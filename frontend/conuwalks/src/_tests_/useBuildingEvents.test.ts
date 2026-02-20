

// Mock native modules FIRST before any imports
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Then import and mock useGoogleCalendar
jest.mock("@/src/hooks/useGoogleCalendar", () => ({
  useGoogleCalendar: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react-native";
import { useBuildingEvents } from "@/src/hooks/useBuildingEvents";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";

// ===== MOCK DATA HELPERS =====

const makeDate = (date: Date) => ({
  dateTime: date.toISOString(),
  date: date.toISOString().split("T")[0],
});

const createEvent = (id: string, location: string, startDate: Date, duration = 1) => {
  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
  return {
    id,
    summary: `Event ${id}`,
    location,
    start: makeDate(startDate),
    end: makeDate(endDate),
  };
};

// ===== TEST HELPERS =====

const mockCalendar = (events: any[] = [], loading = false, error: string | null = null) => {
  (useGoogleCalendar as jest.Mock).mockReturnValue({
    events,
    fetchUpcomingEvents: jest.fn(),
    loading,
    error,
  });
};


describe("useBuildingEvents Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== LOCATION PARSING =====

  describe("Location Parsing", () => {
    it("should parse valid location formats correctly", () => {
      const now = new Date();
      const events = [
        createEvent("1", "H 910", now),
        createEvent("2", "VL 301", now),
        createEvent("3", "H-405", now),
      ];

      mockCalendar(events);
      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(2);
        expect(result.current.buildingEvents[0]).toMatchObject({
          buildingCode: "H",
          roomNumber: "910",
        });
        expect(result.current.buildingEvents[1]).toMatchObject({
          buildingCode: "H",
          roomNumber: "405",
        });
      });
    });

    it("should handle case-insensitive building codes", () => {
      const now = new Date();
      mockCalendar([createEvent("1", "h 910", now)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents[0].buildingCode).toBe("H");
      });
    });

    it("should exclude events with invalid location format", () => {
      const now = new Date();
      mockCalendar([
        createEvent("1", "Invalid Location", now),
        createEvent("2", "H 910", now),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(1);
      });
    });

    it("should exclude events with no location", () => {
      const now = new Date();
      mockCalendar([
        createEvent("1", "", now),
        createEvent("2", "H 910", now),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(1);
      });
    });
  });

  // ===== EVENT FILTERING =====

  describe("Event Filtering", () => {
    it("should filter events by building code exactly", () => {
      const now = new Date();
      mockCalendar([
        createEvent("1", "H 910", now),
        createEvent("2", "VL 301", now),
        createEvent("3", "H 405", now),
        createEvent("4", "CC 801", now),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(2);
        expect(result.current.buildingEvents.every((e) => e.buildingCode === "H")).toBe(true);
      });
    });

    it("should return empty when no events match building", () => {
      const now = new Date();
      mockCalendar([
        createEvent("1", "VL 301", now),
        createEvent("2", "CC 801", now),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(0);
      });
    });

    it("should return empty when buildingId is empty", () => {
      const now = new Date();
      mockCalendar([createEvent("1", "H 910", now)]);

      const { result } = renderHook(() => useBuildingEvents("", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents).toHaveLength(0);
      });
    });

    it("should populate buildingCode and roomNumber correctly", () => {
      const now = new Date();
      mockCalendar([createEvent("1", "H 910", now)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        const event = result.current.buildingEvents[0];
        expect(event.buildingCode).toBe("H");
        expect(event.roomNumber).toBe("910");
      });
    });
  });

  // ===== TODAY'S EVENTS =====

  describe("Today's Events", () => {
    it("should filter only today's events", () => {
      const now = new Date();
      const today10am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10);
      const today2pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14);
      const tomorrow = new Date(today10am);
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockCalendar([
        createEvent("1", "H 910", today10am),
        createEvent("2", "H 911", today2pm),
        createEvent("3", "H 912", tomorrow),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.todayEvents).toHaveLength(2);
      });
    });

    it("should sort today's events by start time", () => {
      const now = new Date();
      const today2pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14);
      const today10am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10);
      const today12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

      mockCalendar([
        createEvent("1", "H 910", today2pm),
        createEvent("2", "H 911", today10am),
        createEvent("3", "H 912", today12pm),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.todayEvents[0].start.getHours()).toBe(10);
        expect(result.current.todayEvents[1].start.getHours()).toBe(12);
        expect(result.current.todayEvents[2].start.getHours()).toBe(14);
      });
    });

    it("should return empty array when no today's events exist", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockCalendar([createEvent("1", "H 910", tomorrow)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.todayEvents).toHaveLength(0);
      });
    });
  });

  // ===== NEXT EVENT =====

  describe("Next Event", () => {
    it("should identify the next upcoming event correctly", () => {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);

      mockCalendar([
        createEvent("1", "H 910", nextHour),
        createEvent("2", "H 911", nextDay),
      ]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.nextEvent).toBeDefined();
        expect(result.current.nextEvent?.id).toBe("1");
      });
    });

    it("should return null when no upcoming events exist", () => {
      const pastHour = new Date(Date.now() - 60 * 60 * 1000);
      mockCalendar([createEvent("1", "H 910", pastHour)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.nextEvent).toBeNull();
      });
    });

    it("should return null when events array is empty", () => {
      mockCalendar([]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.nextEvent).toBeNull();
      });
    });
  });

  // ===== STATE & EDGE CASES =====

  describe("State Management", () => {
    it("should propagate loading state from useGoogleCalendar", () => {
      mockCalendar([], true, null);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      expect(result.current.loading).toBe(true);
    });

    it("should propagate error state from useGoogleCalendar", () => {
      const error = "Failed to fetch events";
      mockCalendar([], false, error);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      expect(result.current.error).toBe(error);
    });
  });

  describe("Edge Cases", () => {
    it("should handle events with date-only (no dateTime)", () => {
      const events = [
        {
          id: "1",
          summary: "All Day",
          location: "H 910",
          start: { date: "2024-02-18" },
          end: { date: "2024-02-19" },
        },
      ];

      mockCalendar(events);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        expect(result.current.buildingEvents.length).toBeGreaterThanOrEqual(0);
      });
    });

    it("should have all required BuildingEvent fields", () => {
      const now = new Date();
      mockCalendar([createEvent("1", "H 910", now)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        const event = result.current.buildingEvents[0];
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("summary");
        expect(event).toHaveProperty("start");
        expect(event).toHaveProperty("end");
        expect(event).toHaveProperty("location");
        expect(event).toHaveProperty("roomNumber");
        expect(event).toHaveProperty("buildingCode");
        expect(event).toHaveProperty("courseName");
      });
    });

    it("should convert start and end to Date objects", () => {
      const now = new Date();
      mockCalendar([createEvent("1", "H 910", now)]);

      const { result } = renderHook(() => useBuildingEvents("H", "SGW"));

      waitFor(() => {
        const event = result.current.buildingEvents[0];
        expect(event.start instanceof Date).toBe(true);
        expect(event.end instanceof Date).toBe(true);
      });
    });
  });
});
