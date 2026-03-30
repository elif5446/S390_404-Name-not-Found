import {
  decodePolyline,
  formatDistance,
  stripHtml,
  toLatLng,
  clampToFuture,
  isRoutesBlockedError,
  normalizeTravelMode,
  mapRoutesApiResponse,
  mapLegacyApiResponse,
  fetchRoutesApi,
  fetchLegacyApi,
} from "@/src/api/googleDirectionsAPI";
import { ITravelModeStrategy } from "@/src/outdoorDirections/TravelModeStrategy";
const mockFetch = jest.fn();
global.fetch = mockFetch as any;
const stubStrategy = {
  apiMode: "DRIVE",
  applyTimeToRoutesBody: jest.fn((_body, targetTime) => targetTime),
  applyTimeToLegacyUrl: jest.fn((url, targetTime) => ({
    url,
    safeTargetTime: targetTime,
  })),
  buildStepInstruction: jest.fn((instr: string) => instr),
  fetchRoutes: jest.fn(),
} satisfies ITravelModeStrategy;

describe("decodePolyline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("decodes a known encoded polyline to the correct coordinates", () => {
    // "_p~iF~ps|U_ulLnnqC_mqNvxq`@" is the classic Google example
    const result = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(result).toHaveLength(3);
    expect(result[0].latitude).toBeCloseTo(38.5, 1);
    expect(result[0].longitude).toBeCloseTo(-120.2, 1);
    expect(result[1].latitude).toBeCloseTo(40.7, 1);
    expect(result[1].longitude).toBeCloseTo(-120.95, 1);
    expect(result[2].latitude).toBeCloseTo(43.252, 1);
    expect(result[2].longitude).toBeCloseTo(-126.453, 1);
  });

  it("returns an empty array for an empty string", () => {
    expect(decodePolyline("")).toEqual([]);
  });

  it("returns LatLng objects with latitude and longitude keys", () => {
    const result = decodePolyline("_p~iF~ps|U");
    expect(result[0]).toHaveProperty("latitude");
    expect(result[0]).toHaveProperty("longitude");
  });
});

describe("formatDistance", () => {
  it("returns '0 m' for undefined", () => {
    expect(formatDistance(undefined)).toBe("0 m");
  });

  it("returns '0 m' for 0", () => {
    expect(formatDistance(0)).toBe("0 m");
  });

  it("returns '0 m' for negative values", () => {
    expect(formatDistance(-50)).toBe("0 m");
  });

  it("formats metres when value is below 1000", () => {
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("rounds metres correctly", () => {
    expect(formatDistance(500.6)).toBe("501 m");
  });

  it("formats kilometres when value is 1000 or above", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(12345)).toBe("12.3 km");
  });
});

describe("stripHtml", () => {
  it("strips simple tags", () => {
    expect(stripHtml("<b>Turn left</b>")).toBe("Turn left");
  });

  it("strips nested tags", () => {
    expect(stripHtml("<div><span>Go straight</span></div>")).toBe(
      "Go straight",
    );
  });

  it("returns 'Continue' for undefined", () => {
    expect(stripHtml(undefined)).toBe("Continue");
  });

  it("returns 'Continue' for an empty string", () => {
    expect(stripHtml("")).toBe("Continue");
  });

  it("returns 'Continue' when only tags remain after stripping", () => {
    expect(stripHtml("<br/>")).toBe("Continue");
  });

  it("preserves plain text with no tags", () => {
    expect(stripHtml("Keep going")).toBe("Keep going");
  });
});

describe("toLatLng", () => {
  it("converts {latitude, longitude} shape", () => {
    expect(toLatLng({ latitude: 45.5, longitude: -73.6 })).toEqual({
      latitude: 45.5,
      longitude: -73.6,
    });
  });

  it("converts {lat, lng} shape", () => {
    expect(toLatLng({ lat: 45.5, lng: -73.6 })).toEqual({
      latitude: 45.5,
      longitude: -73.6,
    });
  });

  it("returns undefined for undefined input", () => {
    expect(toLatLng(undefined)).toBeUndefined();
  });

  it("returns undefined when latitude is NaN", () => {
    expect(toLatLng({ latitude: NaN, longitude: -73.6 })).toBeUndefined();
  });

  it("returns undefined when longitude is NaN", () => {
    expect(toLatLng({ latitude: 45.5, longitude: NaN })).toBeUndefined();
  });

  it("accepts zero as a valid coordinate", () => {
    expect(toLatLng({ latitude: 0, longitude: 0 })).toEqual({
      latitude: 0,
      longitude: 0,
    });
  });
});

describe("clampToFuture", () => {
  it("returns null when passed null", () => {
    expect(clampToFuture(null)).toBeNull();
  });

  it("returns the same date when it is in the future", () => {
    const future = new Date(Date.now() + 60_000);
    expect(clampToFuture(future)).toEqual(future);
  });

  it("returns a date ~10 s from now when the target is in the past", () => {
    const past = new Date(Date.now() - 5_000);
    const result = clampToFuture(past);
    expect(result).not.toBeNull();
    const diff = result!.getTime() - Date.now();
    // Should be within [8 000, 12 000] ms of now
    expect(diff).toBeGreaterThan(8_000);
    expect(diff).toBeLessThan(12_000);
  });
});

describe("isRoutesBlockedError", () => {
  const blockedMessages = [
    "ComputeRoutes are blocked",
    "routes.googleapis.com is not available",
    "google.maps.routing.v2.Routes.ComputeRoutes",
    "Routes API has not been used",
    "Method google.maps.routing.v2.Routes.ComputeRoutes are blocked",
  ];

  blockedMessages.forEach((msg) => {
    it(`returns true for: "${msg}"`, () => {
      expect(isRoutesBlockedError(msg)).toBe(true);
    });
  });

  it("returns false for an unrelated error message", () => {
    expect(isRoutesBlockedError("Network timeout")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isRoutesBlockedError("COMPUTEROUTES ARE BLOCKED")).toBe(true);
  });
});

// normalizeTravelMode
describe("normalizeTravelMode", () => {
  it("normalizes WALK variants", () => {
    expect(normalizeTravelMode("WALK")).toBe("walking");
    expect(normalizeTravelMode("WALKING")).toBe("walking");
  });

  it("normalizes DRIVE variants", () => {
    expect(normalizeTravelMode("DRIVE")).toBe("driving");
  });

  it("normalizes BICYCLE variants", () => {
    expect(normalizeTravelMode("BICYCLE")).toBe("bicycling");
  });

  it("normalizes TRANSIT", () => {
    expect(normalizeTravelMode("TRANSIT")).toBe("transit");
  });

  it("returns undefined for unknown modes", () => {
    expect(normalizeTravelMode("BOAT")).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(normalizeTravelMode(undefined)).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(normalizeTravelMode("walk")).toBe("walking");
    expect(normalizeTravelMode("Drive")).toBe("driving");
  });
});

describe("mapRoutesApiResponse", () => {
  const makeRawRoute = (overrides: Record<string, unknown> = {}) => ({
    distanceMeters: 1200,
    duration: "300s",
    polyline: { encodedPolyline: "_p~iF~ps|U" },
    legs: [
      {
        distanceMeters: 1200,
        duration: "300s",
        steps: [
          {
            distanceMeters: 600,
            staticDuration: "150s",
            travelMode: "WALK",
            startLocation: { latLng: { latitude: 45.5, longitude: -73.6 } },
            endLocation: { latLng: { latitude: 45.51, longitude: -73.61 } },
            navigationInstruction: { instructions: "<b>Head north</b>" },
            polyline: { encodedPolyline: "_p~iF~ps|U" },
          },
        ],
      },
    ],
    ...overrides,
  });

  it("maps a valid route to RouteData shape", () => {
    const results = mapRoutesApiResponse(
      [makeRawRoute()],
      null,
      "leave",
      "driving",
      stubStrategy,
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("route-0");
    expect(results[0].requestMode).toBe("driving");
    expect(results[0].distance).toBe("1.2 km");
    expect(results[0].steps).toHaveLength(1);
  });

  it("strips HTML from step instructions", () => {
    const results = mapRoutesApiResponse(
      [makeRawRoute()],
      null,
      "leave",
      "driving",
      stubStrategy,
    );
    // buildStepInstruction is called with the stripped text; our stub returns it as-is
    expect(stubStrategy.buildStepInstruction).toHaveBeenCalledWith(
      "Head north",
      expect.anything(),
    );
  });

  it("filters out routes with no leg or no polyline", () => {
    const noLeg = {
      distanceMeters: 100,
      duration: "10s",
      polyline: { encodedPolyline: "_p~iF~ps|U" },
      legs: [],
    };
    const noPoly = {
      distanceMeters: 100,
      duration: "10s",
      legs: [{ steps: [] }],
    };
    expect(
      mapRoutesApiResponse(
        [noLeg, noPoly],
        null,
        "leave",
        "driving",
        stubStrategy,
      ),
    ).toHaveLength(0);
  });

  it("maps transit step details", () => {
    const routeWithTransit = makeRawRoute();
    routeWithTransit.legs[0].steps[0] = {
      ...routeWithTransit.legs[0].steps[0],
      travelMode: "TRANSIT",
      transitDetails: {
        headsign: "Montmorency",
        transitLine: {
          name: "Orange Line",
          nameShort: "O",
          vehicle: { type: "SUBWAY", name: { text: "Metro" } },
        },
        stopDetails: {
          departureStop: { name: "Berri-UQAM" },
          arrivalStop: { name: "Snowdon" },
        },
      },
    } as any;

    const results = mapRoutesApiResponse(
      [routeWithTransit],
      null,
      "leave",
      "transit",
      stubStrategy,
    );
    const step = results[0].steps[0];
    expect(step.travelMode).toBe("transit");
    expect(step.transitLineName).toBe("Orange Line");
    expect(step.transitLineShortName).toBe("O");
    expect(step.transitHeadsign).toBe("Montmorency");
    expect(step.transitDepartureStop).toBe("Berri-UQAM");
    expect(step.transitArrivalStop).toBe("Snowdon");
  });

  it("handles multiple alternative routes", () => {
    const results = mapRoutesApiResponse(
      [makeRawRoute(), makeRawRoute()],
      null,
      "leave",
      "driving",
      stubStrategy,
    );
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("route-0");
    expect(results[1].id).toBe("route-1");
  });
});

describe("mapLegacyApiResponse", () => {
  const makeRawLegacyRoute = () => ({
    overview_polyline: { points: "_p~iF~ps|U" },
    legs: [
      {
        distance: { text: "1.2 km", value: 1200 },
        duration: { text: "5 mins", value: 300 },
        steps: [
          {
            distance: { value: 600 },
            duration: { text: "2 mins" },
            travel_mode: "WALKING",
            start_location: { lat: 45.5, lng: -73.6 },
            end_location: { lat: 45.51, lng: -73.61 },
            html_instructions: "<b>Head north</b>",
            polyline: { points: "_p~iF~ps|U" },
          },
        ],
      },
    ],
  });

  it("maps a valid legacy route to RouteData shape", () => {
    const results = mapLegacyApiResponse(
      [makeRawLegacyRoute()],
      null,
      "leave",
      "walking",
      stubStrategy,
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("legacy-route-0");
    expect(results[0].distance).toBe("1.2 km");
    expect(results[0].steps).toHaveLength(1);
  });

  it("strips HTML from legacy step instructions", () => {
    mapLegacyApiResponse(
      [makeRawLegacyRoute()],
      null,
      "leave",
      "walking",
      stubStrategy,
    );
    expect(stubStrategy.buildStepInstruction).toHaveBeenCalledWith(
      "Head north",
      expect.anything(),
    );
  });

  it("filters out routes missing leg, polyline, distance, or duration", () => {
    const missingDistance = {
      overview_polyline: { points: "_p~iF~ps|U" },
      legs: [{ duration: { text: "5 mins", value: 300 }, steps: [] }],
    };
    expect(
      mapLegacyApiResponse(
        [missingDistance],
        null,
        "leave",
        "driving",
        stubStrategy,
      ),
    ).toHaveLength(0);
  });

  it("maps transit step details from legacy shape", () => {
    const route = makeRawLegacyRoute();
    (route.legs[0].steps[0] as any).transit_details = {
      headsign: "Montmorency",
      line: {
        name: "Orange Line",
        short_name: "O",
        vehicle: { type: "SUBWAY" },
      },
      departure_stop: { name: "Berri-UQAM" },
      arrival_stop: { name: "Snowdon" },
    };

    const results = mapLegacyApiResponse(
      [route],
      null,
      "leave",
      "transit",
      stubStrategy,
    );
    const step = results[0].steps[0];
    expect(step.transitLineName).toBe("Orange Line");
    expect(step.transitLineShortName).toBe("O");
    expect(step.transitHeadsign).toBe("Montmorency");
    expect(step.transitDepartureStop).toBe("Berri-UQAM");
    expect(step.transitArrivalStop).toBe("Snowdon");
  });

  it("handles multiple alternative legacy routes", () => {
    const results = mapLegacyApiResponse(
      [makeRawLegacyRoute(), makeRawLegacyRoute()],
      null,
      "leave",
      "driving",
      stubStrategy,
    );
    expect(results).toHaveLength(2);
    expect(results[1].id).toBe("legacy-route-1");
  });
});

describe("fetchRoutesApi", () => {
  const start = { latitude: 45.5, longitude: -73.6 };
  const destination = { latitude: 45.51, longitude: -73.61 };
  const targetTime = new Date("2030-01-01T12:00:00.000Z");

  it("builds the request body, calls fetch, and returns routes", async () => {
    const rawRoutes = [{ id: "r1" }];
    (stubStrategy.applyTimeToRoutesBody as jest.Mock).mockReturnValueOnce(
      targetTime,
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ routes: rawRoutes }),
    });

    const result = await fetchRoutesApi(
      start,
      destination,
      stubStrategy,
      targetTime,
      "leave",
    );

    expect(stubStrategy.applyTimeToRoutesBody).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: {
          location: { latLng: { latitude: 45.5, longitude: -73.6 } },
        },
        destination: {
          location: { latLng: { latitude: 45.51, longitude: -73.61 } },
        },
        travelMode: "DRIVE",
      }),
      targetTime,
      "leave",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Goog-Api-Key": expect.any(String),
          "X-Goog-FieldMask": expect.any(String),
        }),
      }),
    );

    expect(result).toEqual({
      rawRoutes,
      safeTargetTime: targetTime,
    });
  });

  it("throws fallback Routes API status message when error.message is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: jest.fn().mockResolvedValue({ error: {} }),
    });

    await expect(
      fetchRoutesApi(start, destination, stubStrategy, targetTime, "leave"),
    ).rejects.toThrow("Routes API failed: 502");
  });

  it("throws fallback legacy status message when error_message is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 418,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(
      fetchLegacyApi(
        start,
        destination,
        stubStrategy,
        targetTime,
        "leave",
        "driving",
      ),
    ).rejects.toThrow("Directions API failed: 418");
  });

  it("throws when the Routes API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: { message: "Routes backend failure" },
      }),
    });

    await expect(
      fetchRoutesApi(start, destination, stubStrategy, targetTime, "leave"),
    ).rejects.toThrow("Routes backend failure");
  });

  it("throws when the Routes API returns no routes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ routes: [] }),
    });

    await expect(
      fetchRoutesApi(start, destination, stubStrategy, targetTime, "leave"),
    ).rejects.toThrow("No route found between these locations");
  });
});

describe("fetchLegacyApi", () => {
  const start = { latitude: 45.5, longitude: -73.6 };
  const destination = { latitude: 45.51, longitude: -73.61 };
  const targetTime = new Date("2030-01-01T12:00:00.000Z");

  it("builds the legacy URL, calls fetch, and returns routes", async () => {
    const rawRoutes = [{ id: "legacy-1" }];
    (stubStrategy.applyTimeToLegacyUrl as jest.Mock).mockReturnValueOnce({
      url: "https://example.com/fake-legacy-url",
      safeTargetTime: targetTime,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        status: "OK",
        routes: rawRoutes,
      }),
    });

    const result = await fetchLegacyApi(
      start,
      destination,
      stubStrategy,
      targetTime,
      "leave",
      "driving",
    );

    expect(stubStrategy.applyTimeToLegacyUrl).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://maps.googleapis.com/maps/api/directions/json?",
      ),
      targetTime,
      "leave",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/fake-legacy-url",
      expect.objectContaining({
        method: "GET",
      }),
    );

    expect(result).toEqual({
      rawRoutes,
      safeTargetTime: targetTime,
    });
  });

  it("throws when the legacy API response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({
        error_message: "Legacy API forbidden",
      }),
    });

    await expect(
      fetchLegacyApi(
        start,
        destination,
        stubStrategy,
        targetTime,
        "leave",
        "driving",
      ),
    ).rejects.toThrow("Legacy API forbidden");
  });

  it("throws zero-results message when legacy API returns ZERO_RESULTS", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        status: "ZERO_RESULTS",
        routes: [],
      }),
    });

    await expect(
      fetchLegacyApi(
        start,
        destination,
        stubStrategy,
        targetTime,
        "leave",
        "driving",
      ),
    ).rejects.toThrow("No route found between these locations");
  });

  it("throws generic legacy status error for other bad statuses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        status: "INVALID_REQUEST",
        routes: [],
      }),
    });

    await expect(
      fetchLegacyApi(
        start,
        destination,
        stubStrategy,
        targetTime,
        "leave",
        "driving",
      ),
    ).rejects.toThrow("Directions API error: INVALID_REQUEST");
  });
});

describe("mapRoutesApiResponse extra branch coverage", () => {
  const makeRoute = (overrides: Record<string, unknown> = {}) => ({
    distanceMeters: 1200,
    duration: "300s",
    polyline: { encodedPolyline: "_p~iF~ps|U" },
    legs: [
      {
        distanceMeters: 800,
        duration: "250s",
        steps: [
          {
            distanceMeters: 100,
            staticDuration: "30s",
            travelMode: "WALK",
            startLocation: { latLng: { latitude: 45.5, longitude: -73.6 } },
            endLocation: { latLng: { latitude: 45.51, longitude: -73.61 } },
            navigationInstruction: { instructions: "Walk" },
          },
        ],
      },
    ],
    ...overrides,
  });

  it("uses an empty polylinePoints array when a step polyline is missing", () => {
    const results = mapRoutesApiResponse(
      [makeRoute()],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results[0].steps[0].polylinePoints).toEqual([]);
  });

  it("falls back to leg duration when route duration is missing", () => {
    const route = makeRoute({ duration: undefined });

    const results = mapRoutesApiResponse(
      [route],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results[0].baseDurationSeconds).toBe(250);
  });

  it("falls back to leg distance when route distanceMeters is missing", () => {
    const route = makeRoute({ distanceMeters: undefined });

    const results = mapRoutesApiResponse(
      [route],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results[0].distance).toBe("800 m");
  });
});

describe("mapLegacyApiResponse extra branch coverage", () => {
  const makeLegacyRoute = () => ({
    overview_polyline: { points: "_p~iF~ps|U" },
    legs: [
      {
        distance: { text: "1.2 km", value: 1200 },
        duration: { text: "5 mins", value: 300 },
        steps: [
          {
            distance: { value: 600 },
            travel_mode: "WALKING",
            start_location: { lat: 45.5, lng: -73.6 },
            end_location: { lat: 45.51, lng: -73.61 },
            html_instructions: "Walk forward",
          },
        ],
      },
    ],
  });

  it("uses empty string when legacy step duration text is missing", () => {
    const results = mapLegacyApiResponse(
      [makeLegacyRoute()],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results[0].steps[0].duration).toBe("");
  });

  it("uses an empty polylinePoints array when legacy step polyline is missing", () => {
    const results = mapLegacyApiResponse(
      [makeLegacyRoute()],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results[0].steps[0].polylinePoints).toEqual([]);
  });

  it("handles a truncated polyline string without crashing", () => {
    const result = decodePolyline("?");
    expect(Array.isArray(result)).toBe(true);
  });

  it("decodes a polyline with zero delta coordinates", () => {
    const result = decodePolyline("??");
    expect(result).toEqual([{ latitude: 0, longitude: 0 }]);
  });

  it("decodes negative coordinate deltas", () => {
    // Google's classic example includes negative longitude deltas
    const result = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(result[0].longitude).toBeLessThan(0);
    expect(result[1].longitude).toBeLessThan(0);
  });

  it("decodes positive latitude deltas across points", () => {
    const result = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(result[1].latitude).toBeGreaterThan(result[0].latitude);
    expect(result[2].latitude).toBeGreaterThan(result[1].latitude);
  });

  it("uses an empty steps array when Routes API leg.steps is missing", () => {
    const rawRoute = {
      distanceMeters: 1200,
      duration: "300s",
      polyline: { encodedPolyline: "_p~iF~ps|U" },
      legs: [
        {
          distanceMeters: 1200,
          duration: "300s",
          steps: undefined,
        },
      ],
    };

    const results = mapRoutesApiResponse(
      [rawRoute],
      null,
      "leave",
      "driving",
      stubStrategy,
    );

    expect(results).toHaveLength(1);
    expect(results[0].steps).toEqual([]);
  });

  it('uses "0s" when both route.duration and leg.duration are missing', () => {
    const rawRoute = {
      distanceMeters: 1200,
      duration: undefined,
      polyline: { encodedPolyline: "_p~iF~ps|U" },
      legs: [
        {
          distanceMeters: 1200,
          duration: undefined,
          steps: [],
        },
      ],
    };

    const results = mapRoutesApiResponse(
      [rawRoute],
      null,
      "leave",
      "driving",
      stubStrategy,
    );

    expect(results).toHaveLength(1);
    expect(results[0].baseDurationSeconds).toBe(0);
    expect(results[0].duration).toBeDefined();
  });

  it("uses an empty steps array when legacy leg.steps is missing", () => {
    const rawRoute = {
      overview_polyline: { points: "_p~iF~ps|U" },
      legs: [
        {
          distance: { text: "1.2 km", value: 1200 },
          duration: { text: "5 mins", value: 300 },
          steps: undefined,
        },
      ],
    };

    const results = mapLegacyApiResponse(
      [rawRoute],
      null,
      "leave",
      "walking",
      stubStrategy,
    );

    expect(results).toHaveLength(1);
    expect(results[0].steps).toEqual([]);
  });

  it("handles mixed positive and negative deltas explicitly", () => {
    const result = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

    // Ensure both branches of bitwise decoding are exercised
    const hasPositiveLat = result.some(
      (p, i) => i > 0 && p.latitude > result[i - 1].latitude,
    );
    const hasNegativeLng = result.some((p) => p.longitude < 0);

    expect(hasPositiveLat).toBe(true);
    expect(hasNegativeLng).toBe(true);
  });
});
