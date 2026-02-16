import React from "react";
import { View, Image, Text, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloorData } from "@/src/types/indoor";
import { styles } from "@/src/styles/IndoorMap.styles";

interface MapContentProps {
  floor: FloorData;
  width: number;
  height: number;
}

const MapContent = React.memo(({ floor, width, height }: MapContentProps) => {
  // handle SVG Components
  if (floor.type === "svg" && floor.image) {
    // Assuming floor.image is a React Component (imported SVG)
    const SvgComponent = floor.image as React.ElementType;
    return (
      <View style={{ width, height }}>
        <SvgComponent
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        />
      </View>
    );
  }

  // handle PNG/JPG Images
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
