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
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";

import MapContent from "./IndoorMap";
import POIBadge from "./POIBadge";
import POIFilterPanel from "./POIFilterPanel";
import IndoorDirectionsPanel from "./IndoorDirectionsPanel";
import { styles } from "@/src/styles/IndoorMap.styles";
import { POI_PALETTE } from "@/src/styles/IndoorPOI.styles";

/** Simulated starting room — in a real app this comes from the user's location */
const DEFAULT_STARTING_ROOM = "841";
const MAP_POI_BADGE_SIZE = 18;

const calculateGeographicHeight = (
  bounds:
    | {
        northEast: { latitude: number; longitude: number };
        southWest: { latitude: number; longitude: number };
      }
    | undefined,
  screenWidth: number,
  screenHeight: number,
): number => {
  if (!bounds) return screenHeight;

  const { northEast, southWest } = bounds;
  const latDiff = Math.abs(northEast.latitude - southWest.latitude);
  const lonDiff = Math.abs(northEast.longitude - southWest.longitude);

  if (latDiff < 0.00001 || lonDiff < 0.00001) return screenHeight;

  const latRadians = (northEast.latitude * Math.PI) / 180;
  const lonScale = Math.cos(latRadians);
  const geographicRatio = (lonDiff * lonScale) / latDiff;

  const calculatedHeight = screenWidth / geographicRatio;
  return isFinite(calculatedHeight) ? calculatedHeight : screenHeight;
};

interface Props {
  buildingData: BuildingIndoorConfig;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [headerHeight, setHeaderHeight] = useState(72);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

  //  POI state 
  const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">("DESTINATION");
  const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
  const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

  const poisForFloor = useMemo(
    () => getPOIsForFloor(buildingData.id, currentLevel),
    [buildingData.id, currentLevel],
  );

  const categoriesForFloor = useMemo(
    () => getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM"),
    [buildingData.id, currentLevel],
  );

  const roomPOIs = useMemo(
    () => poisForFloor.filter((p) => p.category === "ROOM"),
    [poisForFloor],
  );

  const nonRoomPOIs = useMemo(
    () => poisForFloor.filter((p) => p.category !== "ROOM"),
    [poisForFloor],
  );

  const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(
    () => new Set(categoriesForFloor),
  );

  // Re-initialise filters when the floor changes
  useEffect(() => {
    setActiveCategories(new Set(getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM")));
    setSourcePOI(null);
    setDestinationPOI(null);
  }, [currentLevel, buildingData.id]);

  const handleToggleCategory = useCallback((cat: POICategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleSelectPOI = useCallback(
    (poi: POI) => {
      if (routeTargetMode === "SOURCE") {
        setSourcePOI(poi);
      } else {
        setDestinationPOI(poi);
      }
    },
    [routeTargetMode],
  );

  const handleCloseDirections = useCallback(() => setDestinationPOI(null), []);

  //  Floor data 
  const activeFloor = useMemo(
    () => buildingData.floors.find((f) => f.level === currentLevel),
    [buildingData.floors, currentLevel],
  );

  const contentHeight = useMemo(
    () => calculateGeographicHeight(activeFloor?.bounds, width, height),
    [activeFloor, width, height],
  );

  //  Animations 
  useEffect(() => {
    isMounted.current = true;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    return () => { isMounted.current = false; };
  }, [fadeAnim]);

  useEffect(() => {
    if (!isMounted.current) return;
    zoomRef.current?.zoomTo(1);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [currentLevel, fadeAnim]);

  const handleFloorChange = useCallback(
    (level: number) => {
      if (level === currentLevel) return;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isMounted.current) setCurrentLevel(level);
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

  const visiblePOIs = [
    ...roomPOIs,
    ...nonRoomPOIs.filter((p) => activeCategories.has(p.category)),
  ];

  return (
    <View style={styles.container}>
      {/*  Map area  */}
      <View style={{ flex: 1, position: "relative" }}>
        <View style={[styles.mapContainer, { marginTop: headerHeight }]}>
          <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
            <ReactNativeZoomableView
              ref={zoomRef}
              maxZoom={3.0}
              minZoom={1.0}
              zoomStep={0.5}
              initialZoom={1.0}
              bindToBorders={true}
              visualTouchFeedbackEnabled={false}
              contentWidth={width}
              contentHeight={contentHeight}
            >
              <View style={{ width, height: contentHeight }}>
                <MapContent
                  floor={activeFloor}
                  width={width}
                  height={contentHeight}
                />

                {/* POI badges rendered in map content coordinates */}
                {visiblePOIs.map((poi) => {
                  const selectionType =
                    destinationPOI?.id === poi.id
                      ? "destination"
                      : sourcePOI?.id === poi.id
                        ? "source"
                        : undefined;

                  return (
                    <POIBadge
                      key={poi.id}
                      poi={poi}
                      left={poi.mapPosition.x * width - MAP_POI_BADGE_SIZE / 2}
                      top={poi.mapPosition.y * contentHeight - MAP_POI_BADGE_SIZE / 2}
                      size={MAP_POI_BADGE_SIZE}
                      selectionType={selectionType}
                      onPress={handleSelectPOI}
                    />
                  );
                })}

                {/* Route overlay in map content coordinates */}
                {destinationPOI ? (
                  <RouteDotsOverlay
                    sourcePOI={sourcePOI}
                    destinationPOI={destinationPOI}
                    mapWidth={width}
                    mapHeight={contentHeight}
                  />
                ) : null}
              </View>
            </ReactNativeZoomableView>
          </Animated.View>
        </View>

        {/* Header chrome */}
        <SafeAreaView
          style={styles.headerWrapper}
          edges={["top"]}
          onLayout={(event: LayoutChangeEvent) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            if (nextHeight > 0 && nextHeight !== headerHeight) {
              setHeaderHeight(nextHeight);
            }
          }}
        >
          <View
            style={styles.headerContent}
            accessible={true}
            accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}
          >
            <View style={styles.headerTitleWrap}>
              <Text
                style={styles.buildingTitle}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {buildingData.name}
              </Text>
            </View>
            <View style={styles.headerFloorToggleRow}>
              {buildingData.floors.map((floor) => {
                const isActive = floor.level === currentLevel;
                return (
                  <TouchableOpacity
                    key={floor.level}
                    onPress={() => handleFloorChange(floor.level)}
                    style={isActive ? styles.headerFloorToggleActive : styles.headerFloorToggle}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Switch to floor ${floor.label}`}
                  >
                    <Text style={isActive ? styles.headerFloorToggleTextActive : styles.headerFloorToggleText}>
                      {floor.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>

        <View style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          zIndex: 6000,
        }}>
          <TouchableOpacity
            onPress={onExit}
            style={{ alignItems: "center" }}
            activeOpacity={0.8}
            accessibilityLabel="Exit Map"
            accessibilityRole="button"
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#912F40",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#fff",
            }}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
            <Text style={{
              color: "#912F40",
              fontSize: 11,
              fontWeight: "700",
              marginTop: 2,
            }}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom panel: directions OR POI list  */}
      {destinationPOI ? (
        <IndoorDirectionsPanel
          poi={destinationPOI}
          startingRoom={DEFAULT_STARTING_ROOM}
          sourcePOI={sourcePOI}
          onClose={handleCloseDirections}
        />
      ) : (
        <POIFilterPanel
          pois={nonRoomPOIs}
          categories={categoriesForFloor}
          activeCategories={activeCategories}
          floorLabel={activeFloor.label}
          targetMode={routeTargetMode}
          sourcePOI={sourcePOI}
          destinationPOI={destinationPOI}
          onTargetModeChange={setRouteTargetMode}
          onToggleCategory={handleToggleCategory}
          onSelectPOI={handleSelectPOI}
        />
      )}
    </View>
  );
};

// ── Route dots overlay ────────────────────────────────────────────────────────
interface RouteDotsProps {
  sourcePOI: POI | null;
  destinationPOI: POI;
  mapWidth: number;
  mapHeight: number;
}

const DOT_COUNT = 14;

const RouteDotsOverlay: React.FC<RouteDotsProps> = ({
  sourcePOI,
  destinationPOI,
  mapWidth,
  mapHeight,
}) => {
  const startX = sourcePOI ? sourcePOI.mapPosition.x * mapWidth : mapWidth * 0.5;
  const startY = sourcePOI ? sourcePOI.mapPosition.y * mapHeight : mapHeight * 0.88;
  const endX = destinationPOI.mapPosition.x * mapWidth;
  const endY = destinationPOI.mapPosition.y * mapHeight;

  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i <= DOT_COUNT; i++) {
    const t = i / DOT_COUNT;
    dots.push({ x: startX + (endX - startX) * t, y: startY + (endY - startY) * t });
  }

  return (
    <>
      {dots.map((d, idx) => (
        <View
          key={idx}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: d.x - 5,
            top: d.y - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: POI_PALETTE.pink,
            opacity: 0.82,
          }}
        />
      ))}
      {/* Start marker */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: startX - 10,
          top: startY - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: sourcePOI ? "#3A7BD5" : POI_PALETTE.pink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
          {sourcePOI ? "S" : "A"}
        </Text>
      </View>
      {/* Destination marker */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: endX - 10,
          top: endY - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: POI_PALETTE.pink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>B</Text>
      </View>
    </>
  );
};

export default IndoorMapOverlay;

