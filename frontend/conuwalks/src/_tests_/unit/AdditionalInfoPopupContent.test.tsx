import React from "react";
import { Platform, ScrollView } from "react-native";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import PopupContent from "../../components/AdditionalInfoPopupContent";
import { BuildingMetadata } from "../../types/Building";

//  mock external icon libraries
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));

// mock styles to prevent undefined object errors during render
jest.mock("@/src/styles/additionalInfoPopup", () => ({
  styles: {
    contentArea: {},
    section: {},
    sectionTitle: {},
    sectionText: {},
    hoursContainer: {},
    hoursRow: {},
    hoursLabel: {},
    hoursValue: {},
    addressContainer: {},
    addressText: {},
    copyButton: {},
    descriptionText: {},
  },
  themedStyles: {
    text: () => ({ color: "#000000" }),
    subtext: () => ({ color: "#666666" }),
    mutedText: () => ({ color: "#999999" }),
  },
}));

const mockNextEvent = {
  id: "1",
  courseName: "CompSci 101",
  start: new Date("2026-02-27T10:00:00Z"),
  end: new Date("2026-02-27T11:00:00Z"),
};

describe("PopupContent Component", () => {
  const mockOnDirectionsPress = jest.fn();
  const mockOnCopyAddress = jest.fn();
  const mockOnScroll = jest.fn();
  const mockScrollViewRef = { current: null };

  const defaultProps = {
    mode: "light" as const,
    buildingInfo: null,
    directionsEtaLabel: "10 min",
    isCopying: false,
    onDirectionsPress: mockOnDirectionsPress,
    onCopyAddress: mockOnCopyAddress,
    scrollViewRef: mockScrollViewRef,
    onScroll: mockOnScroll,
    todayEvents: [], // explicitly empty to trigger the "No classes" UI
    nextEvent: mockNextEvent as any, // triggers the "Next class" UI
  };

  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // intercept timers to prevent act() warnings
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    Platform.OS = originalOS;
    jest.useRealTimers();
  });

  it("renders the static Schedule section even without building data", () => {
    render(<PopupContent {...defaultProps} />);

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText("Schedule")).toBeTruthy();
    expect(
      screen.getByText("No classes scheduled in this building today"),
    ).toBeTruthy();
    expect(screen.getByText("Next class in this building:")).toBeTruthy();
    expect(screen.getByText("CompSci 101")).toBeTruthy();

    // Check for the new dynamic accessibility label on the directions button
    expect(
      screen.getByLabelText("Directions to CompSci 101, 10 min"),
    ).toBeTruthy();
  });

  it("triggers onDirectionsPress when directions button is pressed", () => {
    render(<PopupContent {...defaultProps} />);

    const directionsButton = screen.getByLabelText(
      "Directions to CompSci 101, 10 min",
    );
    fireEvent.press(directionsButton);

    expect(mockOnDirectionsPress).toHaveBeenCalledTimes(1);
  });

  it("renders string-based opening hours correctly", () => {
    const buildingInfo = {
      openingHours: "Open 24/7",
    } as BuildingMetadata;

    render(<PopupContent {...defaultProps} buildingInfo={buildingInfo} />);

    expect(screen.getByText("Opening Hours")).toBeTruthy();
    expect(screen.getByText("Open 24/7")).toBeTruthy();
  });

  it("renders object-based opening hours correctly", () => {
    const buildingInfo = {
      openingHours: {
        weekdays: "8:00 AM - 10:00 PM",
        weekend: "Closed",
      },
    } as BuildingMetadata;

    render(<PopupContent {...defaultProps} buildingInfo={buildingInfo} />);

    expect(screen.getByText("Opening Hours")).toBeTruthy();
    expect(screen.getByText("Weekdays:")).toBeTruthy();
    expect(screen.getByText("8:00 AM - 10:00 PM")).toBeTruthy();
    expect(screen.getByText("Weekend:")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
  });

  it("renders address and triggers onCopyAddress when copy button is pressed", () => {
    const buildingInfo = {
      address: "1455 De Maisonneuve Blvd. W.",
    } as BuildingMetadata;

    render(<PopupContent {...defaultProps} buildingInfo={buildingInfo} />);

    expect(screen.getByText("Address")).toBeTruthy();
    expect(screen.getByText("1455 De Maisonneuve Blvd. W.")).toBeTruthy();

    const copyButton = screen.getByLabelText("Copy address");
    expect(copyButton).toBeDefined();

    fireEvent.press(copyButton);
    expect(mockOnCopyAddress).toHaveBeenCalledTimes(1);
  });

  it("renders the description when provided", () => {
    const buildingInfo = {
      description: "Main hub for engineering students.",
    } as BuildingMetadata;

    render(<PopupContent {...defaultProps} buildingInfo={buildingInfo} />);

    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Main hub for engineering students.")).toBeTruthy();
  });

  it("passes onScroll events to the ScrollView", () => {
    render(<PopupContent {...defaultProps} />);

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView).toBeTruthy();

    // simulate a scroll event
    fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { y: 100 } },
    });

    expect(mockOnScroll).toHaveBeenCalledTimes(1);
    expect(mockOnScroll).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { contentOffset: { y: 100 } },
      }),
    );
  });

  describe("Platform Specific Icon Logic", () => {
    const buildingInfoWithAddress = {
      address: "123 Test St.",
    } as BuildingMetadata;

    it("renders iOS SymbolView and toggles icon on copy", () => {
      Platform.OS = "ios";
      const { rerender } = render(
        <PopupContent
          {...defaultProps}
          buildingInfo={buildingInfoWithAddress}
          isCopying={false}
        />,
      );

      const symbolIcon = screen.UNSAFE_getByType("SymbolView" as any);
      expect(symbolIcon.props.name).toBe("document.on.document");

      // rerender with iscopying = true
      rerender(
        <PopupContent
          {...defaultProps}
          buildingInfo={buildingInfoWithAddress}
          isCopying={true}
        />,
      );

      const filledSymbolIcon = screen.UNSAFE_getByType("SymbolView" as any);
      expect(filledSymbolIcon.props.name).toBe("document.on.document.fill");
    });

    it("renders Android MaterialIcons and toggles icon on copy", () => {
      Platform.OS = "android";
      const { rerender } = render(
        <PopupContent
          {...defaultProps}
          buildingInfo={buildingInfoWithAddress}
          isCopying={false}
        />,
      );

      // we use queryallbytype because the directions button also uses materialicons
      let icons = screen.UNSAFE_queryAllByType("MaterialIcons" as any);
      expect(icons.some((i) => i.props.name === "content-copy")).toBe(true);

      // rerender with iscopying = true
      rerender(
        <PopupContent
          {...defaultProps}
          buildingInfo={buildingInfoWithAddress}
          isCopying={true}
        />,
      );

      icons = screen.UNSAFE_queryAllByType("MaterialIcons" as any);
      expect(icons.some((i) => i.props.name === "task")).toBe(true);
    });
  });
});
