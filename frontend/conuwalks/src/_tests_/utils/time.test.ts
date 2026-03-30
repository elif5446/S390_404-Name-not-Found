import { isToday, parseSeconds, formatDurationFromSeconds, calculateEtaFromSeconds } from "../../utils/time";
describe("calculateEtaFromSeconds", () => {
  test("returns ETA for 'arrive' mode with targetTime", () => {
    const date = new Date(2023, 0, 1, 15, 5); // 15:05
    expect(calculateEtaFromSeconds(100, date, "arrive")).toBe("15:05 ETA");
  });

  test("returns ETA for 'leave' mode with targetTime", () => {
    const date = new Date(2023, 0, 1, 10, 30); // 10:30
    // 3600 seconds = 1 hour
    expect(calculateEtaFromSeconds(3600, date, "leave")).toBe("11:30 ETA");
  });

  test("returns ETA for 'leave' mode with null targetTime (uses Date.now)", () => {
    // Mock Date.now
    const realNow = Date.now;
    Date.now = () => new Date(2023, 0, 1, 8, 0).getTime();
    expect(calculateEtaFromSeconds(1800, null, "leave")).toBe("8:30 ETA");
    Date.now = realNow;
  });

  test("returns ETA for 'arrive' mode with null targetTime (should fallback to leave logic)", () => {
    // Mock Date.now
    const realNow = Date.now;
    Date.now = () => new Date(2023, 0, 1, 9, 0).getTime();
    expect(calculateEtaFromSeconds(600, null, "arrive")).toMatch(/ETA$/);
    Date.now = realNow;
  });
});
describe("formatDurationFromSeconds", () => {
  test("returns '0 min' for 0 seconds", () => {
    expect(formatDurationFromSeconds(0)).toBe("0 min");
  });

  test("returns '0 min' for negative seconds", () => {
    expect(formatDurationFromSeconds(-10)).toBe("0 min");
  });

  test("returns '1 min' for less than 60 seconds", () => {
    expect(formatDurationFromSeconds(30)).toBe("1 min");
  });

  test("returns '2 min' for 90 seconds", () => {
    expect(formatDurationFromSeconds(90)).toBe("2 min");
  });

  test("returns '59 min' for 59*60 seconds", () => {
    expect(formatDurationFromSeconds(59 * 60)).toBe("59 min");
  });

  test("returns '1 h' for 60 min (3600 seconds)", () => {
    expect(formatDurationFromSeconds(3600)).toBe("1 h");
  });

  test("returns '2 h' for 120 min (7200 seconds)", () => {
    expect(formatDurationFromSeconds(7200)).toBe("2 h");
  });

  test("returns '1 h 1 min' for 61 min (3660 seconds)", () => {
    expect(formatDurationFromSeconds(3660)).toBe("1 h 1 min");
  });

  test("returns '2 h 5 min' for 125 min (7500 seconds)", () => {
    expect(formatDurationFromSeconds(7500)).toBe("2 h 5 min");
  });
});



describe("time utils", () => {
  test("isToday returns true for the current date", () => {
    const now = new Date();
    expect(isToday(now)).toBe(true);
  });

  test("isToday returns false for a different date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe("parseSeconds", () => {
  test("returns 0 for undefined", () => {
    expect(parseSeconds(undefined)).toBe(0);
  });

  test("parses valid seconds string with 's'", () => {
    expect(parseSeconds("123s")).toBe(123);
  });

  test("parses valid seconds string without 's'", () => {
    expect(parseSeconds("45")).toBe(45);
  });

  test("returns 0 for non-numeric string", () => {
    expect(parseSeconds("abc")).toBe(0);
  });

  test("returns 0 for Infinity", () => {
    expect(parseSeconds("Infinity")).toBe(0);
  });

  test("returns 0 for NaN", () => {
    expect(parseSeconds("NaN")).toBe(0);
  });
});
