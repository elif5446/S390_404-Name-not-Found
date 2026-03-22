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
});
