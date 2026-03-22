import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Button,
  Text,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  saveTokens,
  saveUserInfo,
  getTokens,
  isTokenValid,
  clearTokens,
} from "../utils/tokenStorage";
import { styles } from "../styles/googleCalendarAuth";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleCalendarAuth({onAuthSuccess}: Readonly<{onAuthSuccess?: () => void;}>) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  const isMounted = useRef(true);
  const hasNavigated = useRef(false);

  const iOSId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";

  const iOSPrefix = iOSId.split(".apps.googleusercontent.com")[0];
  const androidPrefix = androidId.split(".apps.googleusercontent.com")[0];

  const redirectUri = Platform.OS === "android" ? `com.googleusercontent.apps.${androidPrefix}:/` : `com.googleusercontent.apps.${iOSPrefix}:/`;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: iOSId,
    androidClientId: androidId,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    redirectUri
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      handlePostLogin(authentication?.accessToken, authentication?.idToken);
    } else if (response?.type === "error" || response?.type === "cancel") {
      setIsAutoLoggingIn(false);
    }
  }, [response]);

  useEffect(() => {
    isMounted.current = true;
    checkExistingSession();
    return () => { isMounted.current = false; };
  }, []);

  const checkExistingSession = async () => {
    try {
      const tokens = await getTokens();
      if (tokens && isTokenValid(tokens)) {
        onAuthSuccess?.();
      } else {
        await clearTokens();
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error checking existing session:", error);
      setIsInitialized(true);
    }
  };

  const handlePostLogin = async (accessToken: string | undefined, idToken: string | undefined) => {
    if (!accessToken) return;

    try {
      setIsAutoLoggingIn(true);

      const userInfoResponse = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userInfoResponse.json();

      await saveTokens({
        accessToken,
        idToken: idToken || "",
        expiryDate: Date.now() + 3600000,
      });

      await saveUserInfo({
        id: userData.id || "",
        name: userData.name || "User",
        email: userData.email || "",
        photo: userData.picture || "",
      });

      if (isMounted.current && !hasNavigated.current) {
        hasNavigated.current = true;
        onAuthSuccess?.();
      }
    } catch (error) {
      console.error("Failed to get user profile", error);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  const signIn = async () => {promptAsync();};

  if (!isInitialized && !isAutoLoggingIn) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  if (isAutoLoggingIn) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Logging you in...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
      <Text style={styles.title}>CONUWALKS</Text>

      <View
        style={{
          backgroundColor: Platform.OS === "ios" ? "#B03060CC" : "#feeded",
          borderRadius: 20,
        }}
      >
        <Button
          title={request ? "Get Started with Google Calendar" : "Loading..."
          }
          disabled={!request}
          onPress={signIn}
          color={Platform.OS === "ios" ? "#feeded" : "#B03060CC"}
        />
      </View>

      <Text style={{ fontSize: 16, paddingTop: 16, paddingBottom: 6, fontWeight: "bold" }}>
        Steps to use Conuwalks:
      </Text>
      <View>
        <Text style={styles.text}>1. Connect your Google account to the app.</Text>
        <Text style={styles.text}>2. Enter your classes on your Google Calendar as events.</Text>
        <Text style={styles.nestedText}>
          2.1 Manually: Enter courses and their location (Building code - Room number) as events.
        </Text>
        <Text style={styles.nestedText}>
          2.2. Automatically: Export your class schedule using this {""}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://chromewebstore.google.com/detail/visual-schedule-builder-e/nbapggbchldhdjckbhdhkhlodokjdoha")}
          >
            Chrome extension
          </Text>
          .
        </Text>
        <Text style={styles.text}>
          3. Once you login, you can see directions to each class!
        </Text>
      </View>
    </View>
  );
}