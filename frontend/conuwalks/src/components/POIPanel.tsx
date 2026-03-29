import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const PANEL_HEIGHT = 300;
const SNAP_POINTS = [0, PANEL_HEIGHT];

interface POIPanelProps {
  visible: boolean;
  onClose: () => void;
  onPOISelect?: (poiType: string) => void; 

}

const POIPanel: React.FC<POIPanelProps> = ({ visible, onClose, onPOISelect }) => {
    const translateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  // Slide panel in/out when `visible` changes
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : PANEL_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // PanResponder for drag
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(0, Math.min(PANEL_HEIGHT, gestureState.dy));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Snap to nearest point
        const threshold = PANEL_HEIGHT / 2;
        if (gestureState.dy > threshold) {
          // Close
          Animated.timing(translateY, {
            toValue: PANEL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Stay open
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const content = (
    <View style={styles.inner}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeButton}
        accessibilityLabel="Close POI panel"
      >
        <MaterialIcons name="close" size={26} color="#B03060" />
      </TouchableOpacity>

      <Text style={styles.title}>Outdoor POIs</Text>

      <View style={styles.list}>
        {["Restaurants", "Coffee shops", "Banks", "Hotels", "Libraries", "Bars"].map(
        (item) => (
            <Text
              key={item}
              style={styles.item}
              onPress={() => {
                onPOISelect?.(item); //  call the handler
                onClose();            //  close panel after selection
              }}
            >
              {item}
            </Text>
          )
        )}
      </View>
    </View>
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        { transform: [{ translateY }] },
        { zIndex: 999 },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={100} tint="light" style={styles.blur}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.androidFallback]}>{content}</View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
  },
  blur: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  androidFallback: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  inner: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#8B3A62", //#8B3A62
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
  },
  list: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  item: {
    fontSize: 17,
    color: "#8B3A62", //#8B3A62
    fontWeight: "500",
    textAlign: "center",
  },
});

export default POIPanel;