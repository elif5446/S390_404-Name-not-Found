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

const destinationPOI: POI = {
  id: "poi-wc-a",
  label: "WC A",
  category: "WC_A",
  description: "Accessibility Washroom",
  room: "918",
  floor: 9,
  mapPosition: { x: 0.92, y: 0.62 },
};

const sourcePOI: POI = {
  id: "poi-lab",
  label: "Lab",
  category: "LAB",
  description: "Computer Lab",
  room: "833",
  floor: 9,
  mapPosition: { x: 0.22, y: 0.28 },
};

describe("IndoorDirectionsPanel", () => {
  it("uses the room start card when source POI is not set", () => {
    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        startingRoom="833"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("833")).toBeTruthy();
    expect(screen.getByText("Starting Room")).toBeTruthy();
    expect(screen.getByText(/Start from room H-833/i)).toBeTruthy();
  });

  it("uses source POI details as route start when provided", () => {
    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        startingRoom="833"
        sourcePOI={sourcePOI}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Computer Lab")).toBeTruthy();
    expect(screen.getByText(/Exit Computer Lab \(H-833\) to the main corridor/i)).toBeTruthy();
    expect(screen.getByText(/Arrive at Accessibility Washroom \(H-918\)/i)).toBeTruthy();
  });

  it("closes the panel when close button is pressed", () => {
    const onClose = jest.fn();

    render(
      <IndoorDirectionsPanel
        poi={destinationPOI}
        startingRoom="833"
        sourcePOI={sourcePOI}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByLabelText("Close directions"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
