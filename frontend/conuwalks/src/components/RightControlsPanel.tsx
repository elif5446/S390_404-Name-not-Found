import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  useColorScheme,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserProfilePopup from "./UserProfilePopup";
import BuildingSearchButton from "../components/BuildingSearchButton";
import { UserInfo } from "@/src/utils/tokenStorage";
import { LatLng } from "react-native-maps";

interface Props {
  userInfo: UserInfo | null;
  onSignOut: () => void;
  userLocation: LatLng | null;
  onLocationPress: () => void;
  locationLoading?: boolean;
  indoorBuildingId?: string | null;
  isInfoPopupExpanded?: boolean;
  handleOpenBuildingSearch: () => void;
  isDirections: boolean;
  isNavigation: boolean;
}
// helper for complexity
const GlassBackground: React.FC<{ mode: "light" | "dark"; borderRadius: number }> = ({ mode, borderRadius }) => {
  if (Platform.OS !== "ios") return null;
  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius,
        overflow: "hidden",
      }}
    >
      <BlurView intensity={35} tint={mode === "dark" ? "dark" : "light"} style={{ flex: 1 }} />
    </View>
  );
};

const RightControlsPanel: React.FC<Props> = ({
  userInfo,
  onSignOut,
  userLocation,
  onLocationPress,
  locationLoading = false,
  indoorBuildingId = null,
  isInfoPopupExpanded = false,
  handleOpenBuildingSearch,
  isDirections,
  isNavigation,
}) => {
  const mode = useColorScheme() || "light";
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  // Don't show location button in certain conditions
  const showLocationButton = userLocation && !indoorBuildingId && !isInfoPopupExpanded;

  // Calculate spacing between buttons
  const buttonSize = 50;
  const buttonSpacing = 12;
  const userIconSize = 50;
  const isIOS = Platform.OS === "ios";
  const backgroundColor = isIOS
    ? "transparent"
    : mode === "dark"
      ? "#2C2C2E"
      : "#FFFFFF";

  const style: ViewStyle = {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isIOS ? 0.18 : 0.22,
    shadowRadius: 4,
    elevation: isIOS ? 0 : 4,
    marginBottom: buttonSpacing,
  };

  const locationIcon = locationLoading ? (
    <ActivityIndicator size="small" color="#B03060" />
  ) : isIOS ? (
    <SymbolView
      name="location.north.fill"
      size={20}
      weight="medium"
      tintColor="#B03060"
    />
  ) : (
    <MaterialIcons name="navigation" size={20} color="#B03060" />
  );

  return (
    <>
      {/* Controls panel, user icon + location button + search button stacked */}
      <View
        style={{
          position: "absolute",
          right: 16,
          top: Math.max(insets.top + 80, 80),
          alignItems: "center",
          //zIndex: 9999,
        }}
        pointerEvents="box-none"
      >
        {/* User Profile Icon */}
        {!isDirections && (
          <>
            {!isNavigation && (
              <TouchableOpacity
                onPress={() => setIsProfileExpanded(!isProfileExpanded)}
                style={[
                  style,
                  {
                    width: userIconSize,
                    height: userIconSize,
                    borderRadius: userIconSize / 2,
                  },
                ]}
                pointerEvents="auto"
                accessible={true}
                accessibilityLabel="Open user profile"
                accessibilityRole="button"
              >
                <GlassBackground mode={mode} />
                <MaterialIcons name="person" size={24} color="#B03060" />
              </TouchableOpacity>
            )}

            {/* Location Recenter Button */}
            {showLocationButton && (
              <TouchableOpacity
                onPress={onLocationPress}
                activeOpacity={0.85}
                style={[
                  style,
                  {
                    position: "relative",
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: buttonSize / 2,
                  },
                ]}
                pointerEvents="auto"
                accessible={true}
                accessibilityLabel="Recenter to your location"
                accessibilityHint="Moves the map camera back to your current location"
              >
                <GlassBackground mode={mode} />
                {locationIcon}
              </TouchableOpacity>
            )}
            {/* Search Button */}
            {!isNavigation && (
              <BuildingSearchButton
                onPress={handleOpenBuildingSearch}
                buttonSize={buttonSize}
                mode={mode}
                buttonSpacing={buttonSpacing}
              />
            )}
          </>
        )}
      </View>
      <UserProfilePopup visible={isProfileExpanded} userInfo={userInfo} onClose={() => setIsProfileExpanded(false)} onSignOut={onSignOut} />
    </>
  );
};

export default RightControlsPanel;
