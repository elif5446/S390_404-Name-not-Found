import React, { useEffect, useState, useRef, useCallback, useId } from "react";
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
  Linking,
  Platform,
} from "react-native";
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
  const instanceId = useRef(useId());
  const hasNavigated = useRef(false);

  const initializeGoogleSignin = useCallback(async () => {
    try {
      console.log(`[${instanceId.current}] Initializing Google Sign-In...`);

      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      if (!webClientId || !iosClientId) {
        console.warn(
          `[${instanceId.current}] WARNING: Google Client IDs are missing from environment variables. Sign-in will fail if attempted.`,
        );
      }

      // Configure Google Sign-In with fallbacks to prevent native module crashes
      GoogleSignin.configure({
        webClientId: webClientId || "",
        iosClientId: iosClientId || "",
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
        const currentUser = GoogleSignin.getCurrentUser();
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

          const userData =
            "user" in currentUser ? currentUser.user : currentUser;
          const mappedUserInfo = {
            id: (userData as any).id || (userData as any).userId || "",
            name:
              (userData as any).name || (userData as any).displayName || "User",
            email: (userData as any).email || "",
            photo: (userData as any).photo || (userData as any).photoUrl || "",
          };

          // Save user info
          await saveUserInfo(mappedUserInfo);
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
  }, []);

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
  }, [initializeGoogleSignin, isAutoLoggingIn]);

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
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
      <Text style={styles.title}>CONUWALKS</Text>

      <View
        style={{
          backgroundColor: Platform.OS === "ios" ? "#B03060CC" : "#feeded",
          borderRadius: 20,
        }}
      >
        <Button
          title={
            isSigninInProgress
              ? "Signing in..."
              : "Get Started with Google Calendar"
          }
          disabled={isSigninInProgress}
          onPress={signIn}
          color={Platform.OS === "ios" ? "#feeded" : "#B03060CC"}
        />
      </View>

      <Text
        style={{
          fontSize: 16,
          paddingTop: 16,
          paddingBottom: 6,
          fontWeight: "bold",
        }}
      >
        Steps to use Conuwalks:
      </Text>
      <View>
        <Text style={styles.text}>
          1. Connect your Google account to the app.
        </Text>
        <Text style={styles.text}>
          2. Enter your classes on your Google Calendar as events.{" "}
        </Text>
        <Text style={styles.nestedText}>
          2.1 Manually: Enter courses and their location (Building code - Room
          number) as events.
        </Text>
        <Text style={styles.nestedText}>
          2.2. Automatically: Export your class schedule from your student
          portal using this {""}
          <Text
            style={styles.link}
            onPress={() => {
              Linking.openURL(
                "https://chromewebstore.google.com/detail/visual-schedule-builder-e/nbapggbchldhdjckbhdhkhlodokjdoha?pli=1",
              );
            }}
          >
            Chrome extension
          </Text>
          .
        </Text>
        <Text style={styles.text}>
          3. Once you login, you can see which classes you take in each
          building, as well as directions to each class!
        </Text>
      </View>
    </View>
  );
}
