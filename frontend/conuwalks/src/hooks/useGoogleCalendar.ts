import { useState, useEffect } from 'react';
import { GoogleCalendarApi, CalendarEvent } from '../api/calendarApi';
import { getTokens, isTokenValid, saveTokens, TokenData } from '../utils/tokenStorage';

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const tokens = await getTokens();
    setIsAuthenticated(!!tokens && isTokenValid(tokens));
  };

  const getApiInstance = async (): Promise<GoogleCalendarApi | null> => {
    const tokens = await getTokens();
    if (!tokens || !isTokenValid(tokens)) {
      setError('Not authenticated or token expired');
      return null;
    }
    return new GoogleCalendarApi(tokens.accessToken);
  };

  // Fetch upcoming events
  const fetchUpcomingEvents = async (maxResults: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const api = await getApiInstance();
      if (!api) return;

      const data = await api.getUpcomingEvents(maxResults);
      setEvents(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all calendars
  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const api = await getApiInstance();
      if (!api) return;

      const data = await api.listCalendars();
      setCalendars(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendars');
    } finally {
      setLoading(false);
    }
  };

  // Create a new event
  const createEvent = async (event: Partial<CalendarEvent>, calendarId: string = 'primary') => {
    setLoading(true);
    setError(null);
    
    try {
      const api = await getApiInstance();
      if (!api) return null;

      const newEvent = await api.createEvent(calendarId, event);
      await fetchUpcomingEvents(); // Refresh events
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string, calendarId: string = 'primary') => {
    setLoading(true);
    setError(null);
    
    try {
      const api = await getApiInstance();
      if (!api) return false;

      await api.deleteEvent(calendarId, eventId);
      await fetchUpcomingEvents(); // Refresh events
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
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