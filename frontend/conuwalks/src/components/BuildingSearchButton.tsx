import React from "react";
import { TouchableOpacity, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";

interface BuildingSearchButtonProps {
  onPress: () => void;
  buttonSize: number;
  mode: string;
  buttonSpacing: number;
}

const BuildingSearchButton: React.FC<BuildingSearchButtonProps> = ({
  onPress,
  buttonSize,
  mode,
  buttonSpacing,
}) => {
  const isIOS = Platform.OS === "ios";
  const backgroundColor = isIOS
    ? "transparent"
    : mode === "dark"
      ? "#2C2C2E"
      : "#FFFFFF";
  const shadowOpacity = isIOS ? 0.18 : 0.22;
  const elevation = isIOS ? 0 : 4;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: "relative",
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize / 2,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity,
        shadowRadius: 4,
        elevation,
        marginBottom: buttonSpacing,
      }}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Open building search"
      accessibilityHint="Tap to search for a building and view its info"
    >
      {isIOS && (
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
      <MaterialIcons name="search" size={24} color="#B03060" />
    </TouchableOpacity>
  );
};

export default BuildingSearchButton;
