import { DrivingStrategy } from "@/src/outdoorDirections/drivingStrategy";
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

describe("DrivingStrategy", () => {
  let strategy: DrivingStrategy;

  beforeEach(() => {
    strategy = new DrivingStrategy();
    jest.clearAllMocks();
  });

  // ── apiMode ────────────────────────────────────────────────────────────────

  describe("apiMode", () => {
    it('is "DRIVE"', () => {
      expect(strategy.apiMode).toBe("DRIVE");
    });
  });

  // ── applyTimeToRoutesBody ──────────────────────────────────────────────────

  describe("applyTimeToRoutesBody", () => {
    it("sets departureTime AND routingPreference when timeMode is 'leave'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");

      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(body.routingPreference).toBe("TRAFFIC_AWARE");
    });

    it("does NOT set departureTime or routingPreference when timeMode is 'arrive'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");

      expect(body.departureTime).toBeUndefined();
      expect(body.routingPreference).toBeUndefined();
    });

    it("does NOT set departureTime or routingPreference when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      const body: Record<string, unknown> = {};

      strategy.applyTimeToRoutesBody(body, null, "leave");

      expect(body.departureTime).toBeUndefined();
      expect(body.routingPreference).toBeUndefined();
    });

    it("returns the clamped date", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      expect(strategy.applyTimeToRoutesBody({}, FUTURE_DATE, "leave")).toBe(FUTURE_DATE);
    });

    it("returns null when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      expect(strategy.applyTimeToRoutesBody({}, null, "leave")).toBeNull();
    });
  });

  // ── applyTimeToLegacyUrl ───────────────────────────────────────────────────

  describe("applyTimeToLegacyUrl", () => {
    it("appends departure_time to URL when timeMode is 'leave'", () => {
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

    it("does NOT append departure_time when timeMode is 'arrive'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const baseUrl = "https://example.com/directions";

      const { url } = strategy.applyTimeToLegacyUrl(baseUrl, FUTURE_DATE, "arrive");

      expect(url).toBe(baseUrl);
    });

    it("does NOT append departure_time when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      const baseUrl = "https://example.com/directions";

      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(baseUrl, null, "leave");

      expect(url).toBe(baseUrl);
      expect(safeTargetTime).toBeNull();
    });
  });

  // ── buildStepInstruction ───────────────────────────────────────────────────

  describe("buildStepInstruction", () => {
    it("returns stripped text when non-empty and not 'Continue'", () => {
      expect(strategy.buildStepInstruction("Turn left on Main St", {})).toBe("Turn left on Main St");
    });

    it("returns 'Continue on route' when stripped is empty", () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Continue on route");
    });

    it("returns 'Continue on route' when stripped is exactly 'Continue'", () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Continue on route");
    });
  });

  // ── fetchRoutes ────────────────────────────────────────────────────────────

  describe("fetchRoutes", () => {
    it("returns routes from Routes API on success", async () => {
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [{}], safeTargetTime: FUTURE_DATE });
      mockMapRoutesApiResponse.mockReturnValue([MOCK_ROUTE]);

      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");

      expect(fetchRoutesApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave");
      expect(mapRoutesApiResponse).toHaveBeenCalledWith([{}], FUTURE_DATE, "leave", "driving", strategy);
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

      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");

      expect(fetchLegacyApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave", "driving");
      expect(routes).toEqual([MOCK_ROUTE]);
    });

    it("throws when Legacy API returns no routes", async () => {
      mockFetchRoutesApi.mockRejectedValue(new Error("REQUEST_DENIED"));
      mockIsRoutesBlockedError.mockReturnValue(true);
      mockFetchLegacyApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null });
      mockMapLegacyApiResponse.mockReturnValue([]);

      await expect(strategy.fetchRoutes(START, DESTINATION, null, "leave")).rejects.toThrow(
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