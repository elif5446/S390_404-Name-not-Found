import React from "react";
import { View } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";
import { Node } from "@/src/indoors/types/Navigation";

interface Props {
  routeNodes: Node[];
  currentLevel: number;
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

const IndoorRouteOverlay: React.FC<Props> = ({
  routeNodes,
  currentLevel,
  canvasWidth,
  canvasHeight,
  offsetX,
  offsetY,
  scale,
}) => {
  const floorIdSuffix = `_${currentLevel}`;

  const nodesForCurrentFloor = routeNodes.filter((node) =>
    node.floorId.endsWith(floorIdSuffix),
  );

  if (nodesForCurrentFloor.length < 2) return null;

  const points = nodesForCurrentFloor
    .map((node) => {
      const x = offsetX + node.x * scale;
      const y = offsetY + node.y * scale;
      return `${x},${y}`;
    })
    .join(" ");

  const firstNode = nodesForCurrentFloor[0];
  const lastNode = nodesForCurrentFloor[nodesForCurrentFloor.length - 1];

  const startX = offsetX + firstNode.x * scale;
  const startY = offsetY + firstNode.y * scale;
  const endX = offsetX + lastNode.x * scale;
  const endY = offsetY + lastNode.y * scale;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
      }}
    >
    <Svg width={canvasWidth} height={canvasHeight}>
        <Polyline
            points={points}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
        />
        <Polyline
            points={points}
            fill="none"
            stroke="#C2185B"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
        />

        <Circle cx={startX} cy={startY} r={4} fill="#3A7BD5" />
        <Circle cx={endX} cy={endY} r={5} fill="#C2185B" />
        </Svg>
    </View>
  );
};

export default IndoorRouteOverlay;