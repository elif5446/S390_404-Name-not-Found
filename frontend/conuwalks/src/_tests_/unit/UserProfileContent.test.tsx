import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import UserProfileContent from "@/src/components/UserProfileContent";
import { Switch, Platform } from "react-native";
import { SymbolView } from "expo-symbols";

import {
  getClassReminderLeadTime,
  saveClassReminderLeadTime,
  getWheelchairAccessibilityPreference,
  saveWheelchairAccessibilityPreference,
  MIN_CLASS_REMINDER_LEAD_TIME_MINUTES,
  MAX_CLASS_REMINDER_LEAD_TIME_MINUTES,
} from "@/src/utils/tokenStorage";

import {
  openNotificationSettings,
  openAppearanceSettings,
} from "@/src/utils/openSystemSettings";

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  return function MaterialIcons(props: any) {
    return React.createElement("MaterialIcons", props, null);
  };
});

jest.mock("expo-symbols", () => ({
  SymbolView: (props: any) => {
    const React = require("react");
    return React.createElement("SymbolView", props, null);
  },
}));

jest.mock("@/src/utils/openSystemSettings", () => ({
  openNotificationSettings: jest.fn(),
  openAppearanceSettings: jest.fn(),
}));

jest.mock("@/src/utils/tokenStorage", () => ({
  getClassReminderLeadTime: jest.fn(),
  saveClassReminderLeadTime: jest.fn(),
  getWheelchairAccessibilityPreference: jest.fn(),
  saveWheelchairAccessibilityPreference: jest.fn(),
  MIN_CLASS_REMINDER_LEAD_TIME_MINUTES: 0,
  MAX_CLASS_REMINDER_LEAD_TIME_MINUTES: 120,
}));

const mockPlatformOS = (os: "ios" | "android") => {
  const originalOS = Platform.OS;

  Object.defineProperty(Platform, "OS", {
    value: os,
    configurable: true,
  });

  return () => {
    Object.defineProperty(Platform, "OS", {
      value: originalOS,
      configurable: true,
    });
  };
};

const mockedGetClassReminderLeadTime =
  getClassReminderLeadTime as jest.MockedFunction<
    typeof getClassReminderLeadTime
  >;
const mockedSaveClassReminderLeadTime =
  saveClassReminderLeadTime as jest.MockedFunction<
    typeof saveClassReminderLeadTime
  >;
const mockedGetWheelchairAccessibilityPreference =
  getWheelchairAccessibilityPreference as jest.MockedFunction<
    typeof getWheelchairAccessibilityPreference
  >;
const mockedSaveWheelchairAccessibilityPreference =
  saveWheelchairAccessibilityPreference as jest.MockedFunction<
    typeof saveWheelchairAccessibilityPreference
  >;
const mockedOpenNotificationSettings =
  openNotificationSettings as jest.MockedFunction<
    typeof openNotificationSettings
  >;
const mockedOpenAppearanceSettings =
  openAppearanceSettings as jest.MockedFunction<typeof openAppearanceSettings>;


describe("UserProfileContent", () => {
  const userInfo = {
    email: "student@test.com",
    studentId: "40212345",
  };

  const onSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetClassReminderLeadTime.mockResolvedValue(10);
    mockedSaveClassReminderLeadTime.mockResolvedValue(true);
    mockedGetWheelchairAccessibilityPreference.mockResolvedValue(false);
    mockedSaveWheelchairAccessibilityPreference.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders account info correctly", async () => {
    const { getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    expect(getByText("student@test.com")).toBeTruthy();
    expect(getByText("Student ID: 40212345")).toBeTruthy();

    await waitFor(() => {
      expect(mockedGetClassReminderLeadTime).toHaveBeenCalled();
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });
  });

  it("renders fallback values when user info is missing", () => {
    const { getByText } = render(
      <UserProfileContent userInfo={{}} onSignOut={onSignOut} mode="light" />,
    );

    expect(getByText("No email linked")).toBeTruthy();
    expect(getByText("Student ID: 12345678")).toBeTruthy();
  });

  it("loads saved preferences on mount", async () => {
    mockedGetClassReminderLeadTime.mockResolvedValue(15);
    mockedGetWheelchairAccessibilityPreference.mockResolvedValue(true);

    const { getByText, getByDisplayValue } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="dark"
      />,
    );

    await waitFor(() => {
      expect(mockedGetClassReminderLeadTime).toHaveBeenCalledTimes(1);
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalledTimes(
        1,
      );
    });

    expect(getByText("15m")).toBeTruthy();
    expect(() => getByDisplayValue("15")).toThrow();
  });

  it("shows custom saved reminder input if saved value is not in predefined options", async () => {
    mockedGetClassReminderLeadTime.mockResolvedValue(17);

    const { getByDisplayValue } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    await waitFor(() => {
      expect(getByDisplayValue("17")).toBeTruthy();
    });
  });

  it("changes reminder when a preset chip is pressed", async () => {
    const { getByLabelText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    const button = getByLabelText("Set class reminder to 15m");
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockedSaveClassReminderLeadTime).toHaveBeenCalledWith(15);
    });
  });

  it("reverts reminder to fallback value if saving preset reminder fails", async () => {
    mockedSaveClassReminderLeadTime.mockResolvedValue(false);
    mockedGetClassReminderLeadTime
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(30);

    const { getByLabelText, getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    fireEvent.press(getByLabelText("Set class reminder to 15m"));

    await waitFor(() => {
      expect(mockedSaveClassReminderLeadTime).toHaveBeenCalledWith(15);
      expect(mockedGetClassReminderLeadTime).toHaveBeenCalledTimes(2);
    });

    expect(getByText("30m")).toBeTruthy();
  });

  it("does not apply invalid custom reminder input", async () => {
    const { getByLabelText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    const input = getByLabelText("Custom class reminder minutes");
    const applyButton = getByLabelText("Apply custom class reminder");

    // empty input
    fireEvent.changeText(input, "");
    fireEvent.press(applyButton);

    // above max
    fireEvent.changeText(
      input,
      String(MAX_CLASS_REMINDER_LEAD_TIME_MINUTES + 1),
    );
    fireEvent.press(applyButton);

    // below min
    fireEvent.changeText(
      input,
      String(MIN_CLASS_REMINDER_LEAD_TIME_MINUTES - 1),
    );
    fireEvent.press(applyButton);

    // non-number
    fireEvent.changeText(input, "abc");
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockedSaveClassReminderLeadTime).not.toHaveBeenCalled();
    });
  });

  it("applies a valid custom reminder", async () => {
    const { getByLabelText, getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    const input = getByLabelText("Custom class reminder minutes");
    fireEvent.changeText(input, "22");

    const applyButton = getByText("Apply");
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockedSaveClassReminderLeadTime).toHaveBeenCalledWith(22);
    });
  });

  it("rounds custom reminder values before saving", async () => {
    const { getByLabelText, getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    const input = getByLabelText("Custom class reminder minutes");
    fireEvent.changeText(input, "12.6");

    const applyButton = getByText("Apply");
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockedSaveClassReminderLeadTime).toHaveBeenCalledWith(13);
    });
  });

  it("enables wheelchair accessibility when switch is turned on", async () => {
    const { UNSAFE_getByType } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    await waitFor(() => {
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchControl = UNSAFE_getByType(Switch);
    fireEvent(switchControl, "onValueChange", true);

    await waitFor(() => {
      expect(mockedSaveWheelchairAccessibilityPreference).toHaveBeenCalledWith(
        true,
      );
    });
  });

  it("disables wheelchair accessibility when switch is turned off", async () => {
    mockedGetWheelchairAccessibilityPreference.mockResolvedValue(true);

    const { UNSAFE_getByType } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    await waitFor(() => {
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchControl = UNSAFE_getByType(Switch);
    fireEvent(switchControl, "onValueChange", false);

    await waitFor(() => {
      expect(mockedSaveWheelchairAccessibilityPreference).toHaveBeenCalledWith(
        false,
      );
    });
  });

  it("keeps wheelchair accessibility off if enabling fails", async () => {
    mockedSaveWheelchairAccessibilityPreference.mockResolvedValue(false);

    const { UNSAFE_getByType } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    await waitFor(() => {
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchControl = UNSAFE_getByType(Switch);
    fireEvent(switchControl, "onValueChange", true);

    await waitFor(() => {
      expect(mockedSaveWheelchairAccessibilityPreference).toHaveBeenCalledWith(
        true,
      );
    });
  });

  it("keeps wheelchair accessibility on if disabling fails", async () => {
    mockedGetWheelchairAccessibilityPreference.mockResolvedValue(true);
    mockedSaveWheelchairAccessibilityPreference.mockResolvedValue(false);

    const { UNSAFE_getByType } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    await waitFor(() => {
      expect(mockedGetWheelchairAccessibilityPreference).toHaveBeenCalled();
    });

    const switchControl = UNSAFE_getByType(Switch);
    fireEvent(switchControl, "onValueChange", false);

    await waitFor(() => {
      expect(mockedSaveWheelchairAccessibilityPreference).toHaveBeenCalledWith(
        false,
      );
    });
  });

  it("opens system notification settings when pressed", () => {
    const { getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    fireEvent.press(getByText("System Notification Settings"));

    expect(mockedOpenNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it("opens appearance settings when pressed", () => {
    const { getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    fireEvent.press(getByText("Appearance"));

    expect(mockedOpenAppearanceSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onSignOut when sign out is pressed", () => {
    const { getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    fireEvent.press(getByText("Sign Out"));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("renders the valid reminder range text", () => {
    const { getByText } = render(
      <UserProfileContent
        userInfo={userInfo}
        onSignOut={onSignOut}
        mode="light"
      />,
    );

    expect(
      getByText(
        `Set any value from ${MIN_CLASS_REMINDER_LEAD_TIME_MINUTES} to ${MAX_CLASS_REMINDER_LEAD_TIME_MINUTES} minutes`,
      ),
    ).toBeTruthy();
  });

it("renders iOS SymbolView icon", async () => {
  const restorePlatform = mockPlatformOS("ios");

  const { UNSAFE_getByType } = render(
    <UserProfileContent
      userInfo={userInfo}
      onSignOut={onSignOut}
      mode="light"
    />,
  );

  await waitFor(() => {
    expect(UNSAFE_getByType(SymbolView)).toBeTruthy();
  });

  restorePlatform();
});

it("applies iOS padding to notification row", () => {
  const restorePlatform = mockPlatformOS("ios");

  const { getByText } = render(
    <UserProfileContent
      userInfo={userInfo}
      onSignOut={onSignOut}
      mode="light"
    />,
  );

  const text = getByText("System Notification Settings");
  const touchable = text.parent?.parent;

  expect(touchable?.props.style).toEqual(
    expect.objectContaining({ paddingTop: 35 }),
  );

  restorePlatform();
});

});
