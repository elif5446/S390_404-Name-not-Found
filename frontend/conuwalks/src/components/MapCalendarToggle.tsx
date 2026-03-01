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

interface Props {
  selected: "map" | "calendar";
  onChange: (v: "map" | "calendar") => void;
  visible?: boolean; // when false, component renders null
}

const MapCalendarToggle: React.FC<Props> = ({ selected, onChange, visible = true }) => {
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
        left: "50%",
        bottom: 24,
        transform: [{ translateX: -65 }],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 28,
        padding: 6,
        backgroundColor: background,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      }}
      accessible={true}
      accessibilityRole="tablist"
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: selected === "map" }}
        accessibilityLabel="Map View"
        onPress={() => onChange("map")}
        style={{
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
          <SymbolView name="map" size={20} tintColor={selected === "map" ? activeColor : inactiveColor} />
        ) : (
          <MaterialIcons name="map" size={22} color={selected === "map" ? activeColor : inactiveColor} />
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
          <SymbolView name="calendar" size={20} tintColor={selected === "calendar" ? activeColor : inactiveColor} />
        ) : (
          <MaterialIcons name="event" size={22} color={selected === "calendar" ? activeColor : inactiveColor} />
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
  );
};

export default MapCalendarToggle;


