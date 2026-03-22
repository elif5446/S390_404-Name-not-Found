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
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import Svg, { Polyline as SvgPolyline, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

// Services & Types
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { Route } from "@/src/indoors/types/Routes";
import { Node } from "@/src/indoors/types/Navigation";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// Components & Metadata
import MapContent from "./IndoorMap";
import DestinationMarker from "./DestinationMarker";
import IndoorRoomLabels from "./IndoorRoomLabels";
import IndoorSearchSheet, {
  IndoorSearchSheetHandle,
} from "./IndoorSearchSheet";
import { styles } from "@/src/styles/IndoorMap.styles";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";

type IndoorState = "search" | "preview" | "navigating";

interface Props {
  buildingData: BuildingIndoorConfig;
  startBuildingId?: string | null;
  startRoomId?: string | null;
  destinationBuildingId?: string | null;
  destinationRoomId?: string | null;
  isNavigationActive?: boolean;
  onSetStartRoom?: (roomLabel: string) => void;
  onSetDestinationRoom?: (roomLabel: string) => void;
  onExit: () => void;
  onCancelNavigation?: () => void;
  onToggleOutdoorMap: () => void;
}

// helper
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

  return Number.isFinite(calculatedHeight) ? calculatedHeight : fallbackHeight;
};

// Hotspot & Search Management
function useHotspots(buildingData: BuildingIndoorConfig, searchQuery: string) {
  const hotspots = useMemo<IndoorHotspot[]>(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (!navConfig) return [];
    return navConfig.floors.flatMap((navFloor) => {
      const visualFloor = buildingData.floors.find(
        (f) => f.id === navFloor.floorId,
      );
      return navFloor.nodes
        .filter((node) => node.type === "room")
        .map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          floorLevel: visualFloor
            ? visualFloor.level
            : buildingData.defaultFloor,
          label: node.label ?? node.id,
        }));
    });
  }, [buildingData.id, buildingData.floors, buildingData.defaultFloor]);

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

  return { hotspots, filteredRooms };
}

// Indoor Routing Engine
function useIndoorRouting(
  indoorService: IndoorMapService,
  buildingData: BuildingIndoorConfig,
  startBuildingId: string | null | undefined,
  destinationBuildingId: string | null | undefined,
  destinationRoomId: string | null | undefined,
  localDestination: IndoorDestination | null,
  baseStartNode: Node | null,
) {
  const [indoorRoute, setIndoorRoute] = useState<Route | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const calculateRoute = async () => {
      if (!baseStartNode) {
        setIndoorRoute(null);
        return;
      }

      let targetId: string | null = null;

      if (localDestination) {
        targetId = localDestination.id;
      } else if (
        destinationBuildingId === buildingData.id &&
        destinationRoomId
      ) {
        const node = indoorService.getNodeByRoomNumber(
          buildingData.id,
          destinationRoomId,
        );
        if (node) targetId = node.id;
      } else if (
        startBuildingId === buildingData.id &&
        destinationBuildingId &&
        startBuildingId !== destinationBuildingId
      ) {
        const exitNode = indoorService.getEntranceNode();
        if (exitNode) targetId = exitNode.id;
      }

      if (targetId && baseStartNode.id !== targetId) {
        try {
          const route = await indoorService.getRoute(
            baseStartNode.id,
            targetId,
          );

          if (isCurrent) {
            setIndoorRoute(route);
          }
        } catch (err) {
          console.warn("[IndoorRouting] Pathfinder failed:", err);
          if (isCurrent) {
            setIndoorRoute(null);
          }
        }
      } else {
        if (isCurrent) {
          setIndoorRoute(null);
        }
      }
    };

    calculateRoute();

    return () => {
      isCurrent = false;
    };
  }, [
    baseStartNode,
    localDestination,
    destinationRoomId,
    destinationBuildingId,
    startBuildingId,
    buildingData.id,
    indoorService,
  ]);

  return indoorRoute;
}

// Global Destination Sync
function useDestinationSync(
  buildingData: BuildingIndoorConfig,
  destinationBuildingId: string | null | undefined,
  destinationRoomId: string | null | undefined,
  hotspots: IndoorHotspot[],
  isNavigationActive: boolean | undefined,
  baseStartNode: Node | null,
  currentLevel: number,
  handleFloorChange: (level: number) => void,
  setPanelState: (state: IndoorState) => void,
) {
  const [destination, setDestination] = useState<IndoorDestination | null>(
    null,
  );
  const lastSyncedDestRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !destinationBuildingId ||
      destinationBuildingId !== buildingData.id ||
      !destinationRoomId
    ) {
      setDestination(null);
      return;
    }

    if (hotspots.length === 0 || !baseStartNode) return;
    if (destinationRoomId === lastSyncedDestRef.current) return;

    const cleanInput = destinationRoomId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const isAlreadySynced =
      destination?.id.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanInput ||
      (destination?.label || "").toLowerCase().replace(/[^a-z0-9]/g, "") ===
        cleanInput;

    if (isAlreadySynced) {
      lastSyncedDestRef.current = destinationRoomId;
      return;
    }

    const targetRoom = hotspots.find((spot) => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      return (
        spotId === cleanInput ||
        spotLabel === cleanInput ||
        spotId.endsWith(cleanInput) ||
        spotLabel.endsWith(cleanInput)
      );
    });

    if (targetRoom) {
      setDestination(targetRoom);
      lastSyncedDestRef.current = destinationRoomId;

      if (isNavigationActive) {
        setPanelState("navigating");
        const startFloorLevel = buildingData.floors.find(
          (f) => f.id === baseStartNode.floorId,
        )?.level;
        if (startFloorLevel !== undefined && startFloorLevel !== currentLevel) {
          setTimeout(() => handleFloorChange(startFloorLevel), 100);
        }
      } else {
        setPanelState("preview");
        if (currentLevel !== targetRoom.floorLevel) {
          setTimeout(() => handleFloorChange(targetRoom.floorLevel), 100);
        }
      }
    } else {
      setDestination(null);
    }
  }, [
    destinationBuildingId,
    destinationRoomId,
    buildingData.id,
    hotspots,
    isNavigationActive,
    baseStartNode,
    buildingData.floors,
    currentLevel,
    destination,
    handleFloorChange,
    setPanelState,
  ]);

  return { destination, setDestination };
}

const determineInitialFloor = (
  buildingData: BuildingIndoorConfig,
  startBuildingId?: string | null,
  startRoomId?: string | null,
  destinationBuildingId?: string | null,
  destinationRoomId?: string | null,
  isNavigationActive?: boolean,
): number => {
  const navConfig = navConfigRegistry[buildingData.id];
  if (!navConfig) return buildingData.defaultFloor;

  const cleanRoomString = (room?: string | null) =>
    room?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "";

  // if actively navigating from a room inside THIS building, start on that floor
  if (
    isNavigationActive &&
    startBuildingId === buildingData.id &&
    startRoomId
  ) {
    const cleanStart = cleanRoomString(startRoomId);
    for (const navFloor of navConfig.floors) {
      if (
        navFloor.nodes.some((n) =>
          n.id
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .endsWith(cleanStart),
        )
      ) {
        const vFloor = buildingData.floors.find(
          (f) => f.id === navFloor.floorId,
        );
        if (vFloor) return vFloor.level;
      }
    }
  }

  // if viewing a destination in THIS building, start on the destination floor
  if (destinationBuildingId === buildingData.id && destinationRoomId) {
    const cleanDest = cleanRoomString(destinationRoomId);
    for (const navFloor of navConfig.floors) {
      if (
        navFloor.nodes.some(
          (n) =>
            n.id
              .replace(/[^a-zA-Z0-9]/g, "")
              .toUpperCase()
              .endsWith(cleanDest) ||
            (n.label || "")
              .replace(/[^a-zA-Z0-9]/g, "")
              .toUpperCase()
              .endsWith(cleanDest),
        )
      ) {
        const vFloor = buildingData.floors.find(
          (f) => f.id === navFloor.floorId,
        );
        if (vFloor) return vFloor.level;
      }
    }
  }

  return buildingData.defaultFloor;
};

const IndoorMapOverlay: React.FC<Props> = ({
  buildingData,
  startBuildingId,
  startRoomId,
  destinationBuildingId,
  destinationRoomId,
  isNavigationActive,
  onSetDestinationRoom,
  onExit,
  onCancelNavigation,
  onToggleOutdoorMap,
}) => {
  const { width, height } = useWindowDimensions();
  const MAP_SECTION_MAX_HEIGHT = height * 0.5;

  const [currentLevel, setCurrentLevel] = useState(() =>
    determineInitialFloor(
      buildingData,
      startBuildingId,
      startRoomId,
      destinationBuildingId,
      destinationRoomId,
      isNavigationActive,
    ),
  );
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const [panelState, setPanelState] = useState<IndoorState>(
    isNavigationActive && destinationRoomId ? "navigating" : "search",
  );

  const searchSheetRef = useRef<IndoorSearchSheetHandle>(null);
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);
  const isProgrammaticDismissRef = useRef(false);

  const indoorService = useRef(new IndoorMapService()).current;
  useEffect(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (navConfig) indoorService.loadBuilding(navConfig);
  }, [buildingData.id, indoorService]);

  // Dynamic Labels
  const startPointLabel = useMemo(() => {
    if (!startBuildingId || startBuildingId === "USER")
      return "Current Location";
    const bName =
      SGWBuildingMetadata[startBuildingId]?.name ||
      LoyolaBuildingMetadata[startBuildingId]?.name ||
      startBuildingId;
    return `${bName} ${startRoomId || ""}`.trim();
  }, [startBuildingId, startRoomId]);

  const destinationPointLabel = useMemo(() => {
    if (!destinationBuildingId) return "";
    if (destinationBuildingId === "USER") return "Current Location";
    const bName =
      SGWBuildingMetadata[destinationBuildingId]?.name ||
      LoyolaBuildingMetadata[destinationBuildingId]?.name ||
      destinationBuildingId;
    return `${bName} ${destinationRoomId || ""}`.trim();
  }, [destinationBuildingId, destinationRoomId]);

  const [searchQuery, setSearchQuery] = useState(destinationPointLabel);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    setSearchQuery(destinationPointLabel);
  }, [destinationPointLabel]);

  const { hotspots, filteredRooms } = useHotspots(buildingData, searchQuery);

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

  const { destination, setDestination } = useDestinationSync(
    buildingData,
    destinationBuildingId,
    destinationRoomId,
    hotspots,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
    setPanelState,
  );

  // override indoorRoute hook target if local destination exists
  const activeRoute = useIndoorRouting(
    indoorService,
    buildingData,
    startBuildingId,
    destinationBuildingId,
    destinationRoomId,
    destination,
    baseStartNode,
  );

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
  const scale = useMemo(
    () => Math.min(width / SVG_SIZE, contentHeight / SVG_SIZE),
    [width, contentHeight],
  );
  const renderedWidth = SVG_SIZE * scale;
  const renderedHeight = SVG_SIZE * scale;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (contentHeight - renderedHeight) / 2;
  const panBufferX = width * 2;
  const panBufferY = Math.max(contentHeight * 2, height * 2);

  const activeFloorSegments = useMemo(() => {
    if (!activeRoute || !activeFloor) return [];
    const segments: (typeof activeRoute.nodes)[] = [];
    let currentSegment: typeof activeRoute.nodes = [];

    activeRoute.nodes.forEach((node) => {
      if (node.floorId === activeFloor.id) {
        currentSegment.push(node);
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    });
    if (currentSegment.length > 0) segments.push(currentSegment);
    return segments;
  }, [activeRoute, activeFloor]);

  // interactions
  useEffect(() => {
    if (panelState === "navigating" || isNavigationActive) {
      isProgrammaticDismissRef.current = true;
      searchSheetRef.current?.dismiss();
      setTimeout(() => {
        isProgrammaticDismissRef.current = false;
      }, 500);
    } else if (panelState === "search") {
      searchSheetRef.current?.minimize();
    }
  }, [panelState, isNavigationActive]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    zoomRef.current?.zoomTo(1);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentLevel, fadeAnim]);

  const handleSetDestination = useCallback(
    (item: IndoorDestination) => {
      setDestination(item);
      setCurrentLevel(item.floorLevel);
      setSearchQuery(item.label ?? item.id);
      setShowSearchResults(false);
      setPanelState("preview");
      searchSheetRef.current?.minimize();
      if (onSetDestinationRoom) onSetDestinationRoom(item.id);
    },
    [onSetDestinationRoom, setDestination],
  );

  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setSearchQuery("");
    setShowSearchResults(false);
    setPanelState("search");
  }, [setDestination]);

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
        {/* Header */}
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
                        setIsFloorMenuOpen(false);
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

        {/* Map Canvas */}
        <View
          style={styles.mapContainer}
          onStartShouldSetResponderCapture={() => {
            searchSheetRef.current?.minimize();
            return false;
          }}
        >
          <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
            <ReactNativeZoomableView
              ref={zoomRef}
              maxZoom={3}
              minZoom={1}
              zoomStep={0.5}
              initialZoom={1}
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

                  {/* Routing Lines */}
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
                      {activeFloorSegments.length > 0 &&
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

                  {/* Markers */}
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
              </View>
            </ReactNativeZoomableView>
          </Animated.View>
        </View>
      </View>

      {/* Overlays & Floating UI */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 67,
          left: 16,
          zIndex: 9999,
          elevation: 20,
          padding: 8,
        }}
        onPress={() => !isProgrammaticDismissRef.current && onExit()}
      >
        <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
      </TouchableOpacity>

      {panelState === "navigating" && (
        <View style={styles.activeNavOverlay}>
          <TouchableOpacity
            style={styles.endNavButton}
            onPress={() => {
              handleClearDestination();
              onCancelNavigation?.();
            }}
          >
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <IndoorSearchSheet
        ref={searchSheetRef}
        visible={panelState === "search" || panelState === "preview"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        filteredRooms={filteredRooms}
        startPointLabel={startPointLabel}
        onSelectDestination={handleSetDestination}
        onClearDestination={handleClearDestination}
        onExit={() => !isProgrammaticDismissRef.current && onExit()}
        onToggleOutdoorMap={() =>
          !isProgrammaticDismissRef.current && onToggleOutdoorMap()
        }
      />
    </View>
  );
};

export default IndoorMapOverlay;
