import {
  getApiMocks,
  resetApiMocks,
  FUTURE_DATE,
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

import { WalkingStrategy } from "@/src/outdoorDirections/walkingStrategy";

const mocks = getApiMocks();
const strategy = new WalkingStrategy();

describe("WalkingStrategy", () => {
  resetApiMocks(mocks);

  it("has correct apiMode and googleTravelMode", () => {
    expect(strategy.apiMode).toBe("WALK");
    expect(strategy.googleTravelMode).toBe("walking");
  });

  // Walking only overrides continueFallback — verify the custom text
  describe("buildStepInstruction", () => {
    it("returns the stripped instruction when it is meaningful", () => {
      expect(strategy.buildStepInstruction("Head north on Rue Sainte-Catherine", {}))
        .toBe("Head north on Rue Sainte-Catherine");
    });

    it('returns walking-specific fallback when stripped is "Continue"', () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Walk to next location");
    });

    it("returns walking-specific fallback when stripped is empty", () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Walk to next location");
    });
  });

  // Smoke tests confirming base class behaviour is correctly inherited
  describe("inherited base behaviour", () => {
    it("sets departureTime on the body when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");
      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
    });

    it("passes 'walking' as the travel mode to mapRoutesApiResponse", async () => {
      await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");
      expect(mocks.mockMapRoutesApiResponse).toHaveBeenCalledWith(
        expect.anything(), expect.anything(), expect.anything(), "walking", strategy,
      );
    });
  });
});