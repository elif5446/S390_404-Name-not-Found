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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
import MapContent from "./IndoorMap";
import POIBadge from "./POIBadge";
import POIFilterPanel from "./POIFilterPanel";
import IndoorRoomLabels from "./IndoorRoomLabels";
import IndoorBottomPanel, {
  IndoorSearchResult,
} from "./IndoorTopPanel";
import { styles } from "@/src/styles/IndoorMap.styles";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";
import {
  IndoorHotspot,
  IndoorDestination,
} from "@/src/indoors/types/hotspot";
import IndoorRouteOverlay from "./IndoorRouteOverlay";
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { Route } from "@/src/indoors/types/Routes";
import IndoorPointMarker from "./IndoorPointMarker";

type RouteNodeLike = {
  id: string;
  x: number;
  y: number;
  label?: string;
};

// type RouteStep = {
//   id: string;
//   text: string;
// };

// function getEstimatedWalkMinutes(distance: number) {
//   const pixelsPerMinute = 300;
//   return Math.max(1, Math.round(distance / pixelsPerMinute));
// }

// function getDirectionVector(
//   from: { x: number; y: number },
//   to: { x: number; y: number },
// ) {
//   return {
//     dx: to.x - from.x,
//     dy: to.y - from.y,
//   };
// }

// function getReadableDestinationLabel(node: { label?: string; id: string }) {
//   const raw = node.label ?? node.id;
//   const cleaned = raw.replace(/^Room\s+/i, "").trim();
//   return `Room ${cleaned}`;
// }

// function getReadableStartLabel(node: { label?: string; id: string }) {
//   return node.label ?? node.id;
// }

// function getInitialCorridorInstruction(vec: { dx: number; dy: number }) {
//   const horizontal = Math.abs(vec.dx) > Math.abs(vec.dy);

//   if (horizontal) {
//     return vec.dx > 0
//       ? "Exit the room and turn right into the corridor"
//       : "Exit the room and turn left into the corridor";
//   }
//   if (vec.dy > 0) {
//     return "Exit the room and turn right into the corridor";
//   } else {
//     return "Exit the room and turn left into the corridor";
//   }
// }

// function getTurnInstruction(
//   prev: { dx: number; dy: number },
//   next: { dx: number; dy: number },
// ): "straight" | "left" | "right" {
//   const cross = prev.dx * next.dy - prev.dy * next.dx;
//   const dot = prev.dx * next.dx + prev.dy * next.dy;

//   if (Math.abs(cross) < 5 || dot > 0) {
//     return "straight";
//   }
//   return cross > 0 ? "left" : "right";
// }

// function generateRouteSteps(nodes: { id: string; x: number; y: number; label?: string }[]): RouteStep[] {
//   if (!nodes || nodes.length < 2) return [];

//   const steps: RouteStep[] = [];

//   const firstVec = getDirectionVector(nodes[0], nodes[1]);

//   if (nodes.length === 2) {
//     steps.push({
//       id: `${nodes[0].id}-${nodes[1].id}-start`,
//       text: getInitialCorridorInstruction(firstVec),
//     });
//     steps.push({
//       id: `${nodes[1].id}-arrive`,
//       text: `Arrive at ${getReadableDestinationLabel(nodes[1])}`,
//     });
//     return steps;
//   }

//   // First step from classroom/start node into corridor
//   steps.push({
//     id: `${nodes[0].id}-${nodes[1].id}-start`,
//     text: getInitialCorridorInstruction(firstVec),
//   });

//   // Middle turns
//   for (let i = 1; i < nodes.length - 1; i++) {
//     const prevVec = getDirectionVector(nodes[i - 1], nodes[i]);
//     const nextVec = getDirectionVector(nodes[i], nodes[i + 1]);

//     const moveLength = Math.sqrt(nextVec.dx * nextVec.dx + nextVec.dy * nextVec.dy);
//     if (moveLength < 5) continue;

//     const turn = getTurnInstruction(prevVec, nextVec);

//     if (turn === "left") {
//       steps.push({
//         id: `${nodes[i].id}-left`,
//         text: "Turn left",
//       });
//     } else if (turn === "right") {
//       steps.push({
//         id: `${nodes[i].id}-right`,
//         text: "Turn right",
//       });
//     } else {
//       if (i === 1 || i === nodes.length - 2) {
//         steps.push({
//           id: `${nodes[i].id}-straight`,
//           text: "Continue straight along the corridor",
//         });
//       }
//     }
//   }

//   // Final arrival
//   const lastNode = nodes[nodes.length - 1];
//   steps.push({
//     id: `${lastNode.id}-arrive`,
//     text: `Arrive at ${getReadableDestinationLabel(lastNode)}`,
//   });

//   return steps.filter((step, index, arr) => {
//     if (index === 0) return true;
//     return step.text !== arr[index - 1].text;
//   });
// }
type RouteStep = {
  id: string;
  text: string;
};

function getEstimatedWalkMinutes(distance: number) {
  const pixelsPerMinute = 300;
  return Math.max(1, Math.round(distance / pixelsPerMinute));
}

function getDirectionVector(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return {
    dx: to.x - from.x,
    dy: to.y - from.y,
  };
}

function getReadableDestinationLabel(node: { label?: string; id: string }) {
  const raw = node.label ?? node.id;
  const cleaned = raw.replace(/^Room\s+/i, "").trim();
  return `Room ${cleaned}`;
}

function getInitialCorridorInstruction(vec: { dx: number; dy: number }) {
  if (Math.abs(vec.dx) >= Math.abs(vec.dy)) {
    return vec.dx > 0
      ? "Exit the room and turn right into the corridor"
      : "Exit the room and turn left into the corridor";
  }

  return "Exit the room and continue into the corridor";
}

function getTurnInstruction(
  prev: { dx: number; dy: number },
  next: { dx: number; dy: number },
): "straight" | "left" | "right" {
  const cross = prev.dx * next.dy - prev.dy * next.dx;
  const dot = prev.dx * next.dx + prev.dy * next.dy;

  // If nearly straight, don't force left/right
  if (Math.abs(cross) < 20 || dot > 0) {
    return "straight";
  }

  // Screen coordinates: y grows downward, so left/right is flipped
  return cross > 0 ? "right" : "left";
}

function generateRouteSteps(
  nodes: { id: string; x: number; y: number; label?: string }[],
): RouteStep[] {
  if (!nodes || nodes.length < 2) return [];

  const steps: RouteStep[] = [];
  const firstVec = getDirectionVector(nodes[0], nodes[1]);

  if (nodes.length === 2) {
    steps.push({
      id: `${nodes[0].id}-${nodes[1].id}-start`,
      text: getInitialCorridorInstruction(firstVec),
    });
    steps.push({
      id: `${nodes[1].id}-arrive`,
      text: `Arrive at ${getReadableDestinationLabel(nodes[1])}`,
    });
    return steps;
  }

  // First step
  steps.push({
    id: `${nodes[0].id}-${nodes[1].id}-start`,
    text: getInitialCorridorInstruction(firstVec),
  });

  // Middle steps
  for (let i = 1; i < nodes.length - 1; i++) {
    const prevVec = getDirectionVector(nodes[i - 1], nodes[i]);
    const nextVec = getDirectionVector(nodes[i], nodes[i + 1]);

    const moveLength = Math.sqrt(nextVec.dx * nextVec.dx + nextVec.dy * nextVec.dy);
    if (moveLength < 5) continue;

    const turn = getTurnInstruction(prevVec, nextVec);

    if (turn === "left") {
      steps.push({
        id: `${nodes[i].id}-left`,
        text: "Turn left at the corridor",
      });
    } else if (turn === "right") {
      steps.push({
        id: `${nodes[i].id}-right`,
        text: "Turn right at the corridor",
      });
    } else {
      // Only occasionally add a straight step
      if (i === 1 || i === nodes.length - 2) {
        steps.push({
          id: `${nodes[i].id}-straight`,
          text: "Continue along the corridor",
        });
      }
    }
  }

  // Final arrival always includes room number
  const lastNode = nodes[nodes.length - 1];
  steps.push({
    id: `${lastNode.id}-arrive`,
    text: `Arrive at ${getReadableDestinationLabel(lastNode)}`,
  });

  // Remove consecutive duplicates
  return steps.filter((step, index, arr) => {
    if (index === 0) return true;
    return step.text !== arr[index - 1].text;
  });
}
function calculateGeographicHeight(
  bounds:
    | {
        northEast: { latitude: number; longitude: number };
        southWest: { latitude: number; longitude: number };
      }
    | undefined,
  screenWidth: number,
  screenHeight: number,
): number {
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
}



interface Props {
  buildingData: BuildingIndoorConfig;
  onExit: () => void;
}

const MAP_POI_BADGE_SIZE = 18;

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();

  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [startLocation, setStartLocation] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [activeField, setActiveField] = useState<"start" | "destination">("destination");
  const [showDirections, setShowDirections] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

  const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">(
    "DESTINATION",
  );
  const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
  const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

  const indoorMapService = useMemo(() => {
    const service = new IndoorMapService();
    const navConfig = navConfigRegistry[buildingData.id];

    if (navConfig) {
      service.loadBuilding(navConfig);
    }

    return service;
  }, [buildingData.id]);

  const resolveDestinationNodeId = useCallback(
    (item: IndoorDestination): string | null => {
      const graph = indoorMapService.getGraph();

      if (graph.getNode(item.id)) {
        return item.id;
      }

      const normalizedLabel = (item.label ?? item.id)
        .replace(/^Room\s+/i, "")
        .trim()
        .toLowerCase();

      const floorId = `${buildingData.id}_${item.floorLevel}`;

      const matchedNode = graph.getAllNodes().find((node) => {
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

  const poisForFloor = useMemo(
    () => getPOIsForFloor(buildingData.id, currentLevel),
    [buildingData.id, currentLevel],
  );

  const categoriesForFloor = useMemo(
    () =>
      getCategoriesForFloor(buildingData.id, currentLevel).filter(
        (c) => c !== "ROOM",
      ),
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

    if (buildingData.id === "H") {
      const hasRoom836 = roomHotspots.some(
        (spot) =>
          spot.floorLevel === 8 &&
          spot.label.replace("Room ", "") === "836",
      );

      if (!hasRoom836) {
        const room836Poi = getPOIsForFloor("H", 8).find(
          (poi) => poi.room === "836",
        );
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

  const handleSetStartLocation = useCallback((item: IndoorDestination) => {
    setStartLocation(item);
    setCurrentLevel(item.floorLevel);
    setSearchQuery(item.label ?? item.id);
    setShowSearchResults(false);
    setShowDirections(false);
    setRoute(null);
  }, []);

  const handleSetDestination = useCallback((item: IndoorDestination) => {
    setDestination(item);
    setCurrentLevel(item.floorLevel);
    setSearchQuery(item.label ?? item.id);
    setShowSearchResults(false);
    setShowDirections(false);
    setRoute(null);
  }, []);

  const handleDirectionsPress = useCallback(() => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig || !destination) {
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const startNodeId = startLocation
        ? resolveDestinationNodeId(startLocation) ?? navConfig.defaultStartNodeId
        : navConfig.defaultStartNodeId;

      const endNodeId = resolveDestinationNodeId(destination);

      if (!startNodeId || !endNodeId) {
        console.warn("Could not resolve start or destination node");
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const nextRoute = indoorMapService.getRoute(startNodeId, endNodeId, false);
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
    startLocation,
    indoorMapService,
    resolveDestinationNodeId,
  ]);

  const combinedSearchResults = useMemo<IndoorSearchResult[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const roomResults: IndoorSearchResult[] = hotspots
      .filter((spot) => {
        const label = spot.label.toLowerCase();
        const short = spot.label.replace("Room ", "").toLowerCase();
        const id = spot.id.toLowerCase();

        return (
          label.includes(query) ||
          short.includes(query) ||
          id.includes(query)
        );
      })
      .map((spot) => ({
        type: "room",
        id: spot.id,
        label: spot.label,
        x: spot.x,
        y: spot.y,
        floorLevel: spot.floorLevel,
      }));

    const poiResults: IndoorSearchResult[] = nonRoomPOIs
      .filter((poi) => {
        const desc = poi.description.toLowerCase();
        const room = poi.room.toLowerCase();
        const category = poi.category.toLowerCase();

        return (
          desc.includes(query) ||
          room.includes(query) ||
          category.includes(query)
        );
      })
      .map((poi) => ({
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
      const applySelection = (target: IndoorDestination) => {
        if (activeField === "start") {
          handleSetStartLocation(target);
        } else {
          handleSetDestination(target);
        }
      };

      if (item.type === "room") {
        applySelection({
          id: item.id,
          x: item.x,
          y: item.y,
          floorLevel: item.floorLevel,
          label: item.label,
        });
        return;
      }

      const matchingRoom = hotspots.find(
        (spot) => spot.label.replace("Room ", "") === item.room,
      );

      if (matchingRoom) {
        applySelection({
          id: matchingRoom.id,
          x: matchingRoom.x,
          y: matchingRoom.y,
          floorLevel: matchingRoom.floorLevel,
          label: matchingRoom.label,
        });
      }
    },
    [activeField, hotspots, handleSetDestination, handleSetStartLocation],
  );

  const routeSteps = useMemo(() => {
    if (!route) return [];
    return generateRouteSteps(route.nodes);
  }, [route]);

  const estimatedMinutes = useMemo(() => {
    if (!route) return 0;
    return getEstimatedWalkMinutes(route.totalDistance);
  }, [route]);

  useEffect(() => {
    setActiveCategories(
      new Set(
        getCategoriesForFloor(buildingData.id, currentLevel).filter(
          (c) => c !== "ROOM",
        ),
      ),
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
        return;
      }

      setDestinationPOI(poi);

      const matchingRoom = hotspots.find(
        (spot) => spot.label.replace("Room ", "") === poi.room,
      );

      if (matchingRoom) {
        handleSetDestination({
          id: matchingRoom.id,
          x: matchingRoom.x,
          y: matchingRoom.y,
          floorLevel: matchingRoom.floorLevel,
          label: matchingRoom.label,
        });
      }
    },
    [routeTargetMode, hotspots, handleSetDestination],
  );

  const activeFloor = useMemo(
    () => buildingData.floors.find((f) => f.level === currentLevel),
    [buildingData.floors, currentLevel],
  );

  const contentHeight = useMemo(
    () => calculateGeographicHeight(activeFloor?.bounds, width, height),
    [activeFloor, width, height],
  );

  const SVG_SIZE = 1024;

  const scale = useMemo(
    () => Math.min(width / SVG_SIZE, contentHeight / SVG_SIZE),
    [width, contentHeight],
  );

  const renderedWidth = useMemo(() => SVG_SIZE * scale, [scale]);
  const renderedHeight = useMemo(() => SVG_SIZE * scale, [scale]);

  const offsetX = useMemo(() => (width - renderedWidth) / 2, [width, renderedWidth]);
  const offsetY = useMemo(
    () => (contentHeight - renderedHeight) / 2,
    [contentHeight, renderedHeight],
  );

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

  if (!activeFloor) {
    return (
      <View style={styles.container}>
        <Text>No floor data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                  style={
                    isActive
                      ? styles.headerFloorToggleActive
                      : styles.headerFloorToggle
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Switch to floor ${floor.label}`}
                >
                  <Text
                    style={
                      isActive
                        ? styles.headerFloorToggleTextActive
                        : styles.headerFloorToggleText
                    }
                  >
                    {floor.label}
                  </Text>
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
                .filter((poi) => activeCategories.has(poi.category))
                .map((poi) => {
                  const selectionType =
                    destinationPOI?.id === poi.id
                      ? "destination"
                      : sourcePOI?.id === poi.id
                        ? "source"
                        : undefined;

                  const { ICON_POSITION_OVERRIDES } = require("./POIBadge");
                  const manualRoomOffset =
                    ICON_POSITION_OVERRIDES[poi.room] ?? { x: 0, y: 0 };

                  return (
                    <POIBadge
                      key={poi.id}
                      poi={poi}
                      left={
                        poi.mapPosition.x * width -
                        MAP_POI_BADGE_SIZE / 2 +
                        manualRoomOffset.x
                      }
                      top={
                        poi.mapPosition.y * contentHeight -
                        MAP_POI_BADGE_SIZE / 2 +
                        manualRoomOffset.y
                      }
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
                onSelectDestination={(item) => {
                  if (activeField === "start") {
                    handleSetStartLocation(item);
                  } else {
                    handleSetDestination(item);
                  }
                }}
              />

              {startLocation &&
                !showDirections &&
                startLocation.floorLevel === currentLevel && (
                  <IndoorPointMarker
                    x={offsetX + startLocation.x * scale}
                    y={offsetY + startLocation.y * scale}
                    emoji="🔵"
                    bgColor="#3A7BD5"
                  />
                )}

              {destination && destination.floorLevel === currentLevel && (
                <IndoorPointMarker
                  x={offsetX + destination.x * scale}
                  y={offsetY + destination.y * scale}
                  emoji="📍"
                  bgColor="transparent"
                />
              )}
            </View>
          </ReactNativeZoomableView>
        </Animated.View>
      </View>

      <TouchableOpacity
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

      <IndoorBottomPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        searchResults={combinedSearchResults}
        onSelectResult={handleSelectSearchResult}
        onClearDestination={() => {
          if (activeField === "start") {
            setStartLocation(null);
            setShowDirections(false);
            setRoute(null);
          } else {
            setDestination(null);
            setShowDirections(false);
            setRoute(null);
          }
        }}
        startLabel={startLocation?.label ?? "Current position"}
        destinationLabel={destination?.label ?? ""}
        activeField={activeField}
        onFocusField={(field) => {
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

      {showDirections && routeSteps.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 12,
            right: 12,
            backgroundColor: "#FFF7FA",
            borderRadius: 20,
            padding: 14,
            borderWidth: 1,
            borderColor: "#F7D6E3",
            shadowColor: "#000",
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 1000,
            maxHeight: 280,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#C2185B",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="walk" size={16} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#C2185B",
                }}
              >
                Walking directions
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#9A9A9A",
                  marginTop: 2,
                }}
              >
                Follow these steps to reach your destination
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#C2185B",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {estimatedMinutes} min
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#F1D3DF",
              marginBottom: 10,
            }}
          />

          <ScrollView
            style={{ maxHeight: 180 }}
            contentContainerStyle={{ paddingBottom: 4 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled
          >
            {routeSteps.map((step, index) => (
              <View
                key={step.id}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: index === routeSteps.length - 1 ? 0 : 10,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: index === routeSteps.length - 1 ? "#C2185B" : "#FCE4EC",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginTop: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: index === routeSteps.length - 1 ? "#FFFFFF" : "#C2185B",
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    lineHeight: 18,
                    color: index === routeSteps.length - 1 ? "#C2185B" : "#333333",
                    fontWeight: index === routeSteps.length - 1 ? "700" : "500",
                  }}
                >
                  {step.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

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