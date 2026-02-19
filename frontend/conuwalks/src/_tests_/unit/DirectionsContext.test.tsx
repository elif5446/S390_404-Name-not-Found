import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { DirectionsProvider, useDirections, RouteData } from "@/src/context/DirectionsContext";

// Mock Data
const MOCK_COORDS = { latitude: 45.495, longitude: -73.578 };
const MOCK_ROUTE: RouteData = {
  id: "route-123",
  polylinePoints: [MOCK_COORDS],
  distance: "1.5 km",
  duration: "18 mins",
  eta: "2:30 PM",
  steps: [],
  overviewPolyline: "encoded_polyline_string",
};

describe("DirectionsContext - Unit Tests", () => {
  // Wrapper to provide context to the hook
  // tsx file because of wrapper but only logic is tested no ui
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DirectionsProvider>{children}</DirectionsProvider>
  );

  describe("Initial State", () => {
    it("should have correct initial state on mount", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.startBuildingId).toBeNull();
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.isNavigationActive).toBe(false);
      expect(result.current.showDirections).toBe(false);
      expect(result.current.travelMode).toBe("walking");
      expect(result.current.routes).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("Start and Destination Management", () => {
    it("should update start point state correctly", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setStartPoint("H", MOCK_COORDS, "Hall Building", "H-820");
      });

      expect(result.current.startBuildingId).toBe("H");
      expect(result.current.startLabel).toBe("Hall Building");
      expect(result.current.startRoom).toBe("H-820");
      expect(result.current.startCoords).toEqual(MOCK_COORDS);
    });

    it("should update destination state and handle clearing", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setDestination("LB", MOCK_COORDS, "Library");
      });
      expect(result.current.destinationBuildingId).toBe("LB");

      act(() => {
        result.current.clearDestination();
      });
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.destinationCoords).toBeNull();
    });

    it("should update room numbers independently", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setStartRoom("Room A");
        result.current.setDestinationRoom("Room B");
      });

      expect(result.current.startRoom).toBe("Room A");
      expect(result.current.destinationRoom).toBe("Room B");
    });
  });

  describe("Navigation & Route Management", () => {
    it("should manage multiple routes and current selection index", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setRoutes([MOCK_ROUTE]);
        result.current.setSelectedRouteIndex(0); // Valid index for 1 route
      });

      expect(result.current.routes).toHaveLength(1);
      expect(result.current.selectedRouteIndex).toBe(0);
      expect(result.current.routeData).toEqual(MOCK_ROUTE);
    });

    it("should update travel modes and navigation visibility", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setTravelMode("transit");
        result.current.setShowDirections(true);
        result.current.setIsNavigationActive(true);
      });

      expect(result.current.travelMode).toBe("transit");
      expect(result.current.showDirections).toBe(true);
      expect(result.current.isNavigationActive).toBe(true);
    });
  });

  describe("Error and Loading States", () => {
    it("should handle async states correctly", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setLoading(true);
        result.current.setError("Network Error");
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe("Network Error");
    });
  });

  describe("Reset Logic", () => {
    it("should restore all states to defaults when resetDirections is called", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // 1. setting several states to non-default values
      act(() => {
        result.current.setDestination("H", MOCK_COORDS, "Hall");
        result.current.setIsNavigationActive(true);
        result.current.setTravelMode("transit");
        result.current.setError("Temporary Error");
      });

      // 2. performing the reset
      act(() => {
        result.current.resetDirections();
      });

      // 3. verifying clean slate
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.isNavigationActive).toBe(false);
      expect(result.current.travelMode).toBe("walking");
      expect(result.current.error).toBeNull();
    });
  });

  describe("Safety & Bounds", () => {
    it("should throw an error if useDirections is used outside of a Provider", () => {

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => renderHook(() => useDirections())).toThrow(
        "useDirections must be used within DirectionsProvider"
      );

      consoleSpy.mockRestore();
    });
  });
});


