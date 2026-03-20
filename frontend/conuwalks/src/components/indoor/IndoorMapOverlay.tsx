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
import DestinationMarker from "./DestinationMarker";
import POIFilterPanel from "./POIFilterPanel";
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

const MAP_POI_BADGE_SIZE = 18;

const RouteDotsOverlay = ({
  sourcePOI,
  destinationPOI,
  mapWidth,
  mapHeight,
  currentLevel,
}: {
  sourcePOI: POI | null;
  destinationPOI: POI | null;
  mapWidth: number;
  mapHeight: number;
  currentLevel: number;
}) => {
  if (!sourcePOI || !destinationPOI) return null;
  if (sourcePOI.floor !== destinationPOI.floor) return null;
  if (sourcePOI.floor !== currentLevel) return null;

  const startX = sourcePOI.mapPosition.x * mapWidth;
  const startY = sourcePOI.mapPosition.y * mapHeight;
  const endX = destinationPOI.mapPosition.x * mapWidth;
  const endY = destinationPOI.mapPosition.y * mapHeight;

  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const dotCount = Math.max(10, Math.round(distance / 22));

  return (
    <View style={{ ...styles.floorImage, position: "absolute" }} pointerEvents="none">
      {Array.from({ length: dotCount + 1 }).map((_, i) => {
        const t = i / dotCount;
        const x = startX + dx * t;
        const y = startY + dy * t;

        return (
          <View
            key={`route-dot-${i}`}
            style={{
              position: "absolute",
              left: x - 2,
              top: y - 2,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E5486B",
              opacity: 0.92,
            }}
          />
        );
      })}
    </View>
  );
};

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [headerHeight, setHeaderHeight] = useState(72);
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
    setActiveCategories(
      new Set(getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM")),
    );
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

    const roomHotspots = navConfig.floors.flatMap((floor) =>
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

    // Room 836 exists in POI data (shared washroom) but has no room node in Hall graph.
    if (buildingData.id === "H") {
      const hasRoom836 = roomHotspots.some(
        (spot) => spot.floorLevel === 8 && spot.label.replace("Room ", "") === "836",
      );

      if (!hasRoom836) {
        const room836Poi = getPOIsForFloor("H", 8).find((poi) => poi.room === "836");
        if (room836Poi) {
          roomHotspots.push({
            id: "H_836",
            x: Math.round(room836Poi.mapPosition.x * 1024),
            y: Math.round(room836Poi.mapPosition.y * 1024),
            floorLevel: 8,
            label: "Room 836",
          });
        }
      }
    }

    return roomHotspots;
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

  // --- DEBUG UI: Show POI info for H-9 ---
  // (DEBUG UI REMOVED)
  // --- END DEBUG UI ---

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

              {nonRoomPOIs
                .filter((poi) => activeCategories.has(poi.category))
                .map((poi) => {
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

              <RouteDotsOverlay
                sourcePOI={sourcePOI}
                destinationPOI={destinationPOI}
                mapWidth={width}
                mapHeight={contentHeight}
                currentLevel={currentLevel}
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
    </View>
  );
  
};

export default IndoorMapOverlay;

