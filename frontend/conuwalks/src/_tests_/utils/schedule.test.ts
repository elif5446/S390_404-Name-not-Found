import {
  guessFutureRoomLocation,
  guessRoomLocation,
} from "../../utils/schedule";

describe("schedule utils", () => {
  const now = new Date("2026-04-02T12:00:00.000Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns null when there is no schedule data", () => {
    expect(guessRoomLocation(null, null)).toBeNull();
    expect(guessFutureRoomLocation(null, null)).toBeNull();
  });

  it("returns null when called with no arguments", () => {
    expect(guessRoomLocation()).toBeNull();
    expect(guessFutureRoomLocation()).toBeNull();
  });

  it("identifies the current calendar event using dateTime values", () => {
    const mockEvent = {
      start: { dateTime: new Date(now - 1000).toISOString() },
      end: { dateTime: new Date(now + 10000).toISOString() },
      location: "H 801",
    };

    const result = guessRoomLocation([mockEvent as any], null);

    expect(result).toEqual({ buildingCode: "H", roomNumber: "801" });
  });

  it("identifies the current calendar event using all-day date values", () => {
    const currentEvent = {
      start: { date: new Date(now - 1000).toISOString() },
      end: { date: new Date(now + 10000).toISOString() },
      location: "MB 1.210",
    };

    expect(guessRoomLocation([currentEvent as any], null)).toEqual({
      buildingCode: "MB",
      roomNumber: "1.210",
    });
  });

  it("returns null when current calendar events are missing dates or locations", () => {
    const events = [
      {
        start: {},
        end: { dateTime: new Date(now + 10000).toISOString() },
        location: "H 801",
      },
      {
        start: { dateTime: new Date(now - 1000).toISOString() },
        end: {},
        location: "H 802",
      },
      {
        start: { dateTime: new Date(now - 1000).toISOString() },
        end: { dateTime: new Date(now + 10000).toISOString() },
      },
    ];

    expect(guessRoomLocation(events as any, null)).toBeNull();
  });

  it("uses today's building events when provided", () => {
    const buildingEvents = [
      {
        start: new Date(now - 1000),
        end: new Date(now + 5000),
        buildingCode: "EV",
        roomNumber: "2.260",
      },
    ];

    expect(guessRoomLocation(null, buildingEvents as any)).toEqual({
      buildingCode: "EV",
      roomNumber: "2.260",
    });
  });

  it("prefers building-event data over calendar-event data for the current room", () => {
    const calendarEvents = [
      {
        start: { dateTime: new Date(now - 1000).toISOString() },
        end: { dateTime: new Date(now + 10000).toISOString() },
        location: "H 801",
      },
    ];
    const buildingEvents = [
      {
        start: new Date(now - 1000),
        end: new Date(now + 5000),
        buildingCode: "EV",
        roomNumber: "2.260",
      },
    ];

    expect(guessRoomLocation(calendarEvents as any, buildingEvents as any)).toEqual({
      buildingCode: "EV",
      roomNumber: "2.260",
    });
  });

  it("returns null when the active building event is missing building or room data", () => {
    expect(
      guessRoomLocation(null, [
        {
          start: new Date(now - 1000),
          end: new Date(now + 5000),
          roomNumber: "2.260",
        },
      ] as any),
    ).toBeNull();

    expect(
      guessRoomLocation(null, [
        {
          start: new Date(now - 1000),
          end: new Date(now + 5000),
          buildingCode: "EV",
        },
      ] as any),
    ).toBeNull();
  });

  it("picks the earliest future calendar event and parses its location", () => {
    const events = [
      {
        start: now + 30000,
        location: "H 900",
      },
      {
        start: now + 5000,
        location: "MB 1.210",
      },
      {
        start: now - 5000,
        location: "EV 2.260",
      },
    ];

    expect(guessFutureRoomLocation(events as any, null)).toEqual({
      buildingCode: "MB",
      roomNumber: "1.210",
    });
  });

  it("returns null for future calendar events with invalid locations", () => {
    const badEvent = { start: now + 5000, location: "" };

    expect(guessFutureRoomLocation([badEvent as any], null)).toBeNull();
  });

  it("uses the provided next building event when available", () => {
    expect(
      guessFutureRoomLocation(null, {
        buildingCode: "VL",
        roomNumber: "101",
      } as any),
    ).toEqual({
      buildingCode: "VL",
      roomNumber: "101",
    });
  });

  it("prefers the provided next building event over calendar data", () => {
    const events = [
      {
        start: now + 5000,
        location: "MB 1.210",
      },
    ];

    expect(
      guessFutureRoomLocation(events as any, {
        buildingCode: "VL",
        roomNumber: "101",
      } as any),
    ).toEqual({
      buildingCode: "VL",
      roomNumber: "101",
    });
  });

  it("returns null when the next building event is incomplete", () => {
    expect(
      guessFutureRoomLocation(null, {
        roomNumber: "101",
      } as any),
    ).toBeNull();

    expect(
      guessFutureRoomLocation(null, {
        buildingCode: "VL",
      } as any),
    ).toBeNull();
  });
});
