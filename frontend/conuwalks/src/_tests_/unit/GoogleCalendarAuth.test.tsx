import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import * as Google from "expo-auth-session/providers/google";
import GoogleCalendarAuth from "../../screens/GoogleCalendarAuth";

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock token storage utilities
jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn().mockResolvedValue(null),
  isTokenValid: jest.fn().mockReturnValue(false),
  saveTokens: jest.fn().mockResolvedValue(true),
  saveUserInfo: jest.fn().mockResolvedValue(true),
  clearTokens: jest.fn().mockResolvedValue(undefined),
}));

describe("GoogleCalendarAuth", () => {
  const promptAsyncMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Google.useAuthRequest as jest.Mock).mockReturnValue([
      { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      null,
      promptAsyncMock,
    ]);
  });

  beforeAll(() => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-id";
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-ios-id";
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "test-android-id";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the sign-in button after initialization", async () => {
    render(<GoogleCalendarAuth />);

    // wait for the checking session phase to finish
    await waitFor(() => {
      expect(screen.queryByText(/Checking login status/i)).toBeNull();
    });

    expect(screen.getByText(/Get Started with Google Calendar/i)).toBeTruthy();
  });

  it("calls promptAsync when button is pressed", async () => {
    const { getByText } = render(<GoogleCalendarAuth />);

    const button = await waitFor(() =>
      getByText(/Get Started with Google Calendar/i),
    );

    fireEvent.press(button);

    await waitFor(() => {
      expect(promptAsyncMock).toHaveBeenCalled();
    });
  });
});
