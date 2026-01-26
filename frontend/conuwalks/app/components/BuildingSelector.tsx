import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Building {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface BuildingSelectorProps {
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (building: Building) => void;
  label: string;
}

const BuildingSelector: React.FC<BuildingSelectorProps> = ({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  label,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {buildings.map((building) => (
          <TouchableOpacity
            key={building.id}
            style={[
              styles.buildingButton,
              selectedBuilding?.id === building.id && styles.selectedBuilding,
            ]}
            onPress={() => onSelectBuilding(building)}
          >
            <Text
              style={[
                styles.buildingText,
                selectedBuilding?.id === building.id && styles.selectedBuildingText,
              ]}
            >
              {building.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  buildingButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedBuilding: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  buildingText: {
    fontSize: 14,
    color: '#333',
  },
  selectedBuildingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BuildingSelector;
