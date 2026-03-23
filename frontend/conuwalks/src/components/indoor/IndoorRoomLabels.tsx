import React from "react";
import { Pressable, Text } from "react-native";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

function getRoomLabelFontSize(label: string): number {
  const room = label.replace("Room ", "");
  if (room === "106.1") {
    return 7;//VL-1
  }
  if (room === "202.30") {
    return 5.5; // VL-2
  }
  if (room === "203.30") {
    return 4; // VL-2
  }
  if (["101.07", "101.06", "101.03", "101.04"].includes(room)) {
    return 6;//VL-1
  }
  if (["927.01", "927.02", "927.03"].includes(room)) {
    return 6;//HALL-9
  }
  if (["925.01", "925.02", "925.03"].includes(room)) {
    return 5.5;//HALL- 9
  }
  if (room === "122.1") {
    return 8; // VL-1 
  }
  if (room === "102.3") {
    return 7; // VL-1 
  } 
  if (room === "928" || room === "932") {
    return 7;//HALL-9
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
  if (room === "202.30") {
    return 2; // VL-2, 
  }
  if (room === "203.30") {
    return 6; // VL-2
  }
  if (room === "204") {
    return 6; // VL-2
  }
  if (room === "240") {
    return 4; // VL-2
  }
  if (room === "197.1") {
    return 4;//VL-1
  }
  if (room === "120") {
    return 6;//VL-1
  }
  if (room === "140") {
    return 10; //VL-1
  }
  if (["101.07", "101.06", "101.03", "101.04"].includes(room)) {
    return 4;//VL-1
  }
  if (["927.01", "927.02", "927.03"].includes(room)) {
    return 8;//HALL-9
  }
  if (["925.01", "925.03"].includes(room)) {
    return 10;//HALL -9
  }
   if (room === "928") {
    return 10; 
  }
  if (room === "931") {
    return 10; 
  }
  
  if (room === "124") {
    return 10; //VL-1 
  }
  if (room === "122.1") {
    return 5; // VL-1 
  }
  if (room === "102") {
    return 5; // VL-1 
  }
  if (room === "102.2") {
    return 4; // VL-1 
  }
  if (room === "102.3") {
    return 2; // VL-1 
  }
  //floor 9 rooms positions
  if (room === "928" || room === "932") {
    return room === "928" ? -20 : 10;
  }

  if (room === "931") {
    return -10;
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
//Floor 8 positions
function getRoomLabelOffsetY(label: string): number {
  const room = label.replace("Room ", "");
  if (room === "865") {
    return -3;
  }
  if (room === "931") {
    return 10;//HALL  -9
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
