import React from "react";
import { Pressable, Text } from "react-native";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

function getRoomLabelFontSize(label: string): number {
  const room = label.replace("Room ", "");
  if (room === "805.01" || room === "805.02") {
    return 7;
  }
  if (room === "832.06") {
    return 10;
  }
  if (room === "851.01") {
    return 5;
  }
  if (room === "851.02" || room === "851.03") {
    return 8;
  }
  if (room === "805.03") {
    return 8;
  }
  return 12;
}

function getRoomLabelOffsetX(label: string): number {
  const room = label.replace("Room ", "");
  if (room === "805.01" || room === "805.02") {
    return 3;
  }
  if (room === "832.06") {
    return -4;
  }
  if (room === "851.03") {
    return -5;
  }
  if (room === "851.01") {
    return 3;
  }
  return 0;
}

function getRoomLabelOffsetY(label: string): number {
  const room = label.replace("Room ", "");
  if (room === "865") {
    return -3;
  }
  return 0;
}

interface Props {
  hotspots: IndoorHotspot[];
  currentLevel: number;
  destination: IndoorDestination | null;
  offsetX: number;
  offsetY: number;
  scale: number;
  onSelectDestination: (item: IndoorDestination) => void;
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
          const isSelected = destination?.id === spot.id;

          return (
            <Pressable
              key={spot.id}
              onPress={() =>
                onSelectDestination({
                  id: spot.id,
                  x: spot.x,
                  y: spot.y,
                  floorLevel: spot.floorLevel,
                  label: spot.label,
                })
              }
              style={{
                position: "absolute",
                left: offsetX + spot.x * scale - 16 + getRoomLabelOffsetX(spot.label),
                top: offsetY + spot.y * scale - 8 + getRoomLabelOffsetY(spot.label),
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Set destination to ${spot.label}`}
            >
              <Text
                style={{
                  fontSize: getRoomLabelFontSize(spot.label),
                  fontWeight: "600",
                  color: isSelected ? "#E5486B" : "#322f2fff",
                }}
              >
                {spot.label.replace("Room ", "")}
              </Text>
            </Pressable>
          );
        })}
    </>
  );
};

export default IndoorRoomLabels;