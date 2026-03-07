import React from "react";
import { render } from "@testing-library/react-native";
import CampusLabels from "@/src/components/campusLabels";
import { SGWData, LOYData } from "@/src/data/BuildingLabels";

// Mock react-native-maps
jest.mock("react-native-maps", () => ({
  Marker: ({ children }: any) => children,
}));

// Mock ONLY getLabelFontSize, keep real SGWData and LOYData
jest.mock("@/src/data/BuildingLabels", () => ({
  ...jest.requireActual("@/src/data/BuildingLabels"),
  getLabelFontSize: jest.fn(() => 12),
}));

// Test campuses array
const campuses = [
  { name: "SGW", data: SGWData },
  { name: "LOY", data: LOYData },
];

describe("CampusLabels - All Buildings", () => {
  campuses.forEach(({ name, data }) => {
    it(`renders all building labels for ${name} campus`, () => {
      const { getByText } = render(
        <CampusLabels
          campus={name as any}
          data={data as any}
          longitudeDelta={0.005}
          onLabelPress={jest.fn()}
        />
      );

      data.features.forEach((feature) => {
        if (feature.properties.centroid) {
          expect(getByText(feature.properties.id)).toBeTruthy();
        }
      });
    });
  });
});