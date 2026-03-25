import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/src/styles/IndoorMap.styles";

const IndoorMapHeader = React.memo(({ buildingData, activeFloor, currentLevel, onFloorChange, onExit, isProgrammaticDismissRef }: any) => {
  return (
    <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
      <View style={styles.headerContent} accessible={true} accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}>
        <View style={[styles.headerTitleWrap, { flexDirection: "row", alignItems: "center" }]}>
          <TouchableOpacity
            onPress={() => !isProgrammaticDismissRef.current && onExit()}
            style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 4 }}
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
          {buildingData.floors.map((floor: any) => {
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
});

IndoorMapHeader.displayName = "IndoorMapHeader";

export default IndoorMapHeader;
