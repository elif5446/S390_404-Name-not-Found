import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, Text, Animated, useWindowDimensions } from "react-native";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";

// Services & Types
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingIndoorConfig, FloorData } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
import { Route } from "@/src/indoors/types/Routes";
import { Node } from "@/src/indoors/types/Navigation";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// Components & Metadata
import IndoorMapHeader from "./IndoorMapHeader";
import PulsingUserMarker from "./PulsingUserMarker";
import POIBadge, { ICON_POSITION_OVERRIDES } from "./POIBadge";
import POIFilterPanel, { POIFilterPanelHandle } from "./POIFilterPanel";
import IndoorTopPanel, { IndoorSearchResult } from "./IndoorTopPanel";
import IndoorRouteOverlay from "./IndoorRouteOverlay";
import IndoorPointMarker from "./IndoorPointMarker";
import IndoorDirectionsPopup, { IndoorDirectionsPopupHandle } from "./IndoorDirectionsPopup";
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
  onCancelNavigation?: (arrived?: boolean) => void;
  onToggleOutdoorMap: () => void;
  onStartNavigation?: () => void;
}

// helper
const calculateGeographicHeight = (bounds: any, screenWidth: number, fallbackHeight: number): number => {
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

// Hook for Map Scaling and Layout Math
function useMapLayout(activeFloor: FloorData | undefined, width: number, height: number) {
  const MAP_SECTION_MAX_HEIGHT = height * 0.5;
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

  return {
    floorSvgWidth,
    floorSvgHeight,
    contentHeight,
    scale,
    offsetX,
    offsetY,
    panBufferX: width * 2,
    panBufferY: Math.max(contentHeight * 2, height * 2),
  };
}
// 4 helper functions
function createRoomResults(hotspots: IndoorHotspot[], buildingId: string): IndoorSearchResult[] {
  return hotspots.map(spot => ({
    type: "room",
    id: spot.id,
    label: spot.label,
    x: spot.x,
    y: spot.y,
    floorLevel: spot.floorLevel,
    buildingId,
  }));
}

function createPOIResults(nonRoomPOIs: POI[], currentLevel: number, layout: any, buildingId: string): IndoorSearchResult[] {
  return nonRoomPOIs.map(poi => ({
    type: "poi",
    id: poi.id,
    label: `${poi.description} (Room ${poi.room})`,
    room: poi.room,
    floorLevel: currentLevel,
    x: Math.round(poi.mapPosition.x * layout.floorSvgWidth),
    y: Math.round(poi.mapPosition.y * layout.floorSvgHeight),
    buildingId,
  }));
}

function filterResults(items: IndoorSearchResult[], query: string): IndoorSearchResult[] {
  return items.filter(item => item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query));
}

function createExternalResults(query: string, buildingData: BuildingIndoorConfig): IndoorSearchResult[] {
  const externalResults: IndoorSearchResult[] = [];
  const allBuildings = { ...SGWBuildingMetadata, ...LoyolaBuildingMetadata };

  Object.entries(allBuildings).forEach(([bId, meta]) => {
    if (bId !== buildingData.id && (meta.name.toLowerCase().includes(query) || bId.toLowerCase().includes(query))) {
      externalResults.push({
        type: "building" as const,
        id: bId,
        label: meta.name,
        buildingId: bId,
      });
    }
  });

  Object.entries(navConfigRegistry).forEach(([bId, config]) => {
    if (bId === buildingData.id) return;
    for (const floor of config.floors) {
      for (const node of floor.nodes) {
        if (node.type === "room") {
          const nodeLabel = node.label || node.id;
          if (nodeLabel.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)) {
            externalResults.push({
              type: "external_room" as const,
              id: node.id,
              label: `${bId} ${nodeLabel}`,
              buildingId: bId,
            });
          }
        }
      }
    }
  });

  return externalResults;
}

function useIndoorSearch(
  searchQuery: string,
  buildingData: BuildingIndoorConfig,
  currentLevel: number,
  hotspots: IndoorHotspot[],
  nonRoomPOIs: POI[],
  layout: any,
) {
  return useMemo<IndoorSearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const roomResults = createRoomResults(hotspots, buildingData.id);
    const poiResults = createPOIResults(nonRoomPOIs, currentLevel, layout, buildingData.id);
    const filteredLocals = filterResults([...roomResults, ...poiResults], query);
    const externalResults = createExternalResults(query, buildingData);

    return [...filteredLocals, ...externalResults].slice(0, 40);
  }, [searchQuery, hotspots, nonRoomPOIs, currentLevel, layout.floorSvgWidth, layout.floorSvgHeight, buildingData.id]);
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

  const cleanRoomString = (room?: string | null) => room?.replaceAll(/[^a-zA-Z0-9]/g, "").toUpperCase() || "";

  if (isNavigationActive && startBuildingId === buildingData.id && startRoomId) {
    const cleanStart = cleanRoomString(startRoomId);
    for (const navFloor of navConfig.floors) {
      if (
        navFloor.nodes.some(n =>
          n.id
            .replaceAll(/[^a-zA-Z0-9]/g, "")
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
              .replaceAll(/[^a-zA-Z0-9]/g, "")
              .toUpperCase()
              .endsWith(cleanDest) ||
            (n.label || "")
              .replaceAll(/[^a-zA-Z0-9]/g, "")
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

//helper functions
const normalize = (value?: string | null): string => value?.toLowerCase().replaceAll(/[^a-z0-9]/g, "") || "";

const matches = (target: string, query: string): boolean => target === query || target.endsWith(query);

//search functions
function findHotspotTarget(hotspots: IndoorHotspot[], query: string, buildingId: string): IndoorDestination | undefined {
  const found = hotspots.find(spot => {
    const id = normalize(spot.id);
    const label = normalize(spot.label);
    return matches(id, query) || matches(label, query);
  });

  if (!found) return;

  return {
    id: found.id,
    x: found.x,
    y: found.y,
    floorLevel: found.floorLevel,
    label: found.label,
    buildingId,
  };
}

function findNodeTarget(buildingData: BuildingIndoorConfig, roomId: string): IndoorDestination | undefined {
  const navConfig = navConfigRegistry[buildingData.id];
  if (!navConfig) return;

  const query = normalize(roomId);

  for (const navFloor of navConfig.floors) {
    const foundNode = navFloor.nodes.find(n => {
      if (n.id === roomId) return true;

      const id = normalize(n.id);
      const label = normalize(n.label);

      return matches(id, query) || matches(label, query);
    });

    if (foundNode) {
      const visualFloor = buildingData.floors.find(f => f.id === navFloor.floorId);

      return {
        id: foundNode.id,
        x: foundNode.x,
        y: foundNode.y,
        floorLevel: visualFloor?.level ?? buildingData.defaultFloor,
        label: foundNode.label ?? foundNode.id,
        buildingId: buildingData.id,
      };
    }
  }
}

function findPOITarget(
  pois: POI[],
  buildingData: BuildingIndoorConfig,
  roomId: string,
  currentLevel?: number,
): IndoorDestination | undefined {
  const found = pois.find(p => p.id === roomId || p.room === roomId);
  if (!found) return;

  const floor = buildingData.floors.find(f => f.level === currentLevel);
  const width = (floor as any)?.width ?? 1024;
  const height = (floor as any)?.height ?? 1024;

  return {
    id: found.id,
    x: Math.round(found.mapPosition.x * width),
    y: Math.round(found.mapPosition.y * height),
    floorLevel: currentLevel ?? buildingData.defaultFloor,
    label: found.label,
    buildingId: buildingData.id,
  };
}

function handleAutoFloorSwitch({
  type,
  targetNode,
  isNavigationActive,
  baseStartNode,
  buildingData,
  currentLevel,
  handleFloorChange,
}: {
  type: string;
  targetNode: IndoorDestination;
  isNavigationActive?: boolean;
  baseStartNode?: Node | null;
  buildingData: BuildingIndoorConfig;
  currentLevel?: number;
  handleFloorChange?: (level: number) => void;
}) {
  if (type !== "destination" || !handleFloorChange || currentLevel === undefined) return;

  const targetLevel =
    isNavigationActive && baseStartNode ? buildingData.floors.find(f => f.id === baseStartNode.floorId)?.level : targetNode.floorLevel;

  if (targetLevel !== undefined && currentLevel !== targetLevel) {
    setTimeout(() => handleFloorChange(targetLevel), 100);
  }
}
interface UseLocationSyncProps {
  type: "start" | "destination";
  buildingData: BuildingIndoorConfig;
  buildingId?: string | null;
  roomId?: string | null;
  hotspots: IndoorHotspot[];
  poisForFloor: POI[];
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
  poisForFloor,
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

    if (type === "destination" && !baseStartNode) return;
    if (roomId === lastSyncedRef.current) return;

    const query = normalize(roomId);

    const targetNode =
      findHotspotTarget(hotspots, query, buildingData.id) ||
      findNodeTarget(buildingData, roomId) ||
      findPOITarget(poisForFloor, buildingData, roomId, currentLevel);
    if (!targetNode) {
      setLocation(null);
      return;
    }

    setLocation(targetNode);
    lastSyncedRef.current = roomId;

    handleAutoFloorSwitch({
      type,
      targetNode,
      isNavigationActive,
      baseStartNode,
      buildingData,
      currentLevel,
      handleFloorChange,
    });
  }, [type, buildingId, roomId, buildingData, hotspots, isNavigationActive, baseStartNode, currentLevel, handleFloorChange]);
  return { location, setLocation };
}

//  room selection handler 
function handleRoomSelection(
  item: IndoorSearchResult,
  isStart: boolean,
  buildingId: string,
  handleSetLocation: any,
) {
  handleSetLocation(
    {
      id: item.id,
      x: item.x!,
      y: item.y!,
      floorLevel: item.floorLevel!,
      label: item.label,
      buildingId,
    },
    isStart,
  );
}

//  building selection handler 
function handleBuildingSelection(
  item: IndoorSearchResult,
  isStart: boolean,
  setStartLocation: any,
  setDestination: any,
  onSetStartRoom: any,
  onSetDestinationRoom: any,
) {
  const syntheticDest: IndoorDestination = {
    id: item.id,
    label: item.label ?? "",
    floorLevel: -999,
    x: 0,
    y: 0,
    buildingId: item.buildingId || item.id,
  };

  if (isStart) {
    setStartLocation(syntheticDest);
    onSetStartRoom?.(item.id, item.buildingId);
  } else {
    setDestination(syntheticDest);
    onSetDestinationRoom?.(item.id, item.buildingId);
  }

  return syntheticDest;
}

function handleZeroDistanceRoute(startNodeId: string, endNodeId: string, indoorMapService: IndoorMapService) {
  if (startNodeId !== endNodeId) return null;
  const graphNode = indoorMapService.getGraph().getNode(startNodeId);
  if (!graphNode) return null;

  return { distance: 0, nodes: [graphNode] } as any;
}

//handle POI selection function
function handlePOISelection(
  item: IndoorSearchResult,
  hotspots: IndoorHotspot[],
  buildingData: BuildingIndoorConfig,
  currentLevel: number,
  indoorMapService: IndoorMapService,
  isStart: boolean,
  handleSetLocation: any,
) {
  const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === item.room);

  if (matchingRoom) {
    return handleSetLocation(
      {
        id: matchingRoom.id,
        x: matchingRoom.x,
        y: matchingRoom.y,
        floorLevel: matchingRoom.floorLevel,
        label: matchingRoom.label,
        buildingId: buildingData.id,
      },
      isStart,
    );
  }

  if (item.x !== undefined && item.y !== undefined) {
    const nearestNode = indoorMapService.getNearestRoomNode(`${buildingData.id}_${currentLevel}`, item.x, item.y);

    return handleSetLocation(
      {
        id: nearestNode?.id ?? item.id,
        x: item.x,
        y: item.y,
        floorLevel: item.floorLevel!,
        label: item.label,
        buildingId: buildingData.id,
      },
      isStart,
    );
  }
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
  onStartNavigation,
  onToggleOutdoorMap,
}) => {
  const { width, height } = useWindowDimensions();

  // Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);
  const isProgrammaticDismissRef = useRef(false);
  const popupRef = useRef<IndoorDirectionsPopupHandle>(null);
  const poiPanelRef = useRef<POIFilterPanelHandle>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

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

  const { floorSvgWidth, floorSvgHeight, contentHeight, scale, offsetX, offsetY, panBufferX, panBufferY } = useMapLayout(
    activeFloor,
    width,
    height,
  );

  useEffect(() => {
    setSearchQuery(destinationPointLabel);
  }, [destinationPointLabel]);

  const handleMapInteraction = useCallback(() => {
    popupRef.current?.minimize();
    poiPanelRef.current?.minimize();
  }, []);

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
    sNode ??= indoorMapService.getEntranceNode() ?? indoorMapService.getStartNode();
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
        if (finished && isMounted.current) {
          setCurrentLevel(level);
          zoomRef.current?.zoomTo(1);
        }
      });
    },
    [currentLevel, fadeAnim],
  );

  const combinedSearchResults = useIndoorSearch(searchQuery, buildingData, currentLevel, hotspots, nonRoomPOIs, {
    floorSvgWidth,
    floorSvgHeight,
  });

  const { location: startLocation, setLocation: setStartLocation } = useLocationSync({
    type: "start",
    buildingData,
    buildingId: startBuildingId,
    roomId: startRoomId,
    hotspots,
    poisForFloor,
  });

  const { location: destination, setLocation: setDestination } = useLocationSync({
    type: "destination",
    buildingData,
    buildingId: destinationBuildingId,
    roomId: destinationRoomId,
    hotspots,
    poisForFloor,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
  });

  // UI lifecycle
  useEffect(() => {
    isMounted.current = true;
    getWheelchairAccessibilityPreference().then(setAvoidStairs);
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

      matchedNode ??= graph.getAllNodes().find(node => {
          const nodeLabel = (node.label ?? node.id).toLowerCase();
          return node.floorId === floorId && (nodeLabel.includes(normalizedLabel) || normalizedLabel.includes(nodeLabel));
        });
      return matchedNode?.id ?? null;
    },
    [indoorMapService, buildingData.id],
  );
  // start‑node resolution
  function resolveStartNode(
    startBuildingId: string | null | undefined,
    startLocation: any,
    startRoomId: string | null | undefined,
    buildingData: BuildingIndoorConfig,
    indoorMapService: IndoorMapService,
    baseStartNode: any,
    navConfig: any,
  ): string {
    if (startBuildingId === buildingData.id) {
      if (startLocation) {
        return resolveDestinationNodeId(startLocation) ?? navConfig.defaultStartNodeId;
      }
      if (startRoomId) {
        return indoorMapService.getNodeByRoomNumber(buildingData.id, startRoomId)?.id || navConfig.defaultStartNodeId;
      }
      return indoorMapService.getEntranceNode()?.id || navConfig.defaultStartNodeId;
    }

    if (startBuildingId === "USER" || (startBuildingId && startBuildingId !== buildingData.id)) {
      return indoorMapService.getEntranceNode()?.id || navConfig.defaultStartNodeId;
    }

    return baseStartNode?.id || navConfig.defaultStartNodeId;
  }

  //end‑node resolution
  function resolveEndNode(
    destinationBuildingId: string | null | undefined,
    destination: any,
    buildingData: BuildingIndoorConfig,
    indoorMapService: IndoorMapService,
  ): string | null {
    if (destinationBuildingId === buildingData.id) {
      if (destination) {
        return resolveDestinationNodeId(destination);
      }
      return indoorMapService.getEntranceNode()?.id || null;
    }

    if (destinationBuildingId && destinationBuildingId !== buildingData.id) {
      return indoorMapService.getEntranceNode()?.id || null;
    }

    return null;
  }

  const calculateRoute = useCallback(async () => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig) return setRoute(null);

      const startNodeId = resolveStartNode(
        startBuildingId,
        startLocation,
        startRoomId,
        buildingData,
        indoorMapService,
        baseStartNode,
        navConfig,
      );

      const endNodeId = resolveEndNode(destinationBuildingId, destination, buildingData, indoorMapService);

      if (!startNodeId || !endNodeId) return setRoute(null);

      const zeroRoute = handleZeroDistanceRoute(startNodeId, endNodeId, indoorMapService);
      if (zeroRoute) return setRoute(zeroRoute);

      const nextRoute = await indoorMapService.getRoute(startNodeId, endNodeId, avoidStairs);
      setRoute(nextRoute);
    } catch (error) {
      console.warn("Failed to compute indoor route:", error);
      setRoute(null);
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

  // Immediately draw route when destination, start, or stairs preference changes
  useEffect(() => {
    if (destination || destinationBuildingId) {
      calculateRoute();
    } else {
      setRoute(null);
    }
  }, [destination, startLocation, calculateRoute, destinationBuildingId, buildingData.id, avoidStairs]);

  const handleClearDestination = useCallback(() => {
    if (activeField === "start") setStartLocation(null);
    else setDestination(null);

    setSearchQuery("");
    setShowSearchResults(false);
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
    },
    [setStartLocation, onSetStartRoom, setDestination, onSetDestinationRoom],
  );

  const handleSelectSearchResult = useCallback(
    (item: IndoorSearchResult) => {
      const isStart = activeField === "start";

      if (item.type === "building" || item.type === "external_room") {
        const synthetic = handleBuildingSelection(item, isStart, setStartLocation, setDestination, onSetStartRoom, onSetDestinationRoom);

        setSearchQuery(synthetic.label ?? "");
        setShowSearchResults(false);
        setRoute(null);
        return;
      }

      if (item.type === "room") {
        handleRoomSelection(item, isStart, buildingData.id, handleSetLocation);
        return;
      }

      handlePOISelection(item, hotspots, buildingData, currentLevel, indoorMapService, isStart, handleSetLocation);
    },
    [
      activeField,
      hotspots,
      buildingData,
      currentLevel,
      indoorMapService,
      setStartLocation,
      setDestination,
      onSetStartRoom,
      onSetDestinationRoom,
      handleSetLocation,
    ],
  );
  const handleSelectPOI = useCallback(
    (poi: POI, forceIsStart?: boolean) => {
      const isStart = forceIsStart ?? (activeField === "start");

      if (isStart) {
        setSourcePOI(poi);
      } else {
        setDestinationPOI(poi);
      }

      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === poi.room);
      if (matchingRoom) {
        handleSetLocation(
          {
            id: matchingRoom.id,
            x: matchingRoom.x,
            y: matchingRoom.y,
            floorLevel: matchingRoom.floorLevel,
            label: matchingRoom.label,
            buildingId: buildingData.id,
          },
          isStart,
        );
      } else if (activeFloor) {
        const xPos = Math.round(poi.mapPosition.x * floorSvgWidth);
        const yPos = Math.round(poi.mapPosition.y * floorSvgHeight);

        const nearestNode = indoorMapService.getNearestRoomNode(activeFloor.id, xPos, yPos);

        handleSetLocation(
          {
            id: nearestNode?.id ?? poi.id,
            x: xPos,
            y: yPos,
            floorLevel: currentLevel,
            label: `${poi.description} (Room ${poi.room})`,
            buildingId: buildingData.id,
          },
          isStart,
        );
      }
    },
    [activeField, hotspots, activeFloor, handleSetLocation, buildingData.id, floorSvgWidth, floorSvgHeight, indoorMapService, currentLevel],
  );

  const handleToggleCategory = useCallback((cat: POICategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const routeSteps = useMemo(() => {
    if (!route?.nodes?.length) return [];

    try {
      const instructions = indoorMapService.getRouteInstructions(route);
      if (instructions?.steps?.length > 0) return instructions.steps;
    } catch (e) {
      console.warn("Could not parse route instructions", e);
    }

    const lastNode = route.nodes[route.nodes.length - 1];
    const entranceNode = indoorMapService.getEntranceNode();
    const isEntrance = !!entranceNode && entranceNode.id === lastNode.id;
    const routingToDifferentBuilding = destinationBuildingId && destinationBuildingId !== buildingData.id;

    let fallbackText = "You are at your destination";
    if (isEntrance && routingToDifferentBuilding) {
      fallbackText = "Head outside to continue your route";
    }

    return [
      {
        id: "arrived",
        text: fallbackText,
        node: lastNode,
      },
    ];
  }, [route, indoorMapService, destinationBuildingId, buildingData.id]);

  useEffect(() => {
    if (route) setActiveStepIndex(0);
  }, [route]);

  const endsAtEntrance = useMemo(() => {
    if (!route?.nodes.length) return false;
    const entranceNode = indoorMapService.getEntranceNode();
    const lastNode = route.nodes[route.nodes.length - 1];

    const routingToDifferentBuilding = destinationBuildingId && destinationBuildingId !== buildingData.id;

    return !!entranceNode && entranceNode.id === lastNode.id && routingToDifferentBuilding;
  }, [route, indoorMapService, destinationBuildingId, buildingData.id]);

  const lastAutoSwitchStepRef = useRef<number | null>(null);
  // auto-switch floors when the step changes
  useEffect(() => {
    if (lastAutoSwitchStepRef.current !== activeStepIndex) {
      lastAutoSwitchStepRef.current = activeStepIndex;

      if (routeSteps.length > 0 && routeSteps[activeStepIndex]) {
        const activeNode = routeSteps[activeStepIndex].node;
        const targetFloor = buildingData.floors.find(f => f.id === activeNode.floorId);
        if (targetFloor?.level !== undefined) {
          handleFloorChange(targetFloor.level);
        }
      }
    }
  }, [activeStepIndex, buildingData.floors, handleFloorChange, routeSteps]);

  const activeLocationNode = useMemo(() => {
    if (isNavigationActive && routeSteps.length > 0 && routeSteps[activeStepIndex]) {
      return routeSteps[activeStepIndex].node;
    }
    return baseStartNode;
  }, [isNavigationActive, routeSteps, activeStepIndex, baseStartNode]);

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]} pointerEvents="auto">
      <IndoorMapHeader
        buildingData={buildingData}
        activeFloor={activeFloor}
        currentLevel={currentLevel}
        onFloorChange={handleFloorChange}
        onExit={onExit}
        isProgrammaticDismissRef={isProgrammaticDismissRef}
      />

      <View style={[styles.mapContainer, { marginTop: 60 }]}>
        <Animated.View
          style={[styles.mapCanvas, { opacity: fadeAnim }]}
          onStartShouldSetResponderCapture={() => {
            handleMapInteraction();
            return false;
          }}
          testID="indoor-map-canvas"
        >
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
                  onSelectDestination={item => handleSetLocation({ ...item, buildingId: buildingData.id }, activeField === "start")}
                />

                {nonRoomPOIs
                  .filter(poi => activeCategories.has(poi.category))
                  .map(poi => {
                    let selectionType: "destination" | "source" | undefined;
                    if (destinationPOI?.id === poi.id) selectionType = "destination";
                    else if (sourcePOI?.id === poi.id) selectionType = "source";
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

                {startLocation?.floorLevel === currentLevel && (
                  <IndoorPointMarker
                    x={offsetX + startLocation.x * scale}
                    y={offsetY + startLocation.y * scale}
                    emoji="🔵"
                    bgColor="#3A7BD5"
                  />
                )}

                {destination?.floorLevel === currentLevel && (
                  <DestinationMarker x={offsetX + destination.x * scale} y={offsetY + destination.y * scale} />
                )}

                {activeLocationNode?.floorId === activeFloor.id && (
                  <PulsingUserMarker x={offsetX + activeLocationNode.x * scale} y={offsetY + activeLocationNode.y * scale} />
                )}
              </View>
            </View>
          </ReactNativeZoomableView>
        </Animated.View>
      </View>

      {!isNavigationActive && (
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
          onStartNavigation={() => {
            if (onStartNavigation) onStartNavigation();
          }}
          canStartNavigation={!!route || (!!destinationBuildingId && destinationBuildingId !== buildingData.id)}
          categories={categoriesForFloor}
          activeCategories={activeCategories}
          onToggleCategory={handleToggleCategory}
        />
      )}

      <IndoorDirectionsPopup
        ref={popupRef}
        visible={!!isNavigationActive && routeSteps.length > 0}
        steps={routeSteps as any}
        activeStepIndex={activeStepIndex}
        onNextStep={() => setActiveStepIndex(prev => Math.min(prev + 1, routeSteps.length - 1))}
        onPrevStep={() => setActiveStepIndex(prev => Math.max(prev - 1, 0))}
        onClose={() => {
          if (onCancelNavigation) onCancelNavigation(false);
        }}
        onFinish={() => {
          if (endsAtEntrance) {
            onToggleOutdoorMap();
          } else if (onCancelNavigation) {
            // Pass 'true' to indicate they successfully arrived
            onCancelNavigation(true);
          }
        }}
        finishLabel={endsAtEntrance ? "Exit Building" : "Finish"}
      />

      <POIFilterPanel
        ref={poiPanelRef}
        visible={!isNavigationActive}
        buildingId={buildingData.id}
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
