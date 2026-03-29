import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
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

describe("RoutePolyline - improved coverage", () => {
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
    timeMode: "leave",
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
  });

  const flushDebounce = async () => {
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
  };

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
        duration: "0 sec",
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
      routeData: routeData,
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
});
