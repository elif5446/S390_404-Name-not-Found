import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, Text, Animated, useWindowDimensions, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { Ionicons } from "@expo/vector-icons";

// Services & Types
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
import { Route } from "@/src/indoors/types/Routes";
import { Node } from "@/src/indoors/types/Navigation";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// Components & Metadata
import POIBadge, { ICON_POSITION_OVERRIDES } from "./POIBadge";
import POIFilterPanel from "./POIFilterPanel";
import IndoorBottomPanel, { IndoorSearchResult } from "./IndoorTopPanel";
import IndoorRouteOverlay from "./IndoorRouteOverlay";
import IndoorPointMarker from "./IndoorPointMarker";
import IndoorDirectionsPopup from "./IndoorDirectionsPopup";
import MapContent from "./IndoorMap";
import IndoorRoomLabels from "./IndoorRoomLabels";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { styles } from "@/src/styles/IndoorMap.styles";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";

const MAP_POI_BADGE_SIZE = 18;
const SVG_SIZE = 1024;

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
  const latDiff = Math.abs(bounds.northEast.latitude - bounds.southWest.latitude);
  const lonDiff = Math.abs(bounds.northEast.longitude - bounds.southWest.longitude);
  if (latDiff < 0.00001 || lonDiff < 0.00001) return fallbackHeight;

  const latRadians = (bounds.northEast.latitude * Math.PI) / 180;
  const lonScale = Math.cos(latRadians);
  const geographicRatio = (lonDiff * lonScale) / latDiff;
  const calculatedHeight = screenWidth / geographicRatio;
  return Number.isFinite(calculatedHeight) ? calculatedHeight : fallbackHeight;
};

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

  const cleanRoomString = (room?: string | null) => room?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "";

  if (isNavigationActive && startBuildingId === buildingData.id && startRoomId) {
    const cleanStart = cleanRoomString(startRoomId);
    for (const navFloor of navConfig.floors) {
      if (
        navFloor.nodes.some(n =>
          n.id
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .endsWith(cleanStart),
        )
      ) {
        return buildingData.floors.find(f => f.id === navFloor.floorId)?.level || buildingData.defaultFloor;
      }
    }
  }

  if (destinationBuildingId === buildingData.id && destinationRoomId) {
    const cleanDest = cleanRoomString(destinationRoomId);
    for (const navFloor of navConfig.floors) {
      if (
        navFloor.nodes.some(
          n =>
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
        return buildingData.floors.find(f => f.id === navFloor.floorId)?.level || buildingData.defaultFloor;
      }
    }
  }

  return buildingData.defaultFloor;
};

// Hotspot & Search Management
function useHotspots(buildingData: BuildingIndoorConfig) {
  return useMemo<IndoorHotspot[]>(() => {
    const navConfig = navConfigRegistry[buildingData.id];
    if (!navConfig) return [];
    return navConfig.floors.flatMap(navFloor => {
      const visualFloor = buildingData.floors.find(f => f.id === navFloor.floorId);
      return navFloor.nodes
        .filter(node => node.type === "room")
        .map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          floorLevel: visualFloor ? visualFloor.level : buildingData.defaultFloor,
          label: node.label ?? node.id,
        }));
    });
  }, [buildingData.id, buildingData.floors, buildingData.defaultFloor]);
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
      } else if (destinationBuildingId === buildingData.id && destinationRoomId) {
        const node = indoorService.getNodeByRoomNumber(buildingData.id, destinationRoomId);
        if (node) targetId = node.id;
      } else if (startBuildingId === buildingData.id && destinationBuildingId && startBuildingId !== destinationBuildingId) {
        const exitNode = indoorService.getEntranceNode();
        if (exitNode) targetId = exitNode.id;
      }

      if (targetId && baseStartNode.id !== targetId) {
        try {
          const route = await indoorService.getRoute(baseStartNode.id, targetId);

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
  }, [baseStartNode, localDestination, destinationRoomId, destinationBuildingId, startBuildingId, buildingData.id, indoorService]);

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
) {
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const lastSyncedDestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!destinationBuildingId || destinationBuildingId !== buildingData.id || !destinationRoomId) {
      setDestination(null);
      return;
    }

    if (hotspots.length === 0 || !baseStartNode || destinationRoomId === lastSyncedDestRef.current) return;

    const cleanInput = destinationRoomId.toLowerCase().replace(/[^a-z0-9]/g, "");

    const targetRoom = hotspots.find(spot => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return spotId === cleanInput || spotLabel === cleanInput || spotId.endsWith(cleanInput) || spotLabel.endsWith(cleanInput);
    });

    if (targetRoom) {
      setDestination(targetRoom);
      lastSyncedDestRef.current = destinationRoomId;
      const targetLevel = isNavigationActive ? buildingData.floors.find(f => f.id === baseStartNode.floorId)?.level : targetRoom.floorLevel;

      if (targetLevel !== undefined && currentLevel !== targetLevel) {
        setTimeout(() => handleFloorChange(targetLevel), 100);
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
    handleFloorChange,
  ]);

  return { destination, setDestination };
}

const IndoorMapOverlay: React.FC<Props> = ({
  buildingData,
  startBuildingId,
  startRoomId,
  destinationBuildingId,
  destinationRoomId,
  isNavigationActive,
  onSetDestinationRoom,
  onSetStartRoom,
  onExit,
  onCancelNavigation,
}) => {
  const { width, height } = useWindowDimensions();
  const MAP_SECTION_MAX_HEIGHT = height * 0.5;

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);
  const isProgrammaticDismissRef = useRef(false);
  const [headerHeight, setHeaderHeight] = useState(72);

  // Core Service Memoization
  const indoorMapService = useMemo(() => {
    const service = new IndoorMapService();
    const navConfig = navConfigRegistry[buildingData.id];
    if (navConfig) service.loadBuilding(navConfig);
    return service;
  }, [buildingData.id]);

  // View & UI State
  const [currentLevel, setCurrentLevel] = useState(() =>
    determineInitialFloor(buildingData, startBuildingId, startRoomId, destinationBuildingId, destinationRoomId, isNavigationActive),
  );

  // Navigation Data State
  const [startLocation, setStartLocation] = useState<IndoorDestination | null>(null);
  const [baseStartNode, setBaseStartNode] = useState<Node | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [avoidStairs, setAvoidStairs] = useState(false);

  // Dynamic Labels
  const startPointLabel = useMemo(() => {
    if (!startBuildingId || startBuildingId === "USER") return "Current Location";
    const bName = SGWBuildingMetadata[startBuildingId]?.name || LoyolaBuildingMetadata[startBuildingId]?.name || startBuildingId;
    return `${bName} ${startRoomId || ""}`.trim();
  }, [startBuildingId, startRoomId]);

  const destinationPointLabel = useMemo(() => {
    if (!destinationBuildingId) return "";
    if (destinationBuildingId === "USER") return "Current Location";
    const bName =
      SGWBuildingMetadata[destinationBuildingId]?.name || LoyolaBuildingMetadata[destinationBuildingId]?.name || destinationBuildingId;
    return `${bName} ${destinationRoomId || ""}`.trim();
  }, [destinationBuildingId, destinationRoomId]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState(destinationPointLabel);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "destination">("destination");
  const [showDirections, setShowDirections] = useState(false);
  const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">("DESTINATION");
  const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
  const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

  // Floor Data Computation
  const activeFloor = useMemo(() => buildingData.floors.find(f => f.level === currentLevel), [buildingData.floors, currentLevel]);
  const hotspots = useHotspots(buildingData);
  const poisForFloor = useMemo(() => getPOIsForFloor(buildingData.id, currentLevel), [buildingData.id, currentLevel]);
  const nonRoomPOIs = useMemo(() => poisForFloor.filter(p => p.category !== "ROOM"), [poisForFloor]);
  const categoriesForFloor = useMemo(
    () => getCategoriesForFloor(buildingData.id, currentLevel).filter(c => c !== "ROOM"),
    [buildingData.id, currentLevel],
  );
  const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(() => new Set(categoriesForFloor));

  useEffect(() => {
    getWheelchairAccessibilityPreference().then(setAvoidStairs);
  }, []);

  useEffect(() => {
    setSearchQuery(destinationPointLabel);
  }, [destinationPointLabel]);

  useEffect(() => {
    setActiveCategories(new Set(getCategoriesForFloor(buildingData.id, currentLevel).filter(c => c !== "ROOM")));
    setSourcePOI(null);
    setDestinationPOI(null);
  }, [currentLevel, buildingData.id]);

  // identify base node
  useEffect(() => {
    let sNode = null;
    if (startBuildingId === buildingData.id && startRoomId) {
      sNode = indoorMapService.getNodeByRoomNumber(buildingData.id, startRoomId);
    }
    if (!sNode) sNode = indoorMapService.getEntranceNode() || indoorMapService.getStartNode();
    setBaseStartNode(sNode);
  }, [buildingData.id, startBuildingId, startRoomId, indoorMapService]);

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

  const { destination, setDestination } = useDestinationSync(
    buildingData,
    destinationBuildingId,
    destinationRoomId,
    hotspots,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
  );

  // map scaling math
  const contentHeight = useMemo(
    () => calculateGeographicHeight(activeFloor?.bounds, width, MAP_SECTION_MAX_HEIGHT),
    [activeFloor, width, MAP_SECTION_MAX_HEIGHT],
  );
  const scale = useMemo(() => Math.min(width / SVG_SIZE, contentHeight / SVG_SIZE), [width, contentHeight]);
  const offsetX = useMemo(() => (width - SVG_SIZE * scale) / 2, [width, scale]);
  const offsetY = useMemo(() => (contentHeight - SVG_SIZE * scale) / 2, [contentHeight, scale]);

  // UI lifecycle
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    zoomRef.current?.zoomTo(1);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [currentLevel, fadeAnim]);

  // node resolution
  const resolveDestinationNodeId = useCallback(
    (item: IndoorDestination): string | null => {
      const graph = indoorMapService.getGraph();
      if (graph.getNode(item.id)) return item.id;

      const normalizedLabel = (item.label ?? item.id)
        .replace(/^Room\s+/i, "")
        .trim()
        .toLowerCase();
      const floorId = `${buildingData.id}_${item.floorLevel}`;

      const matchedNode = graph.getAllNodes().find(node => {
        const nodeLabel = (node.label ?? node.id)
          .replace(/^Room\s+/i, "")
          .trim()
          .toLowerCase();

        return node.floorId === floorId && nodeLabel === normalizedLabel;
      });

      return matchedNode?.id ?? null;
    },
    [indoorMapService, buildingData.id],
  );

  // action handlers
  const handleDirectionsPress = useCallback(async () => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig || !destination) {
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const startNodeId = startLocation ? resolveDestinationNodeId(startLocation) : baseStartNode?.id || navConfig.defaultStartNodeId;
      const endNodeId = resolveDestinationNodeId(destination);

      if (!startNodeId || !endNodeId) {
        console.warn("Could not resolve start or destination node");
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const nextRoute = await indoorMapService.getRoute(startNodeId, endNodeId, avoidStairs);
      setRoute(nextRoute);
      setShowSearchResults(false);
      setShowDirections(true);
    } catch (error) {
      console.warn("Failed to compute indoor route:", error);
      setRoute(null);
      setShowDirections(false);
    }
  }, [buildingData.id, destination, startLocation, baseStartNode, indoorMapService, resolveDestinationNodeId, avoidStairs]);

  // Re-compute route automatically if the user changes the preference
  // while the directions panel is already open
  useEffect(() => {
    if (showDirections && destination) {
      handleDirectionsPress();
    }
  }, [avoidStairs, destination, handleDirectionsPress, showDirections]);

  const handleClearDestination = useCallback(() => {
    if (activeField === "start") setStartLocation(null);
    else setDestination(null);

    setSearchQuery("");
    setShowSearchResults(false);
    setShowDirections(false);
    setRoute(null);
  }, [activeField]);

  const handleSetLocation = useCallback(
    (item: IndoorDestination, isStart: boolean) => {
      if (isStart) {
        setStartLocation(item);
        if (onSetStartRoom) onSetStartRoom(item.id);
      } else {
        setDestination(item);
        if (onSetDestinationRoom) onSetDestinationRoom(item.id);
      }

      setCurrentLevel(item.floorLevel);
      setSearchQuery(item.label ?? item.id);
      setShowSearchResults(false);
      setShowDirections(false);
      setRoute(null);
    },
    [onSetStartRoom, onSetDestinationRoom],
  );

  // override indoorRoute hook target if local destination exists
  const activeRoute = useIndoorRouting(
    indoorMapService,
    buildingData,
    startBuildingId,
    destinationBuildingId,
    destinationRoomId,
    destination,
    baseStartNode,
  );
  const panBufferX = width * 2;
  const panBufferY = Math.max(contentHeight * 2, height * 2);

  const activeFloorSegments = useMemo(() => {
    if (!activeRoute || !activeFloor) return [];
    const segments: (typeof activeRoute.nodes)[] = [];
    let currentSegment: typeof activeRoute.nodes = [];

    activeRoute.nodes.forEach(node => {
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

  // search results
  const combinedSearchResults = useMemo<IndoorSearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const roomResults: IndoorSearchResult[] = hotspots
      .filter(spot => {
        const label = spot.label.toLowerCase();
        const short = spot.label.replace("Room ", "").toLowerCase();
        const id = spot.id.toLowerCase();

        return label.includes(query) || short.includes(query) || id.includes(query);
      })
      .map(spot => ({
        type: "room",
        id: spot.id,
        label: spot.label,
        x: spot.x,
        y: spot.y,
        floorLevel: spot.floorLevel,
      }));

    const poiResults: IndoorSearchResult[] = nonRoomPOIs
      .filter(poi => {
        const desc = poi.description.toLowerCase();
        const room = poi.room.toLowerCase();
        const category = poi.category.toLowerCase();

        return desc.includes(query) || room.includes(query) || category.includes(query);
      })
      .map(poi => ({
        type: "poi",
        id: poi.id,
        label: `${poi.description} (Room ${poi.room})`,
        room: poi.room,
        floorLevel: currentLevel,
        x: Math.round(poi.mapPosition.x * 1024),
        y: Math.round(poi.mapPosition.y * 1024),
      }));

    return [...roomResults, ...poiResults];
  }, [searchQuery, hotspots, nonRoomPOIs, currentLevel]);

  const handleSelectSearchResult = useCallback(
    (item: IndoorSearchResult) => {
      const isStart = activeField === "start";
      if (item.type === "room") {
        handleSetLocation({ id: item.id, x: item.x, y: item.y, floorLevel: item.floorLevel, label: item.label }, isStart);
        return;
      }

      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === item.room);
      if (matchingRoom) {
        handleSetLocation(
          { id: matchingRoom.id, x: matchingRoom.x, y: matchingRoom.y, floorLevel: matchingRoom.floorLevel, label: matchingRoom.label },
          isStart,
        );
      }
    },
    [activeField, hotspots, handleSetLocation],
  );

  const handleSelectPOI = useCallback(
    (poi: POI) => {
      if (routeTargetMode === "SOURCE") {
        setSourcePOI(poi);
        return;
      }
      setDestinationPOI(poi);

      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === poi.room);
      if (matchingRoom) {
        handleSetLocation(
          { id: matchingRoom.id, x: matchingRoom.x, y: matchingRoom.y, floorLevel: matchingRoom.floorLevel, label: matchingRoom.label },
          false,
        );
      } else {
        const xPos = Math.round(poi.mapPosition.x * 1024);
        const yPos = Math.round(poi.mapPosition.y * 1024);
        const nearestNode = indoorMapService.getNearestRoomNode(`${buildingData.id}_${currentLevel}`, xPos, yPos);

        handleSetLocation(
          {
            id: nearestNode ? nearestNode.id : poi.id,
            x: xPos,
            y: yPos,
            floorLevel: currentLevel,
            label: `${poi.description} (Room ${poi.room})`,
          },
          false,
        );
      }
    },
    [routeTargetMode, hotspots, currentLevel, buildingData.id, indoorMapService, handleSetLocation],
  );

  const handleToggleCategory = useCallback((cat: POICategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const routeSteps = useMemo(() => (route ? indoorMapService.getRouteInstructions(route).steps : []), [route, indoorMapService]);

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]} pointerEvents="auto">
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
        <View style={styles.headerContent} accessible={true} accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.buildingTitle} numberOfLines={1} accessibilityRole="header">
              {buildingData.name}
            </Text>
          </View>

          <View style={styles.headerFloorToggleRow}>
            {buildingData.floors.map(floor => {
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
                  <Text style={isActive ? styles.headerFloorToggleTextActive : styles.headerFloorToggleText}>{floor.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.mapContainer, { marginTop: 60 }]}>
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
            <View style={{ width: panBufferX, height: panBufferY }}>
              <MapContent floor={activeFloor} width={width} height={contentHeight} />
              {route && (
                <IndoorRouteOverlay
                  routeNodes={route.nodes}
                  currentLevel={currentLevel}
                  canvasWidth={width}
                  canvasHeight={contentHeight}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  scale={scale}
                />
              )}

              {nonRoomPOIs
                .filter(poi => activeCategories.has(poi.category))
                .map(poi => {
                  const selectionType = destinationPOI?.id === poi.id ? "destination" : sourcePOI?.id === poi.id ? "source" : undefined;
                  const manualRoomOffset = ICON_POSITION_OVERRIDES[poi.room] ?? { x: 0, y: 0 };

                  return (
                    <POIBadge
                      key={poi.id}
                      poi={poi}
                      left={poi.mapPosition.x * width - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.x}
                      top={poi.mapPosition.y * contentHeight - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.y}
                      size={MAP_POI_BADGE_SIZE}
                      selectionType={selectionType}
                      onPress={handleSelectPOI}
                    />
                  );
                })}

              <IndoorRoomLabels
                hotspots={hotspots}
                currentLevel={currentLevel}
                destination={destination}
                offsetX={offsetX}
                offsetY={offsetY}
                scale={scale}
                onSelectDestination={item => handleSetLocation(item, activeField === "start")}
              />

              {startLocation && !showDirections && startLocation.floorLevel === currentLevel && (
                <IndoorPointMarker
                  x={offsetX + startLocation.x * scale}
                  y={offsetY + startLocation.y * scale}
                  emoji="🔵"
                  bgColor="#3A7BD5"
                />
              )}

              {destination && destination.floorLevel === currentLevel && (
                <IndoorPointMarker // <DestinationMarker
                  x={offsetX + destination.x * scale}
                  y={offsetY + destination.y * scale}
                  emoji="📍"
                  bgColor="transparent"
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

        {/* Map Canvas */}
        {/* <View
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
        {/* <Svg
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
                  </Svg> */}

        {/* </View>
              </View> */}
        {/* </ReactNativeZoomableView>
          </Animated.View> */}
        {/* </View> */}
      </View>

      <TouchableOpacity
        style={{
          position: "absolute",
          top: 30,
          left: 5,
          zIndex: 9999,
          elevation: 20,
          padding: 8,
        }}
        onPress={() => !isProgrammaticDismissRef.current && onExit()}
      >
        <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
      </TouchableOpacity>

      <IndoorBottomPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        // filteredRooms={filteredRooms}
        // startPointLabel={startPointLabel}
        // onSelectDestination={handleSetDestination}
        // onClearDestination={handleClearDestination}
        // onExit={() => !isProgrammaticDismissRef.current && onExit()}
        // onToggleOutdoorMap={() =>
        //   !isProgrammaticDismissRef.current && onToggleOutdoorMap()
        // }
        searchResults={combinedSearchResults}
        onSelectResult={handleSelectSearchResult}
        onClearDestination={handleClearDestination}
        startLabel={startLocation?.label ?? "Current position"}
        destinationLabel={destination?.label ?? ""}
        activeField={activeField}
        onFocusField={field => {
          setActiveField(field);
          setSearchQuery("");
          setShowSearchResults(false);
        }}
        onDirectionsPress={handleDirectionsPress}
        canShowDirections={!!destination}
        categories={categoriesForFloor}
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
      />

      <IndoorDirectionsPopup
        visible={showDirections && routeSteps.length > 0}
        steps={routeSteps}
        onClose={() => setShowDirections(false)}
      />

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
