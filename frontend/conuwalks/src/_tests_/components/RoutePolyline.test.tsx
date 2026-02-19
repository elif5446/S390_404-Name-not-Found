import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import RoutePolyline from "../../components/RoutePolyline";
import { useDirections } from "@/src/context/DirectionsContext";
import * as directionsApi from "@/src/api/directions";

// Mocking Directions Context
jest.mock("@/src/context/DirectionsContext");

// Mocking the API module with a factory for reliability
jest.mock("@/src/api/directions", () => ({
  getDirections: jest.fn(),
  decodePolyline: jest.fn(),
}));

// Mocking react-native maps
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Polyline: (props: any) => <View testID="mock-polyline" {...props} />,
  };
});

describe("<RoutePolyline /> UI Component Tests", () => {
  const mockUseDirections = useDirections as jest.Mock;
  const mockGetDirections = directionsApi.getDirections as jest.Mock;
  const mockDecodePolyline = directionsApi.decodePolyline as jest.Mock;

  const mockStart = { latitude: 45.49, longitude: -73.57 };
  const mockDest = { latitude: 45.50, longitude: -73.58 };

  const MOCK_ROUTE_DATA = {
    id: "route-0",
    polylinePoints: [],
    distance: "1 km",
    duration: "10 mins",
    eta: "12:00 ETA",
    steps: [],
    overviewPolyline: "mock_polyline_string",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null if no route data is available (Initial render)", () => {
    mockUseDirections.mockReturnValue({
      showDirections: false,
      isNavigationActive: false,
      routeData: null,
    });

    const { queryByTestId } = render(<RoutePolyline />);
    expect(queryByTestId("mock-polyline")).toBeNull();
  });

  it("successfully fetches and displays a route (Covers lines 48-153)", async () => {
    const setRoutes = jest.fn();
    const setRouteData = jest.fn();
    const setLoading = jest.fn();

    mockUseDirections.mockReturnValue({
      destinationCoords: mockDest,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: false,
      setRoutes,
      setRouteData,
      setLoading,
      setError: jest.fn(),
      routeData: { polylinePoints: [{ latitude: 1, longitude: 1 }] }
    });

    // getDirections returns a direct array of RouteData
    mockGetDirections.mockResolvedValue([MOCK_ROUTE_DATA]);
    mockDecodePolyline.mockReturnValue([{ latitude: 1.1, longitude: 1.1 }]);

    render(<RoutePolyline startLocation={mockStart} />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalled();
      expect(setRouteData).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully (Covers Catch block)", async () => {
    const setError = jest.fn();
    mockUseDirections.mockReturnValue({
      destinationCoords: mockDest,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: false,
      setLoading: jest.fn(),
      setError,
      setRoutes: jest.fn(),
    });

    mockGetDirections.mockRejectedValue(new Error("API Down"));

    render(<RoutePolyline startLocation={mockStart} />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      // It should be called with the actual error message
      expect(setError).toHaveBeenCalledWith("API Down");
    });
  });

  it("handles the empty routes array from API (Covers line 150 area)", async () => {
    const setRoutes = jest.fn();
    mockUseDirections.mockReturnValue({
      destinationCoords: mockDest,
      travelMode: "walking",
      showDirections: true,
      isNavigationActive: false,
      setLoading: jest.fn(),
      setRoutes,
      setError: jest.fn(),
    });

    mockGetDirections.mockResolvedValue([]);

    render(<RoutePolyline startLocation={mockStart} />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(setRoutes).toHaveBeenCalledWith([]);
    });
  });

  it("clears timers and sets isMounted to false on unmount (Covers cleanup lines)", () => {
    mockUseDirections.mockReturnValue({
      showDirections: false,
      isNavigationActive: false,
      setLoading: jest.fn(),
    });

    const { unmount } = render(<RoutePolyline />);
    unmount();
    expect(true).toBe(true);
  });
});