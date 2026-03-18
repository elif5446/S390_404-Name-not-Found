import React from "react";
import { View, Image, Text, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloorData } from "@/src/indoors/types/FloorPlans";
import { styles } from "@/src/styles/IndoorMap.styles";

// ============================================================
// DEV OVERLAY — delete this section when done mapping
// ============================================================
//import { hallBuildingNavConfig } from "@/src/indoors/data/HallBuilding";
import { MBBuildingNavConfig } from "@/src/indoors/data/MBBuilding";
import Svg, { Line, Circle, Text as SvgText } from "react-native-svg";

const NODE_COLORS: Record<string, string> = {
  entrance:  "#00FF00",
  hallway:   "#00BFFF",
  room:      "#FFD700",
  elevator:  "#FF69B4",
  stairs:    "#FF8C00",
  escalator: "#DA70D6",
  bathroom: "#a369ff"
};

const DevNavOverlay = ({ floorId, width, height }: { floorId: string; width: number; height: number }) => {
const floorConfig = MBBuildingNavConfig.floors.find((f) => f.floorId === floorId);

  if (!floorConfig) {
    console.warn(`[DevNavOverlay] No nav config found for floorId: "${floorId}"`);
    return null;
  }

  console.log("[DevNavOverlay]", { floorId, nodeCount: floorConfig.nodes.length, edgeCount: floorConfig.edges.length });

  const nodeMap = new Map(floorConfig.nodes.map((n) => [n.id, n]));

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 1024 1024"
      style={{ position: "absolute", top: 0, left: 0}}
      pointerEvents="none"
    >
      {floorConfig.edges.map((edge, i) => {
        const a = nodeMap.get(edge.nodeAId);
        const b = nodeMap.get(edge.nodeBId);
        if (!a || !b) return null;
        return (
          <Line
            key={`edge-${i}`}
            x1={a.x} y1={a.y}
            x2={b.x} y2={b.y}
            stroke={edge.accessible ? "rgba(201, 23, 23, 0.8)" : "rgba(255,80,80,0.8)"}
            strokeWidth={2}
            strokeDasharray={edge.accessible ? undefined : "5,3"}
          />
        );
      })}

      {floorConfig.nodes.map((node) => {
        const color = NODE_COLORS[node.type] ?? "#db1c1c";
        const r = node.type === "room" ? 5 : 7;
        return (
          <React.Fragment key={node.id}>
            <Circle cx={node.x} cy={node.y} r={r} fill={color} opacity={0.95} />
            <SvgText
              x={node.x + r + 3}
              y={node.y + 4}
              fontSize={9}
              fill="white"
              stroke="black"
              strokeWidth={0.6}
            >
              {node.label ?? node.id}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};
// ============================================================
// END DEV OVERLAY
// ============================================================

interface MapContentProps {
  floor: FloorData;
  width: number;
  height: number;
}

const MapContent = React.memo(({ floor, width, height }: MapContentProps) => {
  // DEV: floor.level is a number (e.g. 8), build the navConfig floorId from it
  const devFloorId = `MB_${floor.id}`;

  // handle SVG Components
  if (floor.type === "svg" && floor.image) {
    const isValidComponent =
      typeof floor.image === "function" ||
      (typeof floor.image === "object" && floor.image !== null);
    if (isValidComponent) {
      const SvgComponent = floor.image as React.ElementType;
      return (
        <View style={{ width, height, position: "relative" }}>
          <SvgComponent width={width} height={height} preserveAspectRatio="xMidYMid meet" />
          {/* DEV */}
          <DevNavOverlay floorId={devFloorId} width={width} height={height} />
        </View>
      );
    } else {
      console.warn(
        `[IndoorMap] Floor ${floor.level} has type 'svg' but 'image' is not a valid component. Received: ${typeof floor.image}`,
      );
    }
  }

  // handle PNG/JPG Images
  if (floor.type === "png" && floor.image) {
    return (
      <View style={{ width, height, position: "relative" }}>
        <Image
          source={floor.image as ImageSourcePropType}
          style={[styles.floorImage, { width, height }]}
          resizeMode="contain"
        />
        {/* DEV */}
        <DevNavOverlay floorId={devFloorId} width={width} height={height} />
      </View>
    );
  }

  return (
    <View style={[styles.errorBox, { width, height }]}>
      <Ionicons name="alert-circle-outline" size={32} color={styles.errorText.color} />
      <Text style={styles.errorText}>Map Image Unavailable</Text>
    </View>
  );
});

MapContent.displayName = "MapContent";

export default MapContent;