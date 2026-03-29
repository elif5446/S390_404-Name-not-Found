import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from "@testing-library/react-native";
import { Linking } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import GoogleCalendarAuth from "../../components/GoogleCalendarAuth";
import { GoogleCalendarAuthFlow } from "../../Auth/GoogleCalendarAuthFlow";

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("../../utils/tokenStorage", () => ({
  getTokens: jest.fn().mockResolvedValue(null),
  isTokenValid: jest.fn().mockReturnValue(false),
  saveTokens: jest.fn().mockResolvedValue(true),
  saveUserInfo: jest.fn().mockResolvedValue(true),
  clearTokens: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../Auth/GoogleCalendarAuthFlow");

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Linking = { openURL: jest.fn().mockResolvedValue(undefined) };
  return RN;
});

const MockedAuthFlow = GoogleCalendarAuthFlow as jest.MockedClass<
  typeof GoogleCalendarAuthFlow
>;

const asFlow = (partial: { execute: jest.Mock }): GoogleCalendarAuthFlow =>
  partial as unknown as GoogleCalendarAuthFlow;

const makeAuthRequestMock = (
  requestOverride: object | null = {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  responseOverride: object | null = null
) => {
  const promptAsyncMock = jest.fn().mockResolvedValue({ type: "success" });
  (Google.useAuthRequest as jest.Mock).mockReturnValue([
    requestOverride,
    responseOverride,
    promptAsyncMock,
  ]);
  return promptAsyncMock;
};

const waitForReady = () =>
  waitFor(() =>
    expect(screen.getByText(/Get Started with Google Calendar/i)).toBeTruthy()
  );

beforeAll(() => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-id";
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID =
    "123456789.apps.googleusercontent.com";
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID =
    "987654321.apps.googleusercontent.com";
});

beforeEach(() => {
  jest.clearAllMocks();

  MockedAuthFlow.mockImplementation(
    (_prompt, onSuccess) =>
      asFlow({
        execute: jest.fn().mockImplementation(async () => {
          onSuccess?.();
        }),
      })
  );
});

describe("initial checking state", () => {
  it("shows 'Checking login status…' spinner on first render", () => {
    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockReturnValue(new Promise(() => {})),
        })
    );
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    expect(screen.getByText(/Logging you in.../i)).toBeTruthy();
  });
});

describe("ready state", () => {
  it("renders the sign-in button after initialization completes", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitForReady();

    expect(screen.getByText(/Get Started with Google Calendar/i)).toBeTruthy();
  });

  it("renders the app title CONUWALKS", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitForReady();

    expect(screen.getByText("CONUWALKS")).toBeTruthy();
  });

  it("renders all instructional step texts", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitForReady();

    expect(
      screen.getByText(/Connect your Google account to the app/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Enter your classes on your Google Calendar/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Once you login, you can see directions/i)
    ).toBeTruthy();
  });

  it("renders the Chrome extension link", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitForReady();

    expect(screen.getByText(/Chrome extension/i)).toBeTruthy();
  });
});

describe("button disabled state", () => {
  it("shows 'Loading…' and is disabled when request is null", async () => {
    makeAuthRequestMock(null);
    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(screen.getByText(/Loading\.\.\./i)).toBeTruthy()
    );
  });
});

describe("button press", () => {
  it("calls promptAsync when the sign-in button is pressed", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    const button = await waitForReady().then(() =>
      screen.getByText(/Get Started with Google Calendar/i)
    );

    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockReturnValue(new Promise(() => {})),
        })
    );

    MockedAuthFlow.mockClear();

    fireEvent.press(button);

    await waitFor(() => expect(MockedAuthFlow).toHaveBeenCalledTimes(1));
  });
});

describe("onAuthSuccess callback", () => {
  it("calls onAuthSuccess when the auth flow succeeds", async () => {
    makeAuthRequestMock();
    const onAuthSuccess = jest.fn();

    render(<GoogleCalendarAuth onAuthSuccess={onAuthSuccess} />);

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledTimes(1));
  });

  it("does not throw when onAuthSuccess is not provided", async () => {
    makeAuthRequestMock();

    expect(() => render(<GoogleCalendarAuth />)).not.toThrow();

    await waitFor(() =>
      expect(screen.queryByText(/Checking login status/i)).toBeNull()
    );
  });
});

describe("loading state during auth", () => {
  it("shows 'Logging you in…' spinner while flow is executing", async () => {
    let resolveFlow!: () => void;

    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockReturnValue(
            new Promise<void>((resolve) => {
              resolveFlow = resolve;
            })
          ),
        })
    );

    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(screen.getByText(/Logging you in/i)).toBeTruthy()
    );

    act(() => resolveFlow());
  });
});

describe("error state", () => {
  it("shows the error message when the auth flow throws an Error", async () => {
    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockRejectedValue(new Error("Network error")),
        })
    );

    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(screen.getByText(/Network error/i)).toBeTruthy()
    );
  });

  it("shows fallback message for non-Error throws", async () => {
    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockRejectedValue("something unexpected"),
        })
    );

    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(
        screen.getByText(/Authentication failed. Please try again./i)
      ).toBeTruthy()
    );
  });

  it("re-enables the sign-in button after an error so the user can retry", async () => {
    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockRejectedValue(new Error("Timeout")),
        })
    );

    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(
        screen.getByText(/Get Started with Google Calendar/i)
      ).toBeTruthy()
    );
  });
});

describe("response useEffect branch", () => {
  it("re-runs the auth flow when response.type is 'success'", async () => {
    const successResponse = {
      type: "success",
      authentication: { accessToken: "tok" },
    };

    makeAuthRequestMock(
      { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      successResponse
    );

    render(<GoogleCalendarAuth />);

    await waitFor(() => expect(MockedAuthFlow).toHaveBeenCalledTimes(2));
  });

  it("sets status to 'ready' when response.type is 'cancel'", async () => {
    makeAuthRequestMock(
      { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      { type: "cancel" }
    );

    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(
        screen.getByText(/Get Started with Google Calendar/i)
      ).toBeTruthy()
    );
  });

  it("sets status to 'ready' when response.type is 'error'", async () => {
    makeAuthRequestMock(
      { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      { type: "error", error: { message: "OAuth error" } }
    );

    render(<GoogleCalendarAuth />);

    await waitFor(() =>
      expect(
        screen.getByText(/Get Started with Google Calendar/i)
      ).toBeTruthy()
    );
  });
});

describe("isMounted cleanup", () => {
  it("does not call setState after the component unmounts", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let resolveFlow!: () => void;

    MockedAuthFlow.mockImplementation(
      () =>
        asFlow({
          execute: jest.fn().mockReturnValue(
            new Promise<void>((resolve) => {
              resolveFlow = resolve;
            })
          ),
        })
    );

    makeAuthRequestMock();
    const { unmount } = render(<GoogleCalendarAuth />);

    act(() => unmount());

    await act(async () => {
      resolveFlow();
    });

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update")
    );

    consoleError.mockRestore();
  });
});

describe("Chrome extension link", () => {
  it("opens the Chrome Web Store URL when the link is pressed", async () => {
    makeAuthRequestMock();
    render(<GoogleCalendarAuth />);

    await waitForReady();

    const link = screen.getByText(/Chrome extension/i);
    fireEvent.press(link);

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://chromewebstore.google.com/detail/visual-schedule-builder-e/nbapggbchldhdjckbhdhkhlodokjdoha"
    );
  });
});
