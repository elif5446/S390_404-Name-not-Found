import { LatLng } from "react-native-maps";

/**
 * Calculate the centroid (center point) of a polygon
 * @param coordinates - Array of [longitude, latitude] coordinates
 * @returns Center point as LatLng
 */
export const calculatePolygonCenter = (coordinates: LatLng[]): LatLng => {
  const lat =
    coordinates.reduce((s, c) => s + c.latitude, 0) / coordinates.length;
  const lng =
    coordinates.reduce((s, c) => s + c.longitude, 0) / coordinates.length;
  return { latitude: lat, longitude: lng };
};
