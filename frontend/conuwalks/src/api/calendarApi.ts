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
    console.log("GoogleCalendarApi initialize with tokens", accessToken);
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${CALENDAR_BASE_URL}${endpoint}`;
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    // Log request body if present (mask sensitive data)
    if (options.body) {
      try {
        const bodyObj = JSON.parse(options.body as string);
        console.log(`Request body:`, JSON.stringify(bodyObj, null, 2).substring(0, 200) + '...');
      } catch (error) {
        console.log(`Request body: [Unable to parse]`, error);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // Try to parse error response body
        let errorBody: any = {};
        let errorMessage = `Status: ${response.status}`;
        
        try {
          errorBody = await response.json();
          console.error(`Error response body:`, JSON.stringify(errorBody, null, 2));
          errorMessage = errorBody.error?.message || errorBody.error || errorMessage;
        } catch (parseError) {
          console.error(`Could not parse error response:`, parseError);
        }

        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            console.error(`Token expired or invalid. User needs to re-authenticate.`);
            console.error(`Token used: ${this.accessToken.substring(0, 10)}...`);
            break;
          case 403:
            console.error(`Permission denied. User may not have access to this calendar.`);
            break;
          case 404:
            console.error(`Resource not found: ${url}`);
            break;
          case 429:
            console.error(`Rate limit exceeded. Too many requests.`);
            break;
          case 504:
            console.error(`Google API server error (${response.status}). This might be temporary.`);
            break;
          default:
            console.error(`Unhandled HTTP error: ${response.status}`);
        }
        throw new Error(`Google Calendar API Failure: ${errorMessage} (${response.status})`);
      }

      // Parse successful response
      const data = await response.json();
      console.log(`API request successful: ${url}`);
      
      // Log response size (number of items if it's an array)
      if (data.items && Array.isArray(data.items)) {
        console.log(`Response contains ${data.items.length} items`);
      } else if (Array.isArray(data)) {
        console.log(`Response contains ${data.length} items`);
      }
      
      return data;

    } catch (error) {
      // Handle network errors or other fetch failures
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error(`Network error: Unable to reach Google Calendar API. Check internet connection.`);
        throw new Error(`Network error: Please check your internet connection`);
      }
      
      // Re-throw the error with additional context
      console.error(`API call failed:`, error);
      throw error;
    }
  }


  // Discuss w/ Michael & Nicole which ones to delete because will not use all
  // Get list of user's calendars
  async listCalendars() {
    console.log("Fetching user's calendar list")
    try {
      const results = await this.fetchApi('/users/me/calendarList');
      console.log("Calendar list fetched successfully");
      return results;
    } catch (error) {
      console.error("Failed to fetch calendar list:", error);
      throw error;
    }
  }

  // Get events from primary calendar
  async getUpcomingEvents(maxResults: number = 10) {
    const now = new Date().toISOString();
    console.log(`Fetching upcoming events from primary calendar`);
    try {
      const result = await this.fetchApi(
      `/calendars/primary/events?` +
      `maxResults=${maxResults}&` +
      `orderBy=startTime&` +
      `singleEvents=true&` +
      `timeMin=${encodeURIComponent(now)}`
    );
    console.log(`Found ${result.items?.length || 0} upcoming events from primary calendar.`);
    return result;
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error);
      throw error;
    }
  }

  // Get events from a specific calendar
  async getEventsFromCalendar(calendarId: string, maxResults: number = 10) {
    const now = new Date().toISOString();
    console.log(`Fetching events from calendar ${calendarId}...`);
    
    try {
      const result = await this.fetchApi(
        `/calendars/${encodeURIComponent(calendarId)}/events?` +
        `maxResults=${maxResults}&` +
        `orderBy=startTime&` +
        `singleEvents=true&` +
        `timeMin=${encodeURIComponent(now)}`
      );
      
      console.log(`Found ${result.items?.length || 0} events from calendar ${calendarId}.`);
      return result;
    } catch (error) {
      console.error(`Failed to fetch events from calendar ${calendarId}:`, error);
      throw error;
    }
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
    console.log(`Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
    
    try {
      const result = await this.fetchApi(
        `/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${encodeURIComponent(timeMin.toISOString())}&` +
        `timeMax=${encodeURIComponent(timeMax.toISOString())}&` +
        `orderBy=startTime&` +
        `singleEvents=true`
      );
      
      console.log(`Found ${result.items?.length || 0} events in date range from primary calendar.`);
      return result;
    } catch (error) {
      console.error(`Failed to fetch events in range:`, error);
      throw error;
    }
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
