import React from 'react';
import { View, Platform, useColorScheme } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polygon, LatLng } from 'react-native-maps';
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
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
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
          fillColor={properties.color + '75'} // add alpha for semi-transparent
          strokeColor={properties.color}
          strokeWidth={1}
          tappable
          onPress={() => console.log('Tapped:', properties.id)}
        />
      );
    });

  const mapID = useColorScheme() === 'dark' ? "eb0ccd6d2f7a95e23f1ec398" : "eb0ccd6d2f7a95e117328051"; // Workaround

  return (
    <View style={styles.container}>
      <MapView
        key={mapID} // Rerender when mode (light/dark) changes
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        googleMapId={Platform.OS === 'android' ? mapID : undefined} // Style
        style={styles.map}
        pitchEnabled={false} // No 3D
        maxDelta={0}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        showsPointsOfInterest={false} // takes out the information off all businesses
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        tintColor="#FF2D55"
        region={{
          ...initialLocation,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
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
