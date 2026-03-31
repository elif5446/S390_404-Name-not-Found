import React from "react";
import { Platform } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import BuildingSearchButton from "../../components/BuildingSearchButton"; 

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
      expect(
        screen.getByLabelText("Open building search")
      ).toBeTruthy();
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
        "Tap to search for a building and view its info"
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
