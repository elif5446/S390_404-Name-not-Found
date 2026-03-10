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
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import Svg, { Polyline as SvgPolyline, G } from "react-native-svg";
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";

import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { Route } from "@/src/indoors/types/Routes";
import { Node } from "@/src/indoors/types/Navigation";

import MapContent from "./IndoorMap";
import DestinationMarker from "./DestinationMarker";
import IndoorBottomPanel from "./IndoorTopPanel";
import IndoorRoomLabels from "./IndoorRoomLabels";
import { styles } from "@/src/styles/IndoorMap.styles";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";

import IndoorSearchSheet, {
  IndoorSearchSheetHandle,
} from "./IndoorSearchSheet";
import IndoorDirectionsSheet from "./IndoorDirectionsSheet";
import { Ionicons } from "@expo/vector-icons";

type IndoorState = "search" | "preview" | "navigating";

const calculateGeographicHeight = (
  bounds:
    | {
        northEast: { latitude: number; longitude: number };
        southWest: { latitude: number; longitude: number };
      }
    | undefined,
  screenWidth: number,
  fallbackHeight: number,
): number => {
  if (!bounds) return fallbackHeight;

  const { northEast, southWest } = bounds;
  const latDiff = Math.abs(northEast.latitude - southWest.latitude);
  const lonDiff = Math.abs(northEast.longitude - southWest.longitude);

  if (latDiff < 0.00001 || lonDiff < 0.00001) return fallbackHeight;

  const latRadians = (northEast.latitude * Math.PI) / 180;
  const lonScale = Math.cos(latRadians);
  const geographicRatio = (lonDiff * lonScale) / latDiff;

  const calculatedHeight = screenWidth / geographicRatio;
  return isFinite(calculatedHeight) ? calculatedHeight : fallbackHeight;
};

interface Props {
  buildingData: BuildingIndoorConfig;
  startRoomId?: string | null;
  destinationRoomId?: string | null;
  isNavigationActive?: boolean;
  onSetStartRoom?: (roomLabel: string) => void;
  onSetDestinationRoom?: (roomLabel: string) => void;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({
  buildingData,
  startRoomId,
  destinationRoomId,
  isNavigationActive,
  onSetStartRoom,
  onSetDestinationRoom,
  onExit,
}) => {
  const { width, height } = useWindowDimensions();
  const MAP_SECTION_MAX_HEIGHT = height * 0.5;
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [destination, setDestination] = useState<IndoorDestination | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

  const [indoorRoute, setIndoorRoute] = useState<Route | null>(null);
  const [baseStartNode, setBaseStartNode] = useState<Node | null>(null);

  const indoorService = useRef(new IndoorMapService()).current;
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const [panelState, setPanelState] = useState<IndoorState>(
    isNavigationActive && destinationRoomId ? "navigating" : "search",
  );
  const searchSheetRef = useRef<IndoorSearchSheetHandle>(null);

  // Initial Load & Start Node setup
  useEffect(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (!navConfig) {
      console.warn(
        `[IndoorRouting] No navigation config found for: ${buildingData.id}`,
      );
      return;
    }

    indoorService.loadBuilding(navConfig);

    let sNode = startRoomId
      ? indoorService.getNodeByRoomNumber(buildingData.id, startRoomId)
      : indoorService.getEntranceNode() || indoorService.getStartNode();

    setBaseStartNode(sNode);
  }, [buildingData.id, startRoomId, indoorService]);

  // Dynamic Route Calculation
  useEffect(() => {
    if (!baseStartNode) return;

    let targetId: string | null = null;
    if (destination) {
      targetId = destination.id;
    } else if (destinationRoomId) {
      const node = indoorService.getNodeByRoomNumber(
        buildingData.id,
        destinationRoomId,
      );
      if (node) targetId = node.id;
    }

    if (targetId && baseStartNode.id !== targetId) {
      try {
        const route = indoorService.getRoute(baseStartNode.id, targetId);
        setIndoorRoute(route);
      } catch (err) {
        console.warn("Pathfinder failed:", err);
        setIndoorRoute(null);
      }
    } else {
      setIndoorRoute(null);
    }
  }, [
    baseStartNode,
    destination,
    destinationRoomId,
    buildingData.id,
    indoorService,
  ]);

  const activeFloor = useMemo(
    () => buildingData.floors.find((f) => f.level === currentLevel),
    [buildingData.floors, currentLevel],
  );

  const contentHeight = useMemo(
    () =>
      calculateGeographicHeight(
        activeFloor?.bounds,
        width,
        MAP_SECTION_MAX_HEIGHT,
      ),
    [activeFloor, width, MAP_SECTION_MAX_HEIGHT],
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

  const panBufferX = width * 2;
  const panBufferY = Math.max(contentHeight * 2, height * 2);

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

  const handleMapInteraction = useCallback(() => {
    if (panelState === "search") {
      searchSheetRef.current?.minimize();
    }
  }, [panelState]);

  const handleSetDestination = useCallback((item: IndoorDestination) => {
    setDestination(item);
    setCurrentLevel(item.floorLevel);
    setSearchQuery(item.label ?? item.id);
    setShowSearchResults(false);
    setPanelState("preview");
  }, []);

  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setSearchQuery("");
    setShowSearchResults(false);
    setPanelState("search");
  }, []);

  const handleStartNavigation = useCallback(() => {
    setPanelState("navigating");

    if (baseStartNode) {
      const startFloorLevel = buildingData.floors.find(
        (f) => f.id === baseStartNode.floorId,
      )?.level;
      if (startFloorLevel !== undefined) {
        handleFloorChange(startFloorLevel);
      }
    }
  }, [baseStartNode, buildingData.floors, handleFloorChange]);

  const handleCancelNavigation = useCallback(() => {
    handleClearDestination();
  }, [handleClearDestination]);

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

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]} pointerEvents="auto">
      <View style={styles.mapSection}>
        <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.buildingTitle} numberOfLines={1}>
              {buildingData.name}
            </Text>

            <TouchableOpacity
              style={styles.currentFloorButton}
              onPress={() => setIsFloorMenuOpen(!isFloorMenuOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.currentFloorText}>
                Floor {activeFloor.label}{" "}
                <Text style={{ fontSize: 11 }}>▼</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* NEW: The Dropdown Menu List */}
          {isFloorMenuOpen && (
            <View style={styles.floorDropdownMenu}>
              <ScrollView
                style={{ maxHeight: 200 }}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {buildingData.floors.map((floor) => {
                  const isActive = floor.level === currentLevel;
                  return (
                    <TouchableOpacity
                      key={floor.id}
                      style={[
                        styles.dropdownItem,
                        isActive && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        handleFloorChange(floor.level);
                        setIsFloorMenuOpen(false); // Close menu on select
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isActive && styles.dropdownItemTextActive,
                        ]}
                      >
                        Floor {floor.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>

        <View
          style={styles.mapContainer}
          onStartShouldSetResponderCapture={() => {
            handleMapInteraction();
            return false;
          }}
        >
          <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
            <ReactNativeZoomableView
              ref={zoomRef}
              maxZoom={5.0}
              minZoom={0.5}
              zoomStep={0.5}
              initialZoom={1.0}
              bindToBorders={true}
              visualTouchFeedbackEnabled={false}
              contentWidth={panBufferX}
              contentHeight={panBufferY}
            >
              <View
                style={{
                  width: panBufferX,
                  height: panBufferY,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width, height: contentHeight }}>
                  <MapContent
                    floor={activeFloor}
                    width={width}
                    height={contentHeight}
                  />
                  <Svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                    viewBox={`0 0 ${width} ${contentHeight}`}
                    pointerEvents="none"
                  >
                    <G
                      transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}
                    >
                      {(panelState === "preview" ||
                        panelState === "navigating") &&
                        activeFloorSegments.map((segment, idx) => (
                          <SvgPolyline
                            key={`route-segment-${idx}`}
                            points={segment
                              .map((n) => `${n.x},${n.y}`)
                              .join(" ")}
                            fill="none"
                            stroke="#B03060"
                            strokeWidth={8 / scale}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={`0, ${12 / scale}`}
                          />
                        ))}
                    </G>
                  </Svg>

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

                  {baseStartNode &&
                    baseStartNode.floorId === activeFloor.id && (
                      <View
                        style={{
                          position: "absolute",
                          left: offsetX + baseStartNode.x * scale - 12,
                          top: offsetY + baseStartNode.y * scale - 12,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "#4285F4",
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
              </View>
            </ReactNativeZoomableView>
          </Animated.View>
        </View>
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

      {panelState === "navigating" && (
        <View style={styles.activeNavOverlay}>
          <TouchableOpacity
            style={styles.endNavButton}
            onPress={handleCancelNavigation}
          >
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <IndoorSearchSheet
        ref={searchSheetRef}
        visible={panelState === "search"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        filteredRooms={filteredRooms}
        onSelectDestination={handleSetDestination}
        onExit={onExit}
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
      <IndoorDirectionsSheet
        visible={panelState === "preview"}
        destinationLabel={destination?.label || "Selected Room"}
        onStartNavigation={handleStartNavigation}
        onCancel={handleClearDestination}
      />
    </View>
  );
};

export default IndoorMapOverlay;
