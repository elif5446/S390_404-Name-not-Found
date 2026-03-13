import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { poiBadgeStyles, POI_PALETTE } from "@/src/styles/IndoorPOI.styles";

//Category: icon name + background colour 
type IconLib = "ion" | "mci";

const CATEGORY_CONFIG: Record<
  POICategory,
  {
    icon: string;
    iconLib: IconLib;
    bg: string;
    iconColor: string;
  }
> = {
  LAB: {
    icon: "desktop-outline",
    iconLib: "ion",
    bg: POI_PALETTE.labBg,
    iconColor: POI_PALETTE.iconDark,
  },
  ROOM: {
    icon: "business-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcShared,
    iconColor: POI_PALETTE.iconDark,
  },
  STAIRS: {
    icon: "stairs",
    iconLib: "mci",
    bg: POI_PALETTE.stairsBg,
    iconColor: POI_PALETTE.iconDark,
  },
  ELEVATOR: {
    icon: "elevator",
    iconLib: "mci",
    bg: POI_PALETTE.elevatorBg,
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
    iconColor: "#3A7BD5",
  },
  WC_A: {
    icon: "accessibility-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcA,
    iconColor: POI_PALETTE.white,
  },
  WC_SHARED: {
    icon: "people-outline",
    iconLib: "ion",
    bg: POI_PALETTE.wcShared,
    iconColor: POI_PALETTE.iconDark,
  },
  PRINT: {
    icon: "print-outline",
    iconLib: "ion",
    bg: POI_PALETTE.printBg,
    iconColor: POI_PALETTE.iconDark,
  },
  IT: {
    icon: "help-circle-outline",
    iconLib: "ion",
    bg: POI_PALETTE.itBg,
    iconColor: POI_PALETTE.iconDark,
  },
};

function renderCategoryIcon(
  iconLib: IconLib,
  icon: string,
  size: number,
  color: string,
) {
  if (iconLib === "mci") {
    return (
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }

  return (
    <Ionicons
      name={icon as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
    />
  );
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

function getRoomLabelOffset(room: string): { x: number; y: number } {
  const overrides: Record<string, { x: number; y: number }> = {
    "851.03": { x: -9, y: 3 },
    "851.02": { x: -7, y: 3 },
    "851.01": { x: -1, y: 2 },
    "805.03": { x: -4, y: 1 },
    "805.02": { x: 1, y: 0 },
    "805.01": { x: 1, y: 4 },
    "836": { x: 2, y: 8 }, 
    "852": { x: -4, y: 3 },
  };

  if (overrides[room]) return overrides[room];

  const match = room.match(/^(\d+)\.(\d+)$/);
  if (!match) return { x: 0, y: 0 };

  const ext = match[2];
  if (ext === "01") return { x: -6, y: 0 };
  if (ext === "03") return { x: 6, y: 0 };
  return { x: 0, y: 0 };
}

const POIBadge: React.FC<Props> = ({
  poi,
  left,
  top,
  selectionType,
  onPress,
  size = 18,
}) => {
  const cfg = CATEGORY_CONFIG[poi.category];
  const isRoom = poi.category === "ROOM";
  const isVerticalTransport = poi.category === "STAIRS" || poi.category === "ELEVATOR";
  const isCompactIconOnly = !isRoom && (poi.room === "805" || poi.room === "809");
  const hideTopMarker = !isRoom && (poi.room === "805" || poi.room === "809");
  const isDestination = selectionType === "destination";
  const isSource = selectionType === "source";
  const bg = isDestination ? POI_PALETTE.pink : isSource ? "#3A7BD5" : cfg.bg;
  const iconColor = isDestination || isSource ? POI_PALETTE.white : cfg.iconColor;
  const markerSize = isCompactIconOnly ? 12 : size;
  const markerIconSize = isCompactIconOnly ? 8 : markerSize * 0.56;
  const radius = markerSize * 0.42;
  const anchorLeft = left + size / 2;
  const anchorTop = top + size / 2;
  const isCompactRoomLabel = poi.room === "851.01";
  const iconBadgeShiftDown = poi.room === "805" ? 5 : poi.room === "809" ? 1 : 0;
  const markerShiftUp = poi.room === "836" ? -6 : poi.room === "809" ? -3 : 0;
  const markerShiftRight = poi.room === "836" ? 2 : poi.room === "809" ? 16 : 0;
  const markerZIndex = poi.category === "ELEVATOR" ? 40 : poi.category === "STAIRS" ? 30 : 10;
  const markerHitSlop = isVerticalTransport
    ? { top: 14, bottom: 14, left: 14, right: 14 }
    : { top: 8, bottom: 8, left: 8, right: 8 };

  if (isRoom) {
    const offset = getRoomLabelOffset(poi.room);
    const isExtendedRoom = poi.room.includes(".");
    const showSubRoomIcon = poi.room === "805.01" || poi.room === "805.02";
    const estimatedLabelWidth = isCompactRoomLabel
      ? Math.max(16, Math.round(poi.room.length * 4 + 1))
      : Math.max(18, Math.round(poi.room.length * 4.5 + 4));
    const roomLabelBg = isDestination
      ? POI_PALETTE.pink
      : isSource
        ? "#3A7BD5"
        : "transparent";
    const roomLabelColor = isDestination || isSource ? POI_PALETTE.white : POI_PALETTE.textDark;

    return (
      <View
        style={{
          position: "absolute",
          left: anchorLeft + offset.x - estimatedLabelWidth / 2,
          top: anchorTop + offset.y - 10,
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => onPress?.(poi)}
          activeOpacity={0.75}
          accessibilityLabel={`${poi.description} – Room ${poi.room}`}
          accessibilityRole="button"
          style={{
            minHeight: 12,
            minWidth: estimatedLabelWidth,
            borderRadius: 4,
            paddingHorizontal: isCompactRoomLabel ? 0 : 1,
            paddingVertical: 0,
            backgroundColor: roomLabelBg,
            borderWidth: isDestination || isSource ? 1 : 0,
            borderColor: POI_PALETTE.white,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: isCompactRoomLabel ? 6 : isExtendedRoom ? 6.5 : 7,
              fontWeight: "700",
              color: roomLabelColor,
            }}
          >
            {poi.room}
          </Text>
        </TouchableOpacity>

        {showSubRoomIcon ? (
          <TouchableOpacity
            onPress={() => onPress?.(poi)}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel={`${poi.description} – Room ${poi.room}`}
            accessibilityRole="button"
            style={{
              marginTop: poi.room === "805.02" ? -1 : 1,
              width: 10,
              height: 10,
              borderRadius: 5,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDestination
                ? POI_PALETTE.pink
                : isSource
                  ? "#3A7BD5"
                  : "rgba(255,255,255,0.92)",
            }}
          >
            <Ionicons
              name="desktop-outline"
              size={7}
              color={isDestination || isSource ? POI_PALETTE.white : POI_PALETTE.iconDark}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        left: anchorLeft - markerSize / 2 + markerShiftRight,
        top: anchorTop - markerSize / 2 - 3 + markerShiftUp,
        alignItems: "center",
        zIndex: markerZIndex,
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={() => onPress?.(poi)}
        activeOpacity={0.75}
        hitSlop={markerHitSlop}
        style={[
          poiBadgeStyles.badge,
          isRoom
            ? {
                width: 1,
                height: 1,
                borderRadius: 0,
                backgroundColor: "transparent",
              }
            : hideTopMarker
              ? {
                  width: 1,
                  height: 1,
                  borderRadius: 0,
                  backgroundColor: "transparent",
                }
            : {
                width: markerSize,
                height: markerSize,
                borderRadius: radius,
                backgroundColor: bg,
                marginTop: iconBadgeShiftDown,
              },
          (isDestination || isSource) && poiBadgeStyles.highlighted,
        ]}
        accessibilityLabel={`${poi.description} – Room ${poi.room}`}
        accessibilityRole="button"
      >
        {!isRoom && !hideTopMarker
          ? renderCategoryIcon(cfg.iconLib, cfg.icon, markerIconSize, iconColor)
          : null}
      </TouchableOpacity>

      {!isCompactIconOnly && !isVerticalTransport ? (
        <View
          style={{
            marginTop: poi.room === "805" ? -1 : poi.room === "809" ? 0 : 2,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 5,
            paddingHorizontal: 3,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontSize: 8, fontWeight: "700", color: POI_PALETTE.textDark }}>
            {poi.room}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default POIBadge;
