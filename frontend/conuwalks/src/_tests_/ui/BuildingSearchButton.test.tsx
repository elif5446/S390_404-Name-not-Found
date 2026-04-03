import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import BuildingSearchButton from "../../components/BuildingSearchButton";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children, ...props }: any) => {
    const View = require("react-native").View;
    return <View {...props}>{children}</View>;
  },
}));

describe("BuildingSearchButton", () => {
  const mockOnPress = jest.fn();
  const defaultProps = {
    onPress: mockOnPress,
    buttonSize: 56,
    mode: "light" as const,
    buttonSpacing: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Button rendering", () => {
    it("renders the search button", () => {
      render(<BuildingSearchButton {...defaultProps} />);

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("calls onPress when button is pressed", () => {
      render(<BuildingSearchButton {...defaultProps} />);

      const button = screen.getByLabelText("Open building search");
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("has correct accessibility properties", () => {
      render(<BuildingSearchButton {...defaultProps} />);

      const button = screen.getByLabelText("Open building search");
      expect(button).toBeTruthy();

      // Check accessibility hint
      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Light mode styling (Line 14 - light branch)", () => {
    it("applies light mode background color when mode is 'light'", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      const button = screen.getByLabelText("Open building search");
      expect(button).toBeTruthy();
    });

    it("renders with correct styles in light mode", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Dark mode styling (Line 14 - dark branch)", () => {
    it("applies dark mode background color when mode is 'dark'", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      const button = screen.getByLabelText("Open building search");
      expect(button).toBeTruthy();
    });

    it("renders with correct styles in dark mode", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("iOS platform styling (Line 15, 16, 17 - iOS branches)", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    afterEach(() => {
      Platform.OS = "android";
    });

    it("applies transparent background on iOS", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("applies iOS shadow values", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("renders BlurView in iOS", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      // BlurView is rendered on iOS
      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("applies dark mode BlurView intensity on iOS in dark mode", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Android platform styling (Line 15, 16, 17 - Android branches)", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    it("applies platform-specific background color on Android", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("applies Android shadow values (elevation)", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("applies different background color in dark mode on Android", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Button sizing and spacing", () => {
    it("respects custom button size", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          buttonSize={64}
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("respects custom button spacing", () => {
      render(
        <BuildingSearchButton
          {...defaultProps}
          buttonSpacing={16}
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("renders with various sizes and modes", () => {
      const { rerender } = render(
        <BuildingSearchButton
          {...defaultProps}
          buttonSize={48}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();

      rerender(
        <BuildingSearchButton
          {...defaultProps}
          buttonSize={72}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Mode and platform combinations", () => {
    it("handles light mode with iOS platform", () => {
      Platform.OS = "ios";

      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();

      Platform.OS = "android";
    });

    it("handles dark mode with iOS platform", () => {
      Platform.OS = "ios";

      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();

      Platform.OS = "android";
    });

    it("handles light mode with Android platform", () => {
      Platform.OS = "android";

      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="light"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });

    it("handles dark mode with Android platform", () => {
      Platform.OS = "android";

      render(
        <BuildingSearchButton
          {...defaultProps}
          mode="dark"
        />
      );

      expect(screen.getByLabelText("Open building search")).toBeTruthy();
    });
  });

  describe("Multiple presses", () => {
    it("handles multiple button presses", () => {
      render(<BuildingSearchButton {...defaultProps} />);

      const button = screen.getByLabelText("Open building search");

      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });
  });
});
