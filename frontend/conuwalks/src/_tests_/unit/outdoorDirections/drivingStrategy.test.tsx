import {
  getApiMocks,
  resetApiMocks,
  FUTURE_DATE,
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

import { DrivingStrategy } from "@/src/outdoorDirections/drivingStrategy";

const mocks = getApiMocks();
const strategy = new DrivingStrategy();

describe("DrivingStrategy", () => {
  resetApiMocks(mocks);

  it("has correct apiMode and googleTravelMode", () => {
    expect(strategy.apiMode).toBe("DRIVE");
    expect(strategy.googleTravelMode).toBe("driving");
  });

  describe("applyTimeToRoutesBody", () => {
    it("sets departureTime and TRAFFIC_AWARE when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");
      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(body.routingPreference).toBe("TRAFFIC_AWARE");
    });

    it("does not set TRAFFIC_AWARE when timeMode is arrive", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");
      expect(body.routingPreference).toBeUndefined();
    });

    it("does not set TRAFFIC_AWARE when targetTime is null", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, null, "leave");
      expect(body.routingPreference).toBeUndefined();
    });
  });

  describe("inherited base behaviour", () => {
    it("appends departure_time to legacy URL when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "leave");
      expect(url).toContain("departure_time");
    });

    it("passes 'driving' as the travel mode to mapRoutesApiResponse", async () => {
      mocks.mockFetchRoutesApi.mockResolvedValueOnce({
        rawRoutes: [MOCK_ROUTE],
        safeTargetTime: FUTURE_DATE,
      });
      mocks.mockMapRoutesApiResponse.mockReturnValueOnce([MOCK_ROUTE]);

      await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");

      expect(mocks.mockMapRoutesApiResponse).toHaveBeenCalledWith(
        [MOCK_ROUTE],
        FUTURE_DATE,
        "leave",
        "driving",
        strategy,
      );
    });

    it("handles AbortError and throws timeout message", async () => {
      const abortError = new Error("request aborted");
      abortError.name = "AbortError";

      mocks.mockFetchRoutesApi.mockRejectedValueOnce(abortError);

      await expect(
        strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave")
      ).rejects.toThrow("Directions request timed out. Please try again.");
    });

    it("falls back to legacy API when blocked error is detected", async () => {
      const blockedError = new Error("routes api blocked");

      mocks.mockFetchRoutesApi.mockRejectedValueOnce(blockedError);
      mocks.mockIsRoutesBlockedError.mockReturnValueOnce(true);
      mocks.mockFetchLegacyApi.mockResolvedValueOnce({
        rawRoutes: [MOCK_ROUTE],
        safeTargetTime: FUTURE_DATE,
      });
      mocks.mockMapLegacyApiResponse.mockReturnValueOnce([MOCK_ROUTE]);

      const result = await strategy.fetchRoutes(
        START,
        DESTINATION,
        FUTURE_DATE,
        "leave"
      );

      expect(mocks.mockIsRoutesBlockedError).toHaveBeenCalledWith(blockedError.message);
      expect(mocks.mockFetchLegacyApi).toHaveBeenCalledWith(
        START,
        DESTINATION,
        strategy,
        FUTURE_DATE,
        "leave",
        "driving",
      );
      expect(mocks.mockMapLegacyApiResponse).toHaveBeenCalledWith(
        [MOCK_ROUTE],
        FUTURE_DATE,
        "leave",
        "driving",
        strategy,
      );
      expect(result).toEqual([MOCK_ROUTE]);
    });

    it("rethrows normal Error objects when they are not blocked errors", async () => {
      const error = new Error("some other failure");

      mocks.mockFetchRoutesApi.mockRejectedValueOnce(error);
      mocks.mockIsRoutesBlockedError.mockReturnValueOnce(false);

      await expect(
        strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave")
      ).rejects.toThrow("some other failure");
    });

    it("rethrows non-Error values unchanged", async () => {
      mocks.mockFetchRoutesApi.mockRejectedValueOnce("plain string failure");

      await expect(
        strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave")
      ).rejects.toBe("plain string failure");
    });
  });
});