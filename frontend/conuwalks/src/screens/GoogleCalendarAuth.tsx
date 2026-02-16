import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import { View, Button, Text, Alert, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { saveTokens } from "../utils/tokenStorage";

WebBrowser.maybeCompleteAuthSession();

// Define type for Google user info
interface GoogleUserInfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

interface Props {
  onAuthSuccess?: () => void;
}

export default function GoogleCalendarAuth({ onAuthSuccess }: Props) {
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isExpoGo = Constants.appOwnership === "expo";

  const redirectUri = Platform.select({
    ios: "com.conuwalks.app:/oauth2redirect",
    android: "com.conuwalks.app:/oauth2redirect",
    default: "com.conuwalks.app:/oauth2redirect",
  });

  console.log("Using redirect URI:", redirectUri);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    iosClientId: iosClientId,
    androidClientId: androidClientId,
    redirectUri,
    scopes: [
      "openid",
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    usePKCE: true,
  });

  const getUserInfo = async (accessToken: string) => {
    try {
      console.log("Fetching user info...");

      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!userInfoResponse.ok) {
        throw new Error(`HTTP error! status: ${userInfoResponse.status}`);
      }

      const userData: GoogleUserInfo = await userInfoResponse.json();
      console.log("User info fetched:", userData);
      setUserInfo(userData);

      // Save tokens
      await saveTokens({
        accessToken: accessToken,
        expiryDate: Date.now() + 3600000, // 1 hour from now
      });

      // Call success callback
      onAuthSuccess?.();
    } catch (error) {
      console.error("Error fetching user info:", error);
      Alert.alert("Error", "Failed to fetch user information");
    }
  };

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success") {
        setIsLoading(true);
        try {
          console.log("Success response:", response);

          // Check where token is
          const accessToken =
            response.params?.access_token ||
            response.authentication?.accessToken;

          if (accessToken) {
            await getUserInfo(accessToken);
          } else {
            console.log("No access token found in response");
          }
        } catch (error) {
          console.error("Error handling response:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === "error") {
        Alert.alert(
          "Authentication Error",
          "Failed to authenticate with Google",
        );
        console.error("Auth error:", response.error);
      }
    };

    handleResponse();
  }, [response]);

  if (!request) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text>Loading authentication configuration...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Google Calendar Integration
      </Text>

      <Button
        title={isLoading ? "Processing..." : "Connect Google Calendar"}
        disabled={!request || isLoading}
        onPress={() => promptAsync()}
      />

      {userInfo && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text>Logged in as:</Text>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginTop: 5 }}>
            {userInfo.name || userInfo.email || "Unknown User"}
          </Text>
          {userInfo.email && (
            <Text style={{ marginTop: 5, color: "gray" }}>
              {userInfo.email}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
