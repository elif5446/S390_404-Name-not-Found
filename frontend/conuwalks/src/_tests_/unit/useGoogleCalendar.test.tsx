import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";
import { getTokens, isTokenValid, clearTokens } from "../../utils/tokenStorage";
import { GoogleCalendarApi } from "../../api/calendarApi";

jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn(),
  isTokenValid: jest.fn(),
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock("../../api/calendarApi", () => ({
  GoogleCalendarApi: jest.fn(),
}));

const mockGetTokens = getTokens as jest.Mock;
const mockIsTokenValid = isTokenValid as jest.Mock;
const mockClearTokens = clearTokens as jest.Mock;

const mockGetUpcomingEvents = jest.fn();
const mockListCalendars = jest.fn();
const mockCreateEvent = jest.fn();
const mockDeleteEvent = jest.fn();

(GoogleCalendarApi as jest.Mock).mockImplementation(() => ({
  getUpcomingEvents: mockGetUpcomingEvents,
  listCalendars: mockListCalendars,
  createEvent: mockCreateEvent,
  deleteEvent: mockDeleteEvent,
}));

const mockTokens = {
  accessToken: "mock-access-token",
  idToken: "mock-id-token",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  delete process.env.EXPO_PUBLIC_MOCK_CALENDAR;

  mockGetTokens.mockResolvedValue(mockTokens);
  mockIsTokenValid.mockReturnValue(true);
  mockClearTokens.mockResolvedValue(undefined);
});

describe("Initial State", () => {
  it("has correct initial state", () => {
    const { result } = renderHook(() => useGoogleCalendar());
    expect(result.current.events).toEqual([]);
    expect(result.current.calendars).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("checks authentication status on mount", async () => {
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(mockGetTokens).toHaveBeenCalled();
  });

  it("sets isAuthenticated to false when no tokens", async () => {
    mockGetTokens.mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("sets isAuthenticated to false when token is invalid", async () => {
    mockIsTokenValid.mockReturnValue(false);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

describe("fetchUpcomingEvents", () => {
  it("fetches upcoming events successfully", async () => {
    const mockEvents = [
      { id: "1", summary: "COMP 346", location: "H 820" },
      { id: "2", summary: "SOEN 345", location: "H 110" },
    ];
    mockGetUpcomingEvents.mockResolvedValue({ items: mockEvents });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading to true while fetching", async () => {
    mockGetUpcomingEvents.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ items: [] }), 100)),
    );

    const { result } = renderHook(() => useGoogleCalendar());

    act(() => {
      result.current.fetchUpcomingEvents();
    });

    expect(result.current.loading).toBe(true);
  });

  it("handles empty events list", async () => {
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.events).toEqual([]);
  });

  it("handles missing items in response", async () => {
    mockGetUpcomingEvents.mockResolvedValue({});

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.events).toEqual([]);
  });

  it("sets error when not authenticated", async () => {
    mockGetTokens.mockResolvedValue(null);
    (
      require("../../utils/tokenStorage").clearTokens as jest.Mock
    ).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.error).toBe("Not authenticated or token expired");
    expect(result.current.events).toEqual([]);
  });

  it("sets error on fetch failure", async () => {
    mockGetUpcomingEvents.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });

  it("passes maxResults parameter correctly", async () => {
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents(25);
    });

    expect(mockGetUpcomingEvents).toHaveBeenCalledWith(25);
  });
});

describe("fetchCalendars", () => {
  it("fetches calendars successfully", async () => {
    const mockCalendars = [
      { id: "primary", summary: "My Calendar" },
      { id: "work", summary: "Work Calendar" },
    ];
    mockListCalendars.mockResolvedValue({ items: mockCalendars });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchCalendars();
    });

    expect(result.current.calendars).toEqual(mockCalendars);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on fetch calendars failure", async () => {
    mockListCalendars.mockRejectedValue(new Error("Failed to load"));

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchCalendars();
    });

    expect(result.current.error).toBe("Failed to load");
    expect(result.current.loading).toBe(false);
  });

  it("handles missing items in calendars response", async () => {
    mockListCalendars.mockResolvedValue({});

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchCalendars();
    });

    expect(result.current.calendars).toEqual([]);
  });
});

describe("createEvent", () => {
  it("creates an event successfully", async () => {
    const newEvent = { id: "3", summary: "New Event", location: "H 820" };
    mockCreateEvent.mockResolvedValue(newEvent);
    mockGetUpcomingEvents.mockResolvedValue({ items: [newEvent] });

    const { result } = renderHook(() => useGoogleCalendar());

    let createdEvent;
    await act(async () => {
      createdEvent = await result.current.createEvent({ summary: "New Event" });
    });

    expect(createdEvent).toEqual(newEvent);
    expect(result.current.error).toBeNull();
  });

  it("returns null when not authenticated", async () => {
    mockGetTokens.mockResolvedValue(null);

    const { result } = renderHook(() => useGoogleCalendar());

    let createdEvent;
    await act(async () => {
      createdEvent = await result.current.createEvent({ summary: "New Event" });
    });

    expect(createdEvent).toBeNull();
  });

  it("sets error on create event failure", async () => {
    mockCreateEvent.mockRejectedValue(new Error("Create failed"));

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.createEvent({ summary: "New Event" });
    });

    expect(result.current.error).toBe("Create failed");
  });

  it("uses primary calendar by default", async () => {
    mockCreateEvent.mockResolvedValue({});
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.createEvent({ summary: "New Event" });
    });

    expect(mockCreateEvent).toHaveBeenCalledWith("primary", {
      summary: "New Event",
    });
  });
});

describe("deleteEvent", () => {
  it("deletes an event successfully", async () => {
    mockDeleteEvent.mockResolvedValue(undefined);
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteEvent("event-1");
    });

    expect(deleteResult).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("returns false when not authenticated", async () => {
    mockGetTokens.mockResolvedValue(null);

    const { result } = renderHook(() => useGoogleCalendar());

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteEvent("event-1");
    });

    expect(deleteResult).toBe(false);
  });

  it("sets error on delete failure", async () => {
    mockDeleteEvent.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.deleteEvent("event-1");
    });

    expect(result.current.error).toBe("Delete failed");
  });

  it("uses primary calendar by default", async () => {
    mockDeleteEvent.mockResolvedValue(undefined);
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.deleteEvent("event-1");
    });

    expect(mockDeleteEvent).toHaveBeenCalledWith("primary", "event-1");
  });
});

describe("State Management", () => {
  it("clears error before each fetch", async () => {
    mockGetUpcomingEvents.mockRejectedValueOnce(new Error("First error"));
    mockGetUpcomingEvents.mockResolvedValueOnce({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });
    expect(result.current.error).toBe("First error");

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });
    expect(result.current.error).toBeNull();
  });

  it("sets loading to false after successful fetch", async () => {
    mockGetUpcomingEvents.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets loading to false after failed fetch", async () => {
    mockGetUpcomingEvents.mockRejectedValue(new Error("Error"));

    const { result } = renderHook(() => useGoogleCalendar());

    await act(async () => {
      await result.current.fetchUpcomingEvents();
    });

    expect(result.current.loading).toBe(false);
  });

  describe("additional coverage - auth and fallback branches", () => {
    it("clears tokens and sets error when tokens exist but are invalid", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockGetTokens.mockResolvedValue(mockTokens);
      mockIsTokenValid.mockReturnValue(false);
      mockClearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        await result.current.fetchUpcomingEvents();
      });

      expect(mockClearTokens).toHaveBeenCalled();
      expect(result.current.error).toBe("Not authenticated or token expired");
      expect(result.current.events).toEqual([]);
    });

    it("returns early in fetchCalendars when api instance is null", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        await result.current.fetchCalendars();
      });

      expect(result.current.calendars).toEqual([]);
      expect(result.current.error).toBe("Not authenticated or token expired");
    });

    it("uses fallback message when fetchUpcomingEvents throws a non-Error", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockGetUpcomingEvents.mockRejectedValue("boom");

      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        await result.current.fetchUpcomingEvents();
      });

      expect(result.current.error).toBe("Failed to fetch events");
    });

    it("uses fallback message when fetchCalendars throws a non-Error", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockListCalendars.mockRejectedValue("boom");

      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        await result.current.fetchCalendars();
      });

      expect(result.current.error).toBe("Failed to fetch calendars");
    });

    it("uses fallback message when createEvent throws a non-Error", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockCreateEvent.mockRejectedValue("boom");

      const { result } = renderHook(() => useGoogleCalendar());

      let createdEvent;
      await act(async () => {
        createdEvent = await result.current.createEvent({
          summary: "Test event",
        });
      });

      expect(createdEvent).toBeNull();
      expect(result.current.error).toBe("Failed to create event");
    });

    it("returns null from createEvent when api instance is null", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGoogleCalendar());

      let createdEvent;
      await act(async () => {
        createdEvent = await result.current.createEvent({
          summary: "Test event",
        });
      });

      expect(createdEvent).toBeNull();
      expect(result.current.error).toBe("Not authenticated or token expired");
    });

    it("uses fallback message when deleteEvent throws a non-Error", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockDeleteEvent.mockRejectedValue("boom");

      const { result } = renderHook(() => useGoogleCalendar());

      let deleted;
      await act(async () => {
        deleted = await result.current.deleteEvent("event-1");
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe("Failed to delete event");
    });

    it("returns false from deleteEvent when api instance is null", async () => {
      const { useGoogleCalendar } = require("../../hooks/useGoogleCalendar");

      mockGetTokens.mockResolvedValue(null);
      mockClearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGoogleCalendar());

      let deleted;
      await act(async () => {
        deleted = await result.current.deleteEvent("event-1");
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe("Not authenticated or token expired");
    });
  });

  describe("mock environment branches", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.useFakeTimers();

      process.env.EXPO_PUBLIC_MOCK_CALENDAR = "true";
    });

    afterEach(() => {
      process.env = OLD_ENV;
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it("sets isAuthenticated to true on mount in mock mode", async () => {
      const { result } = renderHook(() => useGoogleCalendar());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it("fetches mock upcoming events", async () => {
      const {
        MOCK_CALENDAR_EVENTS,
      } = require("../../_tests_/mock/mockCalendarData");

      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        const promise = result.current.fetchUpcomingEvents();
        jest.runAllTimers();
        await promise;
      });

      expect(result.current.events).toEqual(MOCK_CALENDAR_EVENTS);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("fetches mock calendars", async () => {
      const { result } = renderHook(() => useGoogleCalendar());

      await act(async () => {
        const promise = result.current.fetchCalendars();
        jest.runAllTimers();
        await promise;
      });

      expect(result.current.calendars).toEqual([
        { id: "primary", summary: "Mock Primary Calendar" },
      ]);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("creates a mock event", async () => {
      const { result } = renderHook(() => useGoogleCalendar());

      let createdEvent: any = null;

      await act(async () => {
        const promise = result.current.createEvent({ summary: "Mock Event" });
        jest.runAllTimers();
        createdEvent = await promise;
      });

      if (!createdEvent) throw new Error("Expected event");

      expect(createdEvent.id).toMatch(/^mock-id-/);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("deletes a mock event", async () => {
      const { result } = renderHook(() => useGoogleCalendar());

      let deleted = false;

      await act(async () => {
        const promise = result.current.deleteEvent("id");
        jest.runAllTimers();
        deleted = await promise;
      });

      expect(deleted).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});
