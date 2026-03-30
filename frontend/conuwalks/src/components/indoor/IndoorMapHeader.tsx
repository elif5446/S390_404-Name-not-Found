import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { styles } from "@/src/styles/IndoorMap.styles"; // Your existing external styles

type FloorData = BuildingIndoorConfig["floors"][0];

export interface IndoorMapHeaderProps {
  buildingData: BuildingIndoorConfig;
  activeFloor: FloorData;
  currentLevel: number;
  onFloorChange: (level: number) => void;
  onExit: () => void;
  isProgrammaticDismissRef: React.RefObject<boolean>;
}

const IndoorMapHeader = React.memo(
  ({ buildingData, activeFloor, currentLevel, onFloorChange, onExit, isProgrammaticDismissRef }: IndoorMapHeaderProps) => {
    return (
      <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
        <View style={styles.headerContent} accessible={true} accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}>
          <View style={[styles.headerTitleWrap, localStyles.titleRow]}>
            <TouchableOpacity
              onPress={() => !isProgrammaticDismissRef.current && onExit()}
              style={localStyles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
            </TouchableOpacity>

            <Text style={styles.buildingTitle} numberOfLines={1} accessibilityRole="header">
              {buildingData.name}
            </Text>
          </View>

          <View style={styles.headerFloorToggleRow}>
            {/* Swapped "any" for "FloorData" for strict typing */}
            {buildingData.floors.map((floor: FloorData) => {
              const isActive = floor.level === currentLevel;
              return (
                <TouchableOpacity
                  key={floor.level}
                  onPress={() => onFloorChange(floor.level)}
                  style={isActive ? styles.headerFloorToggleActive : styles.headerFloorToggle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Switch to floor ${floor.label}`}
                >
                  <Text style={isActive ? styles.headerFloorToggleTextActive : styles.headerFloorToggleText}>{floor.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

IndoorMapHeader.displayName = "IndoorMapHeader";

// Create a local StyleSheet for component-specific layout tweaks
const localStyles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 4,
  },
});

export default IndoorMapHeader;
