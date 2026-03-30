import React from "react";
import { Platform } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import PopupHeader from "../../components/AdditionalInfoPopupHeader";
import { BuildingMetadata, AccessibilityIconDef } from "../../indoors/types/Building";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
jest.mock("../../components/MetroIcon", () => ({ MetroIcon: "MetroIcon" }));
jest.mock("../../components/ui/PlatformIcon", () => "PlatformIcon");
jest.mock("../../components/ui/BottomSheetDragHandle", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({ isDark, onToggleHeight, onAccessibilityAction }: any) => (
    <TouchableOpacity
      accessibilityLabel="Drag handle"
      onPress={onToggleHeight}
      onAccessibilityAction={onAccessibilityAction}
    >
      <Text>Drag Handle</Text>
    </TouchableOpacity>
  );
});

jest.mock("@/src/styles/additionalInfoPopup", () => ({
  styles: {
    handleBarContainer: {},
    handleBar: {},
    iosHeader: {},
    leftHeaderActions: {},
    closeButton: {},
    closeButtonCircle: {},
    closeButtonText: {},
    openIndoorHeaderButton: {},
    openIndoorHeaderButtonText: {},
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
    openIndoorHeaderButton: () => ({ backgroundColor: "#FFFFFF" }),
    openIndoorHeaderButtonText: () => ({ color: "#000000" }),
  },
}));

describe("PopupHeader Component", () => {
  const mockOnDismiss = jest.fn();
  const mockOnDirectionsPress = jest.fn();
  const mockOnToggleHeight = jest.fn();
  const mockOnDragHandleAccessibilityAction = jest.fn();
  const mockOnOpenIndoorPress = jest.fn();

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

  it("renders '--' as ETA fallback when directionsEtaLabel is undefined", () => {
    render(<PopupHeader {...defaultProps} directionsEtaLabel={undefined} />);

    expect(screen.getByLabelText("Directions, --")).toBeTruthy();
    expect(screen.getByText("--")).toBeTruthy();
  });

  it("renders in dark mode without errors", () => {
    render(<PopupHeader {...defaultProps} mode="dark" />);

    expect(screen.getByText("Henry F. Hall Building")).toBeTruthy();
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

    const buildingNameText = screen.getByText("Henry F. Hall Building");
    fireEvent.press(buildingNameText);

    expect(mockOnToggleHeight).toHaveBeenCalledTimes(1);
  });


  it("does not render the indoor button when showOpenIndoorButton is false", () => {
    render(
      <PopupHeader
        {...defaultProps}
        showOpenIndoorButton={false}
        onOpenIndoorPress={mockOnOpenIndoorPress}
      />,
    );

    expect(screen.queryByLabelText("Open indoor map")).toBeNull();
  });

  it("does not render the indoor button when onOpenIndoorPress is not provided", () => {
    render(
      <PopupHeader
        {...defaultProps}
        showOpenIndoorButton={true}
        onOpenIndoorPress={undefined}
      />,
    );

    expect(screen.queryByLabelText("Open indoor map")).toBeNull();
  });

  it("renders and calls onOpenIndoorPress when the indoor button is shown and pressed", () => {
    render(
      <PopupHeader
        {...defaultProps}
        showOpenIndoorButton={true}
        onOpenIndoorPress={mockOnOpenIndoorPress}
      />,
    );

    const indoorButton = screen.getByLabelText("Open indoor map");
    expect(indoorButton).toBeTruthy();

    fireEvent.press(indoorButton);
    expect(mockOnOpenIndoorPress).toHaveBeenCalledTimes(1);
  });

  it("renders the 'Indoor' label text inside the indoor button", () => {
    render(
      <PopupHeader
        {...defaultProps}
        showOpenIndoorButton={true}
        onOpenIndoorPress={mockOnOpenIndoorPress}
      />,
    );

    expect(screen.getByText("Indoor")).toBeTruthy();
  });

  it("does not render the accessibility icon row when no icons are provided", () => {
    render(<PopupHeader {...defaultProps} accessibilityIcons={[]} />);

    expect(screen.queryByLabelText("Metro Access")).toBeNull();
    expect(screen.queryByLabelText("Wheelchair Accessible")).toBeNull();
  });

  it("renders accessibility icon wrappers with correct labels", () => {
    render(
      <PopupHeader {...defaultProps} accessibilityIcons={mockAccessibilityIcons} />,
    );

    expect(screen.getByLabelText("Metro Access")).toBeTruthy();
    expect(screen.getByLabelText("Wheelchair Accessible")).toBeTruthy();
  });

  it("updates sidePadding and rightHeight via onLayout of the right actions view", () => {

    render(
      <PopupHeader {...defaultProps} accessibilityIcons={mockAccessibilityIcons} />,
    );

    const allViews = screen.UNSAFE_queryAllByType("View" as any);
    allViews.forEach((view) => {
      if (view.props.onLayout) {
        fireEvent(view, "layout", {
          nativeEvent: { layout: { width: 120, height: 50 } },
        });
      }
    });

    expect(screen.getByText("Henry F. Hall Building")).toBeTruthy();
  });

  it("renders iOS specific close button and SF Symbols correctly", () => {
    Platform.OS = "ios";
    render(
      <PopupHeader
        {...defaultProps}
        accessibilityIcons={mockAccessibilityIcons}
      />,
    );

    expect(screen.getByText("✕")).toBeTruthy();

    expect(screen.UNSAFE_queryByType("MetroIcon" as any)).toBeTruthy();

    const sfSymbol = screen.UNSAFE_queryAllByType("SymbolView" as any);
    expect(sfSymbol.some((symbol) => symbol.props.name === "figure.roll")).toBeTruthy();

    const materialIcons = screen.UNSAFE_queryAllByType("MaterialIcons" as any);
    expect(materialIcons.some((icon) => icon.props.name === "accessible-forward")).toBe(false);
  });

  it("renders Android specific close button and Material Icons correctly", () => {
    Platform.OS = "android";
    render(
      <PopupHeader
        {...defaultProps}
        accessibilityIcons={mockAccessibilityIcons}
      />,
    );

    expect(screen.queryByText("✕")).toBeNull();

    expect(screen.getByLabelText("Close")).toBeTruthy();

    expect(screen.UNSAFE_queryByType("MetroIcon" as any)).toBeTruthy();

    expect(screen.UNSAFE_queryByType("SymbolView" as any)).toBeNull();

    const platformIcons = screen.UNSAFE_queryAllByType("PlatformIcon" as any);
    expect(platformIcons.some((icon) => icon.props.materialName === "accessible")).toBe(true);
  });

  it("renders PlatformIcon for non-metro accessibility icons on Android", () => {
    Platform.OS = "android";
    render(
      <PopupHeader
        {...defaultProps}
        accessibilityIcons={mockAccessibilityIcons}
      />,
    );

    const platformIcons = screen.UNSAFE_queryAllByType("PlatformIcon" as any);
    expect(
      platformIcons.some((icon) => icon.props.materialName === "accessible"),
    ).toBe(true);
  });

  it("passes accessibility actions from the drag handle", () => {
    render(<PopupHeader {...defaultProps} />);

    const dragHandle = screen.getByLabelText("Drag handle");

    fireEvent(dragHandle, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(mockOnDragHandleAccessibilityAction).toHaveBeenCalledTimes(1);
    expect(mockOnDragHandleAccessibilityAction).toHaveBeenCalledWith({
      nativeEvent: { actionName: "increment" },
    });
  });
});
