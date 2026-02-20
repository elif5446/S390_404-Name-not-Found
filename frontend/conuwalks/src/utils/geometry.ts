import { LatLng } from "react-native-maps";

/**
 * Calculate the centroid (center point) of a polygon
 * @param coordinates - Array of [longitude, latitude] coordinates
 * @returns Center point as LatLng
 */
export const calculatePolygonCenter = (
  coordinates: number[][]
): LatLng => {
  let latSum = 0;
  let lngSum = 0;

  coordinates.forEach(([lng, lat]) => {
    latSum += lat;
    lngSum += lng;
  });

  const centerLat = latSum / coordinates.length;
  const centerLng = lngSum / coordinates.length;

  return {
    latitude: centerLat,
    longitude: centerLng,
  };
};
