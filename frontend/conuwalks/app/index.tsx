import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import MapWithDirections from './components/MapWithDirections';
import BuildingSelector from './components/BuildingSelector';

// Sample buildings on Concordia University campus (SGW Campus)
const BUILDINGS = [
  { id: '1', name: 'Hall Building (H)', latitude: 45.4970, longitude: -73.5787 },
  { id: '2', name: 'EV Building', latitude: 45.4953, longitude: -73.5783 },
  { id: '3', name: 'MB Building', latitude: 45.4950, longitude: -73.5790 },
  { id: '4', name: 'LB Building', latitude: 45.4585, longitude: -73.6402 },
  { id: '5', name: 'GM Building', latitude: 45.4965, longitude: -73.5795 },
  { id: '6', name: 'FG Building', latitude: 45.4949, longitude: -73.5795 },
];

// Replace with your actual Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

interface Building {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function Index() {
  const [startBuilding, setStartBuilding] = useState<Building | null>(null);
  const [destinationBuilding, setDestinationBuilding] = useState<Building | null>(null);
  const [showSelectors, setShowSelectors] = useState(true);

  const handleClearRoute = () => {
    setStartBuilding(null);
    setDestinationBuilding(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus Navigation</Text>
        {(startBuilding || destinationBuilding) && (
          <TouchableOpacity onPress={handleClearRoute} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear Route</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showSelectors && (
        <View style={styles.selectorsContainer}>
          <BuildingSelector
            buildings={BUILDINGS}
            selectedBuilding={startBuilding}
            onSelectBuilding={setStartBuilding}
            label="Select Start Building"
          />
          <BuildingSelector
            buildings={BUILDINGS}
            selectedBuilding={destinationBuilding}
            onSelectBuilding={setDestinationBuilding}
            label="Select Destination Building"
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowSelectors(!showSelectors)}
      >
        <Text style={styles.toggleButtonText}>
          {showSelectors ? '▼ Hide Selectors' : '▲ Show Selectors'}
        </Text>
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <MapWithDirections
          startBuilding={startBuilding}
          destinationBuilding={destinationBuilding}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        />
      </View>

      {startBuilding && destinationBuilding && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            From: {startBuilding.name} → To: {destinationBuilding.name}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  selectorsContainer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  routeInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

