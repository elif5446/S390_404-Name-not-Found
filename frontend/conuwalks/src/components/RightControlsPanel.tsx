import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  Button,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserProfilePopup from "./UserProfilePopup";

interface Props {
  userInfo: any;
  onSignOut: () => void;
  userLocation: any;
  onLocationPress: () => void;
  locationLoading?: boolean;
  indoorBuildingId?: string | null;
  isInfoPopupExpanded?: boolean;
}

const RightControlsPanel: React.FC<Props> = ({
  userInfo,
  onSignOut,
  userLocation,
  onLocationPress,
  locationLoading = false,
  indoorBuildingId = null,
  isInfoPopupExpanded = false,
}) => {
  const mode = useColorScheme() || "light";
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  // Don't show location button in certain conditions
  const showLocationButton =
    userLocation && !indoorBuildingId && !isInfoPopupExpanded;

  // Calculate spacing between buttons
  const buttonSize = 44;
  const buttonSpacing = 8;
  const userIconSize = 50;
  const containerPadding = 8;

  return (
    <>
      {/* Controls panel, user icon + location button stacked */}
      <View
        style={{
          position: "absolute",
          right: 16,
          top: Math.max(insets.top + 80, 80),
          alignItems: "center",
          zIndex: 9999,
        }}
        pointerEvents="box-none"
      >
        {/* User Profile Icon */}
        <TouchableOpacity
          onPress={() => setIsProfileExpanded(!isProfileExpanded)}
          style={{
            width: userIconSize,
            height: userIconSize,
            borderRadius: userIconSize / 2,
            backgroundColor:
              Platform.OS === "ios"
                ? "transparent"
                : mode === "dark"
                  ? "#2C2C2E"
                  : "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.18 : 0.22,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            marginBottom: buttonSpacing,
            overflow: "hidden",
          }}
          pointerEvents="auto"
          accessible={true}
          accessibilityLabel="Open user profile"
          accessibilityRole="button"
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={35}
              tint={mode === "dark" ? "dark" : "light"}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            />
          )}
          <MaterialIcons name="person" size={24} color="#B03060" />
        </TouchableOpacity>

        {/* Location Recenter Button */}
        {showLocationButton && (
          <TouchableOpacity
            onPress={onLocationPress}
            activeOpacity={0.85}
            style={{
              position: "relative",
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor:
                Platform.OS === "ios"
                  ? "transparent"
                  : mode === "dark"
                    ? "#2C2C2E"
                    : "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: Platform.OS === "ios" ? 0.18 : 0.22,
              shadowRadius: 4,
              elevation: Platform.OS === "ios" ? 0 : 4,
              marginBottom: buttonSpacing,
            }}
            pointerEvents="auto"
            accessible={true}
            accessibilityLabel="Recenter to your location"
            accessibilityHint="Moves the map camera back to your current location"
          >
            {Platform.OS === "ios" && (
              <BlurView
                intensity={35}
                tint={mode === "dark" ? "dark" : "light"}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
            {locationLoading ? (
              <ActivityIndicator size="small" color="#B03060" />
            ) : Platform.OS === "ios" ? (
              <SymbolView
                name="location.north.fill"
                size={20}
                weight="medium"
                tintColor="#B03060"
              />
            ) : (
              <MaterialIcons name="navigation" size={20} color="#B03060" />
            )}
          </TouchableOpacity>
        )}
      </View>
      <UserProfilePopup
        visible={isProfileExpanded}
        userInfo={userInfo}
        onClose={() => setIsProfileExpanded(false)}
        onSignOut={onSignOut}
      />
    </>
  );
};

export default RightControlsPanel;
