import { useColorScheme } from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Stack } from "expo-router";
import { DirectionsProvider } from "@/src/context/DirectionsContext";

export default function RootLayout() {
  const theme = useColorScheme() === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return (
    <DirectionsProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{headerShown: false}}/>
        {/* headerShown hides the navigation bar on the top of the screen */}
      </PaperProvider>
    </DirectionsProvider>
  );
}