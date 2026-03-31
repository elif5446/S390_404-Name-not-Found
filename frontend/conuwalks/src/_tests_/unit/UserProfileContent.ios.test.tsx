import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import { SymbolView } from "expo-symbols";

import {
  getClassReminderLeadTime,
  saveClassReminderLeadTime,
  getWheelchairAccessibilityPreference,
  saveWheelchairAccessibilityPreference,
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

Object.defineProperty(Platform, "OS", {
  value: "ios",
  configurable: true,
});

import UserProfileContent from "@/src/components/UserProfileContent";

const mockedGetClassReminderLeadTime =
  getClassReminderLeadTime as jest.MockedFunction<
    typeof getClassReminderLeadTime
  >;
const mockedGetWheelchairAccessibilityPreference =
  getWheelchairAccessibilityPreference as jest.MockedFunction<
    typeof getWheelchairAccessibilityPreference
  >;

describe("UserProfileContent iOS coverage", () => {
  const userInfo = {
    email: "student@test.com",
    studentId: "40212345",
  };

  const onSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetClassReminderLeadTime.mockResolvedValue(10);
    mockedGetWheelchairAccessibilityPreference.mockResolvedValue(false);
  });

  it("renders SymbolView on iOS", async () => {
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
  });

  it("applies iOS notification row padding", () => {
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
  });
});
