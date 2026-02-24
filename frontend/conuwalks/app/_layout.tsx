import { useColorScheme } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { Stack } from "expo-router";
import { DirectionsProvider } from "@/src/context/DirectionsContext";

export default function RootLayout() {
  const theme = useColorScheme() === "dark" ? MD3DarkTheme : MD3LightTheme;

  return (
<<<<<<< HEAD
    <DirectionsProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{headerShown: false}}/>
        {/* headerShown hides the navigation bar on the top of the screen */}
      </PaperProvider>
    </DirectionsProvider>
=======
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
>>>>>>> ea8111d6be87bce3bd99c1d5b02a34ee94a69185
  );
}
