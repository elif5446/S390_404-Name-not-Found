import { LatLng } from 'react-native-maps';
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";

// ------------------------
// Types
// ------------------------
export type Coordinates = [number, number];
export type PolygonCoordinates = Coordinates[][];

export interface FeatureProperties {
  id: string;
  centroid?: LatLng;
}

export interface Feature {
  type: "Feature";
  properties: FeatureProperties;
  geometry: {
    type: "Polygon";
    coordinates: PolygonCoordinates;
  };
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

// ------------------------
// Helpers
// ------------------------

// Compute centroid of a polygon
export function computeCentroid(coords: PolygonCoordinates): LatLng {
  let lngSum = 0;
  let latSum = 0;

  const points = coords[0]; // only first ring

  points.forEach(([lng, lat]) => {
    lngSum += lng;
    latSum += lat;
  });

  return {
    latitude: latSum / points.length,
    longitude: lngSum / points.length,
  };
}

// Attach centroids to GeoJSON features (with manual overrides)
export function attachCentroids(
  geojson: FeatureCollection,
  overrides: Record<string, LatLng> = {}
): FeatureCollection {
  geojson.features.forEach((feature) => {
    const id = feature.properties.id;

    feature.properties.centroid =
      overrides[id] ?? computeCentroid(feature.geometry.coordinates);
  });

  return geojson;
}

// Dynamic font size for labels based on zoom
export const getLabelFontSize = (delta: number) => {
  const zoomFactor = 0.004 / delta;
  const size = 25 * zoomFactor;
  return Math.min(22, size);
};

// ------------------------
// Overrides / Precomputed Data
// ------------------------

// SGW campus
export const SGWData = attachCentroids(SGW as FeatureCollection, {
  LS: { latitude: 45.496460041324774 - 0.0001, longitude: -73.57969901828174 + 0.00025 },
  FG: { latitude: 45.49423, longitude: -73.57834 + 0.00005 },
  MB: { latitude: 45.49522 + 0.00005, longitude: -73.57908 },
  ER: { latitude: 45.49646 - 0.00004, longitude: -73.57998 - 0.00001 },
  EV: { latitude: 45.49583 - 0.0003, longitude: -73.57793 },
  CL: { latitude: 45.49423, longitude: -73.57935 + 0.00005 },
});

// Loyola campus
export const LOYData = attachCentroids(LOY as FeatureCollection, {
  SP: { latitude: 45.4577, longitude: -73.6416 },
  CJ: { latitude: 45.4574 + 0.00005, longitude: -73.6404 },
  CC: { latitude: 45.45820 + 0.000015, longitude: -73.64031 },
  AD: { latitude: 45.45801 - 0.00001, longitude: -73.63978 - 0.00006 },
  FC: { latitude: 45.45849 + 0.00003, longitude: -73.63938 },
});
