import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CollapsibleUserProfile from "../../components/CollapsibleUserProfile";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-blur", () => ({ BlurView: ({ children }: any) => children }));

describe("CollapsibleUserProfile", () => {
  const mockUserInfo = { name: "John Tester", email: "john@concordia.ca", photo: "test-url" };
  const mockSignOut = jest.fn();

  it("starts in collapsed state (only shows profile icon)", () => {
    render(<CollapsibleUserProfile userInfo={mockUserInfo} onSignOut={mockSignOut} />);
    expect(screen.getByLabelText("Open user profile")).toBeTruthy();
    expect(screen.queryByText("John Tester")).toBeNull();
  });

  it("expands to show user details and sign out button when pressed", () => {
    render(<CollapsibleUserProfile userInfo={mockUserInfo} onSignOut={mockSignOut} />);
    fireEvent.press(screen.getByLabelText("Open user profile"));

    expect(screen.getByText("John Tester")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("calls onSignOut when button is pressed", () => {
    render(<CollapsibleUserProfile userInfo={mockUserInfo} onSignOut={mockSignOut} />);
    fireEvent.press(screen.getByLabelText("Open user profile"));
    fireEvent.press(screen.getByText("Sign Out"));
    expect(mockSignOut).toHaveBeenCalled();
  });
});