import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import IndoorRoomLabels from "@/src/components/indoor/IndoorRoomLabels";
import { IndoorHotspot } from "@/src/indoors/types/hotspot";

// --- mock data ---
const mockHotspots: IndoorHotspot[] = [
  { id: "h1", label: "Room 101", x: 10, y: 10, floorLevel: 1 },
  { id: "h2", label: "Room 273", x: 20, y: 20, floorLevel: 1 },
  { id: "h3", label: "Room 865", x: 30, y: 30, floorLevel: 2 },
  { id: "h4", label: "Room 961.20", x: 40, y: 40, floorLevel: 1 },
];

const defaultProps = {
  hotspots: mockHotspots,
  currentLevel: 1,
  destination: null,
  offsetX: 100,
  offsetY: 200,
  scale: 2,
  onSelectDestination: jest.fn(),
};

describe("IndoorRoomLabels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("only renders hotspots matching the currentLevel", () => {
    const { queryByText, getByText } = render(<IndoorRoomLabels {...defaultProps} />);

    // should find level 1 rooms
    expect(getByText("101")).toBeTruthy();
    expect(getByText("273")).toBeTruthy();

    // should not find level 2 room
    expect(queryByText("865")).toBeNull();
  });

  it("calls onSelectDestination with the correct hotspot when pressed", () => {
    const onSelectDestination = jest.fn();
    const { getByText } = render(<IndoorRoomLabels {...defaultProps} onSelectDestination={onSelectDestination} />);

    const roomLabel = getByText("101");
    fireEvent.press(roomLabel);

    expect(onSelectDestination).toHaveBeenCalledTimes(1);
    expect(onSelectDestination).toHaveBeenCalledWith(mockHotspots[0]);
  });

  it("calculates standard positioning and font sizes correctly", () => {
    // room 101: x=10, y=10. no special offsets in helper functions.
    // scale = 2, offsetx = 100, offsety = 200
    // expected left: 100 + (10 * 2) - 16 + 0 = 104
    // expected top: 200 + (10 * 2) - 8 + 0 = 212
    // expected font size: 8 (default)

    const { getByLabelText, getByText } = render(<IndoorRoomLabels {...defaultProps} />);

    // check pressable styling (position)
    const pressable = getByLabelText("Set destination to Room 101");
    expect(pressable.props.style.left).toBe(104);
    expect(pressable.props.style.top).toBe(212);

    // check text styling (font size)
    const textNode = getByText("101");
    expect(textNode.props.style.fontSize).toBe(8);
  });

  it("applies custom helper offsets and font sizes to specific rooms", () => {
    // room 273: x=20, y=20.
    // getroomlabeloffsetx("room 273") returns 7
    // getroomlabelfontsize("room 273") returns 7
    // expected left: 100 + (20 * 2) - 16 + 7 = 131
    // expected top: 200 + (20 * 2) - 8 + 0 = 232

    const { getByLabelText, getByText } = render(<IndoorRoomLabels {...defaultProps} />);

    const pressable = getByLabelText("Set destination to Room 273");
    expect(pressable.props.style.left).toBe(131);
    expect(pressable.props.style.top).toBe(232);

    const textNode = getByText("273");
    expect(textNode.props.style.fontSize).toBe(7);
  });

  it("applies complex regex logic correctly for 961.x rooms", () => {
    // room 961.20: x=40, y=40. fits regex: /^961\.(1[9]|2[0-9]|3[0-3])$/
    // expected left: 100 + (40 * 2) - 16 + 0 + 4 = 168
    // expected top: 200 + (40 * 2) - 8 + 0 + 8 = 280
    // expected font size inline override: 4

    const { getByLabelText, getByText } = render(<IndoorRoomLabels {...defaultProps} />);

    const pressable = getByLabelText("Set destination to Room 961.20");
    expect(pressable.props.style.left).toBe(168);
    expect(pressable.props.style.top).toBe(280);

    const textNode = getByText("961.20");
    expect(textNode.props.style.fontSize).toBe(4);
  });

  it("applies negative Y offsets accurately", () => {
    // test room 865 which has a -3 y offset
    const { getByLabelText } = render(<IndoorRoomLabels {...defaultProps} currentLevel={2} />);

    // room 865: x=30, y=30.
    // getroomlabeloffsety("room 865") returns -3
    // expected top: 200 + (30 * 2) - 8 + (-3) = 249

    const pressable = getByLabelText("Set destination to Room 865");
    expect(pressable.props.style.top).toBe(249);
  });
});
