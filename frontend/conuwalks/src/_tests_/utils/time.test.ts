import { isToday } from "../../utils/time";

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
