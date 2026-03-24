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

// helper 1 for complexity, renders the icon based on Platform and selection state
const ToggleIcon = ({ name, iosName, isSelected, activeColor, inactiveColor }: any) => {
  const color = isSelected ? activeColor : inactiveColor;
  if (Platform.OS === "ios") {
    return <SymbolView name={iosName} size={20} tintColor={color} />;
  }
  return <MaterialIcons name={name} size={22} color={color} />;
};

// helper 2 for complexity, the individual toggle button to reduce main loop complexity
const ToggleButton = ({ label, value, current, icon, iosIcon, colors, onPress }: any) => {
  const isSelected = current === value;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${label} View`}
      onPress={() => onPress(value)}
      style={{
        width: 105,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: isSelected ? colors.activeBg : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ToggleIcon
        name={icon}
        iosName={iosIcon}
        isSelected={isSelected}
        activeColor={colors.activeColor}
        inactiveColor={colors.inactiveColor}
      />
      <Text style={{ marginTop: 4, color: isSelected ? colors.activeColor : colors.inactiveColor, fontWeight: "600", fontSize: 11 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
const MapCalendarToggle: React.FC<Props> = ({
  selected,
  onChange,
  visible = true,
}) => {
  const mode = useColorScheme() || "light";

  if (!visible) return null;

  const isIOS = Platform.OS === "ios";
  const isCalendar = selected === "calendar";

// extracted shadow logic
  let shadowOpacity = 0;
  let elevation = 0;

  if (!isCalendar) {
    shadowOpacity = isIOS ? 0.18 : 0.22;
    elevation = isIOS ? 0 : 6;
  }

const colors = {
   background : mode === "dark" ? "#1C1B1F" : "#FFFFFF",
   activeBg : "#B03060",
   activeColor : "#FFFFFF",
   inactiveColor : mode === "dark" ? "#FFFFFF" : "#333333",
  };


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
          backgroundColor: isIOS ? "transparent" : colors.background,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: shadowOpacity,
          shadowRadius: 4,
          elevation: elevation,
        }}
      >


        {isIOS &&
          <BlurView
            intensity={35}
            tint={mode === "dark" ? "dark" : "light"}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          />
        }

        <ToggleButton label="Map" value="map" current={selected} icon="map" iosIcon="map" colors={colors} onPress={onChange} />
        <ToggleButton label="Schedule" value="calendar" current={selected} icon="event" iosIcon="calendar" colors={colors} onPress={onChange} />

      </View>
    </View>
  );
};

export default MapCalendarToggle;
