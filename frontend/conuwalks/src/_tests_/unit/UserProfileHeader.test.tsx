import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import UserProfileHeader from "../../components/UserProfileHeader";
import { TouchableOpacity } from "react-native";

describe("UserProfileHeader", () => {
  const baseUser = { name: "Ahmad", photo: "http://example.com/photo.jpg" };
  const onClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with photo and light mode", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <UserProfileHeader userInfo={baseUser} onClose={onClose} mode="light" />
    );
    expect(getByText("Ahmad")).toBeTruthy();
    expect(getByText("Concordia University Student")).toBeTruthy();
    // Should render the image
    expect(UNSAFE_getAllByType(require("react-native").Image).length).toBeGreaterThan(0);
  });

  it("renders with photo and dark mode", () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <UserProfileHeader userInfo={baseUser} onClose={onClose} mode="dark" />
    );
    expect(getByText("Ahmad")).toBeTruthy();
    expect(UNSAFE_getAllByType(require("react-native").Image).length).toBeGreaterThan(0);
  });

  it("renders with no photo, uses initial", () => {
    const user = { name: "Bob" };
    const { getByText, UNSAFE_queryAllByType } = render(
      <UserProfileHeader userInfo={user} onClose={onClose} mode="light" />
    );
    expect(getByText("B")).toBeTruthy();
    expect(UNSAFE_queryAllByType(require("react-native").Image).length).toBe(0);
  });

  it("renders with no name or photo, uses fallback", () => {
    const { getByText } = render(
      <UserProfileHeader userInfo={{}} onClose={onClose} mode="light" />
    );
    expect(getByText("U")).toBeTruthy();
    expect(getByText("User Name")).toBeTruthy();
  });

  it("calls onClose when close button is pressed", () => {
    const { UNSAFE_getAllByType } = render(
      <UserProfileHeader userInfo={baseUser} onClose={onClose} mode="light" />
    );
    // TouchableOpacity is the first child in the header
    const closeBtn = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});