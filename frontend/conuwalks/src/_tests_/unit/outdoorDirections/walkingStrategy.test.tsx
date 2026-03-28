import { WalkingStrategy } from "@/src/outdoorDirections/walkingStrategy";
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

describe("WalkingStrategy", () => {
  let strategy: WalkingStrategy;

  beforeEach(() => {
    strategy = new WalkingStrategy();
    jest.clearAllMocks();
  });

  // ── apiMode ────────────────────────────────────────────────────────────────

  describe("apiMode", () => {
    it('is "WALK"', () => {
      expect(strategy.apiMode).toBe("WALK");
    });
  });

  // ── applyTimeToRoutesBody ──────────────────────────────────────────────────

  describe("applyTimeToRoutesBody", () => {
    it("sets departureTime on body when timeMode is 'leave'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      const result = strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "leave");

      expect(body.departureTime).toBe(FUTURE_DATE.toISOString());
      expect(result).toBe(FUTURE_DATE);
    });

    it("does NOT set departureTime when timeMode is 'arrive'", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);
      const body: Record<string, unknown> = {};

      strategy.applyTimeToRoutesBody(body, FUTURE_DATE, "arrive");

      expect(body.departureTime).toBeUndefined();
    });

    it("does NOT set departureTime when clampToFuture returns null", () => {
      mockClampToFuture.mockReturnValue(null);
      const body: Record<string, unknown> = {};

      const result = strategy.applyTimeToRoutesBody(body, null, "leave");

      expect(body.departureTime).toBeUndefined();
      expect(result).toBeNull();
    });

    it("never sets arrivalTime regardless of timeMode", () => {
      mockClampToFuture.mockReturnValue(FUTURE_DATE);

      const bodyLeave: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(bodyLeave, FUTURE_DATE, "leave");
      expect(bodyLeave.arrivalTime).toBeUndefined();

      const bodyArrive: Record<string, unknown> = {};
      strategy.applyTimeToRoutesBody(bodyArrive, FUTURE_DATE, "arrive");
      expect(bodyArrive.arrivalTime).toBeUndefined();
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

      const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(baseUrl, FUTURE_DATE, "arrive");

      expect(url).toBe(baseUrl);
      expect(safeTargetTime).toBe(FUTURE_DATE);
    });

    it("returns original URL and null safeTargetTime when clampToFuture returns null", () => {
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
      expect(strategy.buildStepInstruction("Turn left on Rue Sainte-Catherine", {})).toBe(
        "Turn left on Rue Sainte-Catherine",
      );
    });

    it("returns 'Walk to next location' when stripped is empty", () => {
      expect(strategy.buildStepInstruction("", {})).toBe("Walk to next location");
    });

    it("returns 'Walk to next location' when stripped is exactly 'Continue'", () => {
      expect(strategy.buildStepInstruction("Continue", {})).toBe("Walk to next location");
    });

    it("ignores rawStep entirely", () => {
      const rawStep = { html_instructions: "Head north", distance: { value: 100 } };
      expect(strategy.buildStepInstruction("Head north on Boulevard", rawStep)).toBe("Head north on Boulevard");
    });
  });

  // ── fetchRoutes ────────────────────────────────────────────────────────────

  describe("fetchRoutes", () => {
    it("returns routes from Routes API on success", async () => {
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [{}], safeTargetTime: FUTURE_DATE });
      mockMapRoutesApiResponse.mockReturnValue([MOCK_ROUTE]);

      const routes = await strategy.fetchRoutes(START, DESTINATION, FUTURE_DATE, "leave");

      expect(fetchRoutesApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave");
      expect(mapRoutesApiResponse).toHaveBeenCalledWith([{}], FUTURE_DATE, "leave", "walking", strategy);
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

      expect(fetchLegacyApi).toHaveBeenCalledWith(START, DESTINATION, strategy, FUTURE_DATE, "leave", "walking");
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