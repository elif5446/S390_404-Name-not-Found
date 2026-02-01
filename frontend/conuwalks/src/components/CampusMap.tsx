import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { LatLng, Circle, Region } from 'react-native-maps';
import styles from '@/src/styles/campusMap';
import { useUserLocation } from '@/src/hooks/useUserLocation';

interface CampusMapProps {
  initialLocation?: LatLng; // optional prop to set initial map location
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.4974, longitude: -73.5771 },
}) => {
  // Get user's location with permission handling
  const { location: userLocation, error: locationError, loading: locationLoading } = useUserLocation();

  // Use user location if available, otherwise use initial location
  const mapCenter = userLocation || initialLocation;

  // Track map region to scale location circle based on zoom level
  const [mapRegion, setMapRegion] = useState<Region>({
    ...mapCenter,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  });

  // Calculate circle radius based on zoom level (longitudeDelta)
  // Larger longitudeDelta = zoomed out = bigger circle
  const circleRadius = Math.max(30, mapRegion.longitudeDelta * 2000);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...mapCenter,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        onRegionChange={setMapRegion}
      > 
        {userLocation && ( //Show user's current location if available
          <Circle
            center={userLocation}
            radius={circleRadius}
            fillColor="rgba(33, 150, 243, 0.3)"
            strokeColor="rgba(33, 150, 243, 0.8)"
            strokeWidth={2}
          />
        )}
      </MapView>

      {locationLoading && (
        <View style={{ position: 'absolute', top: 20, right: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {locationError && (
        <View style={{ position: 'absolute', top: 20, left: 20, right: 20, backgroundColor: '#fff', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: '#d32f2f', fontSize: 12 }}>{locationError}</Text>
        </View>
      )}
    </View>
  );
};

export default CampusMap;
