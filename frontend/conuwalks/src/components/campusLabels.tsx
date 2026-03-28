import React, { memo, useEffect, useState } from "react";
import { Marker } from "react-native-maps";
import { View, Text, Platform } from "react-native";
import { getLabelFontSize, FeatureCollection } from "@/src/data/BuildingLabels";
import { CampusId } from "@/src/data/campus/campusConfig";

interface Props {
  campus: CampusId;
  data: FeatureCollection;
  longitudeDelta: number;
  onLabelPress: (buildingId: string) => void;
}

const CampusLabels: React.FC<Props> = ({
  campus,
  data,
  longitudeDelta,
  onLabelPress,
}) => {
  const isVisible = longitudeDelta <= 0.0075;
  const fontSize = getLabelFontSize(longitudeDelta);
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    setTrackChanges(true);
    const timeout = setTimeout(() => setTrackChanges(false), 150);
    return () => clearTimeout(timeout);
  }, [fontSize, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {data.features.map((feature) => {
        const { id, name, centroid } = feature.properties;
        if (!centroid) return null;
        let label = fontSize > 25 && Platform.OS === "ios" ? name?.replaceAll(" ", `\n`) : id;

        return (
          <Marker
            key={`${campus}-${id}-label`}
            coordinate={centroid}
            tracksViewChanges={trackChanges}
            zIndex={100}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={(e) => {
              e.stopPropagation();
              onLabelPress(id);
            }}
            importantForAccessibility="no"
            accessible={false}
          >
            <View>
              <Text
                style={{
                  fontSize: fontSize,
                  fontWeight: "bold",
                  color: "#00000033",
                  textAlign: "center"
                }}
                allowFontScaling={false}
                importantForAccessibility="no"
                accessible={false}
              >
                {label}
              </Text>
            </View>
          </Marker>
        );
      })}
    </>
  );
};

export default memo(CampusLabels, (prevProps, nextProps) => {
  const prevVisible = prevProps.longitudeDelta <= 0.0075;
  const nextVisible = nextProps.longitudeDelta <= 0.0075;

  // if visibility toggled, we need to re-render
  if (prevVisible !== nextVisible) return false;
  // if both are invisible, don't re-rendering
  if (!prevVisible && !nextVisible) return true;

  const prevFontSize = getLabelFontSize(prevProps.longitudeDelta);
  const nextFontSize = getLabelFontSize(nextProps.longitudeDelta);

  return prevFontSize === nextFontSize && prevProps.campus === nextProps.campus;
});
