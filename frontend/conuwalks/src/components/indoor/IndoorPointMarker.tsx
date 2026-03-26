import React from "react";
import { View, Text } from "react-native";

interface Props {
  x: number;
  y: number;
  emoji: string;
  bgColor: string;
}

const IndoorPointMarker: React.FC<Props> = ({ x, y, emoji, bgColor }) => {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x + 2,
        top: y - 12,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#fff",
        elevation: 4,
        zIndex: 1000,
      }}
    >
      {emoji && emoji !== "📍" ? <Text style={{ fontSize: 7 }}>{emoji}</Text> : null}
    </View>
  );
};

export default IndoorPointMarker;
