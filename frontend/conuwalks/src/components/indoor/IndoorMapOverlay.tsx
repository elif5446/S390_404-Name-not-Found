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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { Ionicons } from "@expo/vector-icons";

// Services & Types
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { Node } from "@/src/indoors/types/Navigation";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// Components & Metadata
import MapContent from "./IndoorMap";
import DestinationMarker from "./DestinationMarker";
import IndoorRoomLabels from "./IndoorRoomLabels";
import FloorPicker from "./FloorPicker";
import IndoorBottomPanel from "./IndoorTopPanel";
import { styles } from "@/src/styles/IndoorMap.styles";

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
  return Number.isFinite(calculatedHeight) ? calculatedHeight : screenHeight;
};

interface Props {
  buildingData: BuildingIndoorConfig;
  onExit: () => void;
}

interface Props {
  buildingData: BuildingIndoorConfig;
  startBuildingId?: string | null;
  startRoomId?: string | null;
  destinationBuildingId?: string | null;
  destinationRoomId?: string | null;
  onSetStartRoom?: (roomLabel: string) => void;
  onSetDestinationRoom?: (roomLabel: string) => void;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({
  buildingData,
  startBuildingId,
  startRoomId,
  destinationBuildingId,
  destinationRoomId,
  onExit,
}) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [destination, setDestination] = useState<IndoorDestination | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

  const indoorService = useRef(new IndoorMapService()).current;
  useEffect(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (navConfig) indoorService.loadBuilding(navConfig);
  }, [buildingData.id, indoorService]);

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

  const offsetX = useMemo(
    () => (width - renderedWidth) / 2,
    [width, renderedWidth],
  );
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

    return () => {
      isMounted.current = false;
    };
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

  const [baseStartNode, setBaseStartNode] = useState<Node | null>(null);
  useEffect(() => {
    let sNode = null;
    if (startBuildingId === buildingData.id && startRoomId) {
      sNode = indoorService.getNodeByRoomNumber(buildingData.id, startRoomId);
    }
    if (!sNode)
      sNode = indoorService.getEntranceNode() || indoorService.getStartNode();
    setBaseStartNode(sNode);
  }, [buildingData.id, startBuildingId, startRoomId, indoorService]);

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
          <ReactNativeZoomableView
            ref={zoomRef}
            maxZoom={3}
            minZoom={1}
            zoomStep={0.5}
            initialZoom={1}
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

              {/* Markers */}
              {destination && destination.floorLevel === currentLevel && (
                <DestinationMarker
                  x={offsetX + destination.x * scale - 6}
                  y={offsetY + destination.y * scale + 2}
                />
              )}

              {baseStartNode && baseStartNode.floorId === activeFloor.id && (
                <View
                  style={{
                    position: "absolute",
                    left: offsetX + baseStartNode.x * scale - 12,
                    top: offsetY + baseStartNode.y * scale - 12,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#B03060BF",
                    borderWidth: 3,
                    borderColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 4,
                    zIndex: 1005,
                  }}
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
        }}
        onPress={onExit}
      >
        <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
      </TouchableOpacity>

      <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
        <View
          style={styles.headerContent}
          accessible={true}
          accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}
        >
          <Text
            style={styles.buildingTitle}
            numberOfLines={1}
            accessibilityRole="header"
          >
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
