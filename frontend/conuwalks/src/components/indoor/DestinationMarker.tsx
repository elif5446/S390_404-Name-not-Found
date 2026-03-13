import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DestinationMarkerProps {
  x: number;
  y: number;
}

const DestinationMarker: React.FC<DestinationMarkerProps> = ({ x, y }) => {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - 14,
        top: y - 34,
      }}
    >
      <Ionicons name="location-sharp" size={30} color= "#B03060" />
    </View>
  );
};

export default DestinationMarker;