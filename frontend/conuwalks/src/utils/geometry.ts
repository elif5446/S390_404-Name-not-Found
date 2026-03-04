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

export const toRadians = (value: number): number => (value * Math.PI) / 180;

export const distanceMetersBetween = (
  pointA: LatLng,
  pointB: LatLng,
): number => {
  const earthRadius = 6371000;
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);
  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};
