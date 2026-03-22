import {
  guessRoomLocation,
  guessFutureRoomLocation,
} from "../../utils/schedule";

describe("schedule utils", () => {
  const now = Date.now();

  test("guessRoomLocation identifies current event", () => {
    const mockEvent = {
      start: { dateTime: new Date(now - 1000).toISOString() },
      end: { dateTime: new Date(now + 10000).toISOString() },
      location: "H 801",
    };
    const result = guessRoomLocation([mockEvent as any], null);
    expect(result).toEqual({ buildingCode: "H", roomNumber: "801" });
  });

  test("guessFutureRoomLocation identifies next event", () => {
    const futureEvent = {
      start: now + 5000,
      location: "MB 1.210",
    };
    const result = guessFutureRoomLocation([futureEvent as any], null);
    expect(result).toEqual({ buildingCode: "MB", roomNumber: "1.210" });
  });

  test("guessFutureRoomLocation returns null for invalid location", () => {
    const badEvent = { start: now + 5000, location: "" };
    expect(guessFutureRoomLocation([badEvent as any], null)).toBeNull();
  });
});
