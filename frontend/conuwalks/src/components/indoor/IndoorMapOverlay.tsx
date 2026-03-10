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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import Svg, { Polyline as SvgPolyline, Circle, G } from "react-native-svg";
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";

import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { Route } from "@/src/indoors/types/Routes";
import { hallBuildingNavConfig } from "@/src/indoors/data/HallBuilding";
import { Node, BuildingNavConfig } from "@/src/indoors/types/Navigation";

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
  startRoomId?: string | null;
  destinationRoomId?: string | null;
  onSetStartRoom?: (roomLabel: string) => void;
  onSetDestinationRoom?: (roomLabel: string) => void;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({
  buildingData,
  startRoomId,
  destinationRoomId,
  onSetStartRoom,
  onSetDestinationRoom,
  onExit,
}) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

const [indoorRoute, setIndoorRoute] = useState<Route | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [baseStartNode, setBaseStartNode] = useState<Node | null>(null);

  const indoorService = useRef(new IndoorMapService()).current;

  // calculate route on mount
  useEffect(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (!navConfig) {
      console.warn(
        `[IndoorRouting] No navigation config found for building ID: ${buildingData.id}`,
      );
      return;
    }

    indoorService.loadBuilding(navConfig);
    let startNode = startRoomId
      ? indoorService.getNodeByRoomNumber(buildingData.id, startRoomId)
      : indoorService.getEntranceNode();

    let endNode = destinationRoomId
      ? indoorService.getNodeByRoomNumber(buildingData.id, destinationRoomId)
      : indoorService.getEntranceNode();

    // Fallback to default start if nothing is set
    if (!startNode) startNode = indoorService.getStartNode();

    setBaseStartNode(startNode);

    if (startNode && endNode && startNode.id !== endNode.id) {
      try {
        const route = indoorService.getRoute(startNode.id, endNode.id);
        setIndoorRoute(route);

        // Auto-switch to the floor where the route starts
        const startFloorLevel = buildingData.floors.find(
          (f) => f.id === startNode!.floorId,
        )?.level;
        if (startFloorLevel) setCurrentLevel(startFloorLevel);
      } catch (err) {
        console.warn("Could not calculate indoor route:", err);
      }
    } else {
      setIndoorRoute(null);
    }
  }, [buildingData.id, startRoomId, destinationRoomId, indoorService]);

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
const handleSvgPress = useCallback(
    (event: any) => {
      if (!activeFloor) return;
      // Get tap coordinates relative to the SVG view
      const { locationX, locationY } = event.nativeEvent;

      // Scale tap based on ZoomableView scaling if necessary, or let SVG handle intrinsic coordinates
      const nearestNode = indoorService.getNearestRoomNode(
        activeFloor.id,
        locationX,
        locationY,
      );

      if (nearestNode && nearestNode.label) {
        // If we don't have a start room yet, set it as start. Otherwise, set it as destination.
        if (!startRoomId && onSetStartRoom) {
          onSetStartRoom(nearestNode.label);
        } else if (onSetDestinationRoom) {
          onSetDestinationRoom(nearestNode.label);
        }
      }
    },
    [
      activeFloor,
      indoorService,
      startRoomId,
      onSetStartRoom,
      onSetDestinationRoom,
    ],
  );

  const isNodeOnFloor = (
    nodeFloorId: string | undefined,
    floor: typeof activeFloor,
  ) => {
    if (!floor || !nodeFloorId) return false;
    if (nodeFloorId === floor.id) return true;
    const extractedLevel = parseInt(nodeFloorId.split("_").pop() || "", 10);
    return extractedLevel === floor.level;
  };

  const activeFloorSegments = useMemo(() => {
    if (!indoorRoute || !activeFloor) return [];
    const segments: (typeof indoorRoute.nodes)[] = [];
    let currentSegment: typeof indoorRoute.nodes = [];

    indoorRoute.nodes.forEach((node) => {
      // Changed to use our safe floor matcher
      if (isNodeOnFloor(node.floorId, activeFloor)) {
        currentSegment.push(node);
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    });
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }, [indoorRoute, activeFloor]);

  const destinationNode = indoorRoute?.nodes[indoorRoute.nodes.length - 1];
  const isDestinationOnThisFloor = isNodeOnFloor(
    destinationNode?.floorId,
    activeFloor,
  );
  const displayNode = indoorRoute
    ? indoorRoute.nodes[activeNodeIndex]
    : baseStartNode;
  const isUserOnThisFloor = isNodeOnFloor(displayNode?.floorId, activeFloor);

  const handleFloorChange = useCallback(
    (level: number) => {
      if (level === currentLevel) return;

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // once the old map is entirely invisible, swap the state data
        if (finished && isMounted.current) {
          setCurrentLevel(level);
        }
      });
    },
    [currentLevel, fadeAnim],
  );

  useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    // inital fade in
    useEffect(() => {
      if (!isMounted.current) return;

      zoomRef.current?.zoomTo(1);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [currentLevel, fadeAnim]);


  useEffect(() => {
    if (!isMounted.current) return;

    zoomRef.current?.zoomTo(1);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [currentLevel, fadeAnim]);

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
