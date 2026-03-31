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

import { TransitStrategy } from "@/src/outdoorDirections/transitStrategy";

const mocks = getApiMocks();
const strategy = new TransitStrategy();

describe("TransitStrategy", () => {
  resetApiMocks(mocks);

  it("has correct apiMode and googleTravelMode", () => {
    expect(strategy.apiMode).toBe("TRANSIT");
    expect(strategy.googleTravelMode).toBe("transit");
  });

  describe("applyTimeToRoutesBody", () => {
    it("sets departureTime when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");
      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(body.arrivalTime).toBeUndefined();
    });

    it("sets arrivalTime when timeMode is arrive", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const body: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");
      expect(body.arrivalTime).toBe(FUTURE_DATE.toISOString());
      expect(body.departureTime).toBeUndefined();
    });

    it("returns null and sets nothing when targetTime clamps to null", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const body: Record<string, unknown> = {};
      const result = strategy.applyTimeToRoutesBody(body, PAST_DATE, "leave");
      expect(result).toBeNull();
      expect(body.departureTime).toBeUndefined();
      expect(body.arrivalTime).toBeUndefined();
    });
  });

  describe("applyTimeToLegacyUrl", () => {
    it("appends departure_time when timeMode is leave", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "leave");
      const expectedSeconds = Math.floor(FUTURE_DATE.getTime() / 1000);
      expect(url).toContain(`&departure_time=${expectedSeconds}`);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("appends arrival_time when timeMode is arrive", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(FUTURE_DATE);
      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(BASE_URL, FUTURE_DATE, "arrive");
      const expectedSeconds = Math.floor(FUTURE_DATE.getTime() / 1000);
      expect(url).toContain(`&arrival_time=${expectedSeconds}`);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("returns original url and null when targetTime clamps to null", () => {
      mocks.mockClampToFuture.mockReturnValueOnce(null);
      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(BASE_URL, PAST_DATE, "leave");
      expect(url).toBe(BASE_URL);
      expect(safeTargetTime).toBeNull();
    });
  });

  describe("buildStepInstruction", () => {
    it("returns the stripped instruction when it is meaningful", () => {
      expect(strategy.buildStepInstruction("Board at Berri-UQAM", {})).toBe("Board at Berri-UQAM");
    });

    describe("Routes API shape (transitDetails)", () => {
      it("builds instruction from vehicle, line, and headsign", () => {
        const rawStep = {
          transitDetails: {
            transitLine: { vehicle: { name: { text: "Metro" } }, nameShort: "Orange" },
            headsign: "Côte-Vertu",
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep))
          .toBe("Take Metro Orange toward Côte-Vertu");
      });

      it("uses empty line text when short_name is missing", () => {
  const rawStep = {
    transit_details: {
      line: {
        vehicle: { name: "Subway" },
      },
      headsign: "Longueuil",
    },
  };

  expect(strategy.buildStepInstruction("Continue", rawStep))
    .toBe("Take Subway  toward Longueuil");
});

      it("uses empty line text when nameShort is missing", () => {
  const rawStep = {
    transitDetails: {
      transitLine: {
        vehicle: { name: { text: "Metro" } },
      },
      headsign: "Côte-Vertu",
    },
  };

  expect(strategy.buildStepInstruction("Continue", rawStep))
    .toBe("Take Metro  toward Côte-Vertu");
});

      it("omits headsign when not present", () => {
        const rawStep = {
          transitDetails: {
            transitLine: { vehicle: { name: { text: "Bus" } }, nameShort: "24" },
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep)).toBe("Take Bus 24");
      });

      it("falls back to 'Transit' when vehicle name is missing", () => {
        const rawStep = {
          transitDetails: {
            transitLine: { nameShort: "55" },
            headsign: "Downtown",
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep))
          .toBe("Take Transit 55 toward Downtown");
      });
    });

    describe("Legacy API shape (transit_details)", () => {
      it("builds instruction from vehicle, line, and headsign", () => {
        const rawStep = {
          transit_details: {
            line: { vehicle: { name: "Subway" }, short_name: "2" },
            headsign: "Longueuil",
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep))
          .toBe("Take Subway 2 toward Longueuil");
      });

      it("omits headsign when not present", () => {
        const rawStep = {
          transit_details: {
            line: { vehicle: { name: "Tram" }, short_name: "T1" },
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep)).toBe("Take Tram T1");
      });

      it("falls back to 'Transit' when vehicle name is missing", () => {
        const rawStep = {
          transit_details: {
            line: { short_name: "10" },
          },
        };
        expect(strategy.buildStepInstruction("Continue", rawStep)).toBe("Take Transit 10");
      });
    });

    it('returns "Take transit" when no transit details are present and stripped is "Continue"', () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Take transit");
    });

    it('returns "Take transit" when no transit details are present and stripped is empty', () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Take transit");
    });
  });

  describe("inherited base behaviour", () => {
    it("passes 'transit' as the travel mode to mapRoutesApiResponse", async () => {
      await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "arrive");
      expect(mocks.mockMapRoutesApiResponse).toHaveBeenCalledWith(
        expect.anything(), expect.anything(), expect.anything(), "transit", strategy,
      );
    });
  });
});