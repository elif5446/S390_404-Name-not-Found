import { View, StyleSheet, StatusBar, Button, Alert } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import CampusMap from "@/src/components/CampusMap";
import StatusGradient from "@/src/components/StatusGradient";
import SegmentedToggle from "@/src/components/SegmentedToggle";
import { clearTokens } from "@/src/utils/tokenStorage";

export default function HomeScreen() {
  const [campus, setCampus] = useState<"SGW" | "Loyola">("SGW");
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearTokens();
          router.replace("/(dev)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View key={campus} style={styles.mapWrapper}>
        {campus === "SGW" && (
          <CampusMap
            initialLocation={{ latitude: 45.49599, longitude: -73.57854 }}
          />
        )}
        {campus === "Loyola" && (
          <CampusMap
            initialLocation={{ latitude: 45.45846, longitude: -73.63999 }}
          />
        )}
      </View>

      <StatusGradient />
      <SegmentedToggle campus={campus} setCampus={setCampus} />

      {/* Sign out button */}
      <View style={styles.signOutButton}>
        <Button title="Sign Out" onPress={handleSignOut} color="#ff4444" />
      </View>

      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  signOutButton: {
    position: "absolute",
    bottom: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
