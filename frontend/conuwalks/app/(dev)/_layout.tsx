import { Stack } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { getTokens, isTokenValid } from "@/src/utils/tokenStorage";
import { useRouter, useSegments } from "expo-router";

export default function DevLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkAuthStatus();

    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === null || isNavigating.current) return;

    const inAuthGroup = segments[0] === "login";
    console.log("Navigation check:", {
      isAuthenticated,
      inAuthGroup,
      segment: segments[0],
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log("Not authenticated, redirecting to login");
      isNavigating.current = true;

      // Clear any existing timeout
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }

      navigationTimeout.current = setTimeout(() => {
        router.replace("/(dev)/login");
        setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }, 100);
    } else if (isAuthenticated && inAuthGroup) {
      console.log("Authenticated, redirecting to home");
      isNavigating.current = true;

      // Clear any existing timeout
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }

      navigationTimeout.current = setTimeout(() => {
        router.replace("/(dev)");
        setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }, 100);
    }
  }, [isAuthenticated, segments]);

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
