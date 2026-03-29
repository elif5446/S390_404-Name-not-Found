import {
  getApiMocks,
  resetApiMocks,
  FUTURE_DATE,
  PAST_DATE,
  BASE_URL,
  START,
  DESTINATION,
  MOCK_ROUTE,
} from "../../utils/strategyTestHelper";

jest.mock("@/src/api/googleDirectionsAPI", () => ({
  clampToFuture: jest.fn(),
  fetchRoutesApi: jest.fn(),
  fetchLegacyApi: jest.fn(),
  mapRoutesApiResponse: jest.fn(),
  mapLegacyApiResponse: jest.fn(),
  isRoutesBlockedError: jest.fn(),
}));

import { BicyclingStrategy } from "@/src/outdoorDirections/bicyclingStrategy";

const mocks = getApiMocks();
const strategy = new BicyclingStrategy();

describe("BicyclingStrategy", () => {
  resetApiMocks(mocks);

  it("has correct apiMode and googleTravelMode", () => {
    expect(strategy.apiMode).toBe("BICYCLE");
    expect(strategy.googleTravelMode).toBe("bicycling");
  });

  describe("applyTimeToRoutesBody", () => {
    it("sets departureTime when timeMode is leave and time is in future", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      const result = strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");
      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(result).toBe(FUTURE_DATE);
    });

    it("does not set departureTime when timeMode is arrive", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");
      expect(body.departureTime).toBeUndefined();
    });

    it("does not set departureTime when targetTime is null", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const body: Record<string, unknown> = {};
      const result = strategy.applyTimeToRoutesBody(body, null, "leave");
      expect(body.departureTime).toBeUndefined();
      expect(result).toBeNull();
    });

    it("does not set departureTime when targetTime is in the past", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const body: Record<string, unknown> = {};
      const result = strategy.applyTimeToRoutesBody(body, PAST_DATE, "leave");
      expect(body.departureTime).toBeUndefined();
      expect(result).toBeNull();
    });
  });

  describe("applyTimeToLegacyUrl", () => {
    it("appends departure_time when timeMode is leave and time is in future", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "leave");
      const expectedSeconds = Math.floor(FUTURE_DATE.getTime() / 1000);
      expect(url).toContain(`&departure_time=${expectedSeconds}`);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("does not append any time param when timeMode is arrive", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "arrive");
      expect(url).not.toContain("departure_time");
      expect(url).not.toContain("arrival_time");
    });

    it("does not append any time param when targetTime is null", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(BASE_URL, null, "leave");
      expect(url).toBe(BASE_URL);
      expect(safeTargetTime).toBeNull();
    });
  });

  describe("buildStepInstruction", () => {
    it("returns the stripped instruction when it is meaningful", () => {
      expect(strategy.buildStepInstruction("Turn left on Main St", {})).toBe("Turn left on Main St");
    });

    it('returns fallback when stripped is "Continue"', () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Continue on route");
    });

    it("returns fallback when stripped is empty", () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Continue on route");
    });
  });

  describe("fetchRoutes", () => {
    it("returns routes from Routes API on success", async () => {
      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");
      expect(mocks.mockFetchRoutesApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave");
      expect(mocks.mockMapRoutesApiResponse).toHaveBeenCalledWith(
        [MOCK_ROUTE], FUTURE_DATE, "leave", "bicycling", strategy,
      );
      expect(routes).toEqual([MOCK_ROUTE]);
    });

    it("falls back to legacy API when Routes API returns a blocked error", async () => {
      mocks.mockFetchRoutesApi.mockRejectedValueOnce(new Error("Routes API blocked"));
      mocks.mockIsRoutesBlockedError.mockReturnValueOnce(true);
      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");
      expect(mocks.mockFetchLegacyApi).toHaveBeenCalledWith(
        START, DESTINATION, strategy, FUTURE_DATE, "leave", "bicycling",
      );
      expect(routes).toEqual([MOCK_ROUTE]);
    });

    it("throws timeout error on AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mocks.mockFetchRoutesApi.mockRejectedValueOnce(abortError);
      await expect(strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave"))
        .rejects.toThrow("Directions request timed out. Please try again.");
    });

    it("throws when Routes API returns empty routes", async () => {
      mocks.mockMapRoutesApiResponse.mockReturnValueOnce([]);
      await expect(strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave"))
        .rejects.toThrow("No route polyline returned from API");
    });

    it("throws when legacy API returns empty routes", async () => {
      mocks.mockFetchRoutesApi.mockRejectedValueOnce(new Error("blocked"));
      mocks.mockIsRoutesBlockedError.mockReturnValueOnce(true);
      mocks.mockMapLegacyApiResponse.mockReturnValueOnce([]);
      await expect(strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave"))
        .rejects.toThrow("No route polyline returned from Directions API");
    });

    it("rethrows unknown errors", async () => {
      mocks.mockFetchRoutesApi.mockRejectedValueOnce(new Error("Network failure"));
      await expect(strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave"))
        .rejects.toThrow("Network failure");
    });
  });
});