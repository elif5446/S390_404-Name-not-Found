import { View, StyleSheet, StatusBar } from "react-native";
import React, { useState } from 'react';
import CampusMap from "@/src/components/CampusMap";
import StatusGradient from "@/src/components/StatusGradient";
import SegmentedToggle from "@/src/components/SegmentedToggle";
import { useDirections } from "@/src/context/DirectionsContext";

export default function HomeScreen() {
  const [campus, setCampus] = useState<'SGW' | 'Loyola'>('SGW');
  const [isInfoPopupExpanded, setIsInfoPopupExpanded] = useState(false);
  const { isNavigationActive } = useDirections();

  return (
    <View style={styles.container}>
      <View key={campus} style={styles.mapWrapper}>
        {campus === 'SGW' && <CampusMap initialLocation={{ latitude: 45.49599, longitude: -73.57854 }} onInfoPopupExpansionChange={setIsInfoPopupExpanded} /> ||
        campus === 'Loyola' && <CampusMap initialLocation={{ latitude: 45.45846, longitude: -73.63999 }} onInfoPopupExpansionChange={setIsInfoPopupExpanded} />}
      </View>
      <StatusGradient/>
      {!isNavigationActive && (
        <View style={{ opacity: isInfoPopupExpanded ? 0.4 : 1 }}>
          <SegmentedToggle campus={campus} setCampus={setCampus}/>
        </View>
      )}
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Full-screen height
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject, // top, left, right, bottom = 0
  }
});