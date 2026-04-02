import React from "react";
import { Platform } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import BuildingSearchButton from "../../components/BuildingSearchButton";
import {
  searchStartPoint,
  searchDestination,
  processStartPointSearch,
  processDestinationSearch,
} from "../../utils/searchbar";
import { BuildingEvent } from "../../hooks/useBuildingEvents";

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, testID, ...props }: any) => (
      <View testID={testID ?? "blur-view"} {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    MaterialIcons: ({ name, testID }: any) => (
      <Text testID={testID ?? "material-icon"}>{name}</Text>
    ),
  };
});

// Mock building metadata
jest.mock("../../data/metadata/SGW.BuildingMetadata", () => ({
  SGWBuildingSearchMetadata: {
    MB: {
      name: "John Molson Building",
      coordinates: { latitude: 45.49544, longitude: -73.57919 },
    },
    ER: {
      name: "Engineering Research Building",
      coordinates: { latitude: 45.49624, longitude: -73.58013 },
    },
    FG: {
      name: "Faubourg Building",
      coordinates: { latitude: 45.49428, longitude: -73.57834 },
    },
  },
}));

jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingSearchMetadata: {
    AD: {
      name: "Administration Building",
      coordinates: { latitude: 45.45804, longitude: -73.63982 },
    },
    CC: {
      name: "Central Building",
      coordinates: { latitude: 45.45827, longitude: -73.64024 },
    },
    HU: {
      name: "Applied Science Hub",
      coordinates: { latitude: 45.45857, longitude: -73.64183 },
    },
  },
}));

describe("Search Algorithm Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const emptyEvents: BuildingEvent[] = [];

  describe("Building Name Recognition", () => {
    describe("Exact Match Recognitition", () => {
      it("recognizes building with full name", () => {
        const results = searchStartPoint("John Molson Building", emptyEvents);

        expect(results).toContainEqual(
          expect.objectContaining({
            buildingName: "John Molson Building",
            roomNumber: null,
          }),
        );
      });
      it("recognizes building with building code", () => {
        const results = searchStartPoint("MB", emptyEvents);

        expect(results).toContainEqual(
          expect.objectContaining({
            buildingName: "John Molson Building",
            roomNumber: null,
          }),
        );
      });
    });
    it("recognizes building with search term in the middle of name", () => {
      const results = searchStartPoint("Molson", emptyEvents);

      expect(results).toContainEqual(
        expect.objectContaining({
          buildingName: "John Molson Building",
          roomNumber: null,
        }),
      );
    });
    it("recognizes building when search term is at the end", () => {
      const results = searchStartPoint("Building", emptyEvents);

      // Should match any building ending with "Building"
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.buildingName.includes("Building"))).toBe(
        true,
      );
    });

    it("recognizes partial building codes", () => {
      const results = searchStartPoint("M", emptyEvents);

      expect(results).toContainEqual(
        expect.objectContaining({
          buildingName: "John Molson Building",
          roomNumber: null,
        }),
      );
    });
  });

  describe("Building Alias Recognition", () => {
    it("recognizes JMSB alias for John Molson Building", () => {
      const results = searchStartPoint("JMSB", emptyEvents);

      expect(results).toContainEqual(
        expect.objectContaining({
          buildingName: "John Molson Building",
          roomNumber: null,
        }),
      );
    });
  });

  it("recognizes 'Business School' alias for John Molson Building", () => {
    const results = searchStartPoint("Business School", emptyEvents);

    expect(results).toContainEqual(
      expect.objectContaining({
        buildingName: "John Molson Building",
        roomNumber: null,
      }),
    );
  });
  it("recognizes partial alias matches", () => {
    const results = searchStartPoint("Business", emptyEvents);

    expect(results).toContainEqual(
      expect.objectContaining({
        buildingName: "John Molson Building",
        roomNumber: null,
      }),
    );
  });

  describe("Case Insensitivity", () => {
    it("handles uppercase input", () => {
      const results = searchStartPoint("JOHN MOLSON BUILDING", emptyEvents);

      expect(results).toContainEqual(
        expect.objectContaining({
          buildingName: "John Molson Building",
          roomNumber: null,
        }),
      );
    });
  });

  describe("Multiple Building Matches", () => {
    it("returns multiple matches when applicable", () => {
      const results = searchStartPoint("Building", emptyEvents);

      // Should return all buildings with "Building" in the name
      const buildingResults = results.filter((r) =>
        r.buildingName.includes("Building"),
      );
      expect(buildingResults.length).toBeGreaterThan(1);
    });

    it("returns matches from both SGW and Loyola campuses", () => {
      const results = searchStartPoint("Building", emptyEvents);

      const sgwBuildings = results.filter((r) =>
        [
          "John Molson Building",
          "Faubourg Building",
          "Engineering Research Building Building",
        ].includes(r.buildingName),
      );
      const loyolaBuildings = results.filter((r) =>
        ["Administration Building", "Central Building"].includes(
          r.buildingName,
        ),
      );

      expect(sgwBuildings.length).toBeGreaterThan(0);
      expect(loyolaBuildings.length).toBeGreaterThan(0);
    });
  });
});

const defaultProps = {
  onPress: jest.fn(),
  buttonSize: 48,
  mode: "light",
  buttonSpacing: 8,
};

const renderButton = (props = {}) =>
  render(<BuildingSearchButton {...defaultProps} {...props} />);

describe("BuildingSearchButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("accessibility", () => {
    it("has correct accessibilityLabel", () => {
      renderButton();
      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("has accessibilityRole of button", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.accessibilityRole).toBe("button");
    });

    it("has correct accessibilityHint", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.accessibilityHint).toBe(
        "Tap to search for a building and view its info",
      );
    });
  });

  describe("interaction", () => {
    it("calls onPress when pressed", () => {
      const onPress = jest.fn();
      renderButton({ onPress });
      fireEvent.press(screen.getByLabelText("Open building search"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("icon", () => {
    it("renders the search MaterialIcon", () => {
      renderButton();
      expect(screen.getByTestId("material-icon")).toBeTruthy();
    });
  });

  describe("iOS platform", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    afterEach(() => {
      Platform.OS = "ios";
    });

    it("renders BlurView on iOS", () => {
      renderButton();
      expect(screen.getByTestId("blur-view")).toBeTruthy();
    });

    it("uses transparent background on iOS", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ backgroundColor: "transparent" });
    });

    it("uses shadowOpacity 0.18 on iOS", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ shadowOpacity: 0.18 });
    });

    it("uses elevation 0 on iOS", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ elevation: 0 });
    });

    it("passes dark tint to BlurView when mode is dark", () => {
      renderButton({ mode: "dark" });
      const blur = screen.getByTestId("blur-view");
      expect(blur.props.tint).toBe("dark");
    });

    it("passes light tint to BlurView when mode is light", () => {
      renderButton({ mode: "light" });
      const blur = screen.getByTestId("blur-view");
      expect(blur.props.tint).toBe("light");
    });
  });

  describe("Android platform", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    afterEach(() => {
      Platform.OS = "ios";
    });

    it("does NOT render BlurView on Android", () => {
      renderButton();
      expect(screen.queryByTestId("blur-view")).toBeNull();
    });

    it("uses dark background (#2C2C2E) when mode is dark", () => {
      renderButton({ mode: "dark" });
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ backgroundColor: "#2C2C2E" });
    });

    it("uses white background (#FFFFFF) when mode is light", () => {
      renderButton({ mode: "light" });
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ backgroundColor: "#FFFFFF" });
    });

    it("uses shadowOpacity 0.22 on Android", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ shadowOpacity: 0.22 });
    });

    it("uses elevation 4 on Android", () => {
      renderButton();
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ elevation: 4 });
    });
  });

  describe("layout", () => {
    it("applies buttonSize to width, height, and borderRadius", () => {
      renderButton({ buttonSize: 56 });
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({
        width: 56,
        height: 56,
        borderRadius: 28,
      });
    });

    it("applies marginBottom from buttonSpacing", () => {
      renderButton({ buttonSpacing: 16 });
      const btn = screen.getByLabelText("Open building search");
      expect(btn.props.style).toMatchObject({ marginBottom: 16 });
    });
  });
});
