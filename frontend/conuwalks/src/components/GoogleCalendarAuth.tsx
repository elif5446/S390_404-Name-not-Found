import React, { useEffect, useRef, useState } from "react";
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
import { GoogleCalendarAuthFlow } from "../Auth/GoogleCalendarAuthFlow";
import { styles } from "../styles/googleCalendarAuth";

WebBrowser.maybeCompleteAuthSession();

type AuthStatus = "checking" | "ready" | "loading" | "error";

export default function GoogleCalendarAuth({
  onAuthSuccess,
}: Readonly<{ onAuthSuccess?: () => void }>) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const isMounted = useRef(true);

  const iOSId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
  const iOSPrefix = iOSId.split(".apps.googleusercontent.com")[0];
  const androidPrefix = androidId.split(".apps.googleusercontent.com")[0];
  const redirectUri =
    Platform.OS === "android"
      ? `com.googleusercontent.apps.${androidPrefix}:/`
      : `com.googleusercontent.apps.${iOSPrefix}:/`;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: iOSId,
    androidClientId: androidId,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    redirectUri,
  });

  
  useEffect(() => {
    isMounted.current = true;
    runAuthFlow(promptAsync);
    return () => { isMounted.current = false; };
  }, []);


  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      runAuthFlow(() => Promise.resolve(response));
    } else if (response.type === "error" || response.type === "cancel") {
      setStatus("ready");
    }
  }, [response]);

  const runAuthFlow = async (prompt: () => Promise<any>) => {
    setStatus("loading");
    try {
      const flow = new GoogleCalendarAuthFlow(prompt, () => {
        if (isMounted.current) onAuthSuccess?.();
      });
      await flow.execute();
    } catch (error) {
      
      if (isMounted.current) setStatus("ready");
    }
  };

  const signIn = () => runAuthFlow(promptAsync);

  if (status === "checking" || status === "loading") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>
          {status === "checking" ? "Checking login status..." : "Logging you in..."}
        </Text>
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
          title={request ? "Get Started with Google Calendar" : "Loading..."}
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
          2.2. Automatically: Export your class schedule using this{" "}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL(
                "https://chromewebstore.google.com/detail/visual-schedule-builder-e/nbapggbchldhdjckbhdhkhlodokjdoha"
              )
            }
          >
            Chrome extension
          </Text>
          .
        </Text>
        <Text style={styles.text}>3. Once you login, you can see directions to each class!</Text>
      </View>
    </View>
  );
}