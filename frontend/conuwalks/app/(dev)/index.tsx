import {
  View,
  StyleSheet,
  StatusBar,
  Button,
  Alert,
  Image,
  Text,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import CampusMap from "@/src/components/CampusMap";
import StatusGradient from "@/src/components/StatusGradient";
import SegmentedToggle from "@/src/components/SegmentedToggle";
import { clearTokens, getUserInfo } from "@/src/utils/tokenStorage";
import { styles } from "@/src/styles/index";

export default function HomeScreen() {
  const [campus, setCampus] = useState<"SGW" | "Loyola">("SGW");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

      {/* User profile and sign out button */}
      <View style={styles.userContainer}>
        {userInfo?.photo ? (
          <Image source={{ uri: userInfo.photo }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>
              {userInfo?.name?.charAt(0) || "U"}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          {userInfo?.name && (
            <Text style={styles.userName} numberOfLines={1}>
              {userInfo.name}
            </Text>
          )}
          <Button title="Sign Out" onPress={handleSignOut} color="#ff4444" />
        </View>
      </View>

      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
    </View>
  );
}
