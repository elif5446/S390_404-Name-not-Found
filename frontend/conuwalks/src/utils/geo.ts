import { LatLng } from "react-native-maps";
//this file convert GeoJSON coordinates into map coordinates

export const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));

export const isPointInPolygon = (point: LatLng, polygon: LatLng[]): boolean => {
  const x = point.longitude;
  const y = point.latitude;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude,
      yi = polygon[i].latitude;
    const xj = polygon[j].longitude,
      yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};
