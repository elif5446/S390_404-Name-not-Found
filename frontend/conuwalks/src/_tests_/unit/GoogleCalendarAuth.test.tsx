import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import GoogleCalendarAuth from "../../screens/GoogleCalendarAuth";

// mock GoogleSignin module
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ user: { name: "Test User" } })),
  },
  statusCodes: { SIGN_IN_CANCELLED: "1" },
}));

// mock token storage utilities
jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn(() => Promise.resolve(null)),
  isTokenValid: jest.fn(() => false),
  saveTokens: jest.fn(),
  saveUserInfo: jest.fn(),
  clearTokens: jest.fn(),
}));

describe("GoogleCalendarAuth", () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-id";
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-ios-id";
  });

  it("renders the sign-in button after initialization", async () => {
    const { getByText, queryByText } = render(<GoogleCalendarAuth />);

    // wait for the loading state to finish
    await waitFor(() => {
      expect(queryByText(/Checking login status/i)).toBeNull();
    });

    expect(getByText(/Get Started with Google Calendar/i)).toBeTruthy();
  });

  it("calls GoogleSignin.signIn when button is pressed", async () => {
    const { getByText } = render(<GoogleCalendarAuth />);

    const button = await waitFor(() =>
      getByText(/Get Started with Google Calendar/i),
    );

    fireEvent.press(button);

    await waitFor(() => {
      expect(GoogleSignin.signIn).toHaveBeenCalled();
    });
  });
});
