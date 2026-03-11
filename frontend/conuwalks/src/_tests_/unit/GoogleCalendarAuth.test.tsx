import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import GoogleCalendarAuth from "../../screens/GoogleCalendarAuth";

const mockPromptAsync = jest.fn();

jest.mock("expo-auth-session/providers/google", () => ({
  __esModule: true,
  useAuthRequest: jest.fn(() => [{ type: "request" }, null, mockPromptAsync]),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-id";
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-ios-id";
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "test-android-id";
  });

  it("renders the sign-in button after initialization", async () => {
    const { getByText, queryByText } = render(<GoogleCalendarAuth />);

    // wait for the loading state to finish
    await waitFor(() => {
      expect(queryByText(/Checking login status/i)).toBeNull();
    });

    expect(getByText(/Get Started with Google Calendar/i)).toBeTruthy();
  });

  it("calls promptAsync when button is pressed", async () => {
    const { getByText } = render(<GoogleCalendarAuth />);

    const button = await waitFor(() =>
      getByText(/Get Started with Google Calendar/i),
    );

    fireEvent.press(button);

    await waitFor(() => {
      expect(mockPromptAsync).toHaveBeenCalled();
    });
  });
});
