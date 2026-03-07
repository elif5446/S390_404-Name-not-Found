import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { poiBadgeStyles, POI_PALETTE } from "@/src/styles/IndoorPOI.styles";

//Category → icon name + background colour 
const CATEGORY_CONFIG: Record<
  POICategory,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; iconColor: string }
> = {
  LAB: {
    icon: "desktop-outline",
    bg: POI_PALETTE.labBg,
    iconColor: POI_PALETTE.iconDark,
  },
  ROOM: {
    icon: "business-outline",
    bg: POI_PALETTE.wcShared,
    iconColor: POI_PALETTE.iconDark,
  },
  WC_F: {
    icon: "female-outline",
    bg: POI_PALETTE.wcF,
    iconColor: POI_PALETTE.pink,
  },
  WC_M: {
    icon: "male-outline",
    bg: POI_PALETTE.wcM,
    iconColor: "#3A7BD5",
  },
  WC_A: {
    icon: "accessibility-outline",
    bg: POI_PALETTE.wcA,
    iconColor: POI_PALETTE.white,
  },
  WC_SHARED: {
    icon: "people-outline",
    bg: POI_PALETTE.wcShared,
    iconColor: POI_PALETTE.iconDark,
  },
  PRINT: {
    icon: "print-outline",
    bg: POI_PALETTE.printBg,
    iconColor: POI_PALETTE.iconDark,
  },
  IT: {
    icon: "help-circle-outline",
    bg: POI_PALETTE.itBg,
    iconColor: POI_PALETTE.iconDark,
  },
};

interface Props {
  poi: POI;
  /** Absolute pixel position within the parent map container */
  left: number;
  top: number;
  /** Whether this POI is selected as source or destination */
  selectionType?: "source" | "destination";
  onPress?: (poi: POI) => void;
  size?: number;
}

const POIBadge: React.FC<Props> = ({
  poi,
  left,
  top,
  selectionType,
  onPress,
  size = 34,
}) => {
  const cfg = CATEGORY_CONFIG[poi.category];
  const isDestination = selectionType === "destination";
  const isSource = selectionType === "source";
  const bg = isDestination ? POI_PALETTE.pink : isSource ? "#3A7BD5" : cfg.bg;
  const iconColor = isDestination || isSource ? POI_PALETTE.white : cfg.iconColor;
  const radius = size * 0.294;

  return (
    <View
      style={{ position: "absolute", left, top, alignItems: "center" }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={() => onPress?.(poi)}
        activeOpacity={0.75}
        style={[
          poiBadgeStyles.badge,
          { width: size, height: size, borderRadius: radius, backgroundColor: bg },
          (isDestination || isSource) && poiBadgeStyles.highlighted,
        ]}
        accessibilityLabel={`${poi.description} – Room ${poi.room}`}
        accessibilityRole="button"
      >
        <Ionicons name={cfg.icon} size={size * 0.52} color={iconColor} />
      </TouchableOpacity>

      <View
        style={{
          marginTop: 3,
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: 6,
          paddingHorizontal: 4,
          paddingVertical: 1,
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: "700", color: POI_PALETTE.textDark }}>
          {poi.room}
        </Text>
      </View>
    </View>
  );
};

export default POIBadge;
