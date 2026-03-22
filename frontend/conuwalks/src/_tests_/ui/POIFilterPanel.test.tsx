import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import POIFilterPanel from "@/src/components/indoor/POIFilterPanel";
import { POI } from "@/src/types/poi";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: () => <Text>Icon</Text>,
  };
});

const pois: POI[] = [
  {
    id: "poi-lab-1",
    label: "Lab",
    category: "LAB",
    description: "Computer Lab",
    room: "907",
    floor: 9,
    mapPosition: { x: 0.2, y: 0.2 },
  },
  {
    id: "poi-wc-1",
    label: "WC F",
    category: "WC_F",
    description: "Girls Washroom",
    room: "916",
    floor: 9,
    mapPosition: { x: 0.8, y: 0.45 },
  },
];

describe("POIFilterPanel", () => {
  it("shows POIs when the panel is expanded", () => {
    render(
      <POIFilterPanel
        pois={pois}
        categories={["LAB", "WC_F"]}
        activeCategories={new Set(["LAB", "WC_F"])}
        floorLabel="9"
        targetMode="DESTINATION"
        sourcePOI={null}
        destinationPOI={null}
        onTargetModeChange={jest.fn()}
        onToggleCategory={jest.fn()}
        onSelectPOI={jest.fn()}
      />,
    );

    fireEvent.press(
      screen.getByLabelText("Expand or collapse points of interest panel"),
    );

    expect(screen.getByText("Computer Lab")).toBeTruthy();
    expect(screen.getByText("Girls Washroom")).toBeTruthy();
  });

  it("selects a POI from list", () => {
    const onSelectPOI = jest.fn();

    render(
      <POIFilterPanel
        pois={pois}
        categories={["LAB", "WC_F"]}
        activeCategories={new Set(["LAB", "WC_F"])}
        floorLabel="9"
        targetMode="DESTINATION"
        sourcePOI={pois[0]}
        destinationPOI={pois[1]}
        onTargetModeChange={jest.fn()}
        onToggleCategory={jest.fn()}
        onSelectPOI={onSelectPOI}
      />,
    );

    fireEvent.press(
      screen.getByLabelText("Expand or collapse points of interest panel"),
    );

    fireEvent.press(screen.getByLabelText("Navigate to Girls Washroom, Room 916"));
    expect(onSelectPOI).toHaveBeenCalledWith(pois[1]);

    expect(screen.getByText("Source")).toBeTruthy();
    expect(screen.getByText("Destination")).toBeTruthy();
  });
});