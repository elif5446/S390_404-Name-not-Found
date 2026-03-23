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
// Services & Types
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
import POIBadge from "./POIBadge";
import POIFilterPanel from "./POIFilterPanel";
import IndoorBottomPanel, {
  IndoorSearchResult,
} from "./IndoorTopPanel";
import IndoorRouteOverlay from "./IndoorRouteOverlay";
import { Route } from "@/src/indoors/types/Routes";
import IndoorPointMarker from "./IndoorPointMarker";
import IndoorDirectionsPopup from "./IndoorDirectionsPopup";
import { Node } from "@/src/indoors/types/Navigation";
import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// Components & Metadata
import MapContent from "./IndoorMap";
import DestinationMarker from "./DestinationMarker";
import IndoorRoomLabels from "./IndoorRoomLabels";
import FloorPicker from "./FloorPicker";
import { styles } from "@/src/styles/IndoorMap.styles";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";
type RouteNodeLike = {
  id: string;
  x: number;
  y: number;
  label?: string;
};


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

const MAP_POI_BADGE_SIZE = 18;

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
  const [headerHeight, setHeaderHeight] = useState(72);
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [startLocation, setStartLocation] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [activeField, setActiveField] = useState<"start" | "destination">("destination");
  const [showDirections, setShowDirections] = useState(false);
  const [avoidStairs, setAvoidStairs] = useState(false);

// Load the persisted wheelchair accessibility preference on mount
useEffect(() => {
  getWheelchairAccessibilityPreference().then(setAvoidStairs);
}, []);

// Re-compute route automatically if the user changes the preference
// while the directions panel is already open
useEffect(() => {
  if (showDirections && destination) {
    handleDirectionsPress();
  }
}, [avoidStairs]);
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

  // Build a lookup map: floorId → level (e.g. "MB_S2" → 1, "MB_1" → 2)
  const floorLevelByFloorId = Object.fromEntries(
    buildingData.floors.map((f) => [f.id, f.level])
  );

  const roomHotspots = navConfig.floors.flatMap((floor) =>
    floor.nodes
      .filter((node) => node.type === "room")
      .map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        floorLevel: floorLevelByFloorId[floor.floorId] ?? 1,
        label: node.label ?? node.id,
      })),
  );

  return roomHotspots;
}, [buildingData.id, buildingData.floors]);

  const [baseStartNode, setBaseStartNode] = useState<Node | null>(null);

  useEffect(() => {
    let sNode = null;
    if (startBuildingId === buildingData.id && startRoomId) {
      sNode = indoorMapService.getNodeByRoomNumber(
        buildingData.id,
        startRoomId,
      );
    }
    if (!sNode)
      sNode =
        indoorMapService.getEntranceNode() || indoorMapService.getStartNode();
    setBaseStartNode(sNode);
  }, [buildingData.id, startBuildingId, startRoomId, indoorMapService]);

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

  const handleDirectionsPress = useCallback(async () => {
    try {
      const navConfig = navConfigRegistry[buildingData.id];
      if (!navConfig || !destination) {
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const startNodeId = startLocation
        ? resolveDestinationNodeId(startLocation)
        : (baseStartNode?.id || navConfig.defaultStartNodeId);

      const endNodeId = resolveDestinationNodeId(destination);

      if (!startNodeId || !endNodeId) {
        console.warn("Could not resolve start or destination node");
        setRoute(null);
        setShowDirections(false);
        return;
      }

      const nextRoute = await indoorMapService.getRoute(
        startNodeId,
        endNodeId,
        avoidStairs,
      );
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
    baseStartNode,
    indoorMapService,
    resolveDestinationNodeId,
    avoidStairs,
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

    const routeInstructions = useMemo(() => {
      if (!route) return { steps: [] };
      return indoorMapService.getRouteInstructions(route);
    }, [route, indoorMapService]);

    const routeSteps = routeInstructions.steps;


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
      } else {
        // Fallback to nearest node for map-tapped POIs
        const xPos = Math.round(poi.mapPosition.x * 1024);
        const yPos = Math.round(poi.mapPosition.y * 1024);
      const floorIdStr = buildingData.floors.find(
  (f) => f.level === currentLevel
)?.id ?? `${buildingData.id}_${currentLevel}`;
        
        const nearestNode = indoorMapService.getNearestRoomNode(floorIdStr, xPos, yPos);
        
        handleSetDestination({
          id: nearestNode ? nearestNode.id : poi.id,
          x: xPos,
          y: yPos,
          floorLevel: currentLevel,
          label: `${poi.description} (Room ${poi.room})`,
        });
      }
    },
    [routeTargetMode, hotspots, currentLevel, buildingData.id, indoorMapService, handleSetDestination],
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

  const offsetX = useMemo(
    () => (width - renderedWidth) / 2,
    [width, renderedWidth],
  );
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
        style={{
          position: "absolute",
          top: 30,
          left: 5,
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
