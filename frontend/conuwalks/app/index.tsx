import { Text, View, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useLocation } from "../hooks/useLocation";
import * as Location from 'expo-location';

export default function Index() {
  const { location, errorMsg, permissionStatus, requestPermission } = useLocation();

  const handleRequestLocation = async () => {
    await requestPermission();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CoNU Walks</Text>
      
      {permissionStatus === null && (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      
      {permissionStatus === Location.PermissionStatus.UNDETERMINED && (
        <View style={styles.permissionContainer}>
          <Text style={styles.infoText}>
            To use your current location as a starting point, we need access to your location.
          </Text>
          <Button 
            title="Enable Location Services" 
            onPress={handleRequestLocation}
          />
        </View>
      )}
      
      {permissionStatus === Location.PermissionStatus.DENIED && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Location permission denied. Please enable location services in your device settings.
          </Text>
        </View>
      )}
      
      {permissionStatus === Location.PermissionStatus.GRANTED && !location && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.infoText}>Getting your location...</Text>
        </View>
      )}
      
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.successText}>✓ Location Enabled</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.label}>Current Location (Start Point):</Text>
            <Text style={styles.coordinates}>
              📍 Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinates}>
              📍 Longitude: {location.longitude.toFixed(6)}
            </Text>
          </View>
          <Text style={styles.infoText}>
            Your current location is set as the starting point for your itinerary.
          </Text>
        </View>
      )}
      
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 10,
    maxWidth: '90%',
  },
  locationInfo: {
    marginVertical: 15,
    alignItems: 'flex-start',
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  coordinates: {
    fontSize: 14,
    marginVertical: 2,
    color: '#555',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
});
