import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface Building {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapWithDirectionsProps {
  startBuilding: Building | null;
  destinationBuilding: Building | null;
  googleMapsApiKey: string;
}

const MapWithDirections: React.FC<MapWithDirectionsProps> = ({
  startBuilding,
  destinationBuilding,
  googleMapsApiKey,
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Concordia University campus center coordinates (SGW Campus)
  const initialRegion = {
    latitude: 45.4972,
    longitude: -73.5789,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const fetchDirections = useCallback(async () => {
    if (!startBuilding || !destinationBuilding) return;

    try {
      const origin = `${startBuilding.latitude},${startBuilding.longitude}`;
      const destination = `${destinationBuilding.latitude},${destinationBuilding.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&key=${googleMapsApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  }, [startBuilding, destinationBuilding, googleMapsApiKey]);

  useEffect(() => {
    if (startBuilding && destinationBuilding && googleMapsApiKey) {
      fetchDirections();
    } else {
      setRouteCoordinates([]);
    }
  }, [startBuilding, destinationBuilding, googleMapsApiKey, fetchDirections]);

  // Decode polyline from Google Directions API
  const decodePolyline = (encoded: string) => {
    const poly: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Start building marker */}
        {startBuilding && (
          <Marker
            coordinate={{
              latitude: startBuilding.latitude,
              longitude: startBuilding.longitude,
            }}
            title={startBuilding.name}
            description="Start"
            pinColor="green"
          />
        )}

        {/* Destination building marker */}
        {destinationBuilding && (
          <Marker
            coordinate={{
              latitude: destinationBuilding.latitude,
              longitude: destinationBuilding.longitude,
            }}
            title={destinationBuilding.name}
            description="Destination"
            pinColor="red"
          />
        )}

        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default MapWithDirections;
