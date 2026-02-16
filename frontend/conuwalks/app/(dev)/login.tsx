import { View, StyleSheet } from "react-native";
import React from "react";
import GoogleCalendarAuth from "@/src/screens/GoogleCalendarAuth";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    console.log("Auth success, navigating to map.");
    setTimeout(() => {
      router.replace("/(dev)");
      console.log("Nagivation complete.");
    }, 100);
  };

  return (
    <View style={styles.container}>
      <GoogleCalendarAuth onAuthSuccess={handleAuthSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
