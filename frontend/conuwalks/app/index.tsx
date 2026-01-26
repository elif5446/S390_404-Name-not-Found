import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import CampusMap from "./components/CampusMap";
import { CAMPUSES, Campus } from "./config/campusConfig";

export default function Index() {
  const [selectedCampus, setSelectedCampus] = useState<Campus>(CAMPUSES[0]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Concordia Campus Maps</Text>
        <View style={styles.buttonContainer}>
          {CAMPUSES.map((campus) => (
            <TouchableOpacity
              key={campus.id}
              style={[
                styles.button,
                selectedCampus.id === campus.id && styles.buttonActive,
              ]}
              onPress={() => setSelectedCampus(campus)}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedCampus.id === campus.id && styles.buttonTextActive,
                ]}
              >
                {campus.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <CampusMap key={selectedCampus.id} campus={selectedCampus} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    minWidth: 120,
  },
  buttonActive: {
    backgroundColor: "#0d6efd",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
  },
  buttonTextActive: {
    color: "#ffffff",
  },
});

