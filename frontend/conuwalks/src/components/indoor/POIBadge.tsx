import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
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
  WC_F: {
    icon: "person-outline",
    bg: POI_PALETTE.wcF,
    iconColor: POI_PALETTE.pink,
  },
  WC_M: {
    icon: "person-outline",
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
  /** Whether this POI is the selected routing destination */
  highlighted?: boolean;
  onPress?: (poi: POI) => void;
  size?: number;
}

const POIBadge: React.FC<Props> = ({
  poi,
  left,
  top,
  highlighted = false,
  onPress,
  size = 34,
}) => {
  const cfg = CATEGORY_CONFIG[poi.category];
  const bg = highlighted ? POI_PALETTE.pink : cfg.bg;
  const iconColor = highlighted ? POI_PALETTE.white : cfg.iconColor;
  const radius = size * 0.294;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(poi)}
      activeOpacity={0.75}
      style={[
        poiBadgeStyles.badge,
        { position: "absolute", left, top, width: size, height: size, borderRadius: radius, backgroundColor: bg },
        highlighted && poiBadgeStyles.highlighted,
      ]}
      accessibilityLabel={`${poi.description} – Room ${poi.room}`}
      accessibilityRole="button"
    >
      <Ionicons name={cfg.icon} size={size * 0.56} color={iconColor} />
    </TouchableOpacity>
  );
};

export default POIBadge;
