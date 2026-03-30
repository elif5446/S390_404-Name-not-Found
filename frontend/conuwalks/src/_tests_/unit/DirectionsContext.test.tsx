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
      const mockCoords = { latitude: 45, longitude: -73 };

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
        result.current.setDestination("MB", mockCoords, "JMSB", "MB-1.210");
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
      baseDurationSeconds: 600,
      eta: "12:00",
      overviewPolyline: "",
      polylinePoints: [],
      steps: [],
      requestMode: "walking" as const,
    };

    const mockRoute2: RouteData = {
      id: "2",
      distance: "2km",
      duration: "20m",
      baseDurationSeconds: 1200,
      eta: "12:10",
      overviewPolyline: "",
      polylinePoints: [],
      steps: [],
      requestMode: "walking" as const,
    };

    it("updates routes and bounds selectedRouteIndex", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // Set the out-of-bounds index first, then supply routes in a separate act
      // so the functional setState inside setRoutes sees the updated index (5).
      act(() => {
        result.current.setSelectedRouteIndex(5);
      });

      act(() => {
        result.current.setRoutes([mockRoute1, mockRoute2]);
      });

      // setRoutes clamps the index to routes.length - 1 (i.e. 1)
      expect(result.current.routes.length).toBe(2);
      expect(result.current.selectedRouteIndex).toBe(1);
    });

    it("automatically derives routeData from routes array and selectedRouteIndex via useEffect", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.setRoutes([mockRoute1, mockRoute2]);
      });

      act(() => {
        result.current.setSelectedRouteIndex(1);
      });

      // Because of the useEffect in the context, routeData should match mockRoute2
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

      // Dirty the state
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

      // Reset
      act(() => {
        result.current.resetDirections();
      });

      // Verify clean slate
      expect(result.current.startBuildingId).toBeNull();
      expect(result.current.destinationBuildingId).toBeNull();
      expect(result.current.travelMode).toBe("walking");
      expect(result.current.showDirections).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("Coverage for setStartRoom and setDestinationRoom", () => {
    it("setStartRoom triggers showDirections when navigation is active", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      // Set navigation active
      act(() => {
        result.current.setIsNavigationActive(true);
      });
      // Call setStartRoom
      act(() => {
        result.current.setStartRoom("H-999");
      });
      expect(result.current.startRoom).toBe("H-999");
      expect(result.current.showDirections).toBe(true);
      expect(result.current.isNavigationActive).toBe(false);
    });
    it("setDestinationRoom triggers showDirections when navigation is active", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      // Set navigation active
      act(() => {
        result.current.setIsNavigationActive(true);
      });
      // Call setDestinationRoom
      act(() => {
        result.current.setDestinationRoom("MB-999");
      });
      expect(result.current.destinationRoom).toBe("MB-999");
      expect(result.current.showDirections).toBe(true);
      expect(result.current.isNavigationActive).toBe(false);
    });
  });

  describe("Coverage for setRoutes index clamping", () => {
    it("clamps selectedRouteIndex if out of bounds", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      const mockRoute1 = {
        id: "1",
        distance: "1km",
        duration: "10m",
        baseDurationSeconds: 600,
        eta: "12:00",
        overviewPolyline: "",
        polylinePoints: [],
        steps: [],
        requestMode: "walking" as const,
      };
      const mockRoute2 = {
        id: "2",
        distance: "2km",
        duration: "20m",
        baseDurationSeconds: 1200,
        eta: "12:10",
        overviewPolyline: "",
        polylinePoints: [],
        steps: [],
        requestMode: "walking" as const,
      };
      // Set index out of bounds
      act(() => {
        result.current.setSelectedRouteIndex(5);
      });
      // Now set routes with only 1 route
      act(() => {
        result.current.setRoutes([mockRoute1]);
      });
      expect(result.current.selectedRouteIndex).toBe(0);
      // Now set routes with 2 routes and index 1
      act(() => {
        result.current.setSelectedRouteIndex(1);
      });
      act(() => {
        result.current.setRoutes([mockRoute1, mockRoute2]);
      });
      expect(result.current.selectedRouteIndex).toBe(1);
    });

    it("clamps selectedRouteIndex to 0 when routes is set to empty", () => {
      const { result } = renderHook(() => useDirections(), { wrapper });
      act(() => {
        result.current.setSelectedRouteIndex(2);
      });
      act(() => {
        result.current.setRoutes([]);
      });
      expect(result.current.selectedRouteIndex).toBe(0);
    });
  });

  it("setStartPoint triggers showDirections when navigation is active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    act(() => {
      result.current.setIsNavigationActive(true);
    });
    act(() => {
      result.current.setStartPoint("H", { latitude: 1, longitude: 2 }, "Hall", "H-101");
    });
    expect(result.current.showDirections).toBe(true);
    expect(result.current.isNavigationActive).toBe(false);
  });

  it("setDestination triggers showDirections when navigation is active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    act(() => {
      result.current.setIsNavigationActive(true);
    });
    act(() => {
      result.current.setDestination("MB", { latitude: 3, longitude: 4 }, "JMSB", "MB-201");
    });
    expect(result.current.showDirections).toBe(true);
    expect(result.current.isNavigationActive).toBe(false);
  });
});