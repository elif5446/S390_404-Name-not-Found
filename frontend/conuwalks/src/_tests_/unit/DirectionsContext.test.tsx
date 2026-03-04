import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import {
  DirectionsProvider,
  useDirections,
  RouteData,
} from "../../context/DirectionsContext";

describe("DirectionsContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DirectionsProvider>{children}</DirectionsProvider>
  );

  describe("Initial State", () => {
    it("provides the correct default values", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.startBuildingId).toBeNull();
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.routes).toEqual([]);
      expect(result.current.selectedRouteIndex).toBe(0);
      expect(result.current.routeData).toBeNull();
      expect(result.current.travelMode).toBe("walking");
      expect(result.current.timeMode).toBe("leave");
      expect(result.current.targetTime).toBeNull();
      expect(result.current.showDirections).toBe(false);
      expect(result.current.isNavigationActive).toBe(false);
    });

    it("throws an error if useDirections is used outside of DirectionsProvider", () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useDirections());
      }).toThrow("useDirections must be used within DirectionsProvider");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Start and Destination State Updates", () => {
    it("updates start point correctly", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      const mockCoords = { latitude: 45.0, longitude: -73.0 };

      act(() => {
        result.current.setStartPoint("H", mockCoords, "Hall Building", "H-820");
      });

      expect(result.current.startBuildingId).toBe("H");
      expect(result.current.startCoords).toEqual(mockCoords);
      expect(result.current.startLabel).toBe("Hall Building");
      expect(result.current.startRoom).toBe("H-820");
    });

    it("updates destination point correctly", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      const mockCoords = { latitude: 45.1, longitude: -73.1 };

      act(() => {
        result.current.setDestination("MB", mockCoords, "JMSB");
        result.current.setDestinationRoom("MB-1.210");
      });

      expect(result.current.destinationBuildingId).toBe("MB");
      expect(result.current.destinationCoords).toEqual(mockCoords);
      expect(result.current.destinationLabel).toBe("JMSB");
      expect(result.current.destinationRoom).toBe("MB-1.210");
    });

    it("clears destination and related states correctly", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setDestination(
          "MB",
          { latitude: 0, longitude: 0 },
          "JMSB",
        );
        result.current.setShowDirections(true);
        result.current.setIsNavigationActive(true);
      });

      act(() => {
        result.current.clearDestination();
      });

      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.destinationCoords).toBeNull();
      expect(result.current.showDirections).toBe(false);
      expect(result.current.isNavigationActive).toBe(false);
    });
  });

  describe("Routing State Updates", () => {
    const mockRoute1: RouteData = {
      id: "1",
      distance: "1km",
      duration: "10m",
      eta: "12:00",
      overviewPolyline: "",
      polylinePoints: [],
      steps: [],
      requestMode: "walking",
    };

    const mockRoute2: RouteData = {
      id: "2",
      distance: "2km",
      duration: "20m",
      eta: "12:10",
      overviewPolyline: "",
      polylinePoints: [],
      steps: [],
      requestMode: "walking",
    };

    it("updates routes and bounds selectedRouteIndex", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        // set an index out of bounds first
        result.current.setSelectedRouteIndex(5);
        result.current.setRoutes([mockRoute1, mockRoute2]);
      });

      // the hook logic should clamp the selectedrouteindex to 1 (the last valid index)
      expect(result.current.routes.length).toBe(2);
      expect(result.current.selectedRouteIndex).toBe(1);
    });

    it("automatically derives routeData from routes array and selectedRouteIndex via useEffect", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setRoutes([mockRoute1, mockRoute2]);
        result.current.setSelectedRouteIndex(1);
      });

      // because of the useeffect in the context, routedata should match mockroute2
      expect(result.current.routeData).toEqual(mockRoute2);
    });

    it("allows manual setting of routeData via setRouteData", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setRouteData(mockRoute1);
      });

      expect(result.current.routeData).toEqual(mockRoute1);
    });

    it("clears routing data", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setRoutes([mockRoute1]);
        result.current.clearRouteData();
      });

      expect(result.current.routes).toEqual([]);
      expect(result.current.routeData).toBeNull();
      expect(result.current.selectedRouteIndex).toBe(0);
    });
  });

  describe("UI and Time State Updates", () => {
    it("updates basic UI states", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setTravelMode("transit");
        result.current.setLoading(true);
        result.current.setError("Network error");
      });

      expect(result.current.travelMode).toBe("transit");
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe("Network error");
    });

    it("updates time configuration states", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      const testDate = new Date();

      act(() => {
        result.current.setTimeMode("arrive");
        result.current.setTargetTime(testDate);
      });

      expect(result.current.timeMode).toBe("arrive");
      expect(result.current.targetTime).toBe(testDate);
    });
  });

  describe("Global Reset", () => {
    it("resetDirections wipes all state back to defaults", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // dirties the state
      act(() => {
        result.current.setStartPoint(
          "H",
          { latitude: 0, longitude: 0 },
          "Hall",
        );
        result.current.setDestination(
          "MB",
          { latitude: 1, longitude: 1 },
          "JMSB",
        );
        result.current.setTravelMode("bicycling");
        result.current.setShowDirections(true);
        result.current.setLoading(true);
        result.current.setError("Error");
      });

      // reset
      act(() => {
        result.current.resetDirections();
      });

      // verify clean slate
      expect(result.current.startBuildingId).toBeNull();
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.travelMode).toBe("walking");
      expect(result.current.showDirections).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
