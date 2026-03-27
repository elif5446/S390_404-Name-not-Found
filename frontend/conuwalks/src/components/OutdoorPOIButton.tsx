import React from "react";
import { TouchableOpacity, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";

interface OutdoorPOIButtonProps {
    onPress: () => void;
    buttonSize: number;
    mode: string;
    buttonSpacing: number;
}

const OutdoorPOIButton: React.FC<OutdoorPOIButtonProps> = ({
    onPress,
    buttonSize,
    mode,
    buttonSpacing
}) => {
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
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open outdoor points of interest"
            accessibilityHint="Tap to view outdoor POIs such as restaurants, banks, and more"
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
            <MaterialIcons name="favorite" size={24} color="#B03060" />
        </TouchableOpacity>
    );
};

export default OutdoorPOIButton;
