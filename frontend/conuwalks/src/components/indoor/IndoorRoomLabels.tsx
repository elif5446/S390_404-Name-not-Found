import React from "react";
import { Pressable, Text } from "react-native";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

/* ------------------------- Normalization Helper ------------------------- */

const normalize = (label: string) => label.replace("Room ", "");

/* ------------------------- Regex Helpers ------------------------- */

const is961Special = (room: string) =>
  /^961\.(1[9]|2[0-9]|3[0-3])$/.test(room);

const is961Small = (room: string) =>
  /^961\.(0[1-9]|1[0-8])$/.test(room);

/* ------------------------- Lookup Tables ------------------------- */

const FONT_SIZE_MAP: Record<string, number> = {
  "273": 7,
  "275": 7,
  "279": 7,
  "428": 7,
  "106.1": 7,
  "202.30": 5.5,
  "203.30": 4,
  "101.07": 6,
  "101.06": 6,
  "101.03": 6,
  "101.04": 6,
  "927.01": 6,
  "927.02": 6,
  "927.03": 6,
  "925.01": 5.5,
  "925.02": 5.5,
  "925.03": 5.5,
  "122.1": 8,
  "102.3": 7,
  "928": 7,
  "932": 7,
  "832.06": 10,
  "851.01": 5,
  "851.02": 8,
  "851.03": 8,
  "805.03": 8,
};

const OFFSET_X_MAP: Record<string, number> = {
  "273": 7,
  "275": 7,
  "279": 7,
  "428": 2,
  "202.30": 2,
  "203.30": 6,
  "204": 6,
  "240": 4,
  "197.1": 4,
  "120": 6,
  "140": 10,
  "101.07": 4,
  "101.06": 4,
  "101.03": 4,
  "101.04": 4,
  "927.01": 8,
  "927.02": 8,
  "927.03": 8,
  "925.01": 10,
  "925.03": 10,
  "928": 10,
  "931": 10,
  "124": 10,
  "122.1": 5,
  "102": 5,
  "102.2": 4,
  "102.3": 2,
  "805.01": 3,
  "805.02": 3,
  "832.06": -4,
  "851.03": -5,
  "851.01": 3,
};

const OFFSET_Y_MAP: Record<string, number> = {
  "865": -3,
  "931": 10,
};

/* ------------------------- Rule Functions ------------------------- */

function getRoomLabelFontSize(label: string): number {
  const room = normalize(label);

  if (is961Special(room)) return 2;
  if (FONT_SIZE_MAP[room] !== undefined) return FONT_SIZE_MAP[room];

  return 8;
}

function getRoomLabelOffsetX(label: string): number {
  const room = normalize(label);

  if (OFFSET_X_MAP[room] !== undefined) return OFFSET_X_MAP[room];

  // special case for 928/932
  if (room === "928") return -20;
  if (room === "932") return 10;

  return 0;
}

function getRoomLabelOffsetY(label: string): number {
  const room = normalize(label);
  return OFFSET_Y_MAP[room] ?? 0;
}

/* ------------------------- Position Helper ------------------------- */

function getRoomPosition(
  spot: IndoorHotspot,
  offsetX: number,
  offsetY: number,
  scale: number
) {
  const room = normalize(spot.label);

  const baseLeft =
    offsetX + spot.x * scale - 16 + getRoomLabelOffsetX(spot.label);
  const baseTop =
    offsetY + spot.y * scale - 8 + getRoomLabelOffsetY(spot.label);

  if (is961Special(room)) {
    return { left: baseLeft + 4, top: baseTop + 8 };
  }

  return { left: baseLeft, top: baseTop };
}

/* ------------------------- Font Size Helper ------------------------- */

function getFontSize(label: string): number {
  const room = normalize(label);

  if (is961Special(room)) return 4;
  if (is961Small(room)) return 6;

  return getRoomLabelFontSize(label);
}

/* ------------------------- Component ------------------------- */

interface Props {
  hotspots: IndoorHotspot[];
  currentLevel: number;
  destination: IndoorDestination | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  onSelectDestination: (item: IndoorHotspot) => void;
}

const IndoorRoomLabels: React.FC<Props> = ({
  hotspots,
  currentLevel,
  destination,
  offsetX,
  offsetY,
  scale,
  onSelectDestination,
}) => {
  return (
    <>
      {hotspots
        .filter((spot) => spot.floorLevel === currentLevel)
        .map((spot) => {
          const { left, top } = getRoomPosition(
            spot,
            offsetX,
            offsetY,
            scale
          );

          return (
            <Pressable
              key={spot.id}
              onPress={() => onSelectDestination(spot)}
              style={{
                position: "absolute",
                left,
                top,
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Set destination to ${spot.label}`}
              testID={`room-label-${spot.label.replace("Room ", "")}`}
              accessible={true}
            >
              <Text
                style={{
                  fontSize: getFontSize(spot.label),
                  fontWeight: "bold",
                  color: "#000",
                }}
              >
                {normalize(spot.label)}
              </Text>
            </Pressable>
          );
        })}
    </>
  );
};

export default IndoorRoomLabels;
