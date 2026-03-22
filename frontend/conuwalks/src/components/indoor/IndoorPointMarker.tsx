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
        left: x -15,
        top: y - 18,
        width: 14,
        height: 14,
        borderRadius: 14,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 8 }}>{emoji}</Text>
    </View>
  );
};

export default IndoorPointMarker;