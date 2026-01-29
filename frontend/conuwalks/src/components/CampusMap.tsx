import React from 'react';
import { View } from 'react-native';
import MapView, { Polygon, LatLng } from 'react-native-maps';
import styles from '@/src/styles/campusMap';
import SGW from '@/src/data/SGW.geojson';
import LOY from '@/src/data/LOY.geojson'; // import Loyola GeoJSON

// convert GeoJSON coordinates to LatLng
const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

interface CampusMapProps {
  initialLocation?: LatLng; // optional prop to set initial map location
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.4974, longitude: -73.5771 },
}) => {
  // helper function to render polygons
  const renderPolygons = (geojson: typeof SGW | typeof LOY, fillColor: string, strokeColor: string) =>
    geojson.features.map((feature) => {
      if (feature.geometry.type !== 'Polygon') return null;
      const coordinates = feature.geometry.coordinates[0];
      return (
        <Polygon
          key={feature.properties.id}
          coordinates={polygonFromGeoJSON(coordinates)}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={1}
          tappable
          onPress={() => console.log('Tapped:', feature.properties.id)}
        />
      );
    });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...initialLocation,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
      >
        {/* Render SGW campus */}
        {renderPolygons(SGW, 'rgba(79,70,229,0.4)', 'rgba(79,70,229,1)')}

        {/* Render Loyola campus */}
        {renderPolygons(LOY, 'rgba(79,70,229,0.4)', 'rgba(79,70,229,1)')}
      </MapView>
    </View>
  );
};

export default CampusMap;
