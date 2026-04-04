import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import POIBadge from "@/src/components/indoor/POIBadge";
import { POI } from "@/src/types/poi";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name, size, color }: any) => (
      <Text testID="mock-ionicon">{`${name}-${size}-${color}`}</Text>
    ),
    MaterialCommunityIcons: ({ name, size, color }: any) => (
      <Text testID="mock-mci">{`${name}-${size}-${color}`}</Text>
    ),
  };
});

jest.mock("@/src/styles/IndoorPOI.styles", () => ({
  POI_PALETTE: {
    pink: "#B03060",
    iconDark: "#000",
    wcF: "#F00",
    wcM: "#00F",
    wcA: "#0F0",
    white: "#FFF",
    textDark: "#333",
  },
  poiBadgeStyles: {
    badge: { width: 18, height: 18, borderRadius: 9 },
    // omit backgroundcolor here so the test can verify the component's dynamic colors
    highlighted: { borderWidth: 2, borderColor: "#FFF" },
  },
}));

// a helper to quickly generate a mock poi
const createMockPOI = (overrides: Partial<POI>): POI => ({
  id: "mock-poi",
  label: "Mock Label",
  category: "ROOM",
  description: "Mock Description",
  room: "101",
  floor: 1,
  mapPosition: { x: 0.5, y: 0.5 },
  ...overrides,
});

const defaultProps = {
  left: 100,
  top: 200,
  size: 18,
  onPress: jest.fn(),
};

describe("POIBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Room Category Rendering", () => {
    it("renders only the text label for standard rooms (not LABs)", () => {
      const poi = createMockPOI({ category: "ROOM", room: "801" });
      const { getByText, queryByTestId } = render(
        <POIBadge poi={poi} {...defaultProps} />,
      );

      expect(getByText("801")).toBeTruthy();
      expect(queryByTestId("mock-ionicon")).toBeNull();
      expect(queryByTestId("mock-mci")).toBeNull();
    });

    it("renders the sub-room desktop icon for specific overrides like 805.01", () => {
      const poi = createMockPOI({ category: "ROOM", room: "805.01" });
      const { getByText, getByTestId } = render(
        <POIBadge poi={poi} {...defaultProps} />,
      );

      expect(getByText("805.01")).toBeTruthy();

      const icon = getByTestId("mock-ionicon");
      expect(icon.children[0]).toContain("desktop-outline");
    });

    // new coverage for getRoomLabelFontSize
    it("applies different font sizes for compact and extended rooms", () => {
      const compactPoi = createMockPOI({ category: "ROOM", room: "851.01" });
      const { getByText, rerender } = render(
        <POIBadge poi={compactPoi} {...defaultProps} />,
      );
      expect(getByText("851.01").props.style.fontSize).toBe(6);

      const extendedPoi = createMockPOI({ category: "ROOM", room: "101.5" });
      rerender(<POIBadge poi={extendedPoi} {...defaultProps} />);
      expect(getByText("101.5").props.style.fontSize).toBe(6.5);
    });
  });

  describe("Icon Rendering & Styling", () => {
    it("renders Ionicons for categories like WC_M", () => {
      const poi = createMockPOI({ category: "WC_M", room: "810" });
      const { getByTestId } = render(<POIBadge poi={poi} {...defaultProps} />);

      const icon = getByTestId("mock-ionicon");
      expect(icon.children[0]).toContain("male-outline");
    });

    it("renders MaterialCommunityIcons for categories like FOOD", () => {
      const poi = createMockPOI({ category: "FOOD", room: "820" });
      const { getByTestId } = render(<POIBadge poi={poi} {...defaultProps} />);

      const icon = getByTestId("mock-mci");
      expect(icon.children[0]).toContain("coffee");
    });

    it("renders custom IT text for the IT category", () => {
      const poi = createMockPOI({ category: "IT", room: "815" });
      const { getByText } = render(<POIBadge poi={poi} {...defaultProps} />);

      expect(getByText("IT")).toBeTruthy();
    });
  });

  describe("Selection States (Source/Destination)", () => {
    it("applies destination styling when selectionType is 'destination'", () => {
      const poi = createMockPOI({ category: "LAB", room: "801" });
      const { getByLabelText } = render(
        <POIBadge poi={poi} {...defaultProps} selectionType="destination" />,
      );

      const button = getByLabelText("Mock Description – Room 801");
      // fix: flatten the style array so we can strictly check the properties
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.backgroundColor).toBe("#B03060");
    });

    it("applies source styling when selectionType is 'source'", () => {
      const poi = createMockPOI({ category: "LAB", room: "801" });
      const { getByLabelText } = render(
        <POIBadge poi={poi} {...defaultProps} selectionType="source" />,
      );

      const button = getByLabelText("Mock Description – Room 801");
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.backgroundColor).toBe("#3A7BD5");
    });
  });

  describe("Manual Overrides & Offset Logic", () => {
    it("applies manual ICON_POSITION_OVERRIDES based on room number", () => {
      const poi = createMockPOI({ category: "WC_M", room: "836" });
      const { toJSON } = render(<POIBadge poi={poi} {...defaultProps} />);

      const rootNode = toJSON() as any;
      const flatStyle = StyleSheet.flatten(rootNode.props.style);

      expect(flatStyle.position).toBe("absolute");
      expect(flatStyle.left).toBeDefined();
      expect(flatStyle.top).toBeDefined();
    });

    it("renders labels underneath food POIs when showLabel is true", () => {
      const poi = createMockPOI({
        category: "FOOD",
        room: "820",
        label: "Cafe",
        showLabel: true,
      });
      const { getByText } = render(<POIBadge poi={poi} {...defaultProps} />);

      expect(getByText("Cafe")).toBeTruthy();
    });

    it("shrinks the size for specific compact icons like SECOND_CUP", () => {
      const poi = createMockPOI({
        category: "SECOND_CUP",
        room: "820",
        label: "SC",
      });
      const { getByLabelText } = render(
        <POIBadge poi={poi} {...defaultProps} />,
      );

      const button = getByLabelText("Mock Description – Room 820");
      const flatStyle = StyleSheet.flatten(button.props.style);

      expect(flatStyle.width).toBe(12);
      expect(flatStyle.height).toBe(12);
    });

    // new coverage for calculateMarkerShift & getIconBadgeShift
    it("applies specific badge shifts for room 805 and 809", () => {
      const poi809 = createMockPOI({ category: "LAB", room: "809" });
      const { getByLabelText, rerender } = render(
        <POIBadge poi={poi809} {...defaultProps} />,
      );

      const button809 = getByLabelText("Mock Description – Room 809");
      const style809 = StyleSheet.flatten(button809.props.style);

      expect(style809.marginTop).toBe(1);

      const poi805 = createMockPOI({ category: "LAB", room: "805" });
      rerender(<POIBadge poi={poi805} {...defaultProps} />);

      const button805 = getByLabelText("Mock Description – Room 805");
      const style805 = StyleSheet.flatten(button805.props.style);

      expect(style805.marginTop).toBe(5);
    });
  });

  // new coverage for Vertical Transport sizes and hitSlop
  describe("Vertical Transport", () => {
    it("applies larger hitSlop and specific sizes for ELEVATOR and STAIRS", () => {
      const poi = createMockPOI({ category: "ELEVATOR", room: "E1" });
      const { getByLabelText, rerender } = render(
        <POIBadge poi={poi} {...defaultProps} />,
      );
      const button = getByLabelText("Mock Description – Room E1");

      expect(button.props.hitSlop).toEqual({
        top: 14,
        bottom: 14,
        left: 14,
        right: 14,
      });

      expect(StyleSheet.flatten(button.props.style).width).toBe(14);

      const stairs = createMockPOI({ category: "STAIRS", room: "S1" });
      rerender(<POIBadge poi={stairs} {...defaultProps} />);
      expect(
        StyleSheet.flatten(
          getByLabelText("Mock Description – Room S1").props.style,
        ).width,
      ).toBe(15);
    });
  });

  describe("Interactions", () => {
    it("fires onPress with the POI data when tapped", () => {
      const poi = createMockPOI({ category: "LAB", room: "801" });
      const onPressMock = jest.fn();

      const { getByLabelText } = render(
        <POIBadge poi={poi} {...defaultProps} onPress={onPressMock} />,
      );

      fireEvent.press(getByLabelText("Mock Description – Room 801"));

      expect(onPressMock).toHaveBeenCalledTimes(1);
      expect(onPressMock).toHaveBeenCalledWith(poi);
    });

    it("does not crash if onPress is not provided", () => {
      const poi = createMockPOI({ category: "ROOM", room: "101" });
      const { getByText } = render(<POIBadge poi={poi} left={10} top={10} />);
      expect(() => fireEvent.press(getByText("101"))).not.toThrow();
    });
  });
});
