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
});
