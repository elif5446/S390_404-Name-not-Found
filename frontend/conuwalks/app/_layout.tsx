import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Stack } from "expo-router";
import { DirectionsProvider } from "@/src/context/DirectionsContext";


function AppWrapper() {
  const posthog = usePostHog();
  const appState = useRef(AppState.currentState);
  const theme = useColorScheme() === 'dark' ? MD3DarkTheme : MD3LightTheme;
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`[POSTHOG DEBUG] Transition: ${appState.current} -> ${nextAppState}`);
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        posthog.capture('app_reopened_to_skip', { // Failure: Bypass
          timestamp: new Date().toISOString()
        });
        posthog.flush();
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [posthog]);
  return <DirectionsProvider>
    <PaperProvider theme={theme}>
      <Stack screenOptions={{headerShown: false}}/>
      {/* headerShown hides the navigation bar on the top of the screen */}
    </PaperProvider>
  </DirectionsProvider>
}
export default function RootLayout() {
  return (
    <PostHogProvider 
      apiKey="phc_At7tyPZSQwjffq1Uj35XDnUZqAbt5ZTWAc6SsMXbanw" 
      options={{
        host: "https://us.i.posthog.com",
        "enableSessionReplay": true,
        captureAppLifecycleEvents: true // Tracks when app opens/closes
      }}
      autocapture={{
          captureTouches: true, // Tracks taps (misclicks/rage clicks)
          captureScreens: true // Tracks navigation between screens
      }}
    >
      <AppWrapper/>
    </PostHogProvider>
  );
}
