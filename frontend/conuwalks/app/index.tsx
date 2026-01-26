import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

// Sample building data - in a real app this would come from an API
const BUILDINGS = [
  { id: 'H', name: 'Hall Building', x: 50, y: 100 },
  { id: 'MB', name: 'John Molson Building', x: 200, y: 100 },
  { id: 'LB', name: 'J.W. McConnell Building', x: 50, y: 250 },
  { id: 'EV', name: 'Engineering, Computer Science and Visual Arts Building', x: 200, y: 250 },
  { id: 'GM', name: 'Guy-De Maisonneuve Building', x: 125, y: 400 },
];

type Building = typeof BUILDINGS[0];

export default function Index() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [startBuilding, setStartBuilding] = useState<Building | null>(null);
  const [destinationBuilding, setDestinationBuilding] = useState<Building | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setErrorMessage('');
  };

  const handleSetStart = () => {
    if (selectedBuilding) {
      // Check if start and destination are the same
      if (destinationBuilding && selectedBuilding.id === destinationBuilding.id) {
        const message = 'Start and destination buildings cannot be the same. Please select a different building.';
        setErrorMessage(message);
        Alert.alert('Same Building', message, [{ text: 'OK' }]);
        return;
      }
      setStartBuilding(selectedBuilding);
      setSelectedBuilding(null);
      setErrorMessage('');
    }
  };

  const handleSetDestination = () => {
    if (selectedBuilding) {
      // Check if start and destination are the same
      if (startBuilding && selectedBuilding.id === startBuilding.id) {
        const message = 'Start and destination buildings cannot be the same. Please select a different building.';
        setErrorMessage(message);
        Alert.alert('Same Building', message, [{ text: 'OK' }]);
        return;
      }
      setDestinationBuilding(selectedBuilding);
      setSelectedBuilding(null);
      setErrorMessage('');
    }
  };

  const getBuildingStyle = (building: Building) => {
    if (selectedBuilding?.id === building.id) {
      return [styles.building, styles.buildingSelected];
    }
    if (startBuilding?.id === building.id) {
      return [styles.building, styles.buildingStart];
    }
    if (destinationBuilding?.id === building.id) {
      return [styles.building, styles.buildingDestination];
    }
    return styles.building;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ConU Walks - Building Selection</Text>
        <Text style={styles.subtitle}>Click on a building to select it</Text>
      </View>

      {/* Status Display */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Start</Text>
          <Text style={styles.statusValue}>
            {startBuilding ? `${startBuilding.name} (${startBuilding.id})` : 'Not selected'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Destination</Text>
          <Text style={styles.statusValue}>
            {destinationBuilding ? `${destinationBuilding.name} (${destinationBuilding.id})` : 'Not selected'}
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Map View with Buildings */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Campus Map</Text>
        <View style={styles.map}>
          {BUILDINGS.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={[
                getBuildingStyle(building),
                { position: 'absolute', left: building.x, top: building.y },
              ]}
              onPress={() => handleBuildingPress(building)}
            >
              <Text style={styles.buildingText}>{building.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      {selectedBuilding && (
        <View style={styles.actionContainer}>
          <Text style={styles.selectedText}>
            Selected: {selectedBuilding.name} ({selectedBuilding.id})
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.startButton} onPress={handleSetStart}>
              <Text style={styles.buttonText}>Set as Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.destinationButton} onPress={handleSetDestination}>
              <Text style={styles.buttonText}>Set as Destination</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFD700' }]} />
          <Text>Selected Building</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
          <Text>Start Building</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#2196F3' }]} />
          <Text>Destination Building</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  statusValue: {
    flex: 1,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 14,
  },
  mapContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  map: {
    height: 500,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  building: {
    width: 60,
    height: 60,
    backgroundColor: '#9E9E9E',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#757575',
  },
  buildingSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA000',
    borderWidth: 3,
  },
  buildingStart: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  buildingDestination: {
    backgroundColor: '#2196F3',
    borderColor: '#1565C0',
  },
  buildingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedText: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  destinationButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  legend: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendBox: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
});
