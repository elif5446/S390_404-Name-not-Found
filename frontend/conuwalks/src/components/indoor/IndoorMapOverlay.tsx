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
  onCancelNavigation?: () => void;
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

// Hook for Search & Filtering Logic
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
      x: Math.round(poi.mapPosition.x * layout.floorSvgWidth),
      y: Math.round(poi.mapPosition.y * layout.floorSvgHeight),
      buildingId: buildingData.id,
    }));

    const filteredLocals = [...roomResults, ...poiResults].filter(
      item => item.label.toLowerCase().includes(query) || item.id.toLowerCase().includes(query),
    );

    // Cross-Building Results omitted for brevity in this hook, but logic remains the same as your original
    const externalResults: IndoorSearchResult[] = [];
    const allBuildings = { ...SGWBuildingMetadata, ...LoyolaBuildingMetadata };

    Object.entries(allBuildings).forEach(([bId, meta]) => {
      if (bId !== buildingData.id && (meta.name.toLowerCase().includes(query) || bId.toLowerCase().includes(query))) {
        externalResults.push({ type: "building", id: bId, label: meta.name, buildingId: bId });
      }
    });

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

function useStartSync(
  buildingData: BuildingIndoorConfig,
  startBuildingId: string | null | undefined,
  startRoomId: string | null | undefined,
  hotspots: IndoorHotspot[],
) {
  const [startLocation, setStartLocation] = useState<IndoorDestination | null>(null);
  const lastSyncedStartRef = useRef<string | null>(null);

  useEffect(() => {
    if (!startBuildingId || startBuildingId !== buildingData.id || !startRoomId) {
      setStartLocation(null);
      lastSyncedStartRef.current = null;
      return;
    }

    if (startRoomId === lastSyncedStartRef.current) return;

    const cleanInput = startRoomId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let targetNode: IndoorDestination | undefined;

    const foundSpot = hotspots.find(spot => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return spotId === cleanInput || spotLabel === cleanInput || spotId.endsWith(cleanInput) || spotLabel.endsWith(cleanInput);
    });

    if (foundSpot) {
      targetNode = {
        id: foundSpot.id,
        x: foundSpot.x,
        y: foundSpot.y,
        floorLevel: foundSpot.floorLevel,
        label: foundSpot.label,
        buildingId: buildingData.id,
      };
    }

    // if not in hotspots, search ALL nodes
    if (!targetNode) {
      const navConfig = navConfigRegistry[buildingData.id];
      if (navConfig) {
        for (const navFloor of navConfig.floors) {
          const foundNode = navFloor.nodes.find(n => {
            if (n.id === startRoomId) return true;
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
              buildingId: buildingData.id,
            };
            break;
          }
        }
      }
    }

    // fallback for purely visual/explicit POIs
    if (!targetNode) {
      for (const floor of buildingData.floors) {
        const pois = getPOIsForFloor(buildingData.id, floor.level);
        const foundPoi = pois.find(p => p.id === startRoomId || p.room === startRoomId);
        if (foundPoi) {
          const fallbackWidth = (floor as any).width ?? 1024;
          const fallbackHeight = (floor as any).height ?? 1024;
          targetNode = {
            id: foundPoi.id,
            x: Math.round(foundPoi.mapPosition.x * fallbackWidth),
            y: Math.round(foundPoi.mapPosition.y * fallbackHeight),
            floorLevel: floor.level,
            label: foundPoi.label,
            buildingId: buildingData.id,
          };
          break;
        }
      }
    }

    if (targetNode) {
      setStartLocation(targetNode);
      lastSyncedStartRef.current = startRoomId;
    } else {
      setStartLocation(null);
    }
  }, [startBuildingId, startRoomId, buildingData.id, buildingData.floors, buildingData.defaultFloor, hotspots]);

  return { startLocation, setStartLocation };
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
      lastSyncedDestRef.current = null;
      return;
    }

    if (!baseStartNode || destinationRoomId === lastSyncedDestRef.current) return;

    const cleanInput = destinationRoomId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let targetNode: IndoorDestination | undefined;

    const foundSpot = hotspots.find(spot => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return spotId === cleanInput || spotLabel === cleanInput || spotId.endsWith(cleanInput) || spotLabel.endsWith(cleanInput);
    });

    if (foundSpot) {
      targetNode = {
        id: foundSpot.id,
        x: foundSpot.x,
        y: foundSpot.y,
        floorLevel: foundSpot.floorLevel,
        label: foundSpot.label,
        buildingId: buildingData.id,
      };
    }

    // if not in hotspots, search ALL nodes
    if (!targetNode) {
      const navConfig = navConfigRegistry[buildingData.id];
      if (navConfig) {
        for (const navFloor of navConfig.floors) {
          const foundNode = navFloor.nodes.find(n => {
            if (n.id === destinationRoomId) return true; // Exact match priority
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
              buildingId: buildingData.id,
            };
            break;
          }
        }
      }
    }

    // fallback for purely visual/explicit POIs
    if (!targetNode) {
      for (const floor of buildingData.floors) {
        const pois = getPOIsForFloor(buildingData.id, floor.level);
        const foundPoi = pois.find(p => p.id === destinationRoomId || p.room === destinationRoomId);
        if (foundPoi) {
          const fallbackWidth = (floor as any).width ?? 1024;
          const fallbackHeight = (floor as any).height ?? 1024;
          targetNode = {
            id: foundPoi.id,
            x: Math.round(foundPoi.mapPosition.x * fallbackWidth),
            y: Math.round(foundPoi.mapPosition.y * fallbackHeight),
            floorLevel: floor.level,
            label: foundPoi.label,
            buildingId: buildingData.id,
          };
          break;
        }
      }
    }

    if (targetNode) {
      setDestination(targetNode);
      lastSyncedDestRef.current = destinationRoomId;
      const targetLevel = targetNode.floorLevel;
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
    buildingData.defaultFloor,
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
  onStartNavigation,
  onToggleOutdoorMap,
}) => {
  const { width, height } = useWindowDimensions();
  const MAP_SECTION_MAX_HEIGHT = height * 0.5;

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
  //   const [showDirections, setShowDirections] = useState(false);
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

  const { startLocation, setStartLocation } = useStartSync(buildingData, startBuildingId, startRoomId, hotspots);
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

  // Auto-Routing Calculator
  const calculateRoute = useCallback(async () => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig) {
        setRoute(null);
        return;
      }

      let startNodeId: string | null = null;
      let endNodeId: string | null = null;

      // resolve start node
      if (startBuildingId === buildingData.id) {
        if (startLocation) {
          startNodeId = resolveDestinationNodeId(startLocation);
        } else if (startRoomId) {
          startNodeId = indoorMapService.getNodeByRoomNumber(buildingData.id, startRoomId)?.id || null;
        } else {
          startNodeId = indoorMapService.getEntranceNode()?.id || null;
        }
      } else if (startBuildingId === "USER" || (startBuildingId && startBuildingId !== buildingData.id)) {
        startNodeId = indoorMapService.getEntranceNode()?.id || null;
      }

      if (!startNodeId) {
        startNodeId = baseStartNode?.id || navConfig.defaultStartNodeId;
      }

      // Resolve end node
      if (destinationBuildingId === buildingData.id) {
        if (destination) {
          endNodeId = resolveDestinationNodeId(destination);
        } else {
          endNodeId = indoorMapService.getEntranceNode()?.id || null;
        }
      } else if (destinationBuildingId && destinationBuildingId !== buildingData.id) {
        endNodeId = indoorMapService.getEntranceNode()?.id || null;
      }

      if (!startNodeId || !endNodeId) {
        setRoute(null);
        return;
      }

      // handle 0 distance route
      if (startNodeId === endNodeId) {
        const graphNode = indoorMapService.getGraph().getNode(startNodeId);
        if (graphNode) {
          setRoute({ distance: 0, nodes: [graphNode] } as any);
          return;
        }
      }

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
        const syntheticDest: IndoorDestination = {
          id: item.id,
          label: item.label,
          floorLevel: -999,
          x: 0,
          y: 0,
          buildingId: item.buildingId || item.id,
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
        handleSetLocation(
          { id: item.id, x: item.x!, y: item.y!, floorLevel: item.floorLevel!, label: item.label, buildingId: buildingData.id },
          isStart,
        );
        return;
      }

      // Logic for Local POIs
      const matchingRoom = hotspots.find(spot => spot.label.replace("Room ", "") === item.room);
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
      } else if (item.x !== undefined && item.y !== undefined) {
        const nearestNode = indoorMapService.getNearestRoomNode(`${buildingData.id}_${currentLevel}`, item.x, item.y);
        handleSetLocation(
          {
            id: nearestNode ? nearestNode.id : item.id,
            x: item.x,
            y: item.y,
            floorLevel: item.floorLevel!,
            label: item.label,
            buildingId: buildingData.id,
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
            id: nearestNode ? nearestNode.id : poi.id,
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
    if (!route || !route.nodes || route.nodes.length === 0) return [];

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
    if (!route || !route.nodes.length) return false;
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
        if (targetFloor && targetFloor.level !== undefined) {
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

                {startLocation && startLocation.floorLevel === currentLevel && (
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

                {activeLocationNode && activeLocationNode.floorId === activeFloor.id && (
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
          if (onCancelNavigation) onCancelNavigation();
        }}
        onFinish={endsAtEntrance ? onToggleOutdoorMap : onCancelNavigation}
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
