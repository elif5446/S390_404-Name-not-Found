import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, {LatLng } from 'react-native-maps';
import styles from '@/src/styles/campusMap';

interface CampusMapProps {
  initialLocation?: LatLng; // optional prop to set initial map location
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.4974, longitude: -73.5771 },
}) => {
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
      </MapView>
    </View>
  );
};

export default CampusMap;
