import { View, StyleSheet, StatusBar } from "react-native";
import React, { useState } from 'react';
import CampusMap from "@/src/components/CampusMap";
import StatusGradient from "@/src/components/StatusGradient";
import SegmentedToggle from "@/src/components/SegmentedToggle";

export default function HomeScreen() {
  const [campus, setCampus] = useState<'SGW' | 'Loyola'>('SGW');
  return (
    <View style={styles.container}>
      <View key={campus} style={styles.mapWrapper}>
        {campus === 'SGW' && <CampusMap initialLocation={{ latitude: 45.49599, longitude: -73.57854 }} /> ||
        campus === 'Loyola' && <CampusMap initialLocation={{ latitude: 45.45805, longitude: -73.63987 }} />}
      </View>
      <StatusGradient/>
      <SegmentedToggle campus={campus} setCampus={setCampus}/>
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