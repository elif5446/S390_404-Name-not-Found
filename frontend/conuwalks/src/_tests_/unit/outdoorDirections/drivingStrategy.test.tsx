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

  // Driving's only unique behaviour is TRAFFIC_AWARE routing preference
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

  // Smoke tests confirming base class behaviour is correctly inherited
  describe("inherited base behaviour", () => {
    it("appends departure_time to legacy URL when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "leave");
      expect(url).toContain("departure_time");
    });

    it("passes 'driving' as the travel mode to mapRoutesApiResponse", async () => {
      await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");
      expect(mocks.mockMapRoutesApiResponse).toHaveBeenCalledWith(
        expect.anything(), expect.anything(), expect.anything(), "driving", strategy,
      );
    });
  });
});