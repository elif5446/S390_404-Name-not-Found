import { useState, useEffect } from "react";
import { GoogleCalendarApi, CalendarEvent } from "../api/calendarApi";
import { getTokens, isTokenValid, saveTokens } from "../utils/tokenStorage";

// Testing
import { LaunchArguments } from "react-native-launch-arguments";
import { MOCK_CALENDAR_EVENTS } from "../_tests_/mock/mockCalendarData";

const checkIsMockEnv = () => {
  if (process.env.EXPO_PUBLIC_MOCK_CALENDAR === "true") {
    return true;
  }

  try {
    const isMock = LaunchArguments.value().isMockCalendarEnabled;
    return !!isMock;
  } catch (e) {
    return false;
  }
};

const IS_MOCK_ENV = checkIsMockEnv();

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(IS_MOCK_ENV);

  // check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const tokens = await getTokens();
      setIsAuthenticated(!!tokens && isTokenValid(tokens));
    };

    if (!IS_MOCK_ENV) {
      checkAuthStatus();
    }
  }, []);

  const getApiInstance = async (): Promise<GoogleCalendarApi | null> => {
    if (IS_MOCK_ENV) return null;

    const tokens = await getTokens();
    if (!tokens || !isTokenValid(tokens)) {
      setError("Not authenticated or token expired");
      return null;
    }
    return new GoogleCalendarApi(tokens.accessToken);
  };

  // Fetch upcoming events
  const fetchUpcomingEvents = async (maxResults: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_ENV) {
        // INJECT MOCK DATA HERE
        await new Promise((resolve) => setTimeout(resolve, 500));
        setEvents(MOCK_CALENDAR_EVENTS as CalendarEvent[]);
        return;
      }

      const api = await getApiInstance();
      if (!api) return;

      const data = await api.getUpcomingEvents(maxResults);
      setEvents(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all calendars
  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_ENV) {
        // mock calendar lists so UI doesn't break
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCalendars([{ id: "primary", summary: "Mock Primary Calendar" }]);
        return;
      }

      const api = await getApiInstance();
      if (!api) return;

      const data = await api.listCalendars();
      setCalendars(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch calendars",
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new event
  const createEvent = async (
    event: Partial<CalendarEvent>,
    calendarId: string = "primary",
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_ENV) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { ...event, id: `mock-id-${Date.now()}` } as CalendarEvent;
      }

      const api = await getApiInstance();
      if (!api) return null;

      const newEvent = await api.createEvent(calendarId, event);
      await fetchUpcomingEvents(); // Refresh events
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (
    eventId: string,
    calendarId: string = "primary",
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (IS_MOCK_ENV) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;
      }

      const api = await getApiInstance();
      if (!api) return false;

      await api.deleteEvent(calendarId, eventId);
      await fetchUpcomingEvents(); // Refresh events
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    events,
    calendars,
    loading,
    error,
    isAuthenticated,
    fetchUpcomingEvents,
    fetchCalendars,
    createEvent,
    deleteEvent,
  };
};
