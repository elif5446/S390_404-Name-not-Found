import SGW from '@/src/data/campus/SGW.geojson';
import LOY from '@/src/data/campus/LOY.geojson';
import { SGWBuildingMetadata } from '@/src/data/metadata/SGW.BuildingMetaData';
import { LoyolaBuildingMetadata } from '@/src/data/metadata/LOY.BuildingMetadata';

/**
 * Get all building IDs from a GeoJSON
 */
export const getBuildingIds = (geojson: typeof SGW | typeof LOY): string[] => {
  return geojson.features
    .filter((feature) => feature.geometry.type === 'Polygon')
    .map((feature) => feature.properties.id);
};

/**
 * Real test data - uses actual campus GeoJSON and metadata
 */
export const testData = {
  SGW: {
    geojson: SGW,
    metadata: SGWBuildingMetadata,
    buildingIds: getBuildingIds(SGW),
  },
  LOY: {
    geojson: LOY,
    metadata: LoyolaBuildingMetadata,
    buildingIds: getBuildingIds(LOY),
  },
};