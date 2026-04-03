import React from "react";
import { Platform } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import UserProfilePopup from "../../components/UserProfilePopup";

jest.mock("../../components/UserProfileHeader", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return ({ userInfo, onClose }: any) => (
    <TouchableOpacity testID="header-close-btn" onPress={onClose}>
      <Text>{userInfo?.name}</Text>
    </TouchableOpacity>
  );
});

jest.mock("../../components/UserProfileContent", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return ({ onSignOut }: any) => (
    <TouchableOpacity testID="content-signout-btn" onPress={onSignOut}>
      <Text>Sign Out</Text>
    </TouchableOpacity>
  );
});

jest.mock("expo-blur", () => ({
  BlurView: ({ children, testID }: any) => {
    const { View } = require("react-native");
    return <View testID={testID || "blur-view"}>{children}</View>;
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe("UserProfilePopup", () => {
  const mockUserInfo = { name: "John Doe", email: "john@example.com" };
  const mockOnClose = jest.fn();
  const mockOnSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when visible is true", () => {
    render(
      <UserProfilePopup
        visible={true}
        userInfo={mockUserInfo}
        onClose={mockOnClose}
        onSignOut={mockOnSignOut}
      />
    );

    expect(screen.getByText("John Doe")).toBeTruthy();
  });

  it("calls onClose when header close button is pressed", () => {
    render(
      <UserProfilePopup
        visible={true}
        userInfo={mockUserInfo}
        onClose={mockOnClose}
        onSignOut={mockOnSignOut}
      />
    );

    fireEvent.press(screen.getByTestId("header-close-btn"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSignOut when sign out button is pressed", () => {
    render(
      <UserProfilePopup
        visible={true}
        userInfo={mockUserInfo}
        onClose={mockOnClose}
        onSignOut={mockOnSignOut}
      />
    );

    fireEvent.press(screen.getByTestId("content-signout-btn"));
    expect(mockOnSignOut).toHaveBeenCalledTimes(1);
  });

  describe("Platform Specifics", () => {
    it("renders BlurView only on iOS", () => {
      jest.replaceProperty(Platform, "OS", "ios");

      render(
        <UserProfilePopup
          visible={true}
          userInfo={mockUserInfo}
          onClose={mockOnClose}
          onSignOut={mockOnSignOut}
        />
      );

      expect(screen.getByTestId("blur-view")).toBeTruthy();
    });

    it("does not render BlurView on Android", () => {
      jest.replaceProperty(Platform, "OS", "android");

      render(
        <UserProfilePopup
          visible={true}
          userInfo={mockUserInfo}
          onClose={mockOnClose}
          onSignOut={mockOnSignOut}
        />
      );

      expect(screen.queryByTestId("blur-view")).toBeNull();
    });
  });

  describe("Theme/Color Mode", () => {
    it("applies dark background color in dark mode", () => {
      const reactNative = require("react-native");
      jest.spyOn(reactNative, "useColorScheme").mockReturnValue("dark");

      render(
        <UserProfilePopup
          visible={true}
          userInfo={mockUserInfo}
          onClose={mockOnClose}
          onSignOut={mockOnSignOut}
        />
      );

      const container = screen.getByTestId("theme-container");
      
      expect(container.props.style).toEqual(
        expect.objectContaining({ backgroundColor: "#1C1B1F" })
      );
    });

    it("applies white background color in light mode", () => {
      const reactNative = require("react-native");
      jest.spyOn(reactNative, "useColorScheme").mockReturnValue("light");

      render(
        <UserProfilePopup
          visible={true}
          userInfo={mockUserInfo}
          onClose={mockOnClose}
          onSignOut={mockOnSignOut}
        />
      );

      const container = screen.getByTestId("theme-container");
      
      expect(container.props.style).toEqual(
        expect.objectContaining({ backgroundColor: "#FFF" })
      );
    });
  });
});