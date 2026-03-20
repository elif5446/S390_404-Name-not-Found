import React from "react";
import { Pressable, Text } from "react-native";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

function getRoomLabelFontSize(label: string): number {
  const room = label.replace("Room ", "");
  if (["927.01", "927.02", "927.03"].includes(room)) {
    return 6;
  }
  if (["925.01", "925.02", "925.03"].includes(room)) {
    return 5.5;
  }
  if (room === "928" || room === "932") {
    return 7;
  }
  //floor 8 rooms
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
  //floor 9 rooms
        if (/^961\.(1[9]|2[0-9]|3[0-3])$/.test(room)) {
          return 2;
  }
  return 8;
  
}
//rooms positions 
function getRoomLabelOffsetX(label: string): number {
  const room = label.replace("Room ", "");
  if (["927.01", "927.02", "927.03"].includes(room)) {
    return 8;
  }
  if (["925.01", "925.03"].includes(room)) {
    return 10;
  }
    if (room === "928" || room === "932") {
      return 10;
    }
  //floor 9 rooms positions
  if (room === "931") {
    return 10;
  }
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
                left:
                  (() => {
                    const room = spot.label.replace("Room ", "");
                    if (/^961\.(1[9]|2[0-9]|3[0-3])$/.test(room)) {
                      return offsetX + spot.x * scale - 16 + getRoomLabelOffsetX(spot.label) + 4;
                    }
                    return offsetX + spot.x * scale - 16 + getRoomLabelOffsetX(spot.label);
                  })(),
                top:
                  (() => {
                    const room = spot.label.replace("Room ", "");
                    if (/^961\.(1[9]|2[0-9]|3[0-3])$/.test(room)) {
                      return offsetY + spot.y * scale - 8 + getRoomLabelOffsetY(spot.label) + 8;
                    }
                    return offsetY + spot.y * scale - 8 + getRoomLabelOffsetY(spot.label);
                  })(),
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Set destination to ${spot.label}`}
            >
              <Text
                style={{
                  fontSize: (() => {
                    const room = spot.label.replace("Room ", "");
                    if (/^961\.(1[9]|2[0-9]|3[0-3])$/.test(room)) {
                      return 4;
                    }
                    if (/^961\.(0[1-9]|1[0-8])$/.test(room)) {
                      return 6;
                    }
                    return getRoomLabelFontSize(spot.label);
                  })(),
                  fontWeight: "bold",
                  color: "#000",
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