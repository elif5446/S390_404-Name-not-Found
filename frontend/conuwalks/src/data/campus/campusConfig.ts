import SGW from '@/src/data/campus/SGW.geojson';
import LOY from '@/src/data/campus/LOY.geojson';

import { SGWData, LOYData } from '@/src/data/BuildingLabels';
import { SGWBuildingMetadata } from '@/src/data/metadata/SGW.BuildingMetaData';
import { LoyolaBuildingMetadata } from '@/src/data/metadata/LOY.BuildingMetadata';

//this file will return the data needed for each campus
export type CampusId = 'SGW' | 'LOY';

export const CampusConfig = {
  SGW: {
    geojson: SGW,
    labels: SGWData,
    metadata: SGWBuildingMetadata,
  },
  LOY: {
    geojson: LOY,
    labels: LOYData,
    metadata: LoyolaBuildingMetadata,
  },
} as const;
