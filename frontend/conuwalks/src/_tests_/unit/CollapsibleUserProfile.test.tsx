import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CollapsibleUserProfile from "../../components/CollapsibleUserProfile";

// Mocks
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => children,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: (props: any) => props.children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("CollapsibleUserProfile", () => {
  const mockUserInfo = {
    name: "John Tester",
    email: "john@concordia.ca",
    photo: "test-url",
  };
  const mockSignOut = jest.fn();

  it("starts in collapsed state (only shows profile icon)", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    expect(screen.getByLabelText("Open user profile")).toBeTruthy();
    expect(screen.queryByText("John Tester")).toBeNull();
  });

  it("expands to show user details when pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    fireEvent.press(screen.getByLabelText("Open user profile"));

    expect(screen.getByText("John Tester")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("collapses and hides details when the close button is pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );

    // Open
    fireEvent.press(screen.getByLabelText("Open user profile"));
    expect(screen.getByText("John Tester")).toBeTruthy();

    // Close
    const closeBtn = screen.getByLabelText("Close Profile");
    fireEvent.press(closeBtn);

    // Verify hidden
    expect(screen.queryByText("John Tester")).toBeNull();
  });

  it("calls onSignOut when the sign out button is pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    fireEvent.press(screen.getByLabelText("Open user profile"));

    const signOutBtn = screen.getByText("Sign Out");
    fireEvent.press(signOutBtn);

    expect(mockSignOut).toHaveBeenCalled();
  });
});
