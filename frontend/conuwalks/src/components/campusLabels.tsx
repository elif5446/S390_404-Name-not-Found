import React from 'react';
import { useState, useEffect } from 'react';
import { Marker } from 'react-native-maps';
import { View, Text } from 'react-native';

import BuildingTheme from '@/src/styles/BuildingTheme';
import { getLabelFontSize, FeatureCollection } from '@/src/data/BuildingLabels';
import { CampusId } from '@/src/data/campus/campusConfig';
//will only render the labels 

interface Props {
  campus: CampusId;
  data: FeatureCollection;
  longitudeDelta: number;
}

const CampusLabels: React.FC<Props> = ({
  campus,
  data,
  longitudeDelta,
}) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
      setTracksViewChanges(true);
      const timer = setTimeout(() => {
        setTracksViewChanges(false);
      }, 500);
      return () => clearTimeout(timer);
  }, [longitudeDelta]);
  return (
    <>
      {data.features.map((feature) => {
        const { id, centroid } = feature.properties;
        if (!centroid) return null;

        const color =
          BuildingTheme[campus][id as keyof typeof BuildingTheme[typeof campus]] ??
          '#000';

        return (
          <Marker
            key={`${id}-label`}
            coordinate={centroid}
            tracksViewChanges={tracksViewChanges}
            pointerEvents="none"
            zIndex={100}
            anchor={{ x: 0.25, y: 0.25 }}
          >
            <View style={{ padding: 2 }}>
              <Text
                style={{
                  fontSize: getLabelFontSize(longitudeDelta),
                  fontWeight: 'bold',
                  color,
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
