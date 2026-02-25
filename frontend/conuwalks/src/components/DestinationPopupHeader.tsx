import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SFSymbol } from "expo-symbols";
import { styles } from "../styles/DestinationPopup";

const PlatformIcon = ({
  materialName,
  iosName,
  size,
  color,
}: {
  materialName: any;
  iosName: SFSymbol;
  size: number;
  color: string;
}) => {
  if (Platform.OS === "ios")
    return (
      <SymbolView
        name={iosName}
        size={size}
        weight="medium"
        tintColor={color}
      />
    );
  return <MaterialIcons name={materialName} size={size} color={color} />;
};

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
        <View style={styles.dragHandleTouchArea}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isDark ? "#7A7A7C" : "#B8B8BC" },
            ]}
          />
        </View>

        <View style={styles.header}>
          <View style={[styles.headerSide, styles.headerSideLeft]}>
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Close directions"
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
          {(
            [
              { mode: "walking", icon: "directions-walk" },
              { mode: "transit", icon: "directions-transit" },
              { mode: "bicycling", icon: "directions-bike" },
              { mode: "driving", icon: "directions-car" },
            ] as const
          ).map((option) => {
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
              >
                <PlatformIcon
                  materialName={option.icon as any}
                  iosName={
                    option.mode === "walking"
                      ? "figure.walk"
                      : option.mode === "transit"
                        ? "tram.fill"
                        : option.mode === "bicycling"
                          ? "bicycle"
                          : "car.fill"
                  }
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
