/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDestinationData } from "../../hooks/useDestinationData";
import { useDirections } from "@/src/context/DirectionsContext";
import { fetchRoutesApi, mapRoutesApiResponse } from "../../api/googleDirectionsAPI";
import { calculateIndoorPenaltySeconds } from "@/src/indoors/services/indoorRoutingHelper";
import { formatDurationFromSeconds } from "../../utils/time";


jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(),
}));

jest.mock("../../api/googleDirectionsAPI", () => ({
  decodePolyline: jest.fn(),
  formatDistance: jest.fn(),
  stripHtml: jest.fn(),
  toLatLng: jest.fn(),
  clampToFuture: jest.fn(),
  isRoutesBlockedError: jest.fn(),
  normalizeTravelMode: jest.fn(),
  mapRoutesApiResponse: jest.fn(),
  mapLegacyApiResponse: jest.fn(),
  fetchLegacyApi: jest.fn(),
  fetchRoutesApi: jest.fn(),
}));

jest.mock("@/src/indoors/services/indoorRoutingHelper", () => ({
  calculateIndoorPenaltySeconds: jest.fn(),
}));

jest.mock("../../utils/time", () => ({
  formatDurationFromSeconds: jest.fn(),
}));

const mockUseDirections = useDirections as jest.MockedFunction<typeof useDirections>;
const mockFetchRoutesApi = fetchRoutesApi as jest.MockedFunction<typeof fetchRoutesApi>;
const mockMapRoutesApiResponse = mapRoutesApiResponse as jest.MockedFunction<typeof mapRoutesApiResponse>;
const mockCalculateIndoorPenaltySeconds = calculateIndoorPenaltySeconds as jest.MockedFunction<typeof calculateIndoorPenaltySeconds>;
const mockFormatDurationFromSeconds = formatDurationFromSeconds as jest.MockedFunction<typeof formatDurationFromSeconds>;

const defaultStart = { latitude: 45.495, longitude: -73.578 };
const defaultDestination = { latitude: 45.497, longitude: -73.579 };

const baseDirections = {
  routes: [],
  selectedRouteIndex: 0,
  routeData: null,
  travelMode: "walking",
  startCoords: defaultStart,
  destinationCoords: defaultDestination,
  startBuildingId: null,
  startRoom: null,
  destinationBuildingId: null,
  destinationRoom: null,
};

function makeRoute(overrides = {}) {
  return {
    requestMode: "walking",
    baseDurationSeconds: 300,
    duration: "5 mins",
    steps: [],
    ...overrides,
  };
}

function setupDirections(overrides = {}) {
  mockUseDirections.mockReturnValue({ ...baseDirections, ...overrides } as any);
}

function makeMappedRoute(overrides = {}) {
  return {
    id: "route-0",
    requestMode: "walking",
    baseDurationSeconds: 300,
    duration: "5 mins",
    distance: "500 m",
    steps: [],
    polylinePoints: [],
    overviewPolyline: "",
    eta: null,
    ...overrides,
  } as any;
}

describe("useDestinationData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDirections();
    mockCalculateIndoorPenaltySeconds.mockResolvedValue(0);
   
    mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [{}], safeTargetTime: null } as any);
    mockMapRoutesApiResponse.mockReturnValue([makeMappedRoute()]);
    mockFormatDurationFromSeconds.mockImplementation((s) => `${Math.round(s / 60)} min`);
  });


  describe("initialisation", () => {
    it("returns navigationRouteId as null initially", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.navigationRouteId).toBeNull();
    });

    it("exposes setNavigationRouteId", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(typeof result.current.setNavigationRouteId).toBe("function");
    });

    it("spreads all fields from useDirections into the return value", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.routes).toEqual([]);
      expect(result.current.travelMode).toBe("walking");
    });
  });


  describe("indoor penalty fetching", () => {
    it("calls calculateIndoorPenaltySeconds with the correct room/building args", async () => {
      setupDirections({
        startBuildingId: "H",
        startRoom: "H-110",
        destinationBuildingId: "MB",
        destinationRoom: "MB-1.210",
      });

      renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(mockCalculateIndoorPenaltySeconds).toHaveBeenCalledWith(
          "H", "H-110", "MB", "MB-1.210"
        );
      });
    });

    it("defaults indoor penalty to 0 when calculateIndoorPenaltySeconds resolves null", async () => {
      mockCalculateIndoorPenaltySeconds.mockResolvedValue(null as any);
      mockMapRoutesApiResponse.mockReturnValue([makeMappedRoute({ baseDurationSeconds: 600 })]);
      mockFormatDurationFromSeconds.mockReturnValue("10 min");

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("walking")).toBe("10 min");
      });

      expect(mockFormatDurationFromSeconds).toHaveBeenCalledWith(600);
    });

    it("defaults indoor penalty to 0 when calculateIndoorPenaltySeconds rejects", async () => {
      mockCalculateIndoorPenaltySeconds.mockRejectedValue(new Error("fail"));
      mockMapRoutesApiResponse.mockReturnValue([makeMappedRoute({ baseDurationSeconds: 120 })]);
      mockFormatDurationFromSeconds.mockReturnValue("2 min");

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("walking")).toBe("2 min");
      });

      expect(mockFormatDurationFromSeconds).toHaveBeenCalledWith(120);
    });
  });


  describe("getModeDurationLabel()", () => {
    it("returns '--' when no cache entry and no active route match", () => {
      mockMapRoutesApiResponse.mockReturnValue([]);
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getModeDurationLabel("driving")).toBe("--");
    });

    it("uses formatDurationFromSeconds with base + penalty when cache is populated", async () => {
      mockCalculateIndoorPenaltySeconds.mockResolvedValue(60);
      mockMapRoutesApiResponse.mockReturnValue([makeMappedRoute({ baseDurationSeconds: 300 })]);
      mockFormatDurationFromSeconds.mockReturnValue("6 min");

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("walking")).toBe("6 min");
      });

      expect(mockFormatDurationFromSeconds).toHaveBeenCalledWith(360);
    });

    it("falls back to normalizeDurationLabel when cache is empty but active route matches mode", async () => {
      setupDirections({
        routeData: makeRoute({ requestMode: "transit", duration: "12 mins", baseDurationSeconds: undefined }),
      });
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(false));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("transit")).toBe("12 min");
      });
    });

    it("syncs active route duration into cache when routes update", async () => {
      const route = makeRoute({ requestMode: "driving", baseDurationSeconds: 900 });
      setupDirections({ routes: [route], selectedRouteIndex: 0 });
      mockFormatDurationFromSeconds.mockReturnValue("15 min");

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("driving")).toBe("15 min");
      });

      expect(mockFormatDurationFromSeconds).toHaveBeenCalledWith(900);
    });

    // ── normalizeDurationLabel branches ──────────────────────────────────────

    it("returns 'X h Y min' label when normalizeDurationLabel receives an hour+minute string", async () => {
      // normalizeDurationLabel: hourMatch && minuteMatch && minutes > 0 → `${hours} h ${minutes} min`
      setupDirections({
        routeData: makeRoute({ requestMode: "transit", duration: "1 h 30 mins", baseDurationSeconds: undefined }),
      });
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(false));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("transit")).toBe("1 h 30 min");
      });
    });

    it("returns hours-only label when normalizeDurationLabel receives an hour-only string", async () => {
      // normalizeDurationLabel: hourMatch only, no minuteMatch → `${hours} h`
      setupDirections({
        routeData: makeRoute({ requestMode: "transit", duration: "2 hours", baseDurationSeconds: undefined }),
      });
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(false));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("transit")).toBe("2 h");
      });
    });

    it("returns hours-only label when normalizeDurationLabel receives plain 'X h' string", async () => {
      // normalizeDurationLabel: hourMatch, no minuteMatch, remainingMinutes === 0 → `${hours} h`
      setupDirections({
        routeData: makeRoute({ requestMode: "driving", duration: "1 h", baseDurationSeconds: undefined }),
      });
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(false));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("driving")).toBe("1 h");
      });
    });

    it("returns the raw value when normalizeDurationLabel cannot parse the duration string", async () => {
      // normalizeDurationLabel: no hourMatch, no minuteMatch → return value as-is
      setupDirections({
        routeData: makeRoute({ requestMode: "walking", duration: "a while", baseDurationSeconds: undefined }),
      });
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(false));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("walking")).toBe("a while");
      });
    });

    it("does not update cache when baseDurationSeconds is already the same value (dedup guard)", async () => {
      // Covers: if (prev[activeRoute.requestMode] === activeRoute.baseDurationSeconds) return prev;
      const route = makeRoute({ requestMode: "walking", baseDurationSeconds: 300 });
      setupDirections({ routes: [route], selectedRouteIndex: 0 });
      mockFormatDurationFromSeconds.mockReturnValue("5 min");

      const { result, rerender } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(result.current.getModeDurationLabel("walking")).toBe("5 min");
      });

      const callsBefore = mockFormatDurationFromSeconds.mock.calls.length;

      // Re-render with the exact same route/baseDurationSeconds — dedup guard fires, prev is returned
      rerender();

      // formatDurationFromSeconds should not have been called additional times
      expect(mockFormatDurationFromSeconds.mock.calls.length).toBe(callsBefore);
    });
  });


  describe("fetchModeDurations edge cases", () => {
    it("skips updating cache when a mode's baseDurationSeconds is 0 (falsy → treated as null)", async () => {
      // fetchedRoutes[0]?.baseDurationSeconds || null → 0 || null → null
      // result.value.baseSeconds !== null → false → entry not written to cache
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [{ baseDurationSeconds: 0 }], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([makeMappedRoute({ baseDurationSeconds: 0 })]);

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(mockFetchRoutesApi).toHaveBeenCalled();
      });

      // baseDurationSeconds of 0 is falsy → null → not written to cache → "--"
      expect(result.current.getModeDurationLabel("walking")).toBe("--");
    });

    it("skips a mode entry in cache when getDirections returns an empty array", async () => {
      // fetchedRoutes[0] is undefined → baseDurationSeconds undefined → undefined || null → null
      // result.value.baseSeconds === null → condition false → cache not updated
      mockFetchRoutesApi.mockResolvedValue({ rawRoutes: [], safeTargetTime: null } as any);
      mockMapRoutesApiResponse.mockReturnValue([]);

      const { result } = renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(mockFetchRoutesApi).toHaveBeenCalled();
      });

      expect(result.current.getModeDurationLabel("driving")).toBe("--");
    });
  });


  describe("getTransitBadgeLabel()", () => {
    const step = (type: string) => ({ transitVehicleType: type } as any);

    it("returns 'Metro' for subway type", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel(step("subway"))).toBe("Metro");
    });

    it("returns 'Metro' for metro type", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel(step("METRO"))).toBe("Metro");
    });

    it("returns 'Bus' for bus type", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel(step("bus"))).toBe("Bus");
    });

    it("returns 'Bus' for shuttle type", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel(step("shuttle"))).toBe("Bus");
    });

    it("returns the raw transitVehicleType for unknown types", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel(step("TRAM"))).toBe("TRAM");
    });

    it("returns 'Transit' when transitVehicleType is empty", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getTransitBadgeLabel({ transitVehicleType: "" } as any)).toBe("Transit");
    });
  });


  describe("getRouteTransitSummary()", () => {
    it("returns null when there are no transit steps", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getRouteTransitSummary([])).toBeNull();
    });

    it("returns null when no steps have transit fields", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.getRouteTransitSummary([{ transitVehicleType: "" } as any])).toBeNull();
    });

    it("formats a single metro step with short name", () => {
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "subway", transitLineShortName: "Green" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Metro Green");
    });

    it("formats a single bus step with long name when no short name", () => {
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "bus", transitLineName: "105" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Bus 105");
    });

    it("joins multiple different steps with ' → '", () => {
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [
        { transitVehicleType: "subway", transitLineShortName: "Green" },
        { transitVehicleType: "bus", transitLineShortName: "24" },
      ] as any[];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Metro Green → Bus 24");
    });

    it("deduplicates consecutive identical labels", () => {
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [
        { transitVehicleType: "subway", transitLineShortName: "Green" },
        { transitVehicleType: "subway", transitLineShortName: "Green" },
        { transitVehicleType: "bus", transitLineShortName: "24" },
      ] as any[];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Metro Green → Bus 24");
    });

    it("shows vehicle only when no line name is present", () => {
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "subway", transitLineShortName: "" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Metro");
    });

    it("returns 'Transit <line>' for a vehicle type that is not subway, metro, bus, or shuttle", () => {
      // type = "tram" → not subway/metro, not bus/shuttle → vehicle = "Transit"
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "tram", transitLineShortName: "T1" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Transit T1");
    });

    it("returns 'Bus <line>' for a shuttle vehicle type", () => {
      // type.includes("shuttle") → vehicle = "Bus"
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "shuttle", transitLineShortName: "S9" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Bus S9");
    });

    it("returns bare vehicle label 'Transit' when type is unknown and no line name exists", () => {
      // vehicle = "Transit", line = "" → label = "Transit" (nothing appended)
      const { result } = renderHook(() => useDestinationData(true));
      const steps = [{ transitVehicleType: "ferry", transitLineShortName: "" } as any];
      expect(result.current.getRouteTransitSummary(steps)).toBe("Transit");
    });
  });


  describe("transitSteps", () => {
    it("returns empty array when route has no steps", () => {
      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.transitSteps).toEqual([]);
    });

    it("filters out steps without any transit fields", () => {
      setupDirections({
        routeData: makeRoute({
          steps: [
            { instruction: "Walk north" },
            { transitLineName: "Green", transitLineShortName: "G" },
          ],
        }),
      });

      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.transitSteps).toHaveLength(1);
      expect(result.current.transitSteps[0].transitLineName).toBe("Green");
    });

    it("includes steps with any of the recognised transit fields", () => {
      setupDirections({
        routeData: makeRoute({
          steps: [
            { transitDepartureStop: "Guy-Concordia" },
            { transitArrivalStop: "Lionel-Groulx" },
            { transitHeadsign: "Angrignon" },
          ],
        }),
      });

      const { result } = renderHook(() => useDestinationData(true));
      expect(result.current.transitSteps).toHaveLength(3);
    });
  });


  describe("coordinate overrides", () => {
    it("uses overrideDestination instead of context destination when provided", async () => {
      const override = { latitude: 10, longitude: 20 };

      renderHook(() => useDestinationData(true, override));

      await waitFor(() => {
        expect(mockFetchRoutesApi).toHaveBeenCalled();
      });

      const calls = mockFetchRoutesApi.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      calls.forEach((call) => {
        expect(call[1]).toEqual(override);
      });
    });

    it("uses overrideStart instead of context start when provided", async () => {
      const override = { latitude: 99, longitude: 88 };

      renderHook(() => useDestinationData(true, undefined, override));

      await waitFor(() => {
        expect(mockFetchRoutesApi).toHaveBeenCalled();
      });

      const calls = mockFetchRoutesApi.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      calls.forEach((call) => {
        expect(call[0]).toEqual(override);
      });
    });
  });

  describe("visible flag", () => {
    it("does not fetch mode durations when visible is false", async () => {
      renderHook(() => useDestinationData(false));

      await act(async () => {});

      expect(mockFetchRoutesApi).not.toHaveBeenCalled();
    });

    it("fetches mode durations when visible is true", async () => {
      renderHook(() => useDestinationData(true));

      await waitFor(() => {
        expect(mockFetchRoutesApi).toHaveBeenCalled();
      });
    });
  });

  describe("cache reset", () => {
    it("resets navigationRouteId when routeScopeKey changes", async () => {
      const { result, rerender } = renderHook(
        ({ startId }: { startId: string | null }) => {
          setupDirections({ startBuildingId: startId });
          return useDestinationData(true);
        },
        { initialProps: { startId: "H" } }
      );

      act(() => {
        result.current.setNavigationRouteId("some-id");
      });

      expect(result.current.navigationRouteId).toBe("some-id");

      rerender({ startId: "MB" });

      await waitFor(() => {
        expect(result.current.navigationRouteId).toBeNull();
      });
    });
  });
});