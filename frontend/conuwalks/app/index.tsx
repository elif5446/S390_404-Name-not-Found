import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import TransportModeSelector, { TransportMode } from '../components/TransportModeSelector';
import RouteDisplay from '../components/RouteDisplay';

interface RouteInfo {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  mode: string;
  distance_km: number;
  duration_min: number;
  route_points: { lat: number; lng: number }[];
}

export default function Index() {
  const [selectedMode, setSelectedMode] = useState<TransportMode>('walk');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sample coordinates (Montreal area)
  const START_LAT = 45.5;
  const START_LNG = -73.6;
  const END_LAT = 45.52;
  const END_LNG = -73.58;

  // Backend API URL - adjust this based on your deployment
  const API_BASE_URL = 'http://localhost:8000';

  const fetchRoute = useCallback(async (mode: TransportMode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/route?start_lat=${START_LAT}&start_lng=${START_LNG}&end_lat=${END_LAT}&end_lng=${END_LNG}&mode=${mode}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.statusText}`);
      }

      const data = await response.json();
      setRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching route:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, START_LAT, START_LNG, END_LAT, END_LNG]);

  // Fetch route when component mounts or mode changes
  useEffect(() => {
    fetchRoute(selectedMode);
  }, [selectedMode, fetchRoute]);

  const handleModeSelect = (mode: TransportMode) => {
    setSelectedMode(mode);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Route Planner</Text>
        
        <TransportModeSelector
          selectedMode={selectedMode}
          onModeSelect={handleModeSelect}
        />
        
        <RouteDisplay
          route={route}
          loading={loading}
          error={error}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
});
