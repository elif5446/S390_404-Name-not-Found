import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import PlatformIcon from "./ui/PlatformIcon";
import BottomSheetDragHandle from "./ui/BottomSheetDragHandle";
import { useDirections } from "@/src/context/DirectionsContext";
import TimeSelectorModal from "./TimeSelectorModal";
import { styles } from "../styles/DestinationPopup";
import { isToday } from "../utils/time";

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

  const { timeMode, targetTime, setTimeMode, setTargetTime } = useDirections();
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);

  let timeLabel = "Leave now";
  if (targetTime) {
    const timeString = targetTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const prefix = timeMode === "leave" ? "Leave at" : "Arrive by";

    if (isToday(targetTime)) {
      timeLabel = `${prefix} ${timeString}`;
    } else {
      // append the date if it's not today
      const dateString = targetTime.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      timeLabel = `${prefix} ${timeString}, ${dateString}`;
    }
  }

  return (
    <>
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
                      color: active
                        ? "#FFFFFF"
                        : isDark
                          ? "#F5F5F5"
                          : "#202020",
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

          {travelMode === "transit" && (
            <View
              style={{
                marginTop: 4,
                marginBottom: 4,
                paddingHorizontal: 12,
                alignItems: "flex-start",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: isDark ? "#3A3A3C" : "#E6E6E9",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
                onPress={() => setTimeModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Select departure or arrival time"
              >
                <Text
                  style={{
                    color: isDark ? "#E5E5EA" : "#1C1C1E",
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {timeLabel}
                </Text>
                <PlatformIcon
                  materialName="arrow-drop-down"
                  iosName="chevron.down"
                  size={16}
                  color={campusPink}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* MODAL */}
      <TimeSelectorModal
        visible={isTimeModalVisible}
        onClose={() => setTimeModalVisible(false)}
        initialMode={timeMode}
        initialDate={targetTime}
        onApply={(mode, date) => {
          setTimeMode(mode);
          setTargetTime(date);
          setTimeModalVisible(false);
        }}
      />
    </>
  );
};

export default memo(DestinationHeader);
