import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { poiBadgeStyles, POI_PALETTE } from "@/src/styles/IndoorPOI.styles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IconLib = "ion" | "mci" | "custom";

interface IconOffset {
  x: number;
  y: number;
}

interface CategoryConfig {
  icon: string;
  iconLib: IconLib;
  bg: string;
  iconColor: string;
}

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BADGE_SIZE = 18;
const SECOND_CUP_SIZE = 12;
const COMPACT_ICON_SIZE = 12;
const ELEVATOR_SIZE = 14;
const STAIRS_S1_SIZE = 15;

const COMPACT_ICON_ROOMS = new Set(["805", "809"]);
const SUB_ROOM_ICON_ROOMS = new Set(["805.01", "805.02"]);

const COLORS = {
  studentUnion: "#6EC16E",
  secondCup: "#C2A661",
  vinhsCafe: "#8D5524",
  food: "#F7C873",
  rose: "#B76E79",
  sky: "#6EC1E4",
  lavender: "#B0A7D1",
  blue: "#3A7BD5",
  cream: "#fff8e1",
} as const;

// Fine-tune icon placement by room number
export const ICON_POSITION_OVERRIDES: Record<string, IconOffset> = {
  // Hall Floor 9
  "9-S1": { x: -15, y: -15 },
  "9-S2": { x: 10, y: 10 },
  "9-S3": { x: 5, y: 15 },
  "9-S4": { x: 10, y: 8 },
  "9-E1": { x: 2, y: -4 },
  "9-ESCALATOR_DOWN_8": { x: 14, y: 0 },
  "9-ESCALATOR_UP_10": { x: 15, y: 0 },
  ESCALATOR_DOWN_8: { x: -1, y: 10 },
  ESCALATOR_UP_10: { x: 3, y: 10 },

  // Hall Floor 1
  "1-S1": { x: 6, y: 6 },
  "1-S2": { x: 6, y: 4 },
  "1-S3": { x: 8, y: 5 },
  "1-S4": { x: 0, y: 0 },
  "1-E1": { x: 10, y: 10 },
  "1-E2": { x: 15, y: 18 },
  "1-ESCALATOR_UP_1": { x: -10, y: 10 },
  "1-ESCALATOR_DOWN_1": { x: 12, y: 12 },
  "1-ESCALATOR_UP_2": { x: 15, y: 12 },
  "1-SECURITY": { x: -3, y: 15 },

  // Hall Floor 2
  HIVE_CAFE: { x: -10, y: -10 },
  "2-ESCALATOR_DOWN_1": { x: 14, y: 20 },
  "2-E2": { x: 15, y: 20 },
  "2-E1": { x: 10, y: 12 },
  "2-ESCALATOR_UP_2": { x: 15, y: 20 },
  "2-S1": { x: 6, y: 8 },
  "2-S2": { x: 10, y: 14 },
  "2-STUDENT_UNION": { x: 10, y: 5 },
  "2-ESCALATOR_DOWN_2": { x: 15, y: -3 },
  "2-ESCALATOR_UP_8": { x: 10, y: 25 },

  // Floor 9 rooms
  "967": { x: 8, y: -4 },
  "913": { x: 6, y: -8 },
  "915": { x: 6, y: -8 },
  "917": { x: 6, y: -8 },
  "921": { x: 6, y: -4 },
  "929": { x: 10, y: -6 },
  "928": { x: 1, y: -6 },
  "931": { x: 2, y: -2 },
  "933": { x: 8, y: -5 },

  // Floor 8 bathroom
  "836": { x: 10, y: 2 },

  // Floor 8 computer labs
  "801": { x: 2, y: -6 },
  "803": { x: 3, y: -6 },
  "811": { x: 5, y: -6 },
  "815": { x: 5, y: -6 },
  "813": { x: 3, y: -6 },
  "817": { x: 8, y: -6 },
  "819": { x: 8, y: -2 },
  "821": { x: 8, y: -2 },
  "823": { x: 8, y: -2 },
  "825": { x: 8, y: -2 },
  "827": { x: 8, y: -2 },
  "829": { x: 8, y: -4 },

  // Floor 8 stairs / elevator
  S1: { x: 8, y: 12 },
  S2: { x: 6, y: 8 },
  S3: { x: 6, y: 8 },
  S4: { x: 5, y: 12 },
  E1: { x: 6, y: 8 },

  // Floor 9 bathrooms, printer, IT help desk
  B1: { x: 0, y: 2 },
  B2: { x: 5, y: 1 },
  PR1: { x: -10, y: 10 },
  IT: { x: 13, y: -5 },

  // Floor 8 escalators
  ESCALATOR_UP_9: { x: 6, y: 10 },
  ESCALATOR_DOWN_2: { x: 6, y: 2 },
};

const CATEGORY_CONFIG: Record<POICategory, CategoryConfig> = {
  STUDENT_UNION: {
    icon: "account-group",
    iconLib: "mci",
    bg: COLORS.studentUnion,
    iconColor: POI_PALETTE.iconDark,
  },
  SECOND_CUP: {
    icon: "coffee",
    iconLib: "mci",
    bg: COLORS.secondCup,
    iconColor: POI_PALETTE.iconDark,
  },
  MICROWAVE: {
    icon: "microwave",
    iconLib: "mci",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  VINHS_CAFE: {
    icon: "coffee",
    iconLib: "mci",
    bg: COLORS.vinhsCafe,
    iconColor: POI_PALETTE.iconDark,
  },
  FOOD: {
    icon: "coffee",
    iconLib: "mci",
    bg: COLORS.food,
    iconColor: POI_PALETTE.iconDark,
  },
  LAB: {
    icon: "desktop-outline",
    iconLib: "ion",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  HELP_DESK: {
    icon: "shield-outline",
    iconLib: "ion",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  ROOM: {
    icon: "business-outline",
    iconLib: "ion",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  STUDY_ROOM: {
    icon: "book-outline",
    iconLib: "ion",
    bg: COLORS.sky,
    iconColor: POI_PALETTE.iconDark,
  },
  STAIRS: {
    icon: "stairs",
    iconLib: "mci",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  ELEVATOR: {
    icon: "elevator",
    iconLib: "mci",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  ESCALATOR: {
    icon: "escalator",
    iconLib: "mci",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  WC_F: {
    icon: "female-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcF,
    iconColor: POI_PALETTE.pink,
  },
  WC_M: {
    icon: "male-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcM,
    iconColor: COLORS.blue,
  },
  WC_A: {
    icon: "accessibility-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcA,
    iconColor: POI_PALETTE.white,
  },
  WC_SHARED: {
    icon: "human-male-female",
    iconLib: "mci",
    bg: COLORS.lavender,
    iconColor: POI_PALETTE.white,
  },
  PRINT: {
    icon: "print-outline",
    iconLib: "ion",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
  IT: {
    icon: "IT_TEXT",
    iconLib: "custom",
    bg: COLORS.rose,
    iconColor: POI_PALETTE.iconDark,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCategoryIcon(iconLib: IconLib, icon: string, size: number, color: string): React.ReactElement {
  if (iconLib === "custom") {
    return <Text style={{ fontWeight: "bold", fontSize: size * 0.85, color }}>IT</Text>;
  }
  if (iconLib === "mci") {
    return <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={size} color={color} />;
  }
  return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}

const ROOM_LABEL_OFFSET_OVERRIDES: Record<string, IconOffset> = {
  "851.03": { x: -9, y: 3 },
  "851.02": { x: -7, y: 3 },
  "851.01": { x: -1, y: 2 },
  "805.03": { x: -4, y: 1 },
  "805.02": { x: 1, y: 0 },
  "805.01": { x: 1, y: 4 },
  "836": { x: -5, y: -6 },
  "852": { x: -4, y: 3 },
};

const SUB_ROOM_EXT_OFFSETS: Record<string, IconOffset> = {
  "01": { x: -6, y: 0 },
  "03": { x: 6, y: 0 },
};

const ZERO_OFFSET: IconOffset = { x: 0, y: 0 };

function getRoomLabelOffset(room: string): IconOffset {
  if (ROOM_LABEL_OFFSET_OVERRIDES[room]) {
    return ROOM_LABEL_OFFSET_OVERRIDES[room];
  }
  const match = room.match(/^(\d+)\.(\d+)$/);
  if (!match) return ZERO_OFFSET;
  return SUB_ROOM_EXT_OFFSETS[match[2]] ?? ZERO_OFFSET;
}

function resolveIconOffset(poi: POI): IconOffset {
  return (
    ICON_POSITION_OVERRIDES[poi.id] ??
    (poi.floor ? ICON_POSITION_OVERRIDES[`${poi.floor}-${poi.room}`] : undefined) ??
    ICON_POSITION_OVERRIDES[poi.room] ??
    ZERO_OFFSET
  );
}

function resolveMarkerSize(poi: POI, defaultSize: number): number {
  if (poi.category === "SECOND_CUP") return SECOND_CUP_SIZE;
  if (COMPACT_ICON_ROOMS.has(poi.room)) return COMPACT_ICON_SIZE;
  if (poi.category === "ELEVATOR") return ELEVATOR_SIZE;
  if (poi.category === "STAIRS" && poi.room === "S1") return STAIRS_S1_SIZE;
  return defaultSize;
}

function resolveSelectionColors(
  selectionType: "source" | "destination" | undefined,
  cfg: CategoryConfig,
): { bg: string; iconColor: string } {
  if (selectionType === "destination") {
    return { bg: POI_PALETTE.pink, iconColor: POI_PALETTE.white };
  }
  if (selectionType === "source") {
    return { bg: COLORS.blue, iconColor: POI_PALETTE.white };
  }
  return { bg: cfg.bg, iconColor: cfg.iconColor };
}

const VERTICAL_TRANSPORT_CATEGORIES = new Set<POICategory>(["STAIRS", "ELEVATOR", "ESCALATOR", "HELP_DESK"]);

const MARKER_Z_INDEX: Partial<Record<POICategory, number>> = {
  ELEVATOR: 40,
  STAIRS: 30,
};

const CAFE_LABEL_CATEGORIES = new Set<POICategory>(["FOOD", "SECOND_CUP", "VINHS_CAFE"]);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RoomLabelProps {
  poi: POI;
  anchorLeft: number;
  anchorTop: number;
  selectionType?: "source" | "destination";
  onPress?: (poi: POI) => void;
}

const RoomLabel: React.FC<RoomLabelProps> = ({ poi, anchorLeft, anchorTop, selectionType, onPress }) => {
  const isSelected = selectionType === "destination" || selectionType === "source";
  const isCompact = poi.room === "851.01";
  const isExtended = poi.room.includes(".");
  const showSubIcon = SUB_ROOM_ICON_ROOMS.has(poi.room);

  const offset = getRoomLabelOffset(poi.room);
  const labelWidth = isCompact ? Math.max(16, Math.round(poi.room.length * 4 + 1)) : Math.max(18, Math.round(poi.room.length * 4.5 + 4));

  const bgColor = selectionType === "destination" ? POI_PALETTE.pink : selectionType === "source" ? COLORS.blue : "transparent";

  const textColor = isSelected ? POI_PALETTE.white : POI_PALETTE.textDark;
  const subIconColor = isSelected ? POI_PALETTE.white : POI_PALETTE.iconDark;
  const subIconBg =
    selectionType === "destination" ? POI_PALETTE.pink : selectionType === "source" ? COLORS.blue : "rgba(255,255,255,0.92)";

  const accessibilityLabel = `${poi.description} – Room ${poi.room}`;

  return (
    <View
      style={{
        position: "absolute",
        left: anchorLeft + offset.x - labelWidth / 2,
        top: anchorTop + offset.y - 10,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={() => onPress?.(poi)}
        activeOpacity={0.75}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={{
          minHeight: 12,
          minWidth: labelWidth,
          borderRadius: 4,
          paddingHorizontal: isCompact ? 0 : 1,
          paddingVertical: 0,
          backgroundColor: bgColor,
          borderWidth: isSelected ? 1 : 0,
          borderColor: POI_PALETTE.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: isCompact ? 6 : isExtended ? 6.5 : 7,
            fontWeight: "700",
            color: textColor,
          }}
        >
          {poi.room}
        </Text>
      </TouchableOpacity>

      {showSubIcon && (
        <TouchableOpacity
          onPress={() => onPress?.(poi)}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          style={{
            marginTop: poi.room === "805.02" ? -1 : 1,
            width: 10,
            height: 10,
            borderRadius: 5,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: subIconBg,
          }}
        >
          <Ionicons name="desktop-outline" size={7} color={subIconColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface CafeLabelProps {
  poi: POI;
}

const CafeLabel: React.FC<CafeLabelProps> = ({ poi }) => (
  <Text
    style={{
      marginTop: 2,
      fontSize: poi.category === "SECOND_CUP" ? 8 : 10,
      fontWeight: "bold",
      color: POI_PALETTE.textDark,
      textAlign: "center",
      backgroundColor: COLORS.cream,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      overflow: "hidden",
      elevation: 2,
    }}
  >
    {poi.label}
  </Text>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const POIBadge: React.FC<Props> = ({ poi, left, top, selectionType, onPress, size = DEFAULT_BADGE_SIZE }) => {
  const cfg = CATEGORY_CONFIG[poi.category];
  const { bg, iconColor } = resolveSelectionColors(selectionType, cfg);

  const isRoom = poi.category === "ROOM";
  const isLab = poi.category === "LAB";
  const isVerticalTransport = VERTICAL_TRANSPORT_CATEGORIES.has(poi.category);
  const isCompactRoom = COMPACT_ICON_ROOMS.has(poi.room);
  const isSelected = selectionType === "destination" || selectionType === "source";

  const anchorLeft = left + size / 2;
  const anchorTop = top + size / 2;

  // Pure room labels (non-lab) get their own simpler rendering path
  if (isRoom && !isLab) {
    return <RoomLabel poi={poi} anchorLeft={anchorLeft} anchorTop={anchorTop} selectionType={selectionType} onPress={onPress} />;
  }

  const markerSize = resolveMarkerSize(poi, size);
  const markerIconSize = poi.category === "SECOND_CUP" || isCompactRoom ? 8 : markerSize * 0.56;
  const radius = markerSize * 0.42;

  const hasManualLabOffset = isLab && Object.prototype.hasOwnProperty.call(ICON_POSITION_OVERRIDES, poi.room);
  const labShift = isLab && !hasManualLabOffset ? { x: 10, y: -10 } : ZERO_OFFSET;
  const transportShift = isVerticalTransport ? { x: -12, y: -12 } : ZERO_OFFSET;
  const markerShift = {
    x: poi.room === "809" ? 16 : 0,
    y: poi.room === "836" ? -6 : poi.room === "809" ? -3 : 0,
  };
  const manualOffset = resolveIconOffset(poi);
  const iconBadgeShiftDown = poi.room === "805" ? 5 : poi.room === "809" ? 1 : 0;

  const hideMarker = isCompactRoom && !isRoom;
  const markerStyle = hideMarker
    ? { width: 1, height: 1, borderRadius: 0, backgroundColor: "transparent" }
    : {
        width: markerSize,
        height: markerSize,
        borderRadius: radius,
        backgroundColor: bg,
        marginTop: iconBadgeShiftDown,
      };

  const showCafeLabel = (CAFE_LABEL_CATEGORIES.has(poi.category) && poi.showLabel) || poi.category === "VINHS_CAFE";

  const markerZIndex = MARKER_Z_INDEX[poi.category] ?? 10;
  const hitSlop = isVerticalTransport ? { top: 14, bottom: 14, left: 14, right: 14 } : { top: 8, bottom: 8, left: 8, right: 8 };

  return (
    <View
      style={{
        position: "absolute",
        left: anchorLeft - markerSize / 2 + markerShift.x + transportShift.x + labShift.x + manualOffset.x,
        top: anchorTop - markerSize / 2 - 3 + markerShift.y + transportShift.y + labShift.y + manualOffset.y,
        alignItems: "center",
        zIndex: markerZIndex,
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={() => onPress?.(poi)}
        activeOpacity={0.75}
        hitSlop={hitSlop}
        style={[poiBadgeStyles.badge, markerStyle, isSelected && poiBadgeStyles.highlighted]}
        accessibilityLabel={`${poi.description} – Room ${poi.room}`}
        accessibilityRole="button"
      >
        {!hideMarker ? renderCategoryIcon(cfg.iconLib, cfg.icon, markerIconSize, iconColor) : null}
      </TouchableOpacity>

      {showCafeLabel && <CafeLabel poi={poi} />}
    </View>
  );
};

export default POIBadge;
