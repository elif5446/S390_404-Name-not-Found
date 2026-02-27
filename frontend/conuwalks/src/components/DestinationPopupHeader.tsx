import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import PlatformIcon from "./ui/PlatformIcon";
import BottomSheetDragHandle from "./ui/BottomSheetDragHandle";
import { styles } from "../styles/DestinationPopup";

interface DestinationHeaderProps {
  isDark: boolean;
  travelMode: "walking" | "driving" | "transit" | "bicycling";
  setTravelMode: (
    mode: "walking" | "driving" | "transit" | "bicycling",
  ) => void;
  getModeDurationLabel: (
    mode: "walking" | "driving" | "transit" | "bicycling",
  ) => string;
  onDismiss: () => void;
  onToggleHeight: () => void;
}

// outside the component to prevent recreation on every render
const TRANSPORT_OPTIONS = [
  { mode: "walking", icon: "directions-walk", iosName: "figure.walk" },
  { mode: "transit", icon: "directions-transit", iosName: "tram.fill" },
  { mode: "bicycling", icon: "directions-bike", iosName: "bicycle" },
  { mode: "driving", icon: "directions-car", iosName: "car.fill" },
] as const;

const DestinationHeader: React.FC<DestinationHeaderProps> = ({
  isDark,
  travelMode,
  setTravelMode,
  getModeDurationLabel,
  onDismiss,
  onToggleHeight,
}) => {
  const campusPink = "#B03060";

  return (
    <TouchableWithoutFeedback onPress={onToggleHeight}>
      <View>
        <BottomSheetDragHandle
          isDark={isDark}
          onToggleHeight={onToggleHeight}
        />

        <View style={styles.header}>
          <View style={[styles.headerSide, styles.headerSideLeft]}>
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Close directions"
              accessibilityHint="Closes the directions panel"
            >
              {Platform.OS === "ios" ? (
                <View
                  style={[
                    styles.closeButtonCircle,
                    { backgroundColor: isDark ? "#00000031" : "#85858522" },
                  ]}
                >
                  <Text
                    style={[
                      styles.closeButtonText,
                      { color: isDark ? "#FFFFFF" : "#333333" },
                    ]}
                  >
                    ✕
                  </Text>
                </View>
              ) : (
                <PlatformIcon
                  materialName="close"
                  iosName="xmark"
                  size={22}
                  color={campusPink}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Directions</Text>
          </View>
          <View style={[styles.headerSide, styles.headerSideRight]} />
        </View>

        <View
          style={[
            styles.transportRow,
            { backgroundColor: isDark ? "#3A3A3C" : "#E6E6E9" },
          ]}
        >
          {TRANSPORT_OPTIONS.map((option) => {
            const active = option.mode === travelMode;
            const displayDuration = getModeDurationLabel(option.mode);
            return (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.transportButton,
                  { backgroundColor: active ? campusPink : "transparent" },
                ]}
                onPress={() => setTravelMode(option.mode)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.mode} mode`}
                accessibilityHint={`Updates routes for ${option.mode} transportation`}
              >
                <PlatformIcon
                  materialName={option.icon}
                  iosName={option.iosName}
                  size={15}
                  color={active ? "#FFFFFF" : isDark ? "#F5F5F5" : "#202020"}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: active ? "#FFFFFF" : isDark ? "#F5F5F5" : "#202020",
                    fontSize: 9,
                    fontWeight: "600",
                  }}
                >
                  {displayDuration}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default memo(DestinationHeader);
