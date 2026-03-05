import { Platform, Linking, Alert } from "react-native";

/**
 * Lightweight helpers that use only React Native's built-in Linking API.
 * This avoids adding native/expo dependencies so there's no extra setup
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    // Linking.openSettings opens the app's settings page on both iOS and Android
    if (Linking.openSettings) {
      await Linking.openSettings();
      return;
    }

    // Fallback: try the app-settings: URL scheme
    const url = "app-settings:";
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }
  } catch (err) {
    console.warn("openNotificationSettings error:", err);
  }

  Alert.alert(
    "Open Settings",
    "We couldn't open the system settings automatically. Please open the device Settings app and navigate to Notifications → ConUWalks.",
  );
}

export async function openAppearanceSettings(): Promise<void> {
  try {
    // there is no public universal deep link to the system Display & Brightness on iOS
    // on android Linking.openSettings will open the app settings (not the global display settings)
    Alert.alert(
      "Change Appearance",
      Platform.OS === "ios"
        ? "To change the system appearance on iOS, open Settings → Display & Brightness. Would you like to open the app Settings now?"
        : "To change system dark/light mode, open your device settings. Would you like to open the app Settings now?",
      [
        {
          text: "Open Settings",
          onPress: async () => {
            try {
              if (Linking.openSettings) {
                await Linking.openSettings();
                return;
              }
              const url = "app-settings:";
              if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
                return;
              }
            } catch (err) {
              console.warn("openAppearanceSettings open error:", err);
              Alert.alert(
                "Open Settings",
                "Unable to open Settings automatically. Please open the device Settings app and navigate to Display & Brightness.",
              );
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
    return;
  } catch (err) {
    console.warn("openAppearanceSettings error:", err);
  }

  Alert.alert(
    "Open Settings",
    "We couldn't open the system appearance settings automatically. Please open Settings → Display & Brightness (or the equivalent on your device).",
  );
}
