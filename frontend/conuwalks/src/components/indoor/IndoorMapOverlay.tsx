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
import IndoorTopPanel, { IndoorSearchResult } from "./IndoorTopPanel";
import IndoorRouteOverlay from "./IndoorRouteOverlay";
import IndoorPointMarker from "./IndoorPointMarker";
import IndoorDirectionsPopup from "./IndoorDirectionsPopup";
import MapContent from "./IndoorMap";
import IndoorRoomLabels from "./IndoorRoomLabels";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { styles } from "@/src/styles/IndoorMap.styles";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";
import DestinationMarker from "./DestinationMarker";

const MAP_POI_BADGE_SIZE = 18;
const FALLBACK_SVG_SIZE = 1024;

interface Props {
  buildingData: BuildingIndoorConfig;
  startBuildingId?: string | null;
  startRoomId?: string | null;
  destinationBuildingId?: string | null;
  destinationRoomId?: string | null;
  isNavigationActive?: boolean;
  onSetStartRoom?: (roomLabel: string, buildingId?: string) => void;
  onSetDestinationRoom?: (roomLabel: string, buildingId?: string) => void;
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

interface UseLocationSyncProps {
  type: "start" | "destination";
  buildingData: BuildingIndoorConfig;
  buildingId?: string | null;
  roomId?: string | null;
  hotspots: IndoorHotspot[];
  isNavigationActive?: boolean;
  baseStartNode?: Node | null;
  currentLevel?: number;
  handleFloorChange?: (level: number) => void;
}

function useLocationSync({
  type,
  buildingData,
  buildingId,
  roomId,
  hotspots,
  isNavigationActive,
  baseStartNode,
  currentLevel,
  handleFloorChange,
}: UseLocationSyncProps) {
  const [location, setLocation] = useState<IndoorDestination | null>(null);
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!buildingId || buildingId !== buildingData.id || !roomId) {
      setLocation(null);
      lastSyncedRef.current = null;
      return;
    }

    // Destination requires a base node before routing can sync
    if (type === "destination" && !baseStartNode) return;

    // Prevent duplicate updates
    if (roomId === lastSyncedRef.current) return;

    const cleanInput = roomId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let targetNode: IndoorDestination | undefined;

    // Search Hotspots
    targetNode = hotspots.find(spot => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return spotId === cleanInput || spotLabel === cleanInput || spotId.endsWith(cleanInput) || spotLabel.endsWith(cleanInput);
    });

    // Search ALL navigation nodes
    if (!targetNode) {
      const navConfig = navConfigRegistry[buildingData.id];
      if (navConfig) {
        for (const navFloor of navConfig.floors) {
          const foundNode = navFloor.nodes.find(n => {
            if (n.id === roomId) return true; // Exact match priority
            const nId = n.id.toLowerCase().replace(/[^a-z0-9]/g, "");
            const nLabel = (n.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return nId === cleanInput || nLabel === cleanInput || nId.endsWith(cleanInput) || nLabel.endsWith(cleanInput);
          });

          if (foundNode) {
            const visualFloor = buildingData.floors.find(f => f.id === navFloor.floorId);
            targetNode = {
              id: foundNode.id,
              x: foundNode.x,
              y: foundNode.y,
              floorLevel: visualFloor ? visualFloor.level : buildingData.defaultFloor,
              label: foundNode.label ?? foundNode.id,
            };
            break;
          }
        }
      }
    }

    // Search purely visual/explicit POIs
    if (!targetNode) {
      for (const floor of buildingData.floors) {
        const pois = getPOIsForFloor(buildingData.id, floor.level);
        const foundPoi = pois.find(p => p.id === roomId || p.room === roomId);
        if (foundPoi) {
          const fallbackWidth = (floor as any).width ?? 1024;
          const fallbackHeight = (floor as any).height ?? 1024;
          targetNode = {
            id: foundPoi.id,
            x: Math.round(foundPoi.mapPosition.x * fallbackWidth),
            y: Math.round(foundPoi.mapPosition.y * fallbackHeight),
            floorLevel: floor.level,
            label: foundPoi.label,
          };
          break;
        }
      }
    }

    if (targetNode) {
      setLocation(targetNode);
      lastSyncedRef.current = roomId;
      // Handle specific destination auto-floor-switch behavior
      if (type === "destination" && handleFloorChange && currentLevel !== undefined) {
        const targetLevel =
          isNavigationActive && baseStartNode
            ? buildingData.floors.find(f => f.id === baseStartNode.floorId)?.level
            : targetNode.floorLevel;

        if (targetLevel !== undefined && currentLevel !== targetLevel) {
          setTimeout(() => handleFloorChange(targetLevel), 100);
        }
      }
    } else {
      setLocation(null);
    }
  }, [
    type,
    buildingId,
    roomId,
    buildingData.id,
    buildingData.floors,
    buildingData.defaultFloor,
    hotspots,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
  ]);

  return { location, setLocation };
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
  const initialRouteComputed = useRef(false);

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

  // Map Scaling Calculations
  const floorSvgWidth = (activeFloor as any)?.width ?? FALLBACK_SVG_SIZE;
  const floorSvgHeight = (activeFloor as any)?.height ?? FALLBACK_SVG_SIZE;

  const contentHeight = useMemo(
    () => calculateGeographicHeight(activeFloor?.bounds, width, MAP_SECTION_MAX_HEIGHT),
    [activeFloor, width, MAP_SECTION_MAX_HEIGHT],
  );

  const scale = useMemo(
    () => Math.min(width / floorSvgWidth, contentHeight / floorSvgHeight),
    [width, contentHeight, floorSvgWidth, floorSvgHeight],
  );
  const offsetX = useMemo(() => (width - floorSvgWidth * scale) / 2, [width, scale, floorSvgWidth]);
  const offsetY = useMemo(() => (contentHeight - floorSvgHeight * scale) / 2, [contentHeight, scale, floorSvgHeight]);
  const panBufferX = width * 2;
  const panBufferY = Math.max(contentHeight * 2, height * 2);

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

  const { location: startLocation, setLocation: setStartLocation } = useLocationSync({
    type: "start",
    buildingData,
    buildingId: startBuildingId,
    roomId: startRoomId,
    hotspots,
  });

  const { location: destination, setLocation: setDestination } = useLocationSync({
    type: "destination",
    buildingData,
    buildingId: destinationBuildingId,
    roomId: destinationRoomId,
    hotspots,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
  });

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

      let matchedNode = graph.getAllNodes().find(node => {
        const nodeLabel = (node.label ?? node.id)
          .replace(/^Room\s+/i, "")
          .trim()
          .toLowerCase();
        return node.floorId === floorId && nodeLabel === normalizedLabel;
      });

      // try fuzzy match
      if (!matchedNode) {
        matchedNode = graph.getAllNodes().find(node => {
          const nodeLabel = (node.label ?? node.id).toLowerCase();
          return node.floorId === floorId && (nodeLabel.includes(normalizedLabel) || normalizedLabel.includes(nodeLabel));
        });
      }
      return matchedNode?.id ?? null;
    },
    [indoorMapService, buildingData.id],
  );

  // action handlers
  const handleDirectionsPress = useCallback(async () => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig) {
        setRoute(null);
        setShowDirections(false);
        return;
      }

      let startNodeId: string | null = null;
      let endNodeId: string | null = null;

      // resolve start node
      if (startLocation) {
        startNodeId = resolveDestinationNodeId(startLocation);
      } else if (startBuildingId === buildingData.id && startRoomId) {
        startNodeId = indoorMapService.getNodeByRoomNumber(buildingData.id, startRoomId)?.id || null;
      }
      if (!startNodeId) {
        startNodeId = baseStartNode?.id || navConfig.defaultStartNodeId;
      }

      // resolve destination node
      if (destination && destinationBuildingId === buildingData.id) {
        endNodeId = resolveDestinationNodeId(destination);
      } else if (destinationBuildingId && destinationBuildingId !== buildingData.id) {
        // destination is outside this building - Route to the exit
        endNodeId = indoorMapService.getEntranceNode()?.id || null;
      }

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
  }, [
    buildingData.id,
    destination,
    destinationBuildingId,
    startLocation,
    startBuildingId,
    startRoomId,
    baseStartNode,
    indoorMapService,
    resolveDestinationNodeId,
    avoidStairs,
  ]);

  useEffect(() => {
    if (!baseStartNode || initialRouteComputed.current) return;

    const isStartInBuilding = startBuildingId === buildingData.id && startRoomId;
    const isDestInBuilding = destinationBuildingId === buildingData.id && destinationRoomId;
    const isDestOutside = destinationBuildingId && destinationBuildingId !== buildingData.id;

    if (isDestInBuilding) {
      if (destination) {
        handleDirectionsPress();
        initialRouteComputed.current = true;
      }
    } else if (isStartInBuilding && isDestOutside) {
      handleDirectionsPress();
      initialRouteComputed.current = true;
    }
  }, [
    destination,
    baseStartNode,
    startBuildingId,
    startRoomId,
    destinationBuildingId,
    destinationRoomId,
    buildingData.id,
    handleDirectionsPress,
  ]);

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
  }, [activeField, setDestination, setStartLocation]);

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
    [setStartLocation, onSetStartRoom, setDestination, onSetDestinationRoom],
  );

  // search results
  const combinedSearchResults = useMemo<IndoorSearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const roomResults: IndoorSearchResult[] = hotspots.map(spot => ({
      type: "room",
      id: spot.id,
      label: spot.label,
      x: spot.x,
      y: spot.y,
      floorLevel: spot.floorLevel,
      buildingId: buildingData.id,
    }));

    const poiResults: IndoorSearchResult[] = nonRoomPOIs.map(poi => ({
      type: "poi",
      id: poi.id,
      label: `${poi.description} (Room ${poi.room})`,
      room: poi.room,
      floorLevel: currentLevel,
      x: Math.round(poi.mapPosition.x * floorSvgWidth),
      y: Math.round(poi.mapPosition.y * floorSvgHeight),
      buildingId: buildingData.id,
    }));

    if (!query) {
      return [...roomResults, ...poiResults];
    }

    const filteredLocals = [...roomResults, ...poiResults].filter(
      item => item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query),
    );

    // Cross-Building Results (External)
    const externalResults: IndoorSearchResult[] = [];
    const allBuildings = { ...SGWBuildingMetadata, ...LoyolaBuildingMetadata };

    // Search External Buildings
    Object.entries(allBuildings).forEach(([bId, meta]) => {
      if (bId !== buildingData.id && (meta.name.toLowerCase().includes(query) || bId.toLowerCase().includes(query))) {
        externalResults.push({
          type: "building",
          id: bId,
          label: meta.name,
          buildingId: bId,
        });
      }
    });

    // Search External Rooms
    Object.entries(navConfigRegistry).forEach(([bId, config]) => {
      if (bId === buildingData.id) return;
      config.floors.forEach(floor => {
        floor.nodes.forEach(node => {
          if (node.type === "room") {
            const nodeLabel = node.label || node.id;
            if (nodeLabel.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)) {
              externalResults.push({
                type: "external_room",
                id: node.id,
                label: `${bId} ${nodeLabel}`,
                buildingId: bId,
              });
            }
          }
        });
      });
    });

    return [...filteredLocals, ...externalResults].slice(0, 40); // Slice to protect UI performance
  }, [searchQuery, hotspots, nonRoomPOIs, currentLevel, floorSvgWidth, floorSvgHeight, buildingData.id]);

  const handleSelectSearchResult = useCallback(
    (item: IndoorSearchResult) => {
      const isStart = activeField === "start";

      if (item.type === "building" || item.type === "external_room") {
        const syntheticDest: IndoorDestination = {
          id: item.id,
          label: item.label,
          floorLevel: -999,
          x: 0,
          y: 0,
        };

        if (isStart) {
          setStartLocation(syntheticDest);
          if (onSetStartRoom) onSetStartRoom(item.id, item.buildingId);
        } else {
          setDestination(syntheticDest);
          if (onSetDestinationRoom) onSetDestinationRoom(item.id, item.buildingId);
        }

        setSearchQuery(item.label);
        setShowSearchResults(false);
        setRoute(null);
        return;
      }

      if (item.type === "room") {
        handleSetLocation({ id: item.id, x: item.x!, y: item.y!, floorLevel: item.floorLevel!, label: item.label }, isStart);
        return;
      }

      // Logic for Local POIs
      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === item.room);
      if (matchingRoom) {
        handleSetLocation(
          { id: matchingRoom.id, x: matchingRoom.x, y: matchingRoom.y, floorLevel: matchingRoom.floorLevel, label: matchingRoom.label },
          isStart,
        );
      } else if (item.x !== undefined && item.y !== undefined) {
        const nearestNode = indoorMapService.getNearestRoomNode(`${buildingData.id}_${currentLevel}`, item.x, item.y);
        handleSetLocation(
          {
            id: nearestNode ? nearestNode.id : item.id,
            x: item.x,
            y: item.y,
            floorLevel: item.floorLevel!,
            label: item.label,
          },
          isStart,
        );
      }
    },
    [
      activeField,
      hotspots,
      setStartLocation,
      onSetStartRoom,
      setDestination,
      onSetDestinationRoom,
      handleSetLocation,
      indoorMapService,
      buildingData.id,
      currentLevel,
    ],
  );

  const handleSelectPOI = useCallback(
    (poi: POI, forceIsStart?: boolean) => {
      const isStart = forceIsStart !== undefined ? forceIsStart : activeField === "start";

      if (isStart) {
        setSourcePOI(poi);
      } else {
        setDestinationPOI(poi);
      }

      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === poi.room);
      if (matchingRoom) {
        handleSetLocation(
          { id: matchingRoom.id, x: matchingRoom.x, y: matchingRoom.y, floorLevel: matchingRoom.floorLevel, label: matchingRoom.label },
          isStart,
        );
      } else if (activeFloor) {
        const xPos = Math.round(poi.mapPosition.x * floorSvgWidth);
        const yPos = Math.round(poi.mapPosition.y * floorSvgHeight);

        const nearestNode = indoorMapService.getNearestRoomNode(activeFloor.id, xPos, yPos);

        handleSetLocation(
          {
            id: nearestNode ? nearestNode.id : poi.id,
            x: xPos,
            y: yPos,
            floorLevel: currentLevel,
            label: `${poi.description} (Room ${poi.room})`,
          },
          isStart,
        );
      }
    },
    [activeField, hotspots, currentLevel, activeFloor, indoorMapService, handleSetLocation, floorSvgWidth, floorSvgHeight],
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
          <View style={[styles.headerTitleWrap, { flexDirection: "row", alignItems: "center" }]}>
            <TouchableOpacity
              onPress={() => !isProgrammaticDismissRef.current && onExit()}
              style={{ paddingHorizontal: 16, paddingVertical: 8, marginRight: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
            </TouchableOpacity>
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
            <View style={{ width, height: contentHeight }}>
              <MapContent floor={activeFloor} width={width} height={contentHeight} />
              <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }]} pointerEvents="box-none">
                {route && (
                  <IndoorRouteOverlay
                    routeNodes={route.nodes}
                    currentFloorId={activeFloor.id}
                    canvasWidth={width}
                    canvasHeight={contentHeight}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    scale={scale}
                  />
                )}

                <IndoorRoomLabels
                  hotspots={hotspots}
                  currentLevel={currentLevel}
                  destination={destination}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  scale={scale}
                  onSelectDestination={item => handleSetLocation(item, activeField === "start")}
                />

                {nonRoomPOIs
                  .filter(poi => activeCategories.has(poi.category))
                  .map(poi => {
                    const selectionType = destinationPOI?.id === poi.id ? "destination" : sourcePOI?.id === poi.id ? "source" : undefined;
                    const manualRoomOffset = ICON_POSITION_OVERRIDES[poi.room] ?? { x: 0, y: 0 };
                    const poiX = offsetX + poi.mapPosition.x * floorSvgWidth * scale;
                    const poiY = offsetY + poi.mapPosition.y * floorSvgHeight * scale;

                    return (
                      <POIBadge
                        key={poi.id}
                        poi={poi}
                        left={poiX - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.x}
                        top={poiY - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.y}
                        size={MAP_POI_BADGE_SIZE}
                        selectionType={selectionType}
                        onPress={poi => handleSelectPOI(poi, activeField === "start")}
                      />
                    );
                  })}

                {startLocation && !showDirections && startLocation.floorLevel === currentLevel && (
                  <IndoorPointMarker
                    x={offsetX + startLocation.x * scale}
                    y={offsetY + startLocation.y * scale}
                    emoji="🔵"
                    bgColor="#3A7BD5"
                  />
                )}

                {destination && destination.floorLevel === currentLevel && (
                  <DestinationMarker x={offsetX + destination.x * scale} y={offsetY + destination.y * scale} />
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
            </View>
          </ReactNativeZoomableView>
        </Animated.View>
      </View>

      <IndoorTopPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        searchResults={combinedSearchResults}
        onSelectResult={handleSelectSearchResult}
        onClearDestination={handleClearDestination}
        startLabel={startLocation?.label ?? startPointLabel}
        destinationLabel={destination?.label ?? destinationPointLabel}
        activeField={activeField}
        onFocusField={field => {
          setActiveField(field);
          setSearchQuery("");
          setShowSearchResults(false);
        }}
        onDirectionsPress={handleDirectionsPress}
        canShowDirections={!!destination || (!!destinationBuildingId && destinationBuildingId !== buildingData.id)}
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
        onSelectPOI={poi => handleSelectPOI(poi, routeTargetMode === "SOURCE")}
      />
    </View>
  );
};

export default IndoorMapOverlay;
