import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";

interface Props {
  selected: "map" | "calendar";
  onChange: (v: "map" | "calendar") => void;
  visible?: boolean; // when false, component renders null
}

const MapCalendarToggle: React.FC<Props> = ({
  selected,
  onChange,
  visible = true,
}) => {
  const mode = useColorScheme() || "light";

  if (!visible) return null;

  const background = mode === "dark" ? "#1C1B1F" : "#FFFFFF";
  const activeBg = "#B03060";
  const activeColor = "#FFFFFF";
  const inactiveColor = mode === "dark" ? "#FFFFFF" : "#333333";

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 24,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
      pointerEvents="box-none"
      accessible={true}
      accessibilityRole="tablist"
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 32,
          padding: 4,
          backgroundColor: Platform.OS === "ios" ? "transparent" : background,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          shadowOpacity: selected === "calendar" ? 0 : 0.18,
          elevation: selected === "calendar" ? 0 : 6,
        }}
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

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: selected === "map" }}
          accessibilityLabel="Map View"
          onPress={() => onChange("map")}
          style={{
            width: 105,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 22,
            backgroundColor: selected === "map" ? activeBg : "transparent",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Platform.OS === "ios" ? (
            <SymbolView
              name="map"
              size={20}
              tintColor={selected === "map" ? activeColor : inactiveColor}
            />
          ) : (
            <MaterialIcons
              name="map"
              size={22}
              color={selected === "map" ? activeColor : inactiveColor}
            />
          )}
          <Text
            style={{
              marginTop: 4,
              color: selected === "map" ? activeColor : inactiveColor,
              fontWeight: "600",
              fontSize: 11,
            }}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: selected === "calendar" }}
          accessibilityLabel="Schedule View"
          onPress={() => onChange("calendar")}
          style={{
            width: 105,
            marginLeft: 6,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 22,
            backgroundColor: selected === "calendar" ? activeBg : "transparent",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Platform.OS === "ios" ? (
            <SymbolView
              name="calendar"
              size={20}
              tintColor={selected === "calendar" ? activeColor : inactiveColor}
            />
          ) : (
            <MaterialIcons
              name="event"
              size={22}
              color={selected === "calendar" ? activeColor : inactiveColor}
            />
          )}
          <Text
            style={{
              marginTop: 4,
              color: selected === "calendar" ? activeColor : inactiveColor,
              fontWeight: "600",
              fontSize: 11,
            }}
          >
            Schedule
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapCalendarToggle;
