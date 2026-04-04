import React from "react";
import { TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";

interface OutdoorPOIButtonProps {
  onPress: () => void;
  buttonSize: number;
  mode: string;
  buttonSpacing: number;
}

const OutdoorPOIButton: React.FC<OutdoorPOIButtonProps> = ({ onPress, buttonSize, mode, buttonSpacing }) => {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          marginBottom: buttonSpacing,
          marginTop: Platform.select({
            ios: insets.top + 12,
            android: 24,
          }),
        },

        Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
          },
          android: {
            elevation: 6,
            backgroundColor: mode === "dark" ? "#2C2C2E" : "#FFFFFF",
          },
        }),
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Open outdoor points of interest"
      accessibilityHint="Tap to view outdoor POIs such as restaurants, banks, and more"
      testID="outdoor-poi-button"
    >
      {Platform.OS === "ios" && <BlurView intensity={35} tint={mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />}
      <MaterialIcons name="favorite" size={24} color="#B03060" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

export default OutdoorPOIButton;
