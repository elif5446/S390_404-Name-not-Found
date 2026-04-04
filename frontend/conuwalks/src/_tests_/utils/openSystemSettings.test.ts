import { Alert, Linking, Platform } from "react-native";
import {
  openAppearanceSettings,
  openNotificationSettings,
} from "../../utils/openSystemSettings";

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Linking.openSettings = jest.fn().mockResolvedValue(undefined);
  RN.Linking.canOpenURL = jest.fn().mockResolvedValue(true);
  RN.Linking.openURL = jest.fn().mockResolvedValue(undefined);
  return RN;
});

describe("openSystemSettings utils", () => {
  const openSettingsMock = Linking.openSettings as jest.Mock;
  const canOpenUrlMock = Linking.canOpenURL as jest.Mock;
  const openUrlMock = Linking.openURL as jest.Mock;
  let warnSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    openSettingsMock.mockResolvedValue(undefined);
    canOpenUrlMock.mockResolvedValue(true);
    openUrlMock.mockResolvedValue(undefined);
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("opens notification settings through Linking.openSettings when available", async () => {
    await openNotificationSettings();

    expect(openSettingsMock).toHaveBeenCalledTimes(1);
    expect(canOpenUrlMock).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("falls back to app-settings URL when openSettings is unavailable", async () => {
    (Linking as any).openSettings = undefined;

    await openNotificationSettings();

    expect(canOpenUrlMock).toHaveBeenCalledWith("app-settings:");
    expect(openUrlMock).toHaveBeenCalledWith("app-settings:");

    (Linking as any).openSettings = openSettingsMock;
  });

  it("shows an alert when notification settings cannot be opened", async () => {
    (Linking as any).openSettings = undefined;
    canOpenUrlMock.mockResolvedValue(false);

    await openNotificationSettings();

    expect(alertSpy).toHaveBeenCalledWith(
      "Open Settings",
      expect.stringContaining("couldn't open the system settings automatically"),
    );

    (Linking as any).openSettings = openSettingsMock;
  });

  it("warns and shows an alert when opening notification settings throws", async () => {
    openSettingsMock.mockRejectedValue(new Error("boom"));

    await openNotificationSettings();

    expect(warnSpy).toHaveBeenCalledWith(
      "openNotificationSettings error:",
      expect.any(Error),
    );
    expect(alertSpy).toHaveBeenCalledWith(
      "Open Settings",
      expect.stringContaining("Please open the device Settings app"),
    );
  });

  it("shows the iOS appearance message with action buttons", async () => {
    await openAppearanceSettings();

    expect(alertSpy).toHaveBeenCalledWith(
      "Change Appearance",
      expect.stringContaining("Display & Brightness"),
      expect.arrayContaining([
        expect.objectContaining({ text: "Open Settings" }),
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
      ]),
    );
  });

  it("shows the Android appearance message", async () => {
    Platform.OS = "android";

    await openAppearanceSettings();

    expect(alertSpy).toHaveBeenCalledWith(
      "Change Appearance",
      expect.stringContaining("device settings"),
      expect.any(Array),
    );
  });

  it("opens settings from the appearance alert action", async () => {
    await openAppearanceSettings();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => Promise<void>;
    }>;

    await buttons[0].onPress?.();

    expect(openSettingsMock).toHaveBeenCalledTimes(1);
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it("uses the URL fallback from the appearance alert action when openSettings is unavailable", async () => {
    (Linking as any).openSettings = undefined;

    await openAppearanceSettings();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => Promise<void>;
    }>;

    await buttons[0].onPress?.();

    expect(canOpenUrlMock).toHaveBeenCalledWith("app-settings:");
    expect(openUrlMock).toHaveBeenCalledWith("app-settings:");

    (Linking as any).openSettings = openSettingsMock;
  });

  it("does nothing further when the appearance action fallback URL cannot be opened", async () => {
    (Linking as any).openSettings = undefined;
    canOpenUrlMock.mockResolvedValue(false);

    await openAppearanceSettings();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => Promise<void>;
    }>;

    await buttons[0].onPress?.();

    expect(openUrlMock).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    (Linking as any).openSettings = openSettingsMock;
  });

  it("warns and shows a fallback alert when the appearance action fails", async () => {
    openSettingsMock.mockRejectedValue(new Error("nope"));

    await openAppearanceSettings();

    const buttons = alertSpy.mock.calls[0][2] as Array<{
      text: string;
      onPress?: () => Promise<void>;
    }>;

    await buttons[0].onPress?.();

    expect(warnSpy).toHaveBeenCalledWith(
      "openAppearanceSettings open error:",
      expect.any(Error),
    );
    expect(alertSpy).toHaveBeenLastCalledWith(
      "Open Settings",
      expect.stringContaining("Unable to open Settings automatically"),
    );
  });

  it("warns and shows the outer fallback alert when presenting the appearance dialog fails", async () => {
    alertSpy
      .mockImplementationOnce(() => {
        throw new Error("alert failed");
      })
      .mockImplementation(() => {});

    await openAppearanceSettings();

    expect(warnSpy).toHaveBeenCalledWith(
      "openAppearanceSettings error:",
      expect.any(Error),
    );
    expect(alertSpy).toHaveBeenLastCalledWith(
      "Open Settings",
      expect.stringContaining("appearance settings automatically"),
    );
  });
});
