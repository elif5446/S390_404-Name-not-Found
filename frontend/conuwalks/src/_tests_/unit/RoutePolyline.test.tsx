import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import RoutePolyline from "../../components/RoutePolyline";
import { useDirections } from "@/src/context/DirectionsContext";
import {
  getDirections,
  decodePolyline,
} from "@/src/outdoorDirections/directionsService";
import { getShuttleRouteIfApplicable } from "@/src/api/shuttleEngine";
import { calculateIndoorPenaltySeconds } from "@/src/indoors/services/indoorRoutingHelper";
import {
  calculateEtaFromSeconds,
  formatDurationFromSeconds,
} from "../../utils/time";

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    Polyline: ({ children, ...props }: any) => (
      <View testID="mock-polyline" {...props}>
        {children}
      </View>
    ),
    Marker: ({ children, ...props }: any) => (
      <View testID="mock-marker" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(),
}));

jest.mock("@/src/outdoorDirections/directionsService", () => ({
  getDirections: jest.fn(),
  decodePolyline: jest.fn(() => [{ latitude: 1, longitude: 1 }]),
}));

jest.mock("@/src/api/shuttleEngine", () => ({
  getShuttleRouteIfApplicable: jest.fn(),
}));

jest.mock("@/src/indoors/services/indoorRoutingHelper", () => ({
  calculateIndoorPenaltySeconds: jest.fn(),
}));

jest.mock("../../utils/time", () => ({
  calculateEtaFromSeconds: jest.fn(() => "12:34 PM"),
  formatDurationFromSeconds: jest.fn((seconds: number) => `${seconds} sec`),
}));

describe("RoutePolyline", () => {
  let mockSetRoutes: jest.Mock;
  let mockSetRouteData: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  const defaultProps = {
    startLocation: { latitude: 45.5, longitude: -73.6 },
    zIndex: 5,
  };

  const baseDirectionsContext = {
    startCoords: { latitude: 45.5, longitude: -73.6 },
    destinationCoords: { latitude: 45.6, longitude: -73.5 },
    travelMode: "transit",
    timeMode: "leave" as const,
    targetTime: new Date("2026-03-01T12:00:00Z"),
    showDirections: true,
    isNavigationActive: false,
    routeData: null,
    startBuildingId: "H1",
    startRoom: "101",
    destinationBuildingId: "H2",
    destinationRoom: "202",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    mockSetRoutes = jest.fn();
    mockSetRouteData = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    (decodePolyline as jest.Mock).mockReset();
    (decodePolyline as jest.Mock).mockImplementation(() => [
      { latitude: 1, longitude: 1 },
    ]);

    (getDirections as jest.Mock).mockReset();
    (getDirections as jest.Mock).mockResolvedValue([]);

    (getShuttleRouteIfApplicable as jest.Mock).mockReset();
    (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(null);

    (calculateIndoorPenaltySeconds as jest.Mock).mockReset();
    (calculateIndoorPenaltySeconds as jest.Mock).mockResolvedValue(0);

    (formatDurationFromSeconds as jest.Mock).mockReset();
    (formatDurationFromSeconds as jest.Mock).mockImplementation(
      (seconds: number) => `${seconds} sec`,
    );

    (calculateEtaFromSeconds as jest.Mock).mockReset();
    (calculateEtaFromSeconds as jest.Mock).mockReturnValue("12:34 PM");

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const flushDebounce = async () => {
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
  };

  it("returns null when route should not be shown", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      showDirections: false,
      isNavigationActive: false,
      routeData: null,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { queryByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(queryByTestId("mock-polyline")).toBeNull();
  });

  it("returns null when routeData exists but polylinePoints is empty", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "empty-route",
        polylinePoints: [],
        steps: [],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { queryByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(queryByTestId("mock-polyline")).toBeNull();
  });

  it("does not fetch when directions are hidden", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      showDirections: false,
      isNavigationActive: false,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
  });

  it("does not fetch during active navigation", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      isNavigationActive: true,
      routeData: {
        id: "existing-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
  });

  it("clears routes when destination is missing", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      destinationCoords: null,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
    expect(mockSetRoutes).toHaveBeenCalledWith([]);
  });

  it("clears routes when start location is missing", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      startCoords: null,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
    expect(mockSetRoutes).toHaveBeenCalledWith([]);
  });

  it("clears routes when coordinates are invalid", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      startCoords: { latitude: Number.NaN, longitude: -73.6 },
      destinationCoords: { latitude: 45.6, longitude: -73.5 },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
    expect(mockSetRoutes).toHaveBeenCalledWith([]);
  });

  it("creates an indoor-only mock route when start and destination are in the same building", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      startBuildingId: "H1",
      destinationBuildingId: "H1",
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
    expect(mockSetRoutes).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "indoor-only-route",
        distance: "0 m",
        baseDurationSeconds: 0,
      }),
    ]);
    expect(mockSetRouteData).toHaveBeenCalledWith(
      expect.objectContaining({ id: "indoor-only-route" }),
    );
  });

  it("creates an indoor-only mock route when start and destination coordinates are the same", async () => {
    const sameLocation = { latitude: 45.5, longitude: -73.6 };

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      destinationCoords: sameLocation,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    render(<RoutePolyline startLocation={sameLocation} />);
    await flushDebounce();

    expect(getDirections).not.toHaveBeenCalled();
    expect(mockSetRouteData).toHaveBeenCalledWith(
      expect.objectContaining({ id: "indoor-only-route" }),
    );
  });

  it("handles successful fetch and applies indoor penalty", async () => {
    const mockApiRoutes = [
      {
        id: "1",
        overviewPolyline: "encoded_str",
        baseDurationSeconds: 600,
        isShuttle: false,
        steps: [],
      },
    ];

    (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);
    (calculateIndoorPenaltySeconds as jest.Mock).mockResolvedValue(120);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(decodePolyline).toHaveBeenCalledWith("encoded_str");

    await waitFor(() => {
      expect(formatDurationFromSeconds).toHaveBeenCalledWith(720);
      expect(calculateEtaFromSeconds).toHaveBeenCalledWith(
        720,
        baseDirectionsContext.targetTime,
        baseDirectionsContext.timeMode,
      );
    });

    expect(mockSetRouteData).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        duration: "720 sec",
        eta: "12:34 PM",
      }),
    );
  });

  it("throws an error when all decoded polylines are empty", async () => {
    (getDirections as jest.Mock).mockResolvedValue([
      {
        id: "bad-route",
        overviewPolyline: "bad_poly",
        baseDurationSeconds: 300,
        isShuttle: false,
        steps: [],
      },
    ]);

    (decodePolyline as jest.Mock).mockReturnValue([]);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        "Failed to decode route polyline",
      );
      expect(mockSetRoutes).toHaveBeenCalledWith([]);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  it("uses fallback error message for non-Error throws", async () => {
    (getDirections as jest.Mock).mockRejectedValue("boom");

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Failed to fetch directions");
      expect(mockSetRoutes).toHaveBeenCalledWith([]);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  it("blocks repeated requests after a request denied style API error", async () => {
    (getDirections as jest.Mock).mockRejectedValue(
      new Error("REQUEST_DENIED: API has not been used"),
    );

    const { rerender } = render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).toHaveBeenCalledTimes(1);

    rerender(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).toHaveBeenCalledTimes(1);
  });

  it("retries again after route is dismissed because blocked cache is cleared", async () => {
    (getDirections as jest.Mock)
      .mockRejectedValueOnce(new Error("REQUEST_DENIED: API disabled"))
      .mockResolvedValueOnce([
        {
          id: "recovered",
          overviewPolyline: "ok",
          baseDurationSeconds: 300,
          isShuttle: false,
          steps: [],
        },
      ]);

    const { rerender } = render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).toHaveBeenCalledTimes(1);

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      showDirections: false,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    rerender(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      showDirections: true,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    rerender(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(getDirections).toHaveBeenCalledTimes(2);
  });

  it("injects shuttle route when no public duration is present", async () => {
    const mockApiRoutes = [
      {
        id: "public-1",
        overviewPolyline: "xyz",
        baseDurationSeconds: 900,
        isShuttle: false,
        steps: [],
      },
    ];

    const mockShuttle = {
      id: "shuttle-1",
      isShuttle: true,
      departureDate: "2026-03-01T12:15:00Z",
      polylinePoints: [{ latitude: 2, longitude: 2 }],
      baseDurationSeconds: 300,
      steps: [],
    };

    (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);
    (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(mockShuttle);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetRoutes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "shuttle-1", isShuttle: true }),
          expect.objectContaining({ id: "public-1" }),
        ]),
      );
    });
  });

  it("does not inject shuttle when no shuttle route is returned", async () => {
    const mockApiRoutes = [
      {
        id: "public-1",
        duration: "20 min",
        overviewPolyline: "xyz",
        baseDurationSeconds: 1200,
        isShuttle: false,
        steps: [],
      },
    ];

    (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);
    (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(null);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetRoutes).toHaveBeenCalledWith([
        expect.objectContaining({ id: "public-1" }),
      ]);
    });
  });

  it("does not prepend shuttle when leave mode has enough public travel time before shuttle departure", async () => {
    const mockApiRoutes = [
      {
        id: "public-1",
        duration: "1 h 0 min",
        overviewPolyline: "xyz",
        baseDurationSeconds: 3600,
        isShuttle: false,
        steps: [],
      },
    ];

    const mockShuttle = {
      id: "shuttle-1",
      isShuttle: true,
      departureDate: "2026-03-01T13:30:00Z",
      polylinePoints: [{ latitude: 2, longitude: 2 }],
      baseDurationSeconds: 300,
      steps: [],
    };

    (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);
    (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(mockShuttle);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetRoutes).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: "public-1" }),
      ]);
    });
  });

  it("does not prepend shuttle when arrive-style timing satisfies the 45 minute rule", async () => {
    const mockApiRoutes = [
      {
        id: "public-1",
        duration: "20 min",
        overviewPolyline: "xyz",
        baseDurationSeconds: 1200,
        isShuttle: false,
        steps: [],
      },
    ];

    const mockShuttle = {
      id: "shuttle-1",
      isShuttle: true,
      departureDate: "2026-03-01T10:00:00Z",
      polylinePoints: [{ latitude: 2, longitude: 2 }],
      baseDurationSeconds: 300,
      steps: [],
    };

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      timeMode: "arrive",
      targetTime: new Date("2026-03-01T12:00:00Z"),
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);
    (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(mockShuttle);

    render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    await waitFor(() => {
      expect(mockSetRoutes).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: "public-1" }),
      ]);
    });
  });

it("reuses cached outdoor request and reapplies indoor patch when dependencies change but outdoor key stays the same", async () => {
  const routeData = {
    id: "1",
    overviewPolyline: "encoded_str",
    polylinePoints: [{ latitude: 1, longitude: 1 }],
    baseDurationSeconds: 600,
    steps: [],
    isShuttle: false,
  };

  const altSetRoutes = jest.fn();

  let currentDirectionsContext: any = {
    ...baseDirectionsContext,
    setRoutes: mockSetRoutes,
    setRouteData: mockSetRouteData,
    setLoading: mockSetLoading,
    setError: mockSetError,
  };

  (useDirections as jest.Mock).mockImplementation(() => currentDirectionsContext);

  (getDirections as jest.Mock).mockResolvedValue([routeData]);
  (calculateIndoorPenaltySeconds as jest.Mock).mockResolvedValue(60);

  const { rerender } = render(<RoutePolyline {...defaultProps} />);
  await flushDebounce();

  await waitFor(() => {
    expect(getDirections).toHaveBeenCalledTimes(1);
    expect(calculateIndoorPenaltySeconds).toHaveBeenCalledTimes(1);
  });

  currentDirectionsContext = {
    ...currentDirectionsContext,
    routeData,
    setRoutes: altSetRoutes,
  };

  rerender(<RoutePolyline {...defaultProps} />);
  await flushDebounce();

  await waitFor(() => {
    expect(getDirections).toHaveBeenCalledTimes(1);
    expect(calculateIndoorPenaltySeconds).toHaveBeenCalledTimes(2);
  });
});

  it("reapplies indoor patch when indoor request key changes", async () => {
    const routeData = {
      id: "1",
      overviewPolyline: "encoded_str",
      polylinePoints: [{ latitude: 1, longitude: 1 }],
      baseDurationSeconds: 600,
      steps: [],
      isShuttle: false,
    };

    (getDirections as jest.Mock).mockResolvedValue([routeData]);
    (calculateIndoorPenaltySeconds as jest.Mock)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(180);

    const { rerender } = render(<RoutePolyline {...defaultProps} />);
    await flushDebounce();

    expect(calculateIndoorPenaltySeconds).toHaveBeenCalledTimes(1);

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      routeData,
      startBuildingId: "H1",
      startRoom: "999",
      destinationBuildingId: "H2",
      destinationRoom: "202",
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    rerender(<RoutePolyline {...defaultProps} />);

    await waitFor(() => {
      expect(calculateIndoorPenaltySeconds).toHaveBeenCalledTimes(2);
    });
  });

  it("renders walking route with dashed line styling", () => {
    const polylinePoints = [
      { latitude: 1, longitude: 1 },
      { latitude: 2, longitude: 2 },
    ];

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "walk-route",
        polylinePoints,
        steps: [],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    const polyline = getByTestId("mock-polyline");

    expect(polyline.props.strokeColor).toBe("#B03060");
    expect(polyline.props.lineDashPattern).toEqual([1, 6]);
    expect(polyline.props.lineCap).toBe("round");
  });

  it("renders driving route with solid blue styling", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "driving",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "drive-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    const polyline = getByTestId("mock-polyline");

    expect(polyline.props.strokeColor).toBe("#5DADE2");
    expect(polyline.props.lineDashPattern).toBeUndefined();
    expect(polyline.props.lineCap).toBe("butt");
  });

  it("renders bicycling route with green styling", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "bicycling",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "bike-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(getByTestId("mock-polyline").props.strokeColor).toBe("#48C9B0");
  });

  it("renders non-transit shuttle route as solid maroon", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "shuttle",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "shuttle-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [],
        isShuttle: true,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    const polyline = getByTestId("mock-polyline");

    expect(polyline.props.strokeColor).toBe("#B03060");
    expect(polyline.props.lineDashPattern).toBeUndefined();
    expect(polyline.props.lineCap).toBe("butt");
  });

  it("renders transit segments with correct colors and transfer markers", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "transit",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "transit-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        isShuttle: false,
        steps: [
          {
            travelMode: "walking",
            polylinePoints: [{ latitude: 1, longitude: 1 }],
            endLocation: { latitude: 10, longitude: 10 },
          },
          {
            travelMode: "transit",
            transitVehicleType: "BUS",
            polylinePoints: [{ latitude: 2, longitude: 2 }],
            endLocation: { latitude: 20, longitude: 20 },
          },
          {
            travelMode: "transit",
            transitVehicleType: "SUBWAY",
            transitLineShortName: "1",
            polylinePoints: [{ latitude: 3, longitude: 3 }],
            endLocation: { latitude: 30, longitude: 30 },
          },
          {
            travelMode: "walking",
            polylinePoints: [{ latitude: 4, longitude: 4 }],
            endLocation: { latitude: 40, longitude: 40 },
          },
        ],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getAllByTestId } = render(<RoutePolyline {...defaultProps} />);

    const polylines = getAllByTestId("mock-polyline");
    const markers = getAllByTestId("mock-marker");

    expect(polylines).toHaveLength(4);
    expect(markers).toHaveLength(3);

    expect(polylines[0].props.strokeColor).toBe("#B03060");
    expect(polylines[0].props.lineDashPattern).toEqual([1, 6]);

    expect(polylines[1].props.strokeColor).toBe("#A970FF");
    expect(polylines[1].props.lineDashPattern).toBeUndefined();

    expect(polylines[2].props.strokeColor).toBe("#139D48");
    expect(polylines[2].props.lineDashPattern).toBeUndefined();

    expect(polylines[3].props.strokeColor).toBe("#B03060");
    expect(polylines[3].props.lineDashPattern).toEqual([1, 6]);
  });

  it("renders metro fallback blue when line is unrecognized", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "transit",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "metro-fallback",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        isShuttle: false,
        steps: [
          {
            travelMode: "transit",
            transitVehicleType: "METRO",
            transitLineShortName: "unknown",
            transitLineName: "mystery line",
            polylinePoints: [{ latitude: 3, longitude: 3 }],
            endLocation: { latitude: 30, longitude: 30 },
          },
        ],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(getByTestId("mock-polyline").props.strokeColor).toBe("#2980B9");
  });

  it("renders shuttle-colored transit step when vehicle type includes shuttle", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "transit",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "transit-shuttle",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        isShuttle: false,
        steps: [
          {
            travelMode: "transit",
            transitVehicleType: "Campus Shuttle",
            polylinePoints: [{ latitude: 5, longitude: 5 }],
            endLocation: { latitude: 6, longitude: 6 },
          },
        ],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(getByTestId("mock-polyline").props.strokeColor).toBe("#B03060");
  });

  it("skips transit step rendering when a step has no polyline points", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "transit",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "missing-step-polyline",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        isShuttle: false,
        steps: [
          {
            travelMode: "walking",
            polylinePoints: [],
            endLocation: { latitude: 10, longitude: 10 },
          },
          {
            travelMode: "transit",
            transitVehicleType: "BUS",
            polylinePoints: [{ latitude: 2, longitude: 2 }],
            endLocation: { latitude: 20, longitude: 20 },
          },
        ],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getAllByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(getAllByTestId("mock-polyline")).toHaveLength(1);
  });

  it("does not create transfer markers when travelMode is not transit", () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "walk-route",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [
          {
            travelMode: "walking",
            polylinePoints: [{ latitude: 1, longitude: 1 }],
            endLocation: { latitude: 2, longitude: 2 },
          },
        ],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { queryByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(queryByTestId("mock-marker")).toBeNull();
  });

  it("freezes transfer node marker view changes after layout", async () => {
    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "transit",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "transfer-freeze",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        isShuttle: false,
        steps: [
          {
            travelMode: "walking",
            polylinePoints: [{ latitude: 1, longitude: 1 }],
            endLocation: { latitude: 10, longitude: 10 },
          },
          {
            travelMode: "transit",
            transitVehicleType: "BUS",
            polylinePoints: [{ latitude: 2, longitude: 2 }],
            endLocation: { latitude: 20, longitude: 20 },
          },
        ],
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId, rerender } = render(<RoutePolyline {...defaultProps} />);
    const marker = getByTestId("mock-marker");

    expect(marker.props.tracksViewChanges).toBe(true);

    await act(async () => {
      marker.props.children.props.onLayout();
      jest.advanceTimersByTime(250);
    });

    rerender(<RoutePolyline {...defaultProps} />);

    expect(getByTestId("mock-marker").props.tracksViewChanges).toBe(false);
  });

  it("uses android walking dash pattern when platform is android", () => {
  const originalOS = Platform.OS;

  try {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });

    (useDirections as jest.Mock).mockReturnValue({
      ...baseDirectionsContext,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: true,
      routeData: {
        id: "android-walk",
        polylinePoints: [{ latitude: 1, longitude: 1 }],
        steps: [],
        isShuttle: false,
      },
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });

    const { getByTestId } = render(<RoutePolyline {...defaultProps} />);
    expect(getByTestId("mock-polyline").props.lineDashPattern).toEqual([1, 8]);
  } finally {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalOS,
    });
  }
});
});