import { LatLng } from 'react-native-maps';
//this file convert GeoJSON coordinates into map coordinates

export const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));
