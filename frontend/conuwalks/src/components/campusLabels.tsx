import React from "react";
import { Marker } from "react-native-maps";
import { View, Text } from "react-native";
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
  if (!isVisible) return null;

  return (
    <>
      {data.features.map((feature) => {
        const { id, centroid } = feature.properties;
        if (!centroid) return null;

        return (
          <Marker
            key={`${id}-label`}
            coordinate={centroid}
            tracksViewChanges={true}
            zIndex={100}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={(e) => {
              e.stopPropagation();
              onLabelPress(id);
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: getLabelFontSize(longitudeDelta),
                  fontWeight: "bold",
                  color: "#00000033",
                }}
                importantForAccessibility="no"
                accessible={false}
              >
                {id}
              </Text>
            </View>
          </Marker>
        );
      })}
    </>
  );
};

export default CampusLabels;
