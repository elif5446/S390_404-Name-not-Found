import { renderHook, waitFor, act } from "@testing-library/react";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";
import { getTokens, isTokenValid } from "../../utils/tokenStorage";
import { GoogleCalendarApi } from "../../api/calendarApi";

// Mock dependencies
jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn(),
  isTokenValid: jest.fn(),
  saveTokens: jest.fn(),
}));

jest.mock("../../api/calendarApi", () => ({
  GoogleCalendarApi: jest.fn(),
}));

const mockGetTokens = getTokens as jest.Mock;
const mockIsTokenValid = isTokenValid as jest.Mock;
const mockGetUpcomingEvents = jest.fn();
const mockListCalendars = jest.fn();
const mockCreateEvent = jest.fn();
const mockDeleteEvent = jest.fn();

// Mock GoogleCalendarApi instance
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
  mockGetTokens.mockResolvedValue(mockTokens);
  mockIsTokenValid.mockReturnValue(true);
});

// 1. INITIAL STATE

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

// 2. FETCH UPCOMING EVENTS

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

// 3. FETCH CALENDARS

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

// 4. CREATE EVENT

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

// 5. DELETE EVENT

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

// 6. STATE MANAGEMENT

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
});
