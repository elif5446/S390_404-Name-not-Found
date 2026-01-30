import React from 'react';
import { View } from 'react-native';
import MapView, { Polygon, LatLng } from 'react-native-maps';
import styles from '@/src/styles/campusMap';
import SGW from '@/src/data/SGW.geojson';
import LOY from '@/src/data/LOY.geojson';

// Convert GeoJSON coordinates to LatLng
const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

interface CampusMapProps {
  initialLocation?: LatLng; // optional prop to set initial map location
}

// TypeScript type for properties with color
interface FeatureProperties {
  id: string;
  name?: string;
  color: string;
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.4974, longitude: -73.5771 },
}) => {
  // Helper function to render polygons
  const renderPolygons = (geojson: typeof SGW | typeof LOY) =>
    geojson.features.map((feature) => {
      if (feature.geometry.type !== 'Polygon') return null;

      const coordinates = feature.geometry.coordinates[0];
      const properties = feature.properties as FeatureProperties; // assert type

      return (
        <Polygon
          key={properties.id}
          coordinates={polygonFromGeoJSON(coordinates)}
          fillColor={properties.color + '66'} // add alpha for semi-transparent
          strokeColor={properties.color}
          strokeWidth={1}
          tappable
          onPress={() => console.log('Tapped:', properties.id)}
        />
      );
    });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsPointsOfInterest={false} //takes out the information off all businesses
        initialRegion={{
          ...initialLocation,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
      >
        {/* Render SGW campus */}
        {renderPolygons(SGW)}

        {/* Render Loyola campus */}
        {renderPolygons(LOY)}
      </MapView>
    </View>
  );
};

export default CampusMap;
