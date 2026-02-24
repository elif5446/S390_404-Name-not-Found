import { useColorScheme } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { Stack } from "expo-router";
import { DirectionsProvider } from "@/src/context/DirectionsContext";

export default function RootLayout() {
  const theme = useColorScheme() === "dark" ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <DirectionsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DirectionsProvider>
    </PaperProvider>
  );
}
