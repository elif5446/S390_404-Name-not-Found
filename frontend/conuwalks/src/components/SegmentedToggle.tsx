import { View, Platform, useColorScheme } from "react-native";
import React from "react";
import SegmentedControl from "@react-native-segmented-control/segmented-control"; 
import { SegmentedButtons } from "react-native-paper"; 
import styles from "@/src/styles/segmentedToggle";
import { BlurView } from "expo-blur"; 
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SegmentedToggle = ({
  campus,
  setCampus,
}: {
  campus: "SGW" | "Loyola";
  setCampus: (campus: "SGW" | "Loyola") => void;
}) => {
  const mode = useColorScheme() || "light";
  return (
    <View style={[styles.overlay, { paddingTop: useSafeAreaInsets().top + 10 }]}>
      {(Platform.OS === "ios" && (
        <View style={styles.shadowiOS}>
          <BlurView intensity={10} tint="light" style={styles.blurContainer}>
            <SegmentedControl
              values={["Sir George Williams", "Loyola"]}
              selectedIndex={campus === "SGW" ? 0 : 1}
              onChange={(event) => {
                setCampus(event.nativeEvent.selectedSegmentIndex === 0 ? "SGW" : "Loyola");
              }}
              tintColor="#B03060CC"
              appearance={mode}
              backgroundColor="transparent"
              activeFontStyle={{ color: mode === "light" ? "white" : "black", fontWeight: "600" }}
              fontStyle={{ color: mode === "light" ? "black" : "white" }}
              style={styles.segmentedIos}
            />
          </BlurView>
        </View>
      )) || (Platform.OS === "android" && (
          <View style={[styles.shadowAndroid, { backgroundColor: mode === "dark" ? "#1C1B1F" : "#FFFFFF" }]}>
            <SegmentedButtons
              value={campus}
              onValueChange={setCampus}
              buttons={[
                {
                  value: "SGW",
                  label: "Sir George Williams",
                  showSelectedCheck: true,
                  accessibilityLabel: "Go to Sir George Williams Campus",
                },
                {
                  value: "Loyola",
                  label: "Loyola",
                  showSelectedCheck: true,
                  accessibilityLabel: "Go to Loyola Campus",
                },
              ]}
              theme={{
                colors: {
                  secondaryContainer: "#B03060",
                  onSecondaryContainer: mode === "dark" ? "#1C1B1F" : "#FFFFFF",
                  onSurface: mode === "dark" ? "#FFFFFF" : "#1C1B1F",
                  outline: "rgba(121, 116, 126, 0.3)",
                },
              }}
            />
          </View>
        )) || <View />}
    </View>
  );
};

export default SegmentedToggle;