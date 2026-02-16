import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { FloorData } from '@/src/types/indoor';
import { styles } from '@/src/styles/IndoorMap.styles';

interface Props {
  floors: FloorData[];
  currentFloor: number;
  onFloorSelect: (level: number) => void;
}

const FloorPicker: React.FC<Props> = ({ floors, currentFloor, onFloorSelect }) => {
  // sort floors once when data changes desc
  const sortedFloors = useMemo(() => {
    return [...floors].sort((a, b) => b.level - a.level);
  }, [floors]);

  if (!sortedFloors.length) return null;

  return (
    <View style={styles.pickerContainer}>
      <View style={styles.glassPanel}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {sortedFloors.map((floor) => {
            const isActive = floor.level === currentFloor;
            return (
              <TouchableOpacity
                key={floor.level}
                style={[styles.floorButton, isActive && styles.activeButton]}
                onPress={() => onFloorSelect(floor.level)}
                activeOpacity={0.7}
                accessibilityLabel={`Floor ${floor.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.pickerText, isActive && styles.activePickerText]}>
                  {floor.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default React.memo(FloorPicker);
