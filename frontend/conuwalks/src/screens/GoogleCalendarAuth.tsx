import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { View, Button, Text, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { saveTokens } from "../utils/tokenStorage";

export default function GoogleCalendarAuth({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSigninInProgress, setIsSigninInProgress] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
  }, []);

  const signIn = async () => {
    try {
      setIsSigninInProgress(true);

      await GoogleSignin.hasPlayServices();
      
      const userInfo = await GoogleSignin.signIn();
      console.log("Success:", userInfo);
      setUserInfo(userInfo);

      const tokens = await GoogleSignin.getTokens();
      
      await saveTokens({
        accessToken: tokens.accessToken,
        expiryDate: Date.now() + 3600000, 
      });

      onAuthSuccess?.();

    } catch (error: any) {
      console.error("Login Error:", error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (error.code === statusCodes.IN_PROGRESS) {
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available or outdated");
      } else {
        Alert.alert("Error", error.toString());
      }
    } finally {
      setIsSigninInProgress(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Google Calendar
      </Text>

      <Button
        title={isSigninInProgress ? "Signing in..." : "Connect Google Calendar"}
        disabled={isSigninInProgress}
        onPress={signIn}
      />

      {userInfo && (
        <Text style={{ marginTop: 20 }}>Logged in</Text>
      )}
    </View>
  );
}