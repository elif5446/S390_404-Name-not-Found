import React from "react";
import { Platform } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import PopupHeader from "../../components/AdditionalInfoPopupHeader";
import { BuildingMetadata, AccessibilityIconDef } from "../../types/Building";

// mock the native/external icon components
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
jest.mock("../../components/MetroIcon", () => ({ MetroIcon: "MetroIcon" }));

// mock styles and themedstyles to prevent undefined errors
jest.mock("@/src/styles/additionalInfoPopup", () => ({
  styles: {
    handleBarContainer: {},
    handleBar: {},
    iosHeader: {},
    closeButton: {},
    closeButtonCircle: {},
    closeButtonText: {},
    headerTextContainer: {},
    buildingName: {},
    buildingIdWithIconsContainer: {},
    buildingIdContainer: {},
    buildingId: {},
    rightHeaderActions: {},
    directionsButton: {},
    directionsArrowCircle: {},
    directionsEtaText: {},
    accessibilityIconsContainer: {},
    rightAccessibilityRow: {},
  },
  themedStyles: {
    text: () => ({ color: "#000000" }),
    subtext: () => ({ color: "#666666" }),
    closeButton: () => ({ backgroundColor: "#EEEEEE" }),
    mutedText: () => ({ color: "#999999" }),
  },
}));

describe("PopupHeader Component", () => {
  const mockOnDismiss = jest.fn();
  const mockOnDirectionsPress = jest.fn();
  const mockOnToggleHeight = jest.fn();
  const mockOnDragHandleAccessibilityAction = jest.fn();

  const mockBuildingInfo: BuildingMetadata = {
    name: "Henry F. Hall Building",
    address: "1455 De Maisonneuve Blvd. W.",
  } as BuildingMetadata;

  const mockAccessibilityIcons: AccessibilityIconDef[] = [
    {
      key: "metro",
      sf: "tram.fill.tunnel",
      material: "subway",
      label: "Metro Access",
    },
    {
      key: "wheelchair",
      sf: "figure.roll",
      material: "accessible",
      label: "Wheelchair Accessible",
    },
  ] as AccessibilityIconDef[];

  const defaultProps = {
    mode: "light" as const,
    buildingId: "H",
    buildingInfo: mockBuildingInfo,
    accessibilityIcons: [],
    directionsEtaLabel: "5 min",
    onDismiss: mockOnDismiss,
    onDirectionsPress: mockOnDirectionsPress,
    onToggleHeight: mockOnToggleHeight,
    onDragHandleAccessibilityAction: mockOnDragHandleAccessibilityAction,
  };

  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("renders building name, ID, and directions ETA", () => {
    render(<PopupHeader {...defaultProps} />);

    expect(screen.getByText("Henry F. Hall Building")).toBeTruthy();
    expect(screen.getByText("H")).toBeTruthy();
    expect(screen.getByText("5 min")).toBeTruthy();
  });

  it("renders a default name when buildingInfo is null", () => {
    render(<PopupHeader {...defaultProps} buildingInfo={null} />);

    expect(screen.getByText("Building")).toBeTruthy();
  });

  it("calls onDismiss when the close button is pressed", () => {
    render(<PopupHeader {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close");
    fireEvent.press(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDirectionsPress when directions button is pressed", () => {
    render(<PopupHeader {...defaultProps} />);

    const directionsButton = screen.getByLabelText("Directions, 5 min");
    fireEvent.press(directionsButton);

    expect(mockOnDirectionsPress).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleHeight when the drag handle is pressed", () => {
    render(<PopupHeader {...defaultProps} />);

    const dragHandle = screen.getByLabelText("Drag handle");
    fireEvent.press(dragHandle);

    expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleHeight when the header background is pressed", () => {
    render(<PopupHeader {...defaultProps} />);
    // because the building name is inside the touchablewithoutfeedback,
    // pressing it bubbles up to trigger the ontoggleheight callback
    const buildingNameText = screen.getByText("Henry F. Hall Building");
    fireEvent.press(buildingNameText);

    expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
  });

  it("renders iOS specific close button and SF Symbols correctly", () => {
    Platform.OS = "ios";
    render(
      <PopupHeader
        {...defaultProps}
        accessibilityIcons={mockAccessibilityIcons}
      />,
    );

    // verify ios text-based close button
    expect(screen.getByText("✕")).toBeTruthy();

    // verify custom metro icon is prioritized over sf symbol for the metro key
    expect(screen.UNSAFE_queryByType("MetroIcon" as any)).toBeTruthy();

    // verify sf symbol is used for the standard icon
    const sfSymbol = screen.UNSAFE_queryByType("SymbolView" as any);
    expect(sfSymbol).toBeTruthy();
    expect(sfSymbol.props.name).toBe("figure.roll");

    // materialicons should not be rendered on ios (unless it's the directions arrow, which is hardcoded)
    const materialIcons = screen.UNSAFE_queryAllByType("MaterialIcons" as any);
    expect(materialIcons.some((icon) => icon.props.name === "accessible")).toBe(
      false,
    );
  });

  it("renders Android specific close button and Material Icons correctly", () => {
    Platform.OS = "android";
    render(
      <PopupHeader
        {...defaultProps}
        accessibilityIcons={mockAccessibilityIcons}
      />,
    );

    // the text close button should not exist on android
    expect(screen.queryByText("✕")).toBeNull();

    // verify custom metro icon is still prioritized on android
    expect(screen.UNSAFE_queryByType("MetroIcon" as any)).toBeTruthy();

    // verify materialicons are used instead of sf symbols
    expect(screen.UNSAFE_queryByType("SymbolView" as any)).toBeNull();

    // check for the android close icon and the accessible icon
    const materialIcons = screen.UNSAFE_queryAllByType("MaterialIcons" as any);
    expect(materialIcons.some((icon) => icon.props.name === "close")).toBe(
      true,
    );
    expect(materialIcons.some((icon) => icon.props.name === "accessible")).toBe(
      true,
    );
  });

  it("passes accessibility actions from the drag handle", () => {
    render(<PopupHeader {...defaultProps} />);

    const dragHandle = screen.getByLabelText("Drag handle");

    // simulate an accessibility action (e.g., from voiceover/talkback)
    fireEvent(dragHandle, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(mockOnDragHandleAccessibilityAction).toHaveBeenCalledTimes(1);
    expect(mockOnDragHandleAccessibilityAction).toHaveBeenCalledWith({
      nativeEvent: { actionName: "increment" },
    });
  });
});
