import {
  View,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import CampusMap from "@/src/components/CampusMap";
import StatusGradient from "@/src/components/StatusGradient";
import SegmentedToggle from "@/src/components/SegmentedToggle";
import { clearTokens, getUserInfo } from "@/src/utils/tokenStorage";
import { styles } from "@/src/styles/home";
import { useDirections } from "@/src/context/DirectionsContext";

import MapScheduleToggle from "@/src/components/MapScheduleToggle";
import ScheduleView from "@/src/components/ScheduleView";

export default function DevHomeScreen() {
  const [campus, setCampus] = useState<"SGW" | "Loyola">("SGW");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isNavigationActive } = useDirections();

  const [isInfoPopupVisible, setIsInfoPopupVisible] = useState(false);
  const [selectedView, setSelectedView] = useState<"map" | "calendar">("map");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getUserInfo();
      console.log("Loaded user info:", info);
      setUserInfo(info);
    } catch (error) {
      console.error("Error loading user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Signing out...");
            await clearTokens();
            router.replace("/(dev)/login");
            console.log("Sign out complete, navigated to login");
          } catch (error) {
            console.error("Error during sign out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View key={campus} style={styles.mapWrapper}>
        {selectedView === "map" && (
          <>
            {campus === "SGW" && (
              <CampusMap
                initialLocation={{ latitude: 45.49599, longitude: -73.57854 }}
                onInfoPopupExpansionChange={(isExpanded) => {
                  setIsInfoPopupVisible(isExpanded);
                }}
                userInfo={userInfo}
                onSignOut={handleSignOut}
              />
            )}
            {campus === "Loyola" && (
              <CampusMap
                initialLocation={{ latitude: 45.45846, longitude: -73.63999 }}
                onInfoPopupExpansionChange={(isExpanded) => {
                  setIsInfoPopupVisible(isExpanded);
                }}
                userInfo={userInfo}
                onSignOut={handleSignOut}
              />
            )}
          </>
        )}

        {selectedView === "calendar" && <ScheduleView onNavigateToClass={() => setSelectedView("map")} />}
      </View>

      <StatusGradient />
      {!isNavigationActive && selectedView === "map" && (
        <SegmentedToggle campus={campus} setCampus={setCampus} />
      )}
      {!isNavigationActive && (
        <MapScheduleToggle
          selected={selectedView}
          onChange={(v) => setSelectedView(v)}
          visible={!isInfoPopupVisible}
        />
      )}

      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
    </View>
  );
}
