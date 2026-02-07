import React from 'react';
import { Polygon } from 'react-native-maps';

import BuildingTheme from '@/src/styles/BuildingTheme';
import { polygonFromGeoJSON } from '@/src/utils/geo';
import { CampusId } from '@/src/data/campus/campusConfig';

//only renders the polygons

interface Props {
  campus: CampusId;
  geojson: any;
  metadata: Record<string, { name?: string }>;
}

const CampusPolygons: React.FC<Props> = ({
  campus,
  geojson,
  metadata,
}) => {
  return (
    <>
      {geojson.features.map((feature: any) => {
        if (feature.geometry.type !== 'Polygon') return null;

        const id = feature.properties.id;
        const color =
          BuildingTheme[campus][id as keyof typeof BuildingTheme[typeof campus]] ??
          '#888888';

        return (
          <Polygon
            key={id}
            coordinates={polygonFromGeoJSON(
              feature.geometry.coordinates[0]
            )}
            fillColor={`${color}75`}
            strokeColor={color}
            strokeWidth={1}
            accessibilityLabel={metadata[id]?.name ?? id}
          />
        );
      })}
    </>
  );
};

export default CampusPolygons;
