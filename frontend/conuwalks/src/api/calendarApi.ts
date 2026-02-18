const CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: { email: string }[];
}

export class GoogleCalendarApi {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${CALENDAR_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    return response.json();
  }

  // Discuss w/ Michael which ones to delete because will not use all
  // Get list of user's calendars
  async listCalendars() {
    return this.fetchApi('/users/me/calendarList');
  }

  // Get events from primary calendar
  async getUpcomingEvents(maxResults: number = 10) {
    const now = new Date().toISOString();
    return this.fetchApi(
      `/calendars/primary/events?` +
      `maxResults=${maxResults}&` +
      `orderBy=startTime&` +
      `singleEvents=true&` +
      `timeMin=${encodeURIComponent(now)}`
    );
  }

  // Get events from a specific calendar
  async getEventsFromCalendar(calendarId: string, maxResults: number = 10) {
    const now = new Date().toISOString();
    return this.fetchApi(
      `/calendars/${encodeURIComponent(calendarId)}/events?` +
      `maxResults=${maxResults}&` +
      `orderBy=startTime&` +
      `singleEvents=true&` +
      `timeMin=${encodeURIComponent(now)}`
    );
  }

  // Create a new event
  async createEvent(calendarId: string = 'primary', event: Partial<CalendarEvent>) {
    return this.fetchApi(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Update an event
  async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>) {
    return this.fetchApi(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  // Delete an event
  async deleteEvent(calendarId: string, eventId: string) {
    return this.fetchApi(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Get events for a specific date range
  async getEventsInRange(calendarId: string = 'primary', timeMin: Date, timeMax: Date) {
    return this.fetchApi(
      `/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${encodeURIComponent(timeMin.toISOString())}&` +
      `timeMax=${encodeURIComponent(timeMax.toISOString())}&` +
      `orderBy=startTime&` +
      `singleEvents=true`
    );
  }

  // Search for free/busy information
  async getFreeBusy(timeMin: Date, timeMax: Date, calendarIds: string[] = ['primary']) {
    return this.fetchApi('/freeBusy', {
      method: 'POST',
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map(id => ({ id })),
      }),
    });
  }
}