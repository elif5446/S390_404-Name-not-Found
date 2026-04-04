import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import {
  DirectionsProvider,
  useDirections,
} from "../../context/DirectionsContext";

describe("DirectionsContext", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DirectionsProvider>{children}</DirectionsProvider>
  );

  it("updates start point correctly", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });

    act(() => {
      result.current.setStartPoint(
        "H-BUILDING",
        { latitude: 45.497, longitude: -73.578 },
        "Hall Building",
      );
    });

    expect(result.current.startBuildingId).toBe("H-BUILDING");
    expect(result.current.startLabel).toBe("Hall Building");
    expect(result.current.startCoords?.latitude).toBe(45.497);
  });

  it("clears destination data", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });

    act(() => {
      result.current.clearDestination();
    });

    expect(result.current.destinationBuildingId).toBeNull();
    expect(result.current.destinationCoords).toBeNull();
  });

  it("setDestinationRoom cancels navigation and shows preview popup if active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    // Set navigation active first
    act(() => {
      result.current.setIsNavigationActive(true);
    });
    // Now set destination room
    act(() => {
      result.current.setDestinationRoom("MB-300");
    });
    expect(result.current.isNavigationActive).toBe(false);
    expect(result.current.showDirections).toBe(true);
    expect(result.current.destinationRoom).toBe("MB-300");
  });

  it("setDestinationRoom does not show preview popup if navigation is not active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    // Ensure navigation is not active
    act(() => {
      result.current.setIsNavigationActive(false);
    });
    // Now set destination room
    act(() => {
      result.current.setDestinationRoom("MB-400");
    });
    expect(result.current.isNavigationActive).toBe(false);
    expect(result.current.showDirections).toBe(false);
    expect(result.current.destinationRoom).toBe("MB-400");
  });

  it("setStartRoom does not show preview popup if navigation is not active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    // Ensure navigation is not active
    act(() => {
      result.current.setIsNavigationActive(false);
    });
    // Now set start room
    act(() => {
      result.current.setStartRoom("H-200");
    });
    expect(result.current.isNavigationActive).toBe(false);
    expect(result.current.showDirections).toBe(false);
    expect(result.current.startRoom).toBe("H-200");
  });

  it("setStartRoom cancels navigation and shows preview popup if active", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    // Set navigation active first
    act(() => {
      result.current.setIsNavigationActive(true);
    });
    // Now set start room
    act(() => {
      result.current.setStartRoom("H-100");
    });
    expect(result.current.isNavigationActive).toBe(false);
    expect(result.current.showDirections).toBe(true);
    expect(result.current.startRoom).toBe("H-100");
  });

  it("updates travel mode correctly", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });

    act(() => {
      result.current.setTravelMode("driving");
    });

    expect(result.current.travelMode).toBe("driving");
  });

  it("updates time mode and target time", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });
    const testDate = new Date("2025-12-25T10:00:00");

    act(() => {
      result.current.setTimeMode("arrive");
      result.current.setTargetTime(testDate);
    });

    expect(result.current.timeMode).toBe("arrive");
    expect(result.current.targetTime).toEqual(testDate);
  });

  it("manages loading and error states", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });

    act(() => {
      result.current.setLoading(true);
      result.current.setError("Network error");
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe("Network error");

    act(() => {
      result.current.setLoading(false);
      result.current.setError(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("resets all directions correctly", () => {
    const { result } = renderHook(() => useDirections(), { wrapper });

    // Set various state values
    act(() => {
      result.current.setStartPoint(
        "H-BUILDING",
        { latitude: 45.497, longitude: -73.578 },
        "Hall Building",
        "H-100",
      );
      result.current.setTravelMode("driving");
      result.current.setShowDirections(true);
      result.current.setLoading(true);
      result.current.setError("Some error");
    });

    // Reset
    act(() => {
      result.current.resetDirections();
    });

    // Verify all state is reset
    expect(result.current.startBuildingId).toBeNull();
    expect(result.current.startCoords).toBeNull();
    expect(result.current.startLabel).toBeNull();
    expect(result.current.startRoom).toBeNull();
    expect(result.current.destinationBuildingId).toBeNull();
    expect(result.current.destinationCoords).toBeNull();
    expect(result.current.travelMode).toBe("walking");
    expect(result.current.showDirections).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.timeMode).toBe("leave");
    expect(result.current.targetTime).toBeNull();
  });
});
