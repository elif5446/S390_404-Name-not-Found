import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Button, Platform, View } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import GoogleCalendarAuth from "../../components/GoogleCalendarAuth";
import { GoogleCalendarAuthFlow } from "../../Auth/GoogleCalendarAuthFlow";

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(),
}));

jest.mock("../../Auth/GoogleCalendarAuthFlow", () => ({
  GoogleCalendarAuthFlow: jest.fn(),
}));

jest.mock("../../styles/googleCalendarAuth", () => ({
  styles: {
    centerContainer: {},
    loadingText: {},
    container: {},
    logo: {},
    title: {},
    errorText: {},
    text: {},
    nestedText: {},
    link: {},
  },
}));

const mockedUseAuthRequest = Google.useAuthRequest as jest.Mock;
const MockedGoogleCalendarAuthFlow = GoogleCalendarAuthFlow as jest.Mock;

describe("GoogleCalendarAuth additional coverage", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();

    MockedGoogleCalendarAuthFlow.mockImplementation(
      (_prompt: unknown, onSuccess?: () => void) => ({
        execute: jest.fn().mockImplementation(async () => {
          onSuccess?.();
        }),
      })
    );
  });

  afterAll(() => {
    Object.defineProperty(Platform, "OS", {
      value: originalPlatform,
      configurable: true,
    });
  });

  function setPlatform(os: "ios" | "android") {
    Object.defineProperty(Platform, "OS", {
      value: os,
      configurable: true,
    });
  }

  it("returns to ready state when auth response type is cancel", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      { type: "cancel" },
      jest.fn(),
    ]);

    const { getByText, queryByText } = render(<GoogleCalendarAuth />);

    await waitFor(() => {
      expect(getByText("CONUWALKS")).toBeTruthy();
    });

    expect(queryByText("Logging you in...")).toBeNull();
  });

  it("returns to ready state when auth response type is error", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      { type: "error" },
      jest.fn(),
    ]);

    const { getByText, queryByText } = render(<GoogleCalendarAuth />);

    await waitFor(() => {
      expect(getByText("CONUWALKS")).toBeTruthy();
    });

    expect(queryByText("Logging you in...")).toBeNull();
  });

  it("calls onAuthSuccess and returns to ready state after successful auth", async () => {
    setPlatform("ios");

    const onAuthSuccess = jest.fn();

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      null,
      jest.fn(),
    ]);

    MockedGoogleCalendarAuthFlow.mockImplementation(
      (_prompt: unknown, successCb?: () => void) => ({
        execute: jest.fn().mockImplementation(async () => {
          successCb?.();
        }),
      })
    );

    const { getByText, queryByText } = render(
      <GoogleCalendarAuth onAuthSuccess={onAuthSuccess} />
    );

    await waitFor(() => {
      expect(onAuthSuccess).toHaveBeenCalledTimes(1);
    });

    expect(getByText("CONUWALKS")).toBeTruthy();
    expect(queryByText("Logging you in...")).toBeNull();
  });

  it("shows error.message when auth flow throws an Error", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      null,
      jest.fn(),
    ]);

    MockedGoogleCalendarAuthFlow.mockImplementation(() => ({
      execute: jest.fn().mockRejectedValue(new Error("Boom")),
    }));

    const { queryByText } = render(<GoogleCalendarAuth />);

    await waitFor(() => {
      expect(queryByText("Boom")).toBeTruthy();
    });
  });

  it("shows fallback message when auth flow throws a non-Error", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      null,
      jest.fn(),
    ]);

    MockedGoogleCalendarAuthFlow.mockImplementation(() => ({
      execute: jest.fn().mockRejectedValue("bad failure"),
    }));

    const { queryByText } = render(<GoogleCalendarAuth />);

    await waitFor(() => {
      expect(
        queryByText("Authentication failed. Please try again.")
      ).toBeTruthy();
    });
  });

  it("uses android button and container colors", async () => {
    setPlatform("android");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      { type: "cancel" },
      jest.fn(),
    ]);

    const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
      <GoogleCalendarAuth />
    );

    await waitFor(() => {
      expect(UNSAFE_getByType(Button)).toBeTruthy();
    });

    const button = UNSAFE_getByType(Button);
    expect(button.props.color).toBe("#B03060CC");

    const views = UNSAFE_getAllByType(View);
    const buttonWrapper = views.find((view) => {
      const style = Array.isArray(view.props.style)
        ? Object.assign({}, ...view.props.style)
        : view.props.style;
      return style?.borderRadius === 20;
    });

    expect(buttonWrapper).toBeTruthy();

    const wrapperStyle = Array.isArray(buttonWrapper?.props.style)
      ? Object.assign({}, ...buttonWrapper.props.style)
      : buttonWrapper?.props.style;

    expect(wrapperStyle.backgroundColor).toBe("#feeded");
  });

  it("uses ios button and container colors", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([
      { type: "mock-request" },
      { type: "cancel" },
      jest.fn(),
    ]);

    const { UNSAFE_getByType, UNSAFE_getAllByType } = render(
      <GoogleCalendarAuth />
    );

    await waitFor(() => {
      expect(UNSAFE_getByType(Button)).toBeTruthy();
    });

    const button = UNSAFE_getByType(Button);
    expect(button.props.color).toBe("#feeded");

    const views = UNSAFE_getAllByType(View);
    const buttonWrapper = views.find((view) => {
      const style = Array.isArray(view.props.style)
        ? Object.assign({}, ...view.props.style)
        : view.props.style;
      return style?.borderRadius === 20;
    });

    expect(buttonWrapper).toBeTruthy();

    const wrapperStyle = Array.isArray(buttonWrapper?.props.style)
      ? Object.assign({}, ...buttonWrapper.props.style)
      : buttonWrapper?.props.style;

    expect(wrapperStyle.backgroundColor).toBe("#B03060CC");
  });

  it("renders loading state when request is not yet ready", async () => {
    setPlatform("ios");

    mockedUseAuthRequest.mockReturnValue([null, null, jest.fn()]);

    MockedGoogleCalendarAuthFlow.mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(undefined),
    }));

    const { queryByText } = render(<GoogleCalendarAuth />);

    await waitFor(() => {
      expect(queryByText("Logging you in...")).toBeTruthy();
    });
  });
});