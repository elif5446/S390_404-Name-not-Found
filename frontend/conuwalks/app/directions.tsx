import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../config/api';

interface Building {
  id: string;
  name: string;
  campus: 'SGW' | 'Loyola';
  address: string;
  latitude: number;
  longitude: number;
}

interface DirectionsResponse {
  start: Building;
  destination: Building;
  distance_km: number;
  estimated_time_minutes: number;
  instructions: string[];
  requires_shuttle: boolean;
}

export default function DirectionsScreen() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [startBuilding, setStartBuilding] = useState<string>('');
  const [destinationBuilding, setDestinationBuilding] = useState<string>('');
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingBuildings, setLoadingBuildings] = useState<boolean>(true);

  // Fetch buildings on mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/buildings`);
      if (!response.ok) throw new Error('Failed to fetch buildings');
      const data = await response.json();
      setBuildings(data);
      setLoadingBuildings(false);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      Alert.alert('Error', 'Failed to load buildings. Make sure the backend is running.');
      setLoadingBuildings(false);
    }
  };

  const getDirections = async () => {
    if (!startBuilding || !destinationBuilding) {
      Alert.alert('Error', 'Please select both start and destination buildings');
      return;
    }

    if (startBuilding === destinationBuilding) {
      Alert.alert('Error', 'Start and destination cannot be the same');
      return;
    }

    setLoading(true);
    setDirections(null);

    try {
      const response = await fetch(`${API_BASE_URL}/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_building_id: startBuilding,
          destination_building_id: destinationBuilding,
        }),
      });

      if (!response.ok) throw new Error('Failed to get directions');
      const data = await response.json();
      setDirections(data);
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert('Error', 'Failed to get directions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBuildingsByCampus = (campus: 'SGW' | 'Loyola') => {
    return buildings.filter((b) => b.campus === campus);
  };

  if (loadingBuildings) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#912338" />
        <Text style={styles.loadingText}>Loading buildings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ConuWalks Directions</Text>
        <Text style={styles.subtitle}>Get directions between SGW and Loyola campuses</Text>

        {/* Start Building Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Start Location</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={startBuilding}
              onValueChange={(value) => setStartBuilding(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select a building..." value="" />
              <Picker.Item label="--- SGW Campus ---" value="" enabled={false} />
              {getBuildingsByCampus('SGW').map((building) => (
                <Picker.Item
                  key={building.id}
                  label={`${building.id} - ${building.name}`}
                  value={building.id}
                />
              ))}
              <Picker.Item label="--- Loyola Campus ---" value="" enabled={false} />
              {getBuildingsByCampus('Loyola').map((building) => (
                <Picker.Item
                  key={building.id}
                  label={`${building.id} - ${building.name}`}
                  value={building.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Destination Building Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Destination</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={destinationBuilding}
              onValueChange={(value) => setDestinationBuilding(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select a building..." value="" />
              <Picker.Item label="--- SGW Campus ---" value="" enabled={false} />
              {getBuildingsByCampus('SGW').map((building) => (
                <Picker.Item
                  key={building.id}
                  label={`${building.id} - ${building.name}`}
                  value={building.id}
                />
              ))}
              <Picker.Item label="--- Loyola Campus ---" value="" enabled={false} />
              {getBuildingsByCampus('Loyola').map((building) => (
                <Picker.Item
                  key={building.id}
                  label={`${building.id} - ${building.name}`}
                  value={building.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Get Directions Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (!startBuilding || !destinationBuilding || loading) && styles.buttonDisabled,
          ]}
          onPress={getDirections}
          disabled={!startBuilding || !destinationBuilding || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Directions</Text>
          )}
        </TouchableOpacity>

        {/* Directions Display */}
        {directions && (
          <View style={styles.directionsContainer}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Route Information</Text>
              {directions.requires_shuttle && (
                <View style={styles.shuttleBadge}>
                  <Text style={styles.shuttleBadgeText}>🚌 Shuttle Required</Text>
                </View>
              )}
            </View>

            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                📍 From: {directions.start.name} ({directions.start.campus})
              </Text>
              <Text style={styles.routeInfoText}>
                🎯 To: {directions.destination.name} ({directions.destination.campus})
              </Text>
              <Text style={styles.routeInfoText}>
                📏 Distance: {directions.distance_km} km
              </Text>
              <Text style={styles.routeInfoText}>
                ⏱️ Estimated Time: {directions.estimated_time_minutes} minutes
              </Text>
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Directions:</Text>
              {directions.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#912338',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#912338',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  directionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  shuttleBadge: {
    backgroundColor: '#FFA500',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  shuttleBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  routeInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeInfoText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  instructionsContainer: {
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#912338',
    color: '#fff',
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
