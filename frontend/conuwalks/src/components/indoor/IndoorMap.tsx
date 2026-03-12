import React from "react";
import { View, Image, Text, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloorData } from "@/src/indoors/types/FloorPlans";
import { styles } from "@/src/styles/IndoorMap.styles";

interface MapContentProps {
  floor: FloorData;
  width: number;
  height: number;
}

const MapContent = React.memo(({ floor, width, height }: MapContentProps) => {
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