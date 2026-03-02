import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import MapScheduleToggle from "../../components/MapScheduleToggle";

// Mock external icons
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));

describe("MapScheduleToggle", () => {
  const mockOnChange = jest.fn();

  it("renders both Map and Schedule buttons", () => {
    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);
    expect(screen.getByText("Map")).toBeTruthy();
    expect(screen.getByText("Schedule")).toBeTruthy();
  });

  it("calls onChange when a tab is pressed", () => {
    render(<MapScheduleToggle selected="map" onChange={mockOnChange} />);
    fireEvent.press(screen.getByText("Schedule"));
    expect(mockOnChange).toHaveBeenCalledWith("calendar");
  });

  it("returns null when visible is false", () => {
    const { toJSON } = render(
      <MapScheduleToggle selected="map" onChange={mockOnChange} visible={false} />
    );
    expect(toJSON()).toBeNull();
  });
});