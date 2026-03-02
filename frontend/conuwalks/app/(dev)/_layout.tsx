import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { getTokens, isTokenValid } from "@/src/utils/tokenStorage";

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

    const currentRouteSegments = segments as string[];
    const inAuthGroup = currentRouteSegments[currentRouteSegments.length - 1] === "login";

    console.log("Navigation check:", {
      isAuthenticated,
      inAuthGroup,
      segments,
    });

    // Centralized navigation handler to clear timeouts and prevent rapid-fire redirects
    const executeNavigation = (path: any) => {
      isNavigating.current = true;
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }

      navigationTimeout.current = setTimeout(() => {
        router.replace(path);
        // Give the router time to settle before unlocking navigation
        setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }, 100);
    };

    if (!isAuthenticated && !inAuthGroup) {
      console.log("Not authenticated, redirecting to login");
      executeNavigation("/(dev)/login");
    } else if (isAuthenticated && inAuthGroup) {
      console.log("Authenticated, redirecting to home");
      executeNavigation("/(dev)/home");
    }
  }, [isAuthenticated, router, segments]);

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
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
