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
  Animated,
  useWindowDimensions,
 TouchableOpacity,
} from "react-native";import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import MapContent from "./IndoorMap";
import FloorPicker from "./FloorPicker";
import DestinationMarker from "./DestinationMarker";
import IndoorBottomPanel from "./IndoorTopPanel";
import IndoorRoomLabels from "./IndoorRoomLabels";
import { styles } from "@/src/styles/IndoorMap.styles";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

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
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  const SVG_SIZE = 1024;

  const scale = useMemo(() => {
    return Math.min(width / SVG_SIZE, contentHeight / SVG_SIZE);
  }, [width, contentHeight]);

  const renderedWidth = useMemo(() => SVG_SIZE * scale, [scale]);
  const renderedHeight = useMemo(() => SVG_SIZE * scale, [scale]);

  const offsetX = useMemo(() => (width - renderedWidth) / 2, [width, renderedWidth]);
  const offsetY = useMemo(
    () => (contentHeight - renderedHeight) / 2,
    [contentHeight, renderedHeight],
  );

  const hotspots = useMemo<IndoorHotspot[]>(() => {
    const navConfig = navConfigRegistry[buildingData.id];

    if (!navConfig) return [];

    return navConfig.floors.flatMap((floor) =>
      floor.nodes
        .filter((node) => node.type === "room")
        .map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          floorLevel: parseInt(node.floorId.split("_")[1], 10),
          label: node.label ?? node.id,
        })),
    );
  }, [buildingData.id]);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    return hotspots.filter((spot) => {
      const fullLabel = spot.label.toLowerCase();
      const shortLabel = spot.label.replace("Room ", "").toLowerCase();
      const id = spot.id.toLowerCase();

      return (
        fullLabel.includes(query) ||
        shortLabel.includes(query) ||
        id.includes(query)
      );
    });
  }, [hotspots, searchQuery]);

  const handleSetDestination = useCallback((item: IndoorDestination) => {
    setDestination(item);
    setCurrentLevel(item.floorLevel);
    setSearchQuery(item.label ?? item.id);
    setShowSearchResults(false);
  }, []);

  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setSearchQuery("");
    setShowSearchResults(false);
  }, []);

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
        if (finished && isMounted.current) {
          setCurrentLevel(level);
        }
      });
    },
    [currentLevel, fadeAnim],
  );

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  const visiblePOIs = [
    ...roomPOIs,
    ...nonRoomPOIs.filter((p) => activeCategories.has(p.category)),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
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

              <IndoorRoomLabels
                hotspots={hotspots}
                currentLevel={currentLevel}
                destination={destination}
                offsetX={offsetX}
                offsetY={offsetY}
                scale={scale}
                onSelectDestination={handleSetDestination}
              />

              {destination && destination.floorLevel === currentLevel && (
                <DestinationMarker
                  x={offsetX + destination.x * scale - 6}
                  y={offsetY + destination.y * scale + 2}
                />
              )}
            </View>
          </ReactNativeZoomableView>
        </Animated.View>
      </View>
  <TouchableOpacity
  // style={styles.floatingBackButton}
 style={{
    position: "absolute",
    top: 67,
    left: 16,
    zIndex: 9999,
    elevation: 20,
    padding: 8,
  }}  onPress={onExit}
>
  <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
</TouchableOpacity>

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

      <FloorPicker
        floors={buildingData.floors}
        currentFloor={currentLevel}
        onFloorSelect={handleFloorChange}
      />

      <IndoorBottomPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        filteredRooms={filteredRooms}
        onSelectDestination={handleSetDestination}
        onClearDestination={handleClearDestination}
      />
    </View>
  );
  
};

export default IndoorMapOverlay;

