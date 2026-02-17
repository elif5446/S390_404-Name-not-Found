import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import {
  View,
  Button,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import {
  saveTokens,
  saveUserInfo,
  getTokens,
  isTokenValid,
  clearTokens,
} from "../utils/tokenStorage";
import { styles } from "../styles/googleCalendarAuth";

// Global flag to prevent multiple instances from initializing
let globalInitializationStarted = false;

export default function GoogleCalendarAuth({
  onAuthSuccess,
}: {
  onAuthSuccess?: () => void;
}) {
  const [isSigninInProgress, setIsSigninInProgress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  const isMounted = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substring(7));
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log(`GoogleCalendarAuth [${instanceId.current}] MOUNTED`);
    isMounted.current = true;

    // Only initialize if not already started globally
    if (!globalInitializationStarted) {
      globalInitializationStarted = true;
      console.log(`[${instanceId.current}] Starting initialization...`);
      initializeGoogleSignin();
    } else {
      console.log(
        `[${instanceId.current}] Initialization already started by another instance, waiting...`,
      );

      setTimeout(() => {
        if (isMounted.current && !isAutoLoggingIn) {
          setIsInitialized(true);
        }
      }, 100);
    }

    return () => {
      console.log(`GoogleCalendarAuth [${instanceId.current}] UNMOUNTED`);
      isMounted.current = false;
    };
  }, []);

  const initializeGoogleSignin = async () => {
    try {
      console.log(`[${instanceId.current}] Initializing Google Sign-In...`);

      // Configure Google Sign-In
      await GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      });

      console.log(
        `[${instanceId.current}] Google Sign-In configured successfully`,
      );

      // Check if already valid tokens
      const tokens = await getTokens();
      console.log(`[${instanceId.current}] Tokens found:`, !!tokens);

      if (tokens && isTokenValid(tokens)) {
        console.log(
          `[${instanceId.current}] Valid tokens found, checking Google session...`,
        );

        // Check if user is still signed in with Google
        const currentUser = await GoogleSignin.getCurrentUser();
        console.log(
          `[${instanceId.current}] Current user from Google:`,
          !!currentUser,
        );

        if (currentUser && isMounted.current) {
          console.log(
            `[${instanceId.current}] User still signed in with Google`,
          );

          // Show auto-login loading state
          setIsAutoLoggingIn(true);

          // Save user info
          await saveUserInfo(currentUser);
          console.log(`[${instanceId.current}] User info saved`);

          // Small delay to ensure everything is saved
          setTimeout(() => {
            if (isMounted.current && !hasNavigated.current) {
              console.log(
                `[${instanceId.current}] Auto-login successful, navigating...`,
              );
              hasNavigated.current = true;
              onAuthSuccess?.();
            }
          }, 500);

          return; // Exit early - don't set isInitialized
        } else {
          console.log(
            `[${instanceId.current}] Google session expired, showing login button`,
          );

          await clearTokens();
        }
      } else {
        console.log(
          `[${instanceId.current}] No valid tokens found, showing login button`,
        );
      }
    } catch (error) {
      console.error(
        `[${instanceId.current}] GoogleSignin initialization error:`,
        error,
      );
    } finally {
      // Only mark as initialized if we're not auto-logging in and component is mounted
      if (isMounted.current && !isAutoLoggingIn) {
        console.log(`[${instanceId.current}] Setting isInitialized to true`);
        setIsInitialized(true);
      }
    }
  };

  const signIn = async () => {
    try {
      setIsSigninInProgress(true);

      await GoogleSignin.hasPlayServices();

      const signInResult = await GoogleSignin.signIn();
      console.log(
        `[${instanceId.current}] Sign in success - full result:`,
        JSON.stringify(signInResult, null, 2),
      );

      const tokens = await GoogleSignin.getTokens();

      await saveTokens({
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        expiryDate: Date.now() + 3600000,
      });

      // Extract user data properly
      let userData = null;

      if (signInResult) {
        if ("user" in signInResult && signInResult.user) {
          userData = signInResult.user;
          console.log(
            `[${instanceId.current}] Found user data in signInResult.user`,
          );
        } else if (
          "data" in signInResult &&
          signInResult.data &&
          typeof signInResult.data === "object" &&
          "user" in signInResult.data
        ) {
          userData = signInResult.data.user;
          console.log(
            `[${instanceId.current}] Found user data in signInResult.data.user`,
          );
        } else if (
          signInResult &&
          ("name" in signInResult ||
            "email" in signInResult ||
            "photo" in signInResult ||
            "givenName" in signInResult)
        ) {
          userData = signInResult;
          console.log(
            `[${instanceId.current}] Found user data in signInResult itself`,
          );
        }
      }

      if (userData) {
        console.log(
          `[${instanceId.current}] User data extracted:`,
          JSON.stringify(userData, null, 2),
        );

        // Map user data
        const mappedUserInfo = {
          name:
            (userData as any).name ||
            (userData as any).displayName ||
            ((userData as any).givenName && (userData as any).familyName
              ? `${(userData as any).givenName} ${(userData as any).familyName}`
              : "User"),
          email: (userData as any).email || "",
          photo:
            (userData as any).photo ||
            (userData as any).photoUrl ||
            (userData as any).picture ||
            "",
          id: (userData as any).id || (userData as any).userId || "",
        };

        console.log(
          `[${instanceId.current}] Mapped user info:`,
          mappedUserInfo,
        );

        // Save if we have at least a name or email
        if (mappedUserInfo.name !== "User" || mappedUserInfo.email) {
          await saveUserInfo(mappedUserInfo);
          console.log(`[${instanceId.current}] User info saved successfully`);
        } else {
          console.log(
            `[${instanceId.current}] No real user data to save, using fallback`,
          );
          // Minimal info as fallback
          await saveUserInfo({
            name: "User",
            email: "",
            photo: "",
            id: "",
          });
        }
      } else {
        console.log(`[${instanceId.current}] No user data found in response`);
      }

      // Navigate after successful sign in
      if (!hasNavigated.current) {
        console.log(
          `[${instanceId.current}] Manual sign-in successful, navigating...`,
        );
        hasNavigated.current = true;
        onAuthSuccess?.();
      }
    } catch (error: any) {
      console.error(`[${instanceId.current}] Login Error:`, error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Sign in cancelled by user");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Info", "Sign in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available or outdated");
      } else {
        Alert.alert("Error", error.toString());
      }
    } finally {
      if (isMounted.current) {
        setIsSigninInProgress(false);
      }
    }
  };

  // Show loading screen while checking auth
  if (!isInitialized && !isAutoLoggingIn) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  // Show loading screen during auto-login
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
      <Text style={styles.title}>CONUWALKS</Text>

      <Button
        title={
          isSigninInProgress
            ? "Signing in..."
            : "Connect Google Calendar to see the map and your classes!"
        }
        disabled={isSigninInProgress}
        onPress={signIn}
      />
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
    </View>
  );
}
