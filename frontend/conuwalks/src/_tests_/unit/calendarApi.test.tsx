import { GoogleCalendarApi } from "../../api/calendarApi";

describe("GoogleCalendarApi", () => {
  const mockToken = "test-token";
  let api: GoogleCalendarApi;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    api = new GoogleCalendarApi(mockToken);

    // mock fetch globally
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    // silence console to keep test output clean, but spy on them to check behavior
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Core fetchApi behavior", () => {
    it("should include the Authorization header and correct Content-Type", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await api.listCalendars();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/calendarList"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("logs array length when response is a direct array (coverage)", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "1" }, { id: "2" }],
      });

      await api.listCalendars();
      expect(console.log).toHaveBeenCalledWith("Response contains 2 items");
    });

    it("handles invalid JSON in request body gracefully for logging (coverage)", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // bypassing ts to test the private fetchapi method's error boundary
      // @ts-ignore
      await api.fetchApi("/test", { body: "{ invalid_json: " });

      expect(console.log).toHaveBeenCalledWith(
        "Request body: [Unable to parse]",
        expect.any(Error),
      );
    });
  });

  describe("Error Handling", () => {
    const errorTestCases = [
      { status: 401, desc: "Unauthorized", msg: "Token expired" },
      { status: 403, desc: "Forbidden", msg: "Permission denied" },
      { status: 404, desc: "Not Found", msg: "Resource not found" },
      { status: 429, desc: "Too Many Requests", msg: "Rate limit exceeded" },
      { status: 504, desc: "Gateway Timeout", msg: "Google API server error" },
      {
        status: 418,
        desc: "I'm a teapot (Unhandled)",
        msg: "Unhandled HTTP error",
      },
    ];

    errorTestCases.forEach(({ status, desc, msg }) => {
      it(`handles ${status} ${desc} appropriately`, async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          status,
          json: async () => ({ error: { message: "Test Error" } }),
        });

        await expect(api.listCalendars()).rejects.toThrow(
          `Google Calendar API Failure: Test Error (${status})`,
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(msg),
        );
      });
    });

    it("handles network request failed TypeError specifically", async () => {
      fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));

      await expect(api.listCalendars()).rejects.toThrow(
        "Network error: Please check your internet connection",
      );
    });

    it("re-throws generic errors", async () => {
      const genericError = new Error("Something went completely wrong");
      fetchMock.mockRejectedValueOnce(genericError);

      await expect(api.listCalendars()).rejects.toThrow(genericError);
      expect(console.error).toHaveBeenCalledWith(
        "API call failed:",
        genericError,
      );
    });

    it("falls back to string error if errorBody.error is a string", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad Request String" }),
      });

      await expect(api.listCalendars()).rejects.toThrow(
        "Google Calendar API Failure: Bad Request String (400)",
      );
    });
  });

  describe("GET Methods", () => {
    it("listCalendars returns expected data", async () => {
      const mockData = { items: [{ id: "cal1" }] };
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockData });

      const result = await api.listCalendars();
      expect(result).toEqual(mockData);
    });

    it("getUpcomingEvents constructs correct query with default maxResults", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await api.getUpcomingEvents();

      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).toContain("/calendars/primary/events");
      expect(callUrl).toContain("maxResults=10"); // Default parameter
      expect(callUrl).toContain("orderBy=startTime");
      expect(callUrl).toContain("singleEvents=true");
      expect(callUrl).toContain("timeMin=");
    });

    it("getEventsFromCalendar encodes calendarId and uses maxResults", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await api.getEventsFromCalendar("my cal@example.com", 5);

      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).toContain("/calendars/my%20cal%40example.com/events");
      expect(callUrl).toContain("maxResults=5");
    });

    it("getEventsInRange constructs correct timeMin and timeMax", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const start = new Date("2026-03-01T10:00:00Z");
      const end = new Date("2026-03-05T10:00:00Z");
      await api.getEventsInRange("primary", start, end);

      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).toContain(
        `timeMin=${encodeURIComponent(start.toISOString())}`,
      );
      expect(callUrl).toContain(
        `timeMax=${encodeURIComponent(end.toISOString())}`,
      );
    });
  });

  describe("Mutation Methods", () => {
    it("createEvent sends POST with body to default primary calendar", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
      });
      const event = { summary: "New Meeting" };

      await api.createEvent(undefined, event);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/calendars/primary/events"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(event),
        }),
      );
    });

    it("updateEvent sends PUT with body to specific calendar", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
      });
      const event = { summary: "Updated Meeting" };

      await api.updateEvent("work", "123", event);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/calendars/work/events/123"),
        expect.objectContaining({ method: "PUT", body: JSON.stringify(event) }),
      );
    });

    it("deleteEvent sends DELETE request", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await api.deleteEvent("work", "123");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/calendars/work/events/123"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("getFreeBusy", () => {
    it("sends POST with correct time format and default primary calendar", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ calendars: {} }),
      });

      const start = new Date("2026-03-01T10:00:00Z");
      const end = new Date("2026-03-02T10:00:00Z");

      // using default calendarids array
      await api.getFreeBusy(start, end);

      const requestOptions = fetchMock.mock.calls[0][1];
      const body = JSON.parse(requestOptions.body);

      expect(requestOptions.method).toBe("POST");
      expect(body.timeMin).toBe(start.toISOString());
      expect(body.timeMax).toBe(end.toISOString());
      expect(body.items).toEqual([{ id: "primary" }]);
    });
  });
});
