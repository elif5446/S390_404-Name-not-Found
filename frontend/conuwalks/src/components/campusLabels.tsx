import { Marker } from "react-native-maps";
import { View, Text } from "react-native";
import { getLabelFontSize, FeatureCollection } from "@/src/data/BuildingLabels";
import { CampusId } from "@/src/data/campus/campusConfig";
//will only render the labels

interface Props {
  campus: CampusId;
  data: FeatureCollection;
  longitudeDelta: number;
}

const CampusLabels: React.FC<Props> = ({ campus, data, longitudeDelta }) => {
  const isVisible = longitudeDelta <= 0.0075;
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
            opacity={isVisible ? 1 : 0}
            pointerEvents="none"
            zIndex={100}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View>
              <Text
                style={{
                  fontSize: getLabelFontSize(longitudeDelta),
                  fontWeight: "bold",
                  color: "#00000033",
                }}
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
