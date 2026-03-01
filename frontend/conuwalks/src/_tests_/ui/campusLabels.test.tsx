import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CampusLabels from "../../components/campusLabels";
import { getLabelFontSize } from "@/src/data/BuildingLabels";

jest.mock("@/src/data/BuildingLabels", () => ({
  getLabelFontSize: jest.fn(),
}));

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  const MockMarker = (props: any) => (
    <View testID={`mock-marker-${props.coordinate?.latitude}`} {...props}>
      {props.children}
    </View>
  );
  return {
    Marker: MockMarker,
  };
});

describe("CampusLabels Component", () => {
  const mockOnLabelPress = jest.fn();

  const mockData: any = {
    features: [
      {
        properties: {
          id: "H",
          centroid: { latitude: 45.497, longitude: -73.579 },
        },
      },
      {
        properties: {
          id: "EV",
          centroid: null, // Should be skipped by the render logic
        },
      },
      {
        properties: {
          id: "MB",
          centroid: { latitude: 45.495, longitude: -73.578 },
        },
      },
    ],
  };

  const defaultProps = {
    campus: "SGW" as any,
    data: mockData,
    longitudeDelta: 0.005,
    onLabelPress: mockOnLabelPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getLabelFontSize as jest.Mock).mockReturnValue(14);
  });

  describe("Visibility Logic", () => {
    it("returns null and renders nothing if longitudeDelta is > 0.0075", () => {
      render(<CampusLabels {...defaultProps} longitudeDelta={0.008} />);

      // the text ids shouldn't exist because the component bailed out early
      expect(screen.queryByText("H")).toBeNull();
      expect(screen.queryByText("MB")).toBeNull();
    });

    it("renders markers if longitudeDelta is <= 0.0075", () => {
      render(<CampusLabels {...defaultProps} longitudeDelta={0.0075} />);

      expect(screen.getByText("H")).toBeTruthy();
      expect(screen.getByText("MB")).toBeTruthy();
    });
  });

  describe("Data Filtering", () => {
    it("skips rendering features that do not have a centroid", () => {
      render(<CampusLabels {...defaultProps} />);

      // "ev" is in the mock data, but its centroid is null
      expect(screen.queryByText("EV")).toBeNull();

      // ensure only the two valid features are rendered
      const markers = screen.getAllByTestId(/mock-marker-/);
      expect(markers.length).toBe(2);
    });
  });

  describe("Interactions & Styling", () => {
    it("calls getLabelFontSize with the current longitudeDelta", () => {
      render(<CampusLabels {...defaultProps} longitudeDelta={0.002} />);

      expect(getLabelFontSize).toHaveBeenCalledWith(0.002);
      expect(getLabelFontSize).toHaveBeenCalledTimes(2); // Called once per valid feature
    });

    it("handles marker press, stopping propagation and calling onLabelPress", () => {
      render(<CampusLabels {...defaultProps} />);

      // find the marker by grabbing the text component's parent or by testid
      const markerH = screen.getByTestId("mock-marker-45.497");

      // create a mock event object with stoppropagation
      const mockEvent = {
        stopPropagation: jest.fn(),
      };

      // fire the press event on the marker
      fireEvent(markerH, "press", mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(mockOnLabelPress).toHaveBeenCalledWith("H");
      expect(mockOnLabelPress).toHaveBeenCalledTimes(1);
    });
  });
});
