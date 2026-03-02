import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import RightControlsPanel from "../../components/RightControlsPanel";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("RightControlsPanel", () => {
  const defaultProps = {
    userInfo: { name: "Test" },
    onSignOut: jest.fn(),
    userLocation: { latitude: 0, longitude: 0 },
    onLocationPress: jest.fn(),
  };

  it("hides location button when indoorBuildingId is present", () => {
    render(<RightControlsPanel {...defaultProps} indoorBuildingId="H-Building" />);
    expect(screen.queryByLabelText("Recenter to your location")).toBeNull();
  });

  it("shows location button and calls onLocationPress", () => {
    render(<RightControlsPanel {...defaultProps} indoorBuildingId={null} />);
    const btn = screen.getByLabelText("Recenter to your location");
    fireEvent.press(btn);
    expect(defaultProps.onLocationPress).toHaveBeenCalled();
  });
});