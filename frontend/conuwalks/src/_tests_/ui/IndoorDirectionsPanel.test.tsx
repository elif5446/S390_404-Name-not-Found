import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import IndoorDirectionsPanel from "@/src/components/indoor/IndoorDirectionsPanel";
import { POI } from "@/src/types/poi";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: () => <Text>Icon</Text>,
  };
});

jest.mock("@/src/indoors/services/RouteInstructionService", () => ({
  generateRouteSteps: jest.fn(() => [
    { id: "step-1", text: "Walk straight along the corridor" },
    { id: "step-2", text: "Arrive at Accessibility Washroom (H-918)" },
  ]),
  estimateWalkMinutes: jest.fn(() => 2),
}));

const destinationPOI: POI = {
  id: "poi-wc-a",
  label: "WC A",
  category: "WC_A",
  description: "Accessibility Washroom",
  room: "918",
  floor: 9,
  mapPosition: { x: 0.92, y: 0.62 },
};

const mockPath = [
  {
    id: "833",
    label: "Starting Room",
    floorId: "H_9",
    x: 0.22,
    y: 0.28,
    type: "ROOM",
  },
  {
    id: "corridor-1",
    label: "Corridor",
    floorId: "H_9",
    x: 0.45,
    y: 0.35,
    type: "HALLWAY",
  },
  {
    id: "918",
    label: "Accessibility Washroom",
    floorId: "H_9",
    x: 0.92,
    y: 0.62,
    type: "ROOM",
  },
] as any;

describe("IndoorDirectionsPanel", () => {
  it("renders the starting point card from the first path node", () => {
    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        path={mockPath}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("H-833")).toBeTruthy();
    expect(screen.getByText("Starting Room")).toBeTruthy();
  });

  it("renders the destination details and route steps", () => {
    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        path={mockPath}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Accessibility Washroom")).toBeTruthy();
    expect(screen.getAllByText(/H-918/)).toBeTruthy();
    expect(screen.getByText("ROUTE STEPS")).toBeTruthy();
    expect(screen.getByText(/Walk straight along the corridor/i)).toBeTruthy();
    expect(
      screen.getByText(/Arrive at Accessibility Washroom \(H-918\)/i),
    ).toBeTruthy();
    expect(screen.getByText(/~2 min/i)).toBeTruthy();
  });

  it("closes the panel when close button is pressed", () => {
    const onClose = jest.fn();

    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        path={mockPath}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByLabelText("Close directions"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
