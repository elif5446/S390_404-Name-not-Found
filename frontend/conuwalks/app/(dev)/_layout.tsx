import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { getTokens, isTokenValid } from "@/src/utils/tokenStorage";
import { useRouter, useSegments } from "expo-router";

export default function DevLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(dev)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access login
      router.replace("/(dev)");
    }
  }, [isAuthenticated, segments]);

  useEffect(() => {
    if (segments[0] === "login") {
      // When we're on the login screen, check auth status again
      setTimeout(() => {
        checkAuthStatus();
      }, 500);
    }
  }, [segments]);

  const checkAuthStatus = async () => {
    try {
      console.log("Checking auth status...");
      const tokens = await getTokens();
      const valid = !!(tokens && isTokenValid(tokens));
      console.log("Auth valid:", valid);
      setIsAuthenticated(valid);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    }
  };

  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
