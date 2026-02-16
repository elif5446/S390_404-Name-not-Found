import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/types/indoor";

import MapContent from "./IndoorMap";
import FloorPicker from "./FloorPicker";
import { styles } from "@/src/styles/IndoorMap.styles";

interface Props {
  buildingData: BuildingIndoorConfig;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [isSwitching, setIsSwitching] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

  const activeFloor = useMemo(
    () => buildingData.floors.find((f) => f.level === currentLevel),
    [buildingData.floors, currentLevel],
  );

  // calculate Aspect Ratio strictly based on Geodata
  // returns a safe height or defaults to screen height if data is missing
  const contentHeight = useMemo(() => {
    if (!activeFloor || !activeFloor.bounds) return height;

    const { northEast, southWest } = activeFloor.bounds;
    const latDiff = Math.abs(northEast.latitude - southWest.latitude);
    const lonDiff = Math.abs(northEast.longitude - southWest.longitude);

    if (latDiff < 0.00001 || lonDiff < 0.00001) return height;

    // adjust longitude for latitude (Geographic projection correction)
    const latRadians = (northEast.latitude * Math.PI) / 180;
    const lonScale = Math.cos(latRadians);
    const geographicRatio = (lonDiff * lonScale) / latDiff;

    const calculatedHeight = width / geographicRatio;
    return isFinite(calculatedHeight) ? calculatedHeight : height;
  }, [activeFloor, width, height]);

  // inital fade in
  useEffect(() => {
    isMounted.current = true;

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    return () => {
      isMounted.current = false;
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  // floor transtion
  const handleFloorChange = useCallback(
    (level: number) => {
      if (level === currentLevel) return;

      fadeAnim.stopAnimation();
      setIsSwitching(true);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !isMounted.current) return;
        setCurrentLevel(level);

        requestAnimationFrame(() => {
          if (!isMounted.current) return;
          zoomRef.current?.zoomTo(1);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start(({ finished: fadeInFinished }) => {
            if (fadeInFinished && isMounted.current) {
              setIsSwitching(false);
            }
          });
        });
      });
    },
    [currentLevel, fadeAnim],
  );

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
        <TouchableOpacity onPress={onExit} style={{ padding: 20 }}>
          <Text>Exit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
          <ReactNativeZoomableView
            ref={zoomRef}
            maxZoom={3.0}
            minZoom={1.0}
            zoomStep={0.5}
            initialZoom={1.0}
            bindToBorders={true}
            visualTouchFeedbackEnabled={false} // Disables tap ripple effects
            contentWidth={width}
            contentHeight={contentHeight}
          >
            <MapContent
              floor={activeFloor}
              width={width}
              height={contentHeight}
            />
          </ReactNativeZoomableView>
        </Animated.View>
      </View>

      <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
        <View style={styles.headerContent}>
          <Text style={styles.buildingTitle} numberOfLines={1}>
            {buildingData.name}
          </Text>
          <View style={styles.floorBadge}>
            <Text style={styles.floorTitle}>Floor {activeFloor.label}</Text>
          </View>
        </View>
      </SafeAreaView>

      <FloorPicker
        floors={buildingData.floors}
        currentFloor={currentLevel}
        onFloorSelect={handleFloorChange}
      />

      <View style={styles.footerContainer}>
        <TouchableOpacity
          onPress={onExit}
          style={styles.exitButton}
          activeOpacity={0.8}
          accessibilityLabel="Exit Map"
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IndoorMapOverlay;
