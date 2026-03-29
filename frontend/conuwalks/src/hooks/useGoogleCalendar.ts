import { useState, useEffect } from "react";
import { GoogleCalendarApi, CalendarEvent } from "../api/calendarApi";
import { getTokens, isTokenValid, clearTokens } from "../utils/tokenStorage";
import { MOCK_CALENDAR_EVENTS } from "../_tests_/mock/mockCalendarData";

const checkIsMockEnv = () => process.env.EXPO_PUBLIC_MOCK_CALENDAR === "true";

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isMock = checkIsMockEnv();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const tokens = await getTokens();
      setIsAuthenticated(!!tokens && isTokenValid(tokens));
    };
    if (isMock) setIsAuthenticated(true);
    else checkAuthStatus();
  }, [isMock]);

  // Follows the same check → validate → return pattern as AuthFlow.checkExistingSession
  const getApiInstance = async (): Promise<GoogleCalendarApi | null> => {
    if (isMock) return null;
    try {
      const tokens = await getTokens();
      if (!tokens || !isTokenValid(tokens)) {
        await clearTokens();
        setError("Not authenticated or token expired");
        return null;
      }
      return new GoogleCalendarApi(tokens.accessToken);
    } catch {
      setError("Authentication error occurred.");
      return null;
    }
  };

  const fetchUpcomingEvents = async (maxResults = 10) => {
    setLoading(true);
    setError(null);
    try {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
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

  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
        setCalendars([{ id: "primary", summary: "Mock Primary Calendar" }]);
        return;
      }
      const api = await getApiInstance();
      if (!api) return;
      const data = await api.listCalendars();
      setCalendars(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch calendars");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: Partial<CalendarEvent>, calendarId = "primary") => {
    setLoading(true);
    setError(null);
    try {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
        return { ...event, id: `mock-id-${Date.now()}` } as CalendarEvent;
      }
      const api = await getApiInstance();
      if (!api) return null;
      const newEvent = await api.createEvent(calendarId, event);
      await fetchUpcomingEvents();
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string, calendarId = "primary") => {
    setLoading(true);
    setError(null);
    try {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 500));
        return true;
      }
      const api = await getApiInstance();
      if (!api) return false;
      await api.deleteEvent(calendarId, eventId);
      await fetchUpcomingEvents();
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
