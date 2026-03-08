import React from "react";
import { Pressable, Text } from "react-native";
import { IndoorHotspot, IndoorDestination } from "./types/hotspot";

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
                left: offsetX + spot.x * scale - 16,
                top: offsetY + spot.y * scale - 8,
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Set destination to ${spot.label}`}
            >
              <Text
                style={{
                  fontSize: 12,
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