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
  const isMounted = useRef(true);
  const navigationLock = useRef(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log("LoginScreen MOUNTED");
    isMounted.current = true;

    // Check authentication immediately on mount
    checkAndHandleAuth();

    return () => {
      console.log("LoginScreen UNMOUNTED");
      isMounted.current = false;
    };
  }, []);

  const checkAndHandleAuth = async () => {
    if (navigationLock.current) {
      console.log("Navigation already in progress, skipping auth check");
      return;
    }

    try {
      const tokens = await getTokens();
      if (tokens && isTokenValid(tokens)) {
        console.log("Already authenticated, redirecting to map");

        // Lock immediately
        navigationLock.current = true;
        setIsNavigating(true);

        if (isMounted.current) {
          router.replace("/(dev)");
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const handleAuthSuccess = () => {
    // Lock check
    if (navigationLock.current) {
      console.log("Navigation already in progress, skipping");
      return;
    }

    console.log("Auth success, navigating immediately");

    // Set lock
    navigationLock.current = true;
    setIsNavigating(true);

    if (isMounted.current) {
      router.replace("/(dev)");
    }
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
