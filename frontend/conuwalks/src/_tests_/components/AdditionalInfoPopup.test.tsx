import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import AdditionalInfoPopup from "../../components/AdditionalInfoPopup";

// Mock the metadata files
jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingMetadata: {
    "AD-Building": {
      name: "Administration Building",
      address: "7141 Sherbrooke St. W.",
      description: "Main administrative offices for the Loyola campus.",
      image: "mock-image-url",
    },
  },
}));

jest.mock("../../data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingMetadata: {},
}));

// Mock native modules
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));

describe("<AdditionalInfoPopup /> UI Component Tests", () => {
  const mockOnClose = jest.fn();
  const mockOnDirections = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Use fake timers to control animations
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  it("renders building details correctly when visible", () => {
    const { getByText } = render(
      <AdditionalInfoPopup
        visible={true}
        buildingId="AD-Building"
        campus="LOY"
        onClose={mockOnClose}
        onDirectionsTrigger={mockOnDirections}
      />,
    );

    // Let the initial animation finish
    act(() => {
      jest.runAllTimers();
    });

    expect(getByText("Administration Building")).toBeTruthy();
    expect(getByText("7141 Sherbrooke St. W.")).toBeTruthy();
    expect(
      getByText("Main administrative offices for the Loyola campus."),
    ).toBeTruthy();
  });

  it("shows the directions button and responds to press", () => {
    const { getAllByLabelText } = render(
      <AdditionalInfoPopup
        visible={true}
        buildingId="AD-Building"
        campus="LOY"
        onClose={mockOnClose}
        onDirectionsTrigger={mockOnDirections}
      />,
    );

    act(() => {
      jest.runAllTimers(); // Finish entry animation
    });

    const directionsBtns = getAllByLabelText(/Directions, /);
    fireEvent.press(directionsBtns[0]);

    // Advance timers to complete the dismiss animation
    act(() => {
      jest.runAllTimers();
    });

    // The dismiss callback calls onClose then onDirectionsTrigger
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnDirections).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is pressed", () => {
    const { getByLabelText } = render(
      <AdditionalInfoPopup
        visible={true}
        buildingId="AD-Building"
        campus="LOY"
        onClose={mockOnClose}
      />,
    );

    act(() => {
      jest.runAllTimers(); // Finish entry animation
    });

    const closeBtn = getByLabelText("Close");
    fireEvent.press(closeBtn);

    // Advance timers for the dismiss animation
    act(() => {
      jest.runAllTimers();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders the ETA label if provided", () => {
    const testEta = "8 min walk";
    const { getAllByText } = render(
      <AdditionalInfoPopup
        visible={true}
        buildingId="AD-Building"
        campus="LOY"
        onClose={mockOnClose}
        directionsEtaLabel={testEta}
      />,
    );

    act(() => {
      jest.runAllTimers();
    });

    const etaElements = getAllByText(testEta);
    expect(etaElements.length).toBeGreaterThan(0);
  });
});
