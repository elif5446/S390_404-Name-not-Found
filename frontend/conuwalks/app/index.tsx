import { View, StyleSheet } from "react-native";
import React from 'react';
import CampusMap from "@/src/components/CampusMap";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CampusMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});