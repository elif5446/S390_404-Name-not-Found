import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface RouteInfo {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  mode: string;
  distance_km: number;
  duration_min: number;
  route_points: { lat: number; lng: number }[];
}

interface RouteDisplayProps {
  route: RouteInfo | null;
  loading: boolean;
  error: string | null;
}

export default function RouteDisplay({ route, loading, error }: RouteDisplayProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Calculating route...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Select a transportation mode to see route details</Text>
      </View>
    );
  }

  const getModeLabel = (mode: string) => {
    const labels: { [key: string]: string } = {
      walk: '🚶 Walking',
      bike: '🚴 Biking',
      car: '🚗 Driving',
      public_transportation: '🚌 Public Transit',
    };
    return labels[mode] || mode;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Mode:</Text>
        <Text style={styles.value}>{getModeLabel(route.mode)}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.value}>{route.distance_km.toFixed(1)} km</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Duration:</Text>
        <Text style={styles.value}>
          {route.duration_min} min ({(route.duration_min / 60).toFixed(1)} hours)
        </Text>
      </View>
      
      <View style={styles.coordinatesSection}>
        <Text style={styles.coordinatesTitle}>Start:</Text>
        <Text style={styles.coordinates}>
          {route.start.lat.toFixed(4)}, {route.start.lng.toFixed(4)}
        </Text>
        
        <Text style={[styles.coordinatesTitle, { marginTop: 8 }]}>End:</Text>
        <Text style={styles.coordinates}>
          {route.end.lat.toFixed(4)}, {route.end.lng.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  coordinatesSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#eee',
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  coordinates: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
