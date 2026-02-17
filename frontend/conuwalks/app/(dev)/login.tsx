import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import GoogleCalendarAuth from "@/src/screens/GoogleCalendarAuth";
import { useRouter } from "expo-router";
import {
  getTokens,
  clearTokens,
  getUserInfo,
  isTokenValid,
} from "@/src/utils/tokenStorage";
import { styles } from "@/src/styles/login";

export default function LoginScreen() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log("LoginScreen MOUNTED");
    isMounted.current = true;

    // Check authentication immediately on mount
    (async () => {
      const tokens = await getTokens();
      if (tokens && isTokenValid(tokens)) {
        console.log("Already authenticated, redirecting to map");
        setIsNavigating(true);
        hasNavigated.current = true;
        router.replace("/(dev)");
      }
    })();

    return () => {
      console.log("LoginScreen UNMOUNTED");
      isMounted.current = false;
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, []);

  const handleAuthSuccess = () => {
    // Prevent multiple navigations
    if (isNavigating || hasNavigated.current) {
      console.log("Already navigating or navigated, skipping");
      return;
    }

    console.log("Auth success, preparing to navigate");
    setIsNavigating(true);
    hasNavigated.current = true;

    // Clear any existing timeout
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }

    // Small delay
    navigationTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        console.log("Navigating to map with root replace");
        router.replace("/(dev)");
        setTimeout(() => {
          if (isMounted.current) {
            console.log("Ensuring login screen is gone");
          }
        }, 100);
      }
    }, 500);
  };

  if (isNavigating) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={{ marginTop: 10 }}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleCalendarAuth key="google-auth" onAuthSuccess={handleAuthSuccess} />
    </View>
  );
}
