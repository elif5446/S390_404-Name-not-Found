import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT ?? "8000";
const ANDROID_HOST = process.env.EXPO_PUBLIC_ANDROID_DEV_HOST ?? "10.0.2.2";

function getHost(): string {
  if (Platform.OS === "android") {
    return ANDROID_HOST;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(":")[0];
  }

  return "localhost";
}

export const API_BASE_URL = `http://${getHost()}:${PORT}`;
