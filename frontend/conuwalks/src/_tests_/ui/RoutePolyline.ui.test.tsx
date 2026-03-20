import React from "react";
import { Platform } from "react-native";
import { render, screen } from "@testing-library/react-native";
import RoutePolyline from "../../components/RoutePolyline";
import { useDirections } from "@/src/context/DirectionsContext";

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return {
    Polyline: (props: any) => <View testID="mock-polyline" {...props} />,
  };
});

jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(),
}));
jest.mock("@/src/api/directions", () => ({
  getDirections: jest.fn(),
  decodePolyline: jest.fn(),
}));
jest.mock("@/src/api/shuttleEngine", () => ({
  getShuttleRouteIfApplicable: jest.fn(),
}));

describe("RoutePolyline - UI & Rendering", () => {
  const originalOS = Platform.OS;

  const mockBaseContext = {
    destinationCoords: { latitude: 45.5, longitude: -73.5 },
    timeMode: "leave",
    targetTime: null,
    showDirections: true,
    isNavigationActive: false,
    setRoutes: jest.fn(),
    setRouteData: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
  };

  const defaultProps = {
    startLocation: { latitude: 45.4, longitude: -73.6 },
  };

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("returns null if shouldShowRoute is false", () => {
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        showDirections: false,
        isNavigationActive: false,
        routeData: { polylinePoints: [{ latitude: 0, longitude: 0 }] },
      });

      render(<RoutePolyline {...defaultProps} />);
      expect(screen.queryByTestId("mock-polyline")).toBeNull();
    });

    it("returns null if routeData is missing or empty", () => {
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        showDirections: true,
        routeData: { polylinePoints: [] }, // Empty points
      });

      render(<RoutePolyline {...defaultProps} />);
      expect(screen.queryByTestId("mock-polyline")).toBeNull();
    });
  });

  describe("Standard Travel Modes (Single Polyline)", () => {
    it("renders a solid blue line for driving", () => {
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        travelMode: "driving",
        routeData: { id: "1", polylinePoints: [{ latitude: 0, longitude: 0 }] },
      });

      render(<RoutePolyline {...defaultProps} />);
      const polyline = screen.getByTestId("mock-polyline");
      expect(polyline.props.strokeColor).toBe("#5DADE2");
      expect(polyline.props.lineDashPattern).toBeUndefined(); // Solid
    });

    it("renders a solid teal line for bicycling", () => {
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        travelMode: "bicycling",
        routeData: { id: "1", polylinePoints: [{ latitude: 0, longitude: 0 }] },
      });

      render(<RoutePolyline {...defaultProps} />);
      expect(screen.getByTestId("mock-polyline").props.strokeColor).toBe(
        "#48C9B0",
      );
    });

    it("renders a dashed pink line for walking on iOS", () => {
      Platform.OS = "ios";
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        travelMode: "walking",
        routeData: { id: "1", polylinePoints: [{ latitude: 0, longitude: 0 }] },
      });

      render(<RoutePolyline {...defaultProps} />);
      const polyline = screen.getByTestId("mock-polyline");
      expect(polyline.props.strokeColor).toBe("#B03060");
      expect(polyline.props.lineDashPattern).toEqual([1, 6]);
      expect(polyline.props.strokeWidth).toBe(3);
    });

    it("renders a dashed pink line for walking on Android", () => {
      Platform.OS = "android";
      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        travelMode: "walking",
        routeData: { id: "1", polylinePoints: [{ latitude: 0, longitude: 0 }] },
      });

      render(<RoutePolyline {...defaultProps} />);
      const polyline = screen.getByTestId("mock-polyline");
      expect(polyline.props.lineDashPattern).toEqual([1, 8]);
      expect(polyline.props.strokeWidth).toBe(4);
    });
  });

  describe("Transit Mode (Multi-Step Polylines)", () => {
    it("renders multiple polylines with correct colors for walking, metro, and bus segments", () => {
      const transitRouteData = {
        id: "transit-1",
        polylinePoints: [{ latitude: 0, longitude: 0 }],
        steps: [
          {
            travelMode: "WALKING",
            polylinePoints: [{ latitude: 1, longitude: 1 }],
          },
          {
            travelMode: "TRANSIT",
            transitVehicleType: "Subway",
            transitLineName: "Green Line", // STM Green Line
            polylinePoints: [{ latitude: 2, longitude: 2 }],
          },
          {
            travelMode: "TRANSIT",
            transitVehicleType: "Bus",
            polylinePoints: [{ latitude: 3, longitude: 3 }],
          },
        ],
      };

      (useDirections as jest.Mock).mockReturnValue({
        ...mockBaseContext,
        travelMode: "transit",
        routeData: transitRouteData,
      });

      render(<RoutePolyline {...defaultProps} />);
      const polylines = screen.getAllByTestId("mock-polyline");

      expect(polylines.length).toBe(3);

      // walk segment
      expect(polylines[0].props.strokeColor).toBe("#B03060");
      expect(polylines[0].props.lineDashPattern).toBeTruthy();

      // green metro segment
      expect(polylines[1].props.strokeColor).toBe("#139D48"); // Green
      expect(polylines[1].props.lineDashPattern).toBeNull();

      // bus segment
      expect(polylines[2].props.strokeColor).toBe("#A970FF"); // Light purple
    });
  });
});
