import React from "react";
import { render, act } from "@testing-library/react-native";
import RoutePolyline from "../../components/RoutePolyline";
import { useDirections } from "@/src/context/DirectionsContext";
import { getDirections, decodePolyline } from "@/src/api/directions";
import { getShuttleRouteIfApplicable } from "@/src/api/shuttleEngine";

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return { Polyline: () => <View testID="mock-polyline" /> };
});

jest.mock("@/src/context/DirectionsContext", () => ({
  useDirections: jest.fn(),
}));
jest.mock("@/src/api/directions", () => ({
  getDirections: jest.fn(),
  decodePolyline: jest.fn((str) => [{ latitude: 1, longitude: 1 }]), // Dummy decode
}));
jest.mock("@/src/api/shuttleEngine", () => ({
  getShuttleRouteIfApplicable: jest.fn(),
}));

describe("RoutePolyline - Logic & Functions", () => {
  let mockSetRoutes: jest.Mock;
  let mockSetRouteData: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  const defaultProps = {
    startLocation: { latitude: 45.5, longitude: -73.6 },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockSetRoutes = jest.fn();
    mockSetRouteData = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    (useDirections as jest.Mock).mockReturnValue({
      destinationCoords: { latitude: 45.6, longitude: -73.5 },
      travelMode: "transit",
      timeMode: "leave",
      targetTime: new Date("2026-03-01T12:00:00Z"),
      showDirections: true,
      isNavigationActive: false,
      routeData: null,
      setRoutes: mockSetRoutes,
      setRouteData: mockSetRouteData,
      setLoading: mockSetLoading,
      setError: mockSetError,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("API Fetching & Debouncing", () => {
    it("debounces the API request by 300ms", async () => {
      (getDirections as jest.Mock).mockResolvedValue([]);

      render(<RoutePolyline {...defaultProps} />);
      // initially not called
      expect(getDirections).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(getDirections).not.toHaveBeenCalled();

      // advance past the 300ms threshold
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      expect(getDirections).toHaveBeenCalledTimes(1);
    });

    it("skips fetching and clears routes if coordinates are invalid", async () => {
      render(
        <RoutePolyline startLocation={{ latitude: NaN, longitude: -73.6 }} />,
      );

      await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(getDirections).not.toHaveBeenCalled();
      expect(mockSetRoutes).toHaveBeenCalledWith([]);
    });

    it("handles successful fetch and sets state correctly", async () => {
      const mockApiRoutes = [{ id: "1", overviewPolyline: "encoded_str" }];
      (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);

      render(<RoutePolyline {...defaultProps} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(decodePolyline).toHaveBeenCalledWith("encoded_str");

      // decoded output setup in mock is [{ latitude: 1, longitude: 1 }]
      const expectedRoute = {
        ...mockApiRoutes[0],
        polylinePoints: [{ latitude: 1, longitude: 1 }],
      };
      expect(mockSetRoutes).toHaveBeenCalledWith([expectedRoute]);
      expect(mockSetRouteData).toHaveBeenCalledWith(expectedRoute);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it("handles API errors gracefully", async () => {
      (getDirections as jest.Mock).mockRejectedValue(
        new Error("Network Error"),
      );

      render(<RoutePolyline {...defaultProps} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(mockSetError).toHaveBeenCalledWith("Network Error");
      expect(mockSetRoutes).toHaveBeenCalledWith([]);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Shuttle Injection Logic", () => {
    it("injects shuttle route if applicable and wait time is reasonable", async () => {
      const mockApiRoutes = [
        { id: "public-1", duration: "1 h 0 min", overviewPolyline: "xyz" },
      ];
      (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);

      // target time is noon. shuttle departs at 12:15. wait is 15 mins (less than 60 mins)
      const mockShuttle = {
        isShuttle: true,
        departureDate: "2026-03-01T12:15:00Z",
        polylinePoints: [{ lat: 1, lng: 1 }],
      };
      (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(mockShuttle);

      render(<RoutePolyline {...defaultProps} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      // the shuttle should be unshifted to index 0
      expect(mockSetRoutes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ isShuttle: true }),
          expect.objectContaining({ id: "public-1" }),
        ]),
      );
    });

    it("hides shuttle route if the wait time is longer than taking public transit", async () => {
      // 30 min public transit
      const mockApiRoutes = [
        { id: "public-1", duration: "30 min", overviewPolyline: "xyz" },
      ];
      (getDirections as jest.Mock).mockResolvedValue(mockApiRoutes);

      // target time is noon. shuttle departs at 1:00 pm. wait is 60 mins (greater than 30 mins)
      const mockShuttle = {
        isShuttle: true,
        departureDate: "2026-03-01T13:00:00Z",
        polylinePoints: [{ lat: 1, lng: 1 }],
      };
      (getShuttleRouteIfApplicable as jest.Mock).mockResolvedValue(mockShuttle);

      render(<RoutePolyline {...defaultProps} />);

      await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
      });

      // the shuttle should not be injected
      expect(mockSetRoutes).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "public-1" })]),
      );
    });
  });
});
