import React from 'react';
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
            tracksViewChanges={false}
            pointerEvents="none"
          >
            <Text
              style={{
                fontSize: getLabelFontSize(longitudeDelta),
                fontWeight: 'bold',
                color,
              }}
            >
              {id}
            </Text>
          </Marker>
        );
      })}
    </>
  );
};

export default CampusLabels;
