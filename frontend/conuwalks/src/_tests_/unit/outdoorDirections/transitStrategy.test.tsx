import { TransitStrategy } from "@/src/outdoorDirections/transitStrategy";
import {
  clampToFuture,
  fetchRoutesApi,
  fetchLegacyApi,
  mapRoutesApiResponse,
  mapLegacyApiResponse,
  isRoutesBlockedError,
} from "@/src/api/googleDirectionsAPI";
import { LatLng } from "react-native-maps";
import { RouteData } from "@/src/context/DirectionsContext";

// --- Mocks ---

jest.mock("@/src/api/googleDirectionsAPI", () => ({
  clampToFuture: jest.fn(),
  fetchRoutesApi: jest.fn(),
  fetchLegacyApi: jest.fn(),
  mapRoutesApiResponse: jest.fn(),
  mapLegacyApiResponse: jest.fn(),
  isRoutesBlockedError: jest.fn(),
}));

const mockClampToFuture = clampToFuture as jest.MockedFunction<typeof clampToFuture>;
const mockFetchRoutesApi = fetchRoutesApi as jest.MockedFunction<typeof fetchRoutesApi>;
const mockFetchLegacyApi = fetchLegacyApi as jest.MockedFunction<typeof fetchLegacyApi>;
const mockMapRoutesApiResponse = mapRoutesApiResponse as jest.MockedFunction<typeof mapRoutesApiResponse>;
const mockMapLegacyApiResponse = mapLegacyApiResponse as jest.MockedFunction<typeof mapLegacyApiResponse>;
const mockIsRoutesBlockedError = isRoutesBlockedError as jest.MockedFunction<typeof isRoutesBlockedError>;

// --- Helpers ---

const START: LatLng = { latitude: 45.5017, longitude: -73.5673 };
const DESTINATION: LatLng = { latitude: 45.5231, longitude: -73.5827 };
const FUTURE_DATE = new Date(Date.now() + 60_000);
const MOCK_ROUTE = { polyline: "encodedPolyline" } as unknown as RouteData;

// --- Tests ---

describe("TransitStrategy", () => {
  let strategy: TransitStrategy;

  beforeEach(() => {
    strategy = new TransitStrategy();
    jest.clearAllMocks();
  });

  // ── apiMode ────────────────────────────────────────────────────────────────

  describe("apiMode", () => {
    it('is "TRANSIT"', () => {
      expect(strategy.apiMode).toBe("TRANSIT");
    });
  });

  // ── applyTimeToRoutesBody ──────────────────────────────────────────────────

  describe("applyTimeToRoutesBody", () => {
    it("sets arrivalTime on body when timeMode is 'arrive'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      const result = strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");

      expect(body.arrivalTime).toBe(FUTURE_DATE.toISOString());
      expect(body.departureTime).toBeUndefined();
      expect(result).toBe(FUTURE_DATE);
    });

    it("sets departureTime on body when timeMode is 'leave'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      const result = strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");

      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(body.arrivalTime).toBeUndefined();
      expect(result).toBe(FUTURE_DATE);
    });

    it("returns null and sets nothing when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      const body: Record<string, unknown> = {};

      const result = strategy.applyTimeToRoutesBody(body, null, "leave");

      expect(result).toBeNull();
      expect(body.departureTime).toBeUndefined();
      expect(body.arrivalTime).toBeUndefined();
    });
  });

  // ── applyTimeToLegacyUrl ───────────────────────────────────────────────────

  describe("applyTimeToLegacyUrl", () => {
    it("appends arrival_time when timeMode is 'arrive'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const expectedTimestamp = Math.floor(FUTURE_DATE.getTime() / 1000);

      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(
        "https://example.com/directions",
        FUTURE_DATE,
        "arrive",
      );

      expect(url).toBe(`https://example.com/directions&arrival_time=${expectedTimestamp}`);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("appends departure_time when timeMode is 'leave'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const expectedTimestamp = Math.floor(FUTURE_DATE.getTime() / 1000);

      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(
        "https://example.com/directions",
        FUTURE_DATE,
        "leave",
      );

      expect(url).toBe(`https://example.com/directions&departure_time=${expectedTimestamp}`);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("returns original URL and null safeTargetTime when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      const baseUrl = "https://example.com/directions";

      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(baseUrl, null, "arrive");

      expect(url).toBe(baseUrl);
      expect(safeTargetTime).toBeNull();
    });
  });

  // ── buildStepInstruction ───────────────────────────────────────────────────

  describe("buildStepInstruction", () => {
    it("returns stripped text when non-empty and not 'Continue'", () => {
      expect(strategy.buildStepInstruction("Board at Central Station", {})).toBe("Board at Central Station");
    });

    it("returns 'Take transit' when stripped is empty and no transit details present", () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Take transit");
    });

    it("returns 'Take transit' when stripped is 'Continue' and no transit details present", () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Take transit");
    });

    describe("Routes API shape (transitDetails)", () => {
      it("builds instruction with vehicle, line, and headsign", () => {
        const rawStep = {
          transitDetails: {
            transitLine: {
              vehicle: { name: { text: "Metro" } },
              nameShort: "M1",
            },
            headsign: "Downtown",
          },
        };

        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Metro M1 toward Downtown");
      });

      it("builds instruction without headsign when absent", () => {
        const rawStep = {
          transitDetails: {
            transitLine: {
              vehicle: { name: { text: "Bus" } },
              nameShort: "24",
            },
          },
        };

        expect(strategy.buildStepInstruction("Continue", rawStep)).toBe("Take Bus 24");
      });

      it("falls back to 'Transit' when vehicle name is missing", () => {
        const rawStep = {
          transitDetails: {
            transitLine: { nameShort: "99" },
            headsign: "Airport",
          },
        };

        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Transit 99 toward Airport");
      });

      it("falls back to empty line when nameShort is missing", () => {
        const rawStep = {
          transitDetails: {
            transitLine: { vehicle: { name: { text: "Tram" } } },
            headsign: "North",
          },
        };

        // nameShort ?? "" → empty string so the template produces a double space before "toward"
        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Tram  toward North");
      });
    });

    describe("Legacy API shape (transit_details)", () => {
      it("builds instruction with vehicle, line, and headsign", () => {
        const rawStep = {
          transit_details: {
            line: {
              vehicle: { name: "Subway" },
              short_name: "S2",
            },
            headsign: "Uptown",
          },
        };

        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Subway S2 toward Uptown");
      });

      it("builds instruction without headsign when absent", () => {
        const rawStep = {
          transit_details: {
            line: {
              vehicle: { name: "Ferry" },
              short_name: "F1",
            },
          },
        };

        expect(strategy.buildStepInstruction("Continue", rawStep)).toBe("Take Ferry F1");
      });

      it("falls back to 'Transit' when vehicle name is missing", () => {
        const rawStep = {
          transit_details: {
            line: { short_name: "77" },
            headsign: "Harbor",
          },
        };

        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Transit 77 toward Harbor");
      });

      it("falls back to empty line when short_name is missing", () => {
        const rawStep = {
          transit_details: {
            line: { vehicle: { name: "Train" } },
            headsign: "Central",
          },
        };

        // line resolves to "" so the template produces a double space before "toward"
        expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Train  toward Central");
      });
    });

    it("prefers transitDetails (Routes API) over transit_details (Legacy API) when both present", () => {
      const rawStep = {
        transitDetails: {
          transitLine: { vehicle: { name: { text: "Metro" } }, nameShort: "M1" },
          headsign: "Downtown",
        },
        transit_details: {
          line: { vehicle: { name: "Bus" }, short_name: "42" },
          headsign: "Uptown",
        },
      };

      expect(strategy.buildStepInstruction("", rawStep)).toBe("Take Metro M1 toward Downtown");
    });
  });

  // ── fetchRoutes ────────────────────────────────────────────────────────────

  describe("fetchRoutes", () => {
    it("returns routes from Routes API on success", async () => {
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [{}], safeTargetTime: FUTURE_DATE });
      mockMapRoutesApiResponse.mockReturnValue([MOCK_ROUTE]);

      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");

      expect(fetchRoutesApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave");
      expect(mapRoutesApiResponse).toHaveBeenCalledWith([{}], FUTURE_DATE, "leave", "transit", strategy);
      expect(routes).toEqual([MOCK_ROUTE]);
    });

    it("throws when Routes API returns no routes", async () => {
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null });
      mockMapRoutesApiResponse.mockReturnValue([]);

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "leave")).rejects.toThrow(
        "No route polyline returned from API",
      );
    });

    it("falls back to Legacy API when Routes API throws a blocked error", async () => {
      mockFetchRoutesApi.mockRejectedValue(new Error("REQUEST_DENIED"));
      mockIsRoutesBlockedError.mockReturnValue(true);
      mockFetchLegacyApi.mockResolvedValue({ rawRoutes: [{}], safeTargetTime: FUTURE_DATE });
      mockMapLegacyApiResponse.mockReturnValue([MOCK_ROUTE]);

      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "arrive");

      expect(fetchLegacyApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "arrive", "transit");
      expect(routes).toEqual([MOCK_ROUTE]);
    });

    it("throws when Legacy API returns no routes", async () => {
      mockFetchRoutesApi.mockRejectedValue(new Error("REQUEST_DENIED"));
      mockIsRoutesBlockedError.mockReturnValue(true);
      mockFetchLegacyApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null });
      mockMapLegacyApiResponse.mockReturnValue([]);

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "arrive")).rejects.toThrow(
        "No route polyline returned from Directions API",
      );
    });

    it("throws a timeout error on AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockFetchRoutesApi.mockRejectedValue(abortError);

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "leave")).rejects.toThrow(
        "Directions request timed out. Please try again.",
      );
    });

    it("re-throws non-blocked errors from Routes API", async () => {
      mockFetchRoutesApi.mockRejectedValue(new Error("Network failure"));
      mockIsRoutesBlockedError.mockReturnValue(false);

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "leave")).rejects.toThrow("Network failure");
    });

    it("re-throws non-Error thrown values as-is", async () => {
      mockFetchRoutesApi.mockRejectedValue("string error");

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "leave")).rejects.toBe("string error");
    });
  });
});