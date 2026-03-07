import { Platform, Linking, Alert } from "react-native";
import {
  openNotificationSettings,
  openAppearanceSettings,
} from "../../utils/openSystemSettings";

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Linking.openSettings = jest.fn().mockResolvedValue(true);
  RN.Linking.canOpenURL = jest.fn().mockResolvedValue(true);
  RN.Linking.openURL = jest.fn().mockResolvedValue(true);
  return RN;
});

describe("openSystemSettings utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("openNotificationSettings calls Linking.openSettings", async () => {
    await openNotificationSettings();
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  test("openAppearanceSettings shows Alert for iOS", async () => {
    Platform.OS = "ios";
    const alertSpy = jest.spyOn(Alert, "alert");

    await openAppearanceSettings();

    expect(alertSpy).toHaveBeenCalledWith(
      "Change Appearance",
      expect.stringContaining("Display & Brightness"),
      expect.any(Array),
    );
  });

  test("openAppearanceSettings shows Alert for Android", async () => {
    Platform.OS = "android";
    const alertSpy = jest.spyOn(Alert, "alert");

    await openAppearanceSettings();

    expect(alertSpy).toHaveBeenCalledWith(
      "Change Appearance",
      expect.stringContaining("device settings"),
      expect.any(Array),
    );
  });
});
