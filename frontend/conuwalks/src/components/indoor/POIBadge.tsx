import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { POI, POICategory } from "@/src/types/poi";
import { poiBadgeStyles, POI_PALETTE } from "@/src/styles/IndoorPOI.styles";

//Category: icon name + background colour 
type IconLib = "ion" | "mci" | "custom";
type IconOffset = { x: number; y: number };

// Fine-tune icon placement by room number
export const ICON_POSITION_OVERRIDES: Record<string, IconOffset> = {
        
      
    
  // VL-2 icon positions
                "VL-2-wc-m-1": { x: 0, y: 78 }, 
                "VL-2-wc-f-1": { x: 5, y: 105 },
  
                  "VL-2-elevator-1": { x: 5, y: 1 }, 
                  "VL-2-stairs-1": { x: 6, y: -90 },
                   "VL-2-stairs-2": { x: 6, y: 80 },
                   "VL-2-stairs-3": { x: 8, y: 85 },
                // VL-1 icon positions
                // Bathrooms
                "VL-1-wc-f-1": { x: 5, y: 110},
                "VL-1-wc-f-2": { x: -1, y: 44},
                "VL-1-wc-m-1": { x: 0, y: 140 },
                "VL-1-wc-m-2": { x: 5, y: 75},
                // Stairs
                "VL-1-stairs-1": { x: 5, y: -25 },
                "VL-1-stairs-2": { x: 4, y: 25 },
                "VL-1-stairs-3": { x: 6, y: 90 },
                // Elevator
                "VL-1-elevator-1": { x: 7, y: 17 },
              
  // Hall Floor 9  icon positions
  "9-S1": { x: -15, y: -15 },
  "9-S2": { x: 10, y: 10 },
  "9-S3": { x: 5, y: 15 },
  "9-S4": { x: 10, y: 8},
    "9-E1": { x: 2, y: -4 },
  // Escalators 
  "9-ESCALATOR_DOWN_8": { x: 14, y: 0 },
  "9-ESCALATOR_UP_10": { x: 15, y: 0 }, 
    "ESCALATOR_DOWN_8": { x: -1, y: 10 },
    "ESCALATOR_UP_10": { x: 3, y: 10 },

  // Hall floor 1  
  "1-S1": { x: 6, y: 6 }, 
  "1-S2": { x: 6, y: 4 }, 
  "1-S3": { x: 8, y: 5 }, 
  "1-S4": { x: 0, y: 0 }, 
  "1-E1": { x: 10, y: 10 }, 
  "1-E2": { x: 15, y: 18}, 
  "1-ESCALATOR_UP_1": { x: -10, y: 10}, 
  "1-ESCALATOR_DOWN_1": { x: 12, y: 12 }, 
  "1-ESCALATOR_UP_2": { x: 15, y: 12},
  "1-SECURITY": { x: -3, y: 15 }, 

  //Hall floor 2 

              "HIVE_CAFE": { x: -10, y: -10 },
            "2-ESCALATOR_DOWN_1": { x: 14, y: 20 },
          "2-E2": { x: 15, y: 20 },
          "2-E1": { x: 10, y: 12 },
        "2-ESCALATOR_UP_2": { x: 15, y: 20 },
        "2-S1": { x: 6, y: 8 },
        "2-S2": { x: 10, y: 14 },
      "2-STUDENT_UNION": { x: 10, y: 5 },
      "2-ESCALATOR_DOWN_2": { x: 15, y: -3 },
    "2-ESCALATOR_UP_8": { x: 10, y: 25},
   
    
    

  //Floor 9 icon positions. 
  "967": { x: 8, y: -4 },
  "913": { x: 6, y: -8 },
  "915": { x: 6, y: -8},
  "917": { x: 6, y: -8 },
  "921": { x: 6, y: -4},
  "929": { x: 10, y:-6},
  "928": { x: 1, y: -6 }, 
  "931": { x: 2, y: -2 },
  "933": { x: 8, y: -5},


  // Floor 8 bathroom  icon position
	"836": { x: 10, y: 2 },

  // Floor 8 computer labs icon positions
  "801": { x: 2, y: -6 },
  "803": { x: 3, y: -6 },
  "811": { x: 5, y: -6 },
  "815": { x: 5, y: -6 },
  "813": { x: 3, y: -6 },
  "817": { x: 8, y: -6 },
  "819": { x: 8, y: -2},
  "821": { x: 8, y: -2 },
  "823": { x: 8, y: -2 },
  "825": { x: 8, y: -2 },
  "827": { x: 8, y: -2 },
  "829": { x: 8, y: -4 },
 

  // Floor 8 stairs elevator
  "S1": { x:  8,  y:  12 },
  "S2": { x: 6, y: 8 },
  "S3": { x: 6, y: 8 },
  "S4": { x: 5, y: 12 },
  "E1": { x: 6, y: 8},
  

  // Floor 9 bathrooms, printer, IT help desk
  "B1": { x: 0, y: 2}, // Girls bathroom
  "B2": { x: 5, y: 1 }, // Boys bathroom
  "PR1": { x: -10, y: 10}, // Printer
  "IT": { x: 13, y: -5 }, // IT Help Desk


  // Floor 8 escalator positions
  "ESCALATOR_UP_9": { x: 6, y: 10 },
  "ESCALATOR_DOWN_2": { x: 6, y: 2 },


  //MB-S2 positions:   
    "MB_S2.273": { x: 2, y: 40 },
    "MB_S2.275": { x: 2, y: 40 },
    "MB_S2.279": { x: 3, y: 40 },
    "MB_vinhs_cafe": { x: -15, y: 20 }, 
    "MB_S2.428": { x: 65, y: 315 },
    "MB_S2_BATHROOM_M": { x: -1, y: 8},
    "MB_S2_BATHROOM_W": { x: -1, y: -10},
    "MB_S2_BATHROOM_H": { x: 1, y: -18 },
    "MB_S2_ELEVATOR_1": { x: 12, y: 8 }, 
    "MB_S2_ELEVATOR_2": { x: 14, y: 8},
    "MB_S2_ELEVATOR_3": { x: 14, y: 8 },
    "MB_S2_ELEVATOR_4": { x: 14, y: 15 },
    "MB_S2_ELEVATOR_5": { x: 14, y: 15 },
    "MB_S2_ELEVATOR_6": { x: 14, y: 15 },
    "MB_S2_ESCALATOR_UP": { x: 1, y: -70 },
    "MB_S2_ESCALATOR_DOWN": { x: 10, y: -70 },
    "MB_S2_STAIRS_5": { x: 6, y: 5 },
    "MB_S2_STAIRS_2": { x: 15, y: 0 },
    "MB_S2_STAIRS_1": { x: 15, y: 40 },
    "MB_S2_STAIRS_3": { x: 15, y: 8 },
    "MB_S2_STAIRS_4": { x: 15, y: -8 },












    //MB-Floor1
    "MB_0_secondcup": { x: -50, y: 380 },
    "MB_0_BATHROOM_W": { x: -26, y: 0 },
    "MB_0_SECURITY": { x: -113, y: 75 },
    "MB_0_ESCALATOR_DOWN": { x: -60, y: 110 },
    "MB_0_ESCALATOR_UP": { x: -55, y: 90 },
    "MB_0_STAIRS_1": { x: -45, y: 200},
    "MB_0_STAIRS_2": { x: -122, y: -110},
    "MB_0_ELEVATOR_1": { x: 40, y:15 },
    "MB_0_ELEVATOR_2": { x: 36, y:15 },
    "MB_0_ELEVATOR_3": { x: 32, y:15 },
    "MB_0_ELEVATOR_4": { x: 10, y:-20 },
    "MB_0_ELEVATOR_5": { x: -28, y:-20 },
    "MB_0_ELEVATOR_6": { x: -66, y:-20 },

    
};



const CATEGORY_CONFIG: Record<POICategory, {
  icon: string;
  iconLib: IconLib;
  bg: string;
  iconColor: string;
}> = {
  // ...existing code...
  STUDENT_UNION: {
    icon: "account-group",
    iconLib: "mci",
    bg: "#6EC16E", // green for student union
    iconColor: POI_PALETTE.iconDark,
  },
  SECOND_CUP: {
    icon: "coffee",
    iconLib: "mci",
    bg: "#C2A661", // unique color for Second Cup
    iconColor: POI_PALETTE.iconDark,
  },
  MICROWAVE: {
    icon: "microwave",
    iconLib: "mci",
    bg: "#B76E79",
    iconColor: POI_PALETTE.iconDark,
  },
  VINHS_CAFE: {
    icon: "coffee",
    iconLib: "mci",
    bg: "#8D5524",
    iconColor: POI_PALETTE.iconDark,
  },
  FOOD: {
    icon: "coffee",
    iconLib: "mci",
    bg: "#F7C873",
    iconColor: POI_PALETTE.iconDark,
  },
  LAB: {
    icon: "desktop-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: POI_PALETTE.iconDark,
  },
  HELP_DESK: {
    icon: "shield-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: POI_PALETTE.iconDark,
  },
  ROOM: {
    icon: "business-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: POI_PALETTE.iconDark,
  },
  STUDY_ROOM: {
    icon: "book-outline",
    iconLib: "ion",
    bg: "#6EC1E4",
    iconColor: POI_PALETTE.iconDark,
  },
  STAIRS: {
    icon: "stairs",
    iconLib: "mci",
    bg: "#B76E79", 
    iconColor: POI_PALETTE.iconDark,
  },
  ELEVATOR: {
    icon: "elevator",
    iconLib: "mci",
    bg: "#B76E79", 
    iconColor: POI_PALETTE.iconDark,
  },
  ESCALATOR: {
    icon: "escalator",
    iconLib: "mci",
    bg: "#B76E79", 
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
    icon: "human-male-female", // Both genders symbol for shared washroom
    iconLib: "mci",
    bg: "#B0A7D1", // purple shade for shared washroom
    iconColor: POI_PALETTE.white,
  },
  PRINT: {
    icon: "print-outline",
    iconLib: "ion",
    bg: "#B76E79", 
    iconColor: POI_PALETTE.iconDark,
  },
  IT: {
    icon: "IT_TEXT", // IT icon
    iconLib: "custom",
    bg: "#B76E79", 
    iconColor: POI_PALETTE.iconDark,
  },
};

function renderCategoryIcon(
  iconLib: IconLib | "custom",
  icon: string,
  size: number,
  color: string,
) {
  if (iconLib === "custom" && icon === "IT_TEXT") {
    // Render 'IT' text for IT desk
    return (
      <Text style={{ fontWeight: "bold", fontSize: size * 0.85, color }}>{"IT"}</Text>
    );
  }
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
    "836": { x: -5, y: -6 },
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
  const isLab = poi.category === "LAB";
  const isVerticalTransport = poi.category === "STAIRS" || poi.category === "ELEVATOR" || poi.category === "ESCALATOR" || poi.category === "HELP_DESK";
  const isCompactIconOnly = !isRoom && (poi.room === "805" || poi.room === "809");
  const hideTopMarker = !isRoom && (poi.room === "805" || poi.room === "809");
  const isDestination = selectionType === "destination";
  const isSource = selectionType === "source";
  const bg = isDestination ? POI_PALETTE.pink : isSource ? "#3A7BD5" : cfg.bg;
  const iconColor = isDestination || isSource ? POI_PALETTE.white : cfg.iconColor;
  const isElevator = poi.category === "ELEVATOR";
  const isStairsS1 = poi.category === "STAIRS" && poi.room === "S1";
  const markerSize = isCompactIconOnly ? 12 : isElevator ? 14 : isStairsS1 ? 15 : size;//to change the size of the elavator icon. 
  const markerIconSize = isCompactIconOnly ? 8 : markerSize * 0.56;
  const radius = markerSize * 0.42;
  const anchorLeft = left + size / 2;
  const anchorTop = top + size / 2;
  const isCompactRoomLabel = poi.room === "851.01";
  const iconBadgeShiftDown = poi.room === "805" ? 5 : poi.room === "809" ? 1 : 0;
  const markerShiftUp = poi.room === "836" ? -6 : poi.room === "809" ? -3 : 0;
  const markerShiftRight = poi.room === "836" ? 2 : poi.room === "809" ? 16 : 0;
  // Only use default LAB shift if no manual override
  const hasManualLabOffset = poi.category === "LAB" && Object.prototype.hasOwnProperty.call(ICON_POSITION_OVERRIDES, poi.room);
  const labShiftRight = poi.category === "LAB" && !hasManualLabOffset ? 10 : 0;
  const labShiftUp = poi.category === "LAB" && !hasManualLabOffset ? -10 : 0;
  const transportShiftLeft = isVerticalTransport ? -12 : 0;
  const transportShiftUp = isVerticalTransport ? -12 : 0;
  // Always prefer POI id as unique key for icon offset, then floor-room, then room
  let manualRoomOffset: IconOffset =
    ICON_POSITION_OVERRIDES[poi.id] ??
    (poi.floor ? ICON_POSITION_OVERRIDES[`${poi.floor}-${poi.room}`] : undefined) ??
    ICON_POSITION_OVERRIDES[poi.room] ??
    { x: 0, y: 0 };
  const markerZIndex = poi.category === "ELEVATOR" ? 40 : poi.category === "STAIRS" ? 30 : 10;
  const markerHitSlop = isVerticalTransport
    ? { top: 14, bottom: 14, left: 14, right: 14 }
    : { top: 8, bottom: 8, left: 8, right: 8 };

  if (isRoom && !isLab) {
    // Render only the label for ROOMs (not LABs)
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
        left:
          anchorLeft -
          markerSize / 2 +
          markerShiftRight +
          transportShiftLeft +
          (poi.category === "LAB"
            ? (hasManualLabOffset
                ? 0
                : labShiftRight)
            : 0)
          + manualRoomOffset.x,
        top:
          anchorTop -
          markerSize / 2 -
          3 +
          markerShiftUp +
          transportShiftUp +
          (poi.category === "LAB"
            ? (hasManualLabOffset
                ? 0
                : labShiftUp)
            : 0)
          + manualRoomOffset.y,
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
          isRoom && !isLab
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
        {(!isRoom || isLab) && !hideTopMarker
          ? renderCategoryIcon(cfg.iconLib, cfg.icon, markerIconSize, iconColor)
          : null}
      </TouchableOpacity>
      {/* Show label under icon for Hive Cafe and Vinh's Cafe */}
      {((poi.category === "FOOD" && poi.showLabel) || poi.category === "VINHS_CAFE") && (
        <Text
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: "bold",
            color: POI_PALETTE.textDark,
            textAlign: "center",
            backgroundColor: "#fff8e1",
            borderRadius: 4,
            paddingHorizontal: 4,
            paddingVertical: 1,
            overflow: "hidden",
            elevation: 2,
          }}
        >
          {poi.label}
        </Text>
      )}
    </View>
  );
};

export default POIBadge;
