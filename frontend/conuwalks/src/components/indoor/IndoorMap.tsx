import React from "react";
import { View, Image, Text, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloorData } from "@/src/types/indoor";
import { styles } from "@/src/styles/IndoorMap.styles";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

interface MapContentProps {
  floor: FloorData;
  width: number;
  height: number;
}

const MapContent = React.memo(({ floor, width, height }: MapContentProps) => {
  const DEBUG_GRAPH = true;

  const debugNodes =
    floor.level === 8
      ? [
          // hallways
          { id: "H_8_N1", x: 176, y: 795 },
          { id: "H_8_N2", x: 176, y: 394 },
          { id: "H_8_N3", x: 176, y: 211 },
          { id: "H_8_N4", x: 549, y: 211 },
          { id: "H_8_N5", x: 549, y: 394 },
          { id: "H_8_N6", x: 549, y: 795 },
          { id: "H_8_N7", x: 306, y: 394 },

          // rooms
          { id: "H_847", x: 188, y: 844 },
          { id: "H_801", x: 188, y: 168 },

          // vertical transport
          { id: "H_8_STAIRS", x: 306, y: 359 },
          { id: "H_8_ELEVATOR", x: 340, y: 352 },
        ]
      : [];

  const debugEdges =
    floor.level === 8
      ? [
          // hall to hall
          ["H_8_N1", "H_8_N2"],
          ["H_8_N1", "H_8_N6"],
          ["H_8_N2", "H_8_N3"],
          ["H_8_N2", "H_8_N7"],
          ["H_8_N7", "H_8_N5"],
          ["H_8_N3", "H_8_N4"],
          ["H_8_N4", "H_8_N5"],
          ["H_8_N5", "H_8_N6"],

          // hall to room
          ["H_8_N3", "H_801"],
          ["H_8_N1", "H_847"],

          // hall to vertical
          ["H_8_N7", "H_8_ELEVATOR"],
          ["H_8_N7", "H_8_STAIRS"],
        ]
      : [];

  if (floor.type === "svg" && floor.image) {
    const SvgComponent = floor.image as React.ElementType;

    return (
      <View style={{ width, height }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 1024 1024"
          preserveAspectRatio="xMidYMid meet"
        >
          <SvgComponent width="100%" height="100%" />

          {/* DEBUG EDGES */}
          {DEBUG_GRAPH &&
            debugEdges.map(([aId, bId], index) => {
              const a = debugNodes.find((n) => n.id === aId);
              const b = debugNodes.find((n) => n.id === bId);
              if (!a || !b) return null;

              return (
                <Line
                  key={index}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="blue"
                  strokeWidth="4"
                />
              );
            })}

          {/* DEBUG NODES */}
          {DEBUG_GRAPH &&
            debugNodes.map((node) => (
              <React.Fragment key={node.id}>
                <Circle cx={node.x} cy={node.y} r="8" fill="red" />
                <SvgText
                  x={node.x + 10}
                  y={node.y}
                  fontSize="14"
                  fill="blue"
                >
                  {node.id}
                </SvgText>
              </React.Fragment>
            ))}
        </Svg>
      </View>
    );
  }

  if (floor.type === "png" && floor.image) {
    return (
      <Image
        source={floor.image as ImageSourcePropType}
        style={[styles.floorImage, { width, height }]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.errorBox, { width, height }]}>
      <Ionicons
        name="alert-circle-outline"
        size={32}
        color={styles.errorText.color}
      />
      <Text style={styles.errorText}>Map Image Unavailable</Text>
    </View>
  );
});

MapContent.displayName = "MapContent";

export default MapContent;