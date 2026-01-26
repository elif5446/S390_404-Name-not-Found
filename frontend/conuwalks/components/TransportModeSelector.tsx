import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TransportMode = 'walk' | 'bike' | 'car' | 'public_transportation';

interface TransportModeSelectorProps {
  selectedMode: TransportMode;
  onModeSelect: (mode: TransportMode) => void;
}

const transportModes: { mode: TransportMode; label: string; icon: string }[] = [
  { mode: 'walk', label: 'Walk', icon: '🚶' },
  { mode: 'bike', label: 'Bike', icon: '🚴' },
  { mode: 'car', label: 'Car', icon: '🚗' },
  { mode: 'public_transportation', label: 'Transit', icon: '🚌' },
];

export default function TransportModeSelector({ selectedMode, onModeSelect }: TransportModeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Transportation Mode</Text>
      <View style={styles.modesContainer}>
        {transportModes.map(({ mode, label, icon }) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              selectedMode === mode && styles.selectedModeButton,
            ]}
            onPress={() => onModeSelect(mode)}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[
              styles.label,
              selectedMode === mode && styles.selectedLabel,
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#0051D5',
  },
  icon: {
    fontSize: 32,
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  selectedLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
