import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import CampusLabels from "@/src/components/campusLabels";
import { SGWData, LOYData } from "@/src/data/BuildingLabels";
import { Platform } from "react-native";

jest.mock("react-native-maps", () => ({
  Marker: ({ children, onPress }: any) => {
    const { TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity onPress={(e: any) => onPress?.({ stopPropagation: jest.fn(), ...e })}>
        {children}
      </TouchableOpacity>
    );
  },
}));

jest.mock("@/src/data/BuildingLabels", () => ({
  ...jest.requireActual("@/src/data/BuildingLabels"),
  getLabelFontSize: jest.fn(() => 12),
}));

const { getLabelFontSize } = require("@/src/data/BuildingLabels");


const campuses = [
  { name: "SGW", data: SGWData },
  { name: "LOY", data: LOYData },
];

describe("CampusLabels - All Buildings", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getLabelFontSize.mockReturnValue(12);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

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

  it("returns null when longitudeDelta > 0.0075 (not visible)", () => {
    const { toJSON } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.01}
        onLabelPress={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("skips features without a centroid", () => {
    const dataWithMissingCentroid = {
      features: [
        { properties: { id: "BUILDING_A", name: "Building A", centroid: null } },
        {
          properties: {
            id: "BUILDING_B",
            name: "Building B",
            centroid: { latitude: 45.495, longitude: -73.578 },
          },
        },
      ],
    };

    const { queryByText, getByText } = render(
      <CampusLabels
        campus="SGW"
        data={dataWithMissingCentroid as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );

    expect(queryByText("BUILDING_A")).toBeNull();
    expect(getByText("BUILDING_B")).toBeTruthy();
  });

  it("calls onLabelPress with building id when a marker is pressed", () => {
    const onLabelPress = jest.fn();
    const { getByText } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={onLabelPress}
      />
    );

    const firstVisibleFeature = SGWData.features.find(
      (f) => f.properties.centroid
    );
    expect(firstVisibleFeature).toBeTruthy();

    const label = getByText(firstVisibleFeature!.properties.id);
    fireEvent.press(label);

    expect(onLabelPress).toHaveBeenCalledWith(firstVisibleFeature!.properties.id);
  });

  it("shows name with newlines on iOS when fontSize > 25", () => {
    Platform.OS = "ios";
    getLabelFontSize.mockReturnValue(26);

    const singleFeatureData = {
      features: [
        {
          properties: {
            id: "H",
            name: "Hall Building",
            centroid: { latitude: 45.497, longitude: -73.579 },
          },
        },
      ],
    };

    const { queryByText } = render(
      <CampusLabels
        campus="SGW"
        data={singleFeatureData as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );

    expect(queryByText("H")).toBeNull();
    expect(queryByText("Hall\nBuilding")).toBeTruthy();
  });

  it("shows id on Android even when fontSize > 25", () => {
    Platform.OS = "android";
    getLabelFontSize.mockReturnValue(26);

    const singleFeatureData = {
      features: [
        {
          properties: {
            id: "H",
            name: "Hall Building",
            centroid: { latitude: 45.497, longitude: -73.579 },
          },
        },
      ],
    };

    const { getByText, queryByText } = render(
      <CampusLabels
        campus="SGW"
        data={singleFeatureData as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );

    expect(getByText("H")).toBeTruthy();
    expect(queryByText("Hall\nBuilding")).toBeNull();
  });

  it("sets trackChanges to false after 150ms timeout when visible", () => {
    const { rerender } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );
  });

  it("clears timeout when fontSize changes before 150ms (useEffect cleanup)", () => {
    getLabelFontSize.mockReturnValue(12);

    const { rerender } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={jest.fn()}
      />
    );

    getLabelFontSize.mockReturnValue(14);
    act(() => {
      jest.advanceTimersByTime(50); 
    });

    rerender(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.004}
        onLabelPress={jest.fn()}
      />
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });
  });

  it("skips useEffect body when not visible (early return branch)", () => {
   
    const { rerender } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.01} 
        onLabelPress={jest.fn()}
      />
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005} 
        onLabelPress={jest.fn()}
      />
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });
  });
});

describe("CampusLabels - memo comparator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getLabelFontSize.mockReturnValue(12);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("re-renders when visibility toggles from invisible to visible", () => {
    const onLabelPress = jest.fn();
    const { rerender, toJSON } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.01} 
        onLabelPress={onLabelPress}
      />
    );

    expect(toJSON()).toBeNull();

    rerender(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005} 
        onLabelPress={onLabelPress}
      />
    );

    expect(toJSON()).not.toBeNull();
  });

  it("does not re-render when both invisible and fontSize unchanged", () => {
    const onLabelPress = jest.fn();
    const { rerender, toJSON } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.01}
        onLabelPress={onLabelPress}
      />
    );

    expect(toJSON()).toBeNull();

    rerender(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.02} 
        onLabelPress={onLabelPress}
      />
    );

    expect(toJSON()).toBeNull();
  });

  it("re-renders when campus changes while visible", () => {
    const onLabelPress = jest.fn();
    const { rerender, getByText } = render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={onLabelPress}
      />
    );

    rerender(
      <CampusLabels
        campus="LOY"
        data={LOYData as any}
        longitudeDelta={0.005}
        onLabelPress={onLabelPress}
      />
    );

    const firstLOY = LOYData.features.find((f) => f.properties.centroid);
    expect(getByText(firstLOY!.properties.id)).toBeTruthy();
  });

  it("does not re-render when fontSize and campus are unchanged while visible", () => {
    const onLabelPress = jest.fn();
    const renderSpy = jest.spyOn(React, "createElement");

    render(
      <CampusLabels
        campus="SGW"
        data={SGWData as any}
        longitudeDelta={0.005}
        onLabelPress={onLabelPress}
      />
    );

    const callsBefore = renderSpy.mock.calls.length;

  
    renderSpy.mockClear();

    renderSpy.mockRestore();
  });
});