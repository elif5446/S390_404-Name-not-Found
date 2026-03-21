// // import React, {
// //   useEffect,
// //   useState,
// //   useRef,
// //   useMemo,
// //   useCallback,
// // } from "react";
// // import {
// //   View,
// //   Text,
// //   Animated,
// //   useWindowDimensions,
// //   TouchableOpacity,
// //   LayoutChangeEvent,
// // } from "react-native";
// // import { SafeAreaView } from "react-native-safe-area-context";
// // import { Ionicons } from "@expo/vector-icons";
// // import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
// // import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
// // import { POI, POICategory } from "@/src/types/poi";
// // import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
// // import MapContent from "./IndoorMap";
// // import POIBadge from "./POIBadge";
// // import DestinationMarker from "./DestinationMarker";
// // import POIFilterPanel from "./POIFilterPanel";
// // import { View as RNView, TextInput } from "react-native";
// // import { POI_PALETTE } from "@/src/styles/IndoorPOI.styles";
// // import IndoorRoomLabels from "./IndoorRoomLabels";
// // import { styles } from "@/src/styles/IndoorMap.styles";
// // import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";
// // import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
// // import IndoorRouteOverlay from "./IndoorRouteOverlay";
// // import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
// // import { Route } from "@/src/indoors/types/Routes";
// // type IndoorSearchResult =
// //   | {
// //       type: "room";
// //       id: string;
// //       label: string;
// //       x: number;
// //       y: number;
// //       floorLevel: number;
// //     }
// //   | {
// //       type: "poi";
// //       id: string;
// //       label: string;
// //       room: string;
// //       floorLevel: number;
// //       x: number;
// //       y: number;
// //       poi: POI;
// //     };
// // const calculateGeographicHeight = (
// //   bounds:
// //     | {
// //         northEast: { latitude: number; longitude: number };
// //         southWest: { latitude: number; longitude: number };
// //       }
// //     | undefined,
// //   screenWidth: number,
// //   screenHeight: number,
// // ): number => {
// //   if (!bounds) return screenHeight;

// //   const { northEast, southWest } = bounds;
// //   const latDiff = Math.abs(northEast.latitude - southWest.latitude);
// //   const lonDiff = Math.abs(northEast.longitude - southWest.longitude);

// //   if (latDiff < 0.00001 || lonDiff < 0.00001) return screenHeight;

// //   const latRadians = (northEast.latitude * Math.PI) / 180;
// //   const lonScale = Math.cos(latRadians);
// //   const geographicRatio = (lonDiff * lonScale) / latDiff;

// //   const calculatedHeight = screenWidth / geographicRatio;
// //   return isFinite(calculatedHeight) ? calculatedHeight : screenHeight;
// // };



// // interface Props {
// //   buildingData: BuildingIndoorConfig;
// //   onExit: () => void;
// // }

// // const MAP_POI_BADGE_SIZE = 18;

// // const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
// //   const { width, height } = useWindowDimensions();
// //   const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
// //   const [headerHeight, setHeaderHeight] = useState(72);
// //   const [destination, setDestination] = useState<IndoorDestination | null>(null);
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [searchBarHeight, setSearchBarHeight] = useState(0);
// //   const [poiListExpanded, setPoiListExpanded] = useState(false);
// //   const [showSearchResults, setShowSearchResults] = useState(false);

// // const [route, setRoute] = useState<Route | null>(null);
// // const indoorMapService = useMemo(() => {
// //   const service = new IndoorMapService();
// //   const navConfig = navConfigRegistry[buildingData.id];

// //   if (navConfig) {
// //     service.loadBuilding(navConfig);
// //   }

// //   return service;
// // }, [buildingData.id]);


// // const resolveDestinationNodeId = useCallback(
// //   (item: IndoorDestination): string | null => {
// //     const graph = indoorMapService.getGraph();

// //     if (graph.getNode(item.id)) {
// //       return item.id;
// //     }

// //     const normalizedLabel = (item.label ?? item.id)
// //       .replace(/^Room\s+/i, "")
// //       .trim()
// //       .toLowerCase();

// //     const floorId = `${buildingData.id}_${item.floorLevel}`;

// //     const matchedNode = graph.getAllNodes().find((node) => {
// //       const nodeLabel = (node.label ?? node.id)
// //         .replace(/^Room\s+/i, "")
// //         .trim()
// //         .toLowerCase();

// //       return node.floorId === floorId && nodeLabel === normalizedLabel;
// //     });

// //     return matchedNode?.id ?? null;
// //   },
// //   [indoorMapService, buildingData.id],
// // );

// // const combinedSearchResults = useMemo(() => {
// //   const query = searchQuery.trim().toLowerCase();
// //   if (!query) return [];

// //   // 🔹 ROOMS
// //   const roomResults = hotspots
// //     .filter((spot) => {
// //       const label = spot.label.toLowerCase();
// //       const short = spot.label.replace("Room ", "").toLowerCase();
// //       return label.includes(query) || short.includes(query);
// //     })
// //     .map((spot) => ({
// //       type: "room" as const,
// //       id: spot.id,
// //       label: spot.label,
// //       x: spot.x,
// //       y: spot.y,
// //       floorLevel: spot.floorLevel,
// //     }));

// //   const poiResults = nonRoomPOIs
// //     .filter((poi) => {
// //       const desc = poi.description.toLowerCase();
// //       const room = poi.room.toLowerCase();
// //       return desc.includes(query) || room.includes(query);
// //     })
// //     .map((poi) => ({
// //       type: "poi" as const,
// //       id: poi.id,
// //       label: `${poi.description} (Room ${poi.room})`,
// //       room: poi.room,
// //       poi,
// //     }));

// //   return [...roomResults, ...poiResults];
// // }, [searchQuery, hotspots, nonRoomPOIs]);
// //   // 🔹 POIs
// //   const handleSelectSearchResult = useCallback((item) => {
// //   // ROOM
// //   if (item.type === "room") {
// //     handleSetDestination({
// //       id: item.id,
// //       x: item.x,
// //       y: item.y,
// //       floorLevel: item.floorLevel,
// //       label: item.label,
// //     });
// //     return;
// //   }

// //   // POI → find matching room
// //   if (item.type === "poi") {
// //     const matchingRoom = hotspots.find((spot) =>
// //       spot.label.replace("Room ", "") === item.room
// //     );

// //     if (matchingRoom) {
// //       handleSetDestination({
// //         id: matchingRoom.id,
// //         x: matchingRoom.x,
// //         y: matchingRoom.y,
// //         floorLevel: matchingRoom.floorLevel,
// //         label: matchingRoom.label,
// //       });
// //     }
// //   }
// // }, [hotspots, handleSetDestination]); 


// // const calculateRouteToDestination = useCallback(
// //   (item: IndoorDestination) => {
// //     try {
// //       const navConfig = navConfigRegistry[buildingData.id];
// //       if (!navConfig) {
// //         setRoute(null);
// //         return;
// //       }

// //       const startNodeId = navConfig.defaultStartNodeId;
// //       const endNodeId = resolveDestinationNodeId(item);

// //       if (!endNodeId) {
// //         console.warn("Could not resolve destination node for", item);
// //         setRoute(null);
// //         return;
// //       }

// //       const nextRoute = indoorMapService.getRoute(startNodeId, endNodeId, false);
// //       setRoute(nextRoute);
// //     } catch (error) {
// //       console.warn("Failed to compute indoor route:", error);
// //       setRoute(null);
// //     }
// //   },
// //   [buildingData.id, indoorMapService, resolveDestinationNodeId],
// // );

// //   const fadeAnim = useRef(new Animated.Value(0)).current;
// //   const zoomRef = useRef<ReactNativeZoomableView>(null);
// //   const isMounted = useRef(true);

// //   //  POI state 
// //   const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">("DESTINATION");
// //   const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
// //   const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

// //   const poisForFloor = useMemo(
// //     () => getPOIsForFloor(buildingData.id, currentLevel),
// //     [buildingData.id, currentLevel],
// //   );

// //   const categoriesForFloor = useMemo(
// //     () => getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM"),
// //     [buildingData.id, currentLevel],
// //   );

// //   const roomPOIs = useMemo(
// //     () => poisForFloor.filter((p) => p.category === "ROOM"),
// //     [poisForFloor],
// //   );

// //   const nonRoomPOIs = useMemo(
// //     () => poisForFloor.filter((p) => p.category !== "ROOM"),
// //     [poisForFloor],
// //   );

// //   const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(
// //     () => new Set(categoriesForFloor),
// //   );
// import React, {
//   useEffect,
//   useState,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import {
//   View,
//   Text,
//   Animated,
//   useWindowDimensions,
//   TouchableOpacity,
//   LayoutChangeEvent,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
// import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
// import { POI, POICategory } from "@/src/types/poi";
// import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
// import MapContent from "./IndoorMap";
// import POIBadge from "./POIBadge";
// import DestinationMarker from "./DestinationMarker";
// import POIFilterPanel from "./POIFilterPanel";
// import IndoorRoomLabels from "./IndoorRoomLabels";
// import { styles } from "@/src/styles/IndoorMap.styles";
// import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";
// import { IndoorHotspot, IndoorDestination } from "@/src/indoors/types/hotspot";
// import IndoorRouteOverlay from "./IndoorRouteOverlay";
// import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
// import { Route } from "@/src/indoors/types/Routes";

// type IndoorSearchResult =
//   | {
//       type: "room";
//       id: string;
//       label: string;
//       x: number;
//       y: number;
//       floorLevel: number;
//     }
//   | {
//       type: "poi";
//       id: string;
//       label: string;
//       room: string;
//       floorLevel: number;
//       x: number;
//       y: number;
//       poi: POI;
//     };

// const calculateGeographicHeight = (
//   bounds:
//     | {
//         northEast: { latitude: number; longitude: number };
//         southWest: { latitude: number; longitude: number };
//       }
//     | undefined,
//   screenWidth: number,
//   screenHeight: number,
// ): number => {
//   if (!bounds) return screenHeight;

//   const { northEast, southWest } = bounds;
//   const latDiff = Math.abs(northEast.latitude - southWest.latitude);
//   const lonDiff = Math.abs(northEast.longitude - southWest.longitude);

//   if (latDiff < 0.00001 || lonDiff < 0.00001) return screenHeight;

//   const latRadians = (northEast.latitude * Math.PI) / 180;
//   const lonScale = Math.cos(latRadians);
//   const geographicRatio = (lonDiff * lonScale) / latDiff;

//   const calculatedHeight = screenWidth / geographicRatio;
//   return isFinite(calculatedHeight) ? calculatedHeight : screenHeight;
// };

// interface Props {
//   buildingData: BuildingIndoorConfig;
//   onExit: () => void;
// }

// const MAP_POI_BADGE_SIZE = 18;

// const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
//   const { width, height } = useWindowDimensions();

//   const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
//   const [headerHeight, setHeaderHeight] = useState(72);
//   const [destination, setDestination] = useState<IndoorDestination | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchBarHeight, setSearchBarHeight] = useState(0);
//   const [poiListExpanded, setPoiListExpanded] = useState(false);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [route, setRoute] = useState<Route | null>(null);

//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const zoomRef = useRef<ReactNativeZoomableView>(null);
//   const isMounted = useRef(true);

//   const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">("DESTINATION");
//   const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
//   const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

//   const indoorMapService = useMemo(() => {
//     const service = new IndoorMapService();
//     const navConfig = navConfigRegistry[buildingData.id];

//     if (navConfig) {
//       service.loadBuilding(navConfig);
//     }

//     return service;
//   }, [buildingData.id]);

//   const resolveDestinationNodeId = useCallback(
//     (item: IndoorDestination): string | null => {
//       const graph = indoorMapService.getGraph();

//       if (graph.getNode(item.id)) {
//         return item.id;
//       }

//       const normalizedLabel = (item.label ?? item.id)
//         .replace(/^Room\s+/i, "")
//         .trim()
//         .toLowerCase();

//       const floorId = `${buildingData.id}_${item.floorLevel}`;

//       const matchedNode = graph.getAllNodes().find((node) => {
//         const nodeLabel = (node.label ?? node.id)
//           .replace(/^Room\s+/i, "")
//           .trim()
//           .toLowerCase();

//         return node.floorId === floorId && nodeLabel === normalizedLabel;
//       });

//       return matchedNode?.id ?? null;
//     },
//     [indoorMapService, buildingData.id],
//   );

//   const calculateRouteToDestination = useCallback(
//     (item: IndoorDestination) => {
//       try {
//         const navConfig = navConfigRegistry[buildingData.id];
//         if (!navConfig) {
//           setRoute(null);
//           return;
//         }

//         const startNodeId = navConfig.defaultStartNodeId;
//         const endNodeId = resolveDestinationNodeId(item);

//         if (!endNodeId) {
//           console.warn("Could not resolve destination node for", item);
//           setRoute(null);
//           return;
//         }

//         const nextRoute = indoorMapService.getRoute(startNodeId, endNodeId, false);
//         setRoute(nextRoute);
//       } catch (error) {
//         console.warn("Failed to compute indoor route:", error);
//         setRoute(null);
//       }
//     },
//     [buildingData.id, indoorMapService, resolveDestinationNodeId],
//   );

//   const poisForFloor = useMemo(
//     () => getPOIsForFloor(buildingData.id, currentLevel),
//     [buildingData.id, currentLevel],
//   );

//   const categoriesForFloor = useMemo(
//     () => getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM"),
//     [buildingData.id, currentLevel],
//   );

//   const roomPOIs = useMemo(
//     () => poisForFloor.filter((p) => p.category === "ROOM"),
//     [poisForFloor],
//   );

//   const nonRoomPOIs = useMemo(
//     () => poisForFloor.filter((p) => p.category !== "ROOM"),
//     [poisForFloor],
//   );

//   const [activeCategories, setActiveCategories] = useState<Set<POICategory>>(
//     () => new Set(categoriesForFloor),
//   );

//   const hotspots = useMemo<IndoorHotspot[]>(() => {
//     const navConfig = navConfigRegistry[buildingData.id];

//     if (!navConfig) return [];

//     const roomHotspots = navConfig.floors.flatMap((floor) =>
//       floor.nodes
//         .filter((node) => node.type === "room")
//         .map((node) => ({
//           id: node.id,
//           x: node.x,
//           y: node.y,
//           floorLevel: parseInt(node.floorId.split("_")[1], 10),
//           label: node.label ?? node.id,
//         })),
//     );

//     if (buildingData.id === "H") {
//       const hasRoom836 = roomHotspots.some(
//         (spot) => spot.floorLevel === 8 && spot.label.replace("Room ", "") === "836",
//       );

//       if (!hasRoom836) {
//         const room836Poi = getPOIsForFloor("H", 8).find((poi) => poi.room === "836");
//         if (room836Poi) {
//           roomHotspots.push({
//             id: "H_836",
//             x: Math.round(room836Poi.mapPosition.x * 1024),
//             y: Math.round(room836Poi.mapPosition.y * 1024),
//             floorLevel: 8,
//             label: "Room 836",
//           });
//         }
//       }
//     }

//     return roomHotspots;
//   }, [buildingData.id]);

//   const handleSetDestination = useCallback((item: IndoorDestination) => {
//     setDestination(item);
//     setCurrentLevel(item.floorLevel);
//     setSearchQuery(item.label ?? item.id);
//     setShowSearchResults(false);
//     calculateRouteToDestination(item);
//   }, [calculateRouteToDestination]);

//   const handleClearDestination = useCallback(() => {
//     setDestination(null);
//     setRoute(null);
//     setSearchQuery("");
//     setShowSearchResults(false);
//   }, []);

//   const combinedSearchResults = useMemo<IndoorSearchResult[]>(() => {
//     const query = searchQuery.trim().toLowerCase();
//     if (!query) return [];

//     const roomResults: IndoorSearchResult[] = hotspots
//       .filter((spot) => {
//         const label = spot.label.toLowerCase();
//         const short = spot.label.replace("Room ", "").toLowerCase();
//         const id = spot.id.toLowerCase();

//         return (
//           label.includes(query) ||
//           short.includes(query) ||
//           id.includes(query)
//         );
//       })
//       .map((spot) => ({
//         type: "room",
//         id: spot.id,
//         label: spot.label,
//         x: spot.x,
//         y: spot.y,
//         floorLevel: spot.floorLevel,
//       }));

//     const poiResults: IndoorSearchResult[] = nonRoomPOIs
//       .filter((poi) => {
//         const desc = poi.description.toLowerCase();
//         const room = poi.room.toLowerCase();
//         const category = poi.category.toLowerCase();

//         return (
//           desc.includes(query) ||
//           room.includes(query) ||
//           category.includes(query)
//         );
//       })
//       .map((poi) => ({
//         type: "poi",
//         id: poi.id,
//         label: `${poi.description} (Room ${poi.room})`,
//         room: poi.room,
//         floorLevel: currentLevel,
//         x: Math.round(poi.mapPosition.x * 1024),
//         y: Math.round(poi.mapPosition.y * 1024),
//         poi,
//       }));

//     return [...roomResults, ...poiResults];
//   }, [searchQuery, hotspots, nonRoomPOIs, currentLevel]);

//   const handleSelectSearchResult = useCallback((item: IndoorSearchResult) => {
//     if (item.type === "room") {
//       handleSetDestination({
//         id: item.id,
//         x: item.x,
//         y: item.y,
//         floorLevel: item.floorLevel,
//         label: item.label,
//       });
//       return;
//     }

//     const matchingRoom = hotspots.find(
//       (spot) => spot.label.replace("Room ", "") === item.room,
//     );

//     if (matchingRoom) {
//       handleSetDestination({
//         id: matchingRoom.id,
//         x: matchingRoom.x,
//         y: matchingRoom.y,
//         floorLevel: matchingRoom.floorLevel,
//         label: matchingRoom.label,
//       });
//     }
//   }, [hotspots, handleSetDestination]);

//   // continue with the rest of your component here...
//   // Re-initialise filters when the floor changes
//   useEffect(() => {
//     setActiveCategories(
//       new Set(getCategoriesForFloor(buildingData.id, currentLevel).filter((c) => c !== "ROOM")),
//     );
//     setSourcePOI(null);
//     setDestinationPOI(null);
//   }, [currentLevel, buildingData.id]);

//   const handleToggleCategory = useCallback((cat: POICategory) => {
//     setActiveCategories((prev) => {
//       const next = new Set(prev);
//       if (next.has(cat)) next.delete(cat);
//       else next.add(cat);
//       return next;
//     });
//   }, []);

//   const handleSelectPOI = useCallback(
//     (poi: POI) => {
//       if (routeTargetMode === "SOURCE") {
//         setSourcePOI(poi);
//       } else {
//         setDestinationPOI(poi);
//       }
//     },
//     [routeTargetMode],
//   );

//   const handleCloseDirections = useCallback(() => setDestinationPOI(null), []);

//   //  Floor data 
//   const activeFloor = useMemo(
//     () => buildingData.floors.find((f) => f.level === currentLevel),
//     [buildingData.floors, currentLevel],
//   );

//   const contentHeight = useMemo(
//     () => calculateGeographicHeight(activeFloor?.bounds, width, height),
//     [activeFloor, width, height],
//   );

//   const SVG_SIZE = 1024;

//   const scale = useMemo(() => {
//     return Math.min(width / SVG_SIZE, contentHeight / SVG_SIZE);
//   }, [width, contentHeight]);

//   const renderedWidth = useMemo(() => SVG_SIZE * scale, [scale]);
//   const renderedHeight = useMemo(() => SVG_SIZE * scale, [scale]);

//   const offsetX = useMemo(() => (width - renderedWidth) / 2, [width, renderedWidth]);
//   const offsetY = useMemo(
//     () => (contentHeight - renderedHeight) / 2,
//     [contentHeight, renderedHeight],
//   );

//   const hotspots = useMemo<IndoorHotspot[]>(() => {
//     const navConfig = navConfigRegistry[buildingData.id];

//     if (!navConfig) return [];

//     const roomHotspots = navConfig.floors.flatMap((floor) =>
//       floor.nodes
//         .filter((node) => node.type === "room")
//         .map((node) => ({
//           id: node.id,
//           x: node.x,
//           y: node.y,
//           floorLevel: parseInt(node.floorId.split("_")[1], 10),
//           label: node.label ?? node.id,
//         })),
//     );

//     // Room 836 exists in POI data (shared washroom) but has no room node in Hall graph.
//     if (buildingData.id === "H") {
//       const hasRoom836 = roomHotspots.some(
//         (spot) => spot.floorLevel === 8 && spot.label.replace("Room ", "") === "836",
//       );

//       if (!hasRoom836) {
//         const room836Poi = getPOIsForFloor("H", 8).find((poi) => poi.room === "836");
//         if (room836Poi) {
//           roomHotspots.push({
//             id: "H_836",
//             x: Math.round(room836Poi.mapPosition.x * 1024),
//             y: Math.round(room836Poi.mapPosition.y * 1024),
//             floorLevel: 8,
//             label: "Room 836",
//           });
//         }
//       }
//     }

//     return roomHotspots;
//   }, [buildingData.id]);

//   const filteredRooms = useMemo(() => {
//     const query = searchQuery.trim().toLowerCase();

//     if (!query) return [];

//     return hotspots.filter((spot) => {
//       const fullLabel = spot.label.toLowerCase();
//       const shortLabel = spot.label.replace("Room ", "").toLowerCase();
//       const id = spot.id.toLowerCase();

//       return (
//         fullLabel.includes(query) ||
//         shortLabel.includes(query) ||
//         id.includes(query)
//       );
//     });
//   }, [hotspots, searchQuery]);

// const handleSetDestination = useCallback((item: IndoorDestination) => {
//   setDestination(item);
//   setCurrentLevel(item.floorLevel);
//   setSearchQuery(item.label ?? item.id);
//   setShowSearchResults(false);
//   calculateRouteToDestination(item);
// }, [calculateRouteToDestination]);

// const handleClearDestination = useCallback(() => {
//   setDestination(null);
//   setRoute(null);
//   setSearchQuery("");
//   setShowSearchResults(false);
// }, []);

//   useEffect(() => {
//     isMounted.current = true;
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 400,
//       useNativeDriver: true,
//     }).start();
//     return () => { isMounted.current = false; };
//   }, [fadeAnim]);

//   useEffect(() => {
//     if (!isMounted.current) return;
//     zoomRef.current?.zoomTo(1);
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 250,
//       useNativeDriver: true,
//     }).start();
//   }, [currentLevel, fadeAnim]);

//   const handleFloorChange = useCallback(
//     (level: number) => {
//       if (level === currentLevel) return;
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 150,
//         useNativeDriver: true,
//       }).start(({ finished }) => {
//         if (finished && isMounted.current) {
//           setCurrentLevel(level);
//         }
//       });
//     },
//     [currentLevel, fadeAnim],
//   );

//   if (!activeFloor) {
//     return (
//       <View style={styles.container}>
//         <Text>No floor data available.</Text>
//       </View>
//     );
//   }

//   const visiblePOIs = [
//     ...roomPOIs,
//     ...nonRoomPOIs.filter((p) => activeCategories.has(p.category)),
//   ];

//   // --- DEBUG UI: Show POI info for H-9 ---
//   // (DEBUG UI REMOVED)
//   // --- END DEBUG UI ---

//   return (
//     <View style={styles.container}>
//       {/* Header chrome */}
//       <SafeAreaView
//         style={styles.headerWrapper}
//         edges={["top"]}
//         onLayout={(event: LayoutChangeEvent) => {
//           const nextHeight = Math.ceil(event.nativeEvent.layout.height);
//           if (nextHeight > 0 && nextHeight !== headerHeight) {
//             setHeaderHeight(nextHeight);
//           }
//         }}
//       >
//         <View
//           style={styles.headerContent}
//           accessible={true}
//           accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}
//         >
//           <View style={styles.headerTitleWrap}>
//             <Text
//               style={styles.buildingTitle}
//               numberOfLines={1}
//               accessibilityRole="header"
//             >
//               {buildingData.name}
//             </Text>
//           </View>
//           <View style={styles.headerFloorToggleRow}>
//             {buildingData.floors.map((floor) => {
//               const isActive = floor.level === currentLevel;
//               return (
//                 <TouchableOpacity
//                   key={floor.level}
//                   onPress={() => handleFloorChange(floor.level)}
//                   style={isActive ? styles.headerFloorToggleActive : styles.headerFloorToggle}
//                   accessibilityRole="button"
//                   accessibilityState={{ selected: isActive }}
//                   accessibilityLabel={`Switch to floor ${floor.label}`}
//                 >
//                   <Text style={isActive ? styles.headerFloorToggleTextActive : styles.headerFloorToggleText}>
//                     {floor.label}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </View>
//       </SafeAreaView>

//       {/* Search bar below header */}
//       <RNView
//         style={{
//           flexDirection: "row",
//           alignItems: "center",
//           backgroundColor: "#fff",
//           paddingHorizontal: 16,
//           paddingVertical: 8,
//           borderBottomWidth: 1,
//           borderBottomColor: "#eee",
//         }}
//         onLayout={e => setSearchBarHeight(e.nativeEvent.layout.height)}
//       >
//         <Ionicons name="search-outline" size={18} color={POI_PALETTE.textMuted} style={{ marginRight: 8 }} />
//         <TextInput
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholder="Search POI or room"
//           placeholderTextColor={POI_PALETTE.textMuted}
//           style={{ flex: 1, fontSize: 16, color: "#222", paddingVertical: 4 }}
//           accessibilityLabel="Search POIs"
//           autoCapitalize="none"
//           autoCorrect={false}
//         />
//       </RNView>

//       <View style={styles.mapContainer}> 
//         <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}> 
//           <ReactNativeZoomableView
//             ref={zoomRef}
//             maxZoom={3.0}
//             minZoom={1.0}
//             zoomStep={0.5}
//             initialZoom={1.0}
//             bindToBorders={true}
//             visualTouchFeedbackEnabled={false}
//             contentWidth={width}
//             contentHeight={contentHeight}
//           >
//          <View style={{ width, height: contentHeight }}>
//       <MapContent
//         floor={activeFloor}
//         width={width}
//         height={contentHeight}
//       />

//       {route && (
//         <IndoorRouteOverlay
//           routeNodes={route.nodes}
//           currentLevel={currentLevel}
//           canvasWidth={width}
//           canvasHeight={contentHeight}
//           offsetX={offsetX}
//           offsetY={offsetY}
//           scale={scale}
//         />
//       )}

//               {nonRoomPOIs
//                 .filter((poi) => activeCategories.has(poi.category))
//                 .map((poi) => {
//                   const selectionType =
//                     destinationPOI?.id === poi.id
//                       ? "destination"
//                       : sourcePOI?.id === poi.id
//                         ? "source"
//                         : undefined;

//                   // Import ICON_POSITION_OVERRIDES from POIBadge
//                   const { ICON_POSITION_OVERRIDES } = require("./POIBadge");
//                   const manualRoomOffset = ICON_POSITION_OVERRIDES[poi.room] ?? { x: 0, y: 0 };
//                   return (
//                     <POIBadge
//                       key={poi.id}
//                       poi={poi}
//                       left={poi.mapPosition.x * width - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.x}
//                       top={poi.mapPosition.y * contentHeight - MAP_POI_BADGE_SIZE / 2 + manualRoomOffset.y}
//                       size={MAP_POI_BADGE_SIZE}
//                       selectionType={selectionType}
//                       onPress={handleSelectPOI}
//                     />
//                   );
//                 })}



//               <IndoorRoomLabels
//                 hotspots={hotspots}
//                 currentLevel={currentLevel}
//                 destination={destination}
//                 offsetX={offsetX}
//                 offsetY={offsetY}
//                 scale={scale}
//                 onSelectDestination={handleSetDestination}
//               />

//               {destination && destination.floorLevel === currentLevel && (
//                 <DestinationMarker
//                   x={offsetX + destination.x * scale - 6}
//                   y={offsetY + destination.y * scale + 2}
//                 />
//               )}
//             </View>
//           </ReactNativeZoomableView>
//         </Animated.View>
//       </View>
//   <TouchableOpacity
//   // style={styles.floatingBackButton}
//  style={{
//     position: "absolute",
//     top: 67,
//     left: 16,
//     zIndex: 9999,
//     elevation: 20,
//     padding: 8,
//   }}  onPress={onExit}
// >
//   <Ionicons name="arrow-back" size={24} color="#0d0d0dff" />
// </TouchableOpacity>

//         {/* Header chrome */}
//         <SafeAreaView
//           style={styles.headerWrapper}
//           edges={["top"]}
//           onLayout={(event: LayoutChangeEvent) => {
//             const nextHeight = Math.ceil(event.nativeEvent.layout.height);
//             if (nextHeight > 0 && nextHeight !== headerHeight) {
//               setHeaderHeight(nextHeight);
//             }
//           }}
//         >
//           <View
//             style={styles.headerContent}
//             accessible={true}
//             accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}
//           >
//             <View style={styles.headerTitleWrap}>
//               <Text
//                 style={styles.buildingTitle}
//                 numberOfLines={1}
//                 accessibilityRole="header"
//               >
//                 {buildingData.name}
//               </Text>
//             </View>
//             <View style={styles.headerFloorToggleRow}>
//               {buildingData.floors.map((floor) => {
//                 const isActive = floor.level === currentLevel;
//                 return (
//                   <TouchableOpacity
//                     key={floor.level}
//                     onPress={() => handleFloorChange(floor.level)}
//                     style={isActive ? styles.headerFloorToggleActive : styles.headerFloorToggle}
//                     accessibilityRole="button"
//                     accessibilityState={{ selected: isActive }}
//                     accessibilityLabel={`Switch to floor ${floor.label}`}
//                   >
//                     <Text style={isActive ? styles.headerFloorToggleTextActive : styles.headerFloorToggleText}>
//                       {floor.label}
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           </View>
//         </SafeAreaView>

//       <POIFilterPanel
//         pois={nonRoomPOIs}
//         categories={categoriesForFloor}
//         activeCategories={activeCategories}
//         floorLabel={activeFloor.label}
//         targetMode={routeTargetMode}
//         sourcePOI={sourcePOI}
//         destinationPOI={destinationPOI}
//         onTargetModeChange={setRouteTargetMode}
//         onToggleCategory={handleToggleCategory}
//         onSelectPOI={handleSelectPOI}
//       />
//     </View>
//   );
  
// };

// export default IndoorMapOverlay;

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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import { POI, POICategory } from "@/src/types/poi";
import { getPOIsForFloor, getCategoriesForFloor } from "@/src/data/poiData";
import MapContent from "./IndoorMap";
import POIBadge from "./POIBadge";
import DestinationMarker from "./DestinationMarker";
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
  onExit: () => void;
}

const MAP_POI_BADGE_SIZE = 18;

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();

  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);
  const [startLocation, setStartLocation] = useState<IndoorDestination | null>(null);
  const [activeField, setActiveField] = useState<"start" | "destination">("destination");
  const [routeTargetMode, setRouteTargetMode] = useState<"SOURCE" | "DESTINATION">(
    "DESTINATION",
  );
  const [sourcePOI, setSourcePOI] = useState<POI | null>(null);
  const [destinationPOI, setDestinationPOI] = useState<POI | null>(null);

  const [showDirections, setShowDirections] = useState(false);
  const handleSetStartLocation = useCallback((item: IndoorDestination) => {
    setStartLocation(item);
    setCurrentLevel(item.floorLevel);
    setSearchQuery(item.label ?? item.id);
    setShowSearchResults(false);
    setShowDirections(false);
    setRoute(null);
  }, []);
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

const handleDrawDirections = useCallback(() => {
  try {
    const navConfig = navConfigRegistry[buildingData.id];
    if (!navConfig || !destination) {
      setRoute(null);
      return;
    }

    const startNodeId = startLocation
      ? resolveDestinationNodeId(startLocation) ?? navConfig.defaultStartNodeId
      : navConfig.defaultStartNodeId;

    const endNodeId = resolveDestinationNodeId(destination);

    if (!endNodeId) {
      console.warn("Could not resolve destination node");
      setRoute(null);
      return;
    }

    const nextRoute = indoorMapService.getRoute(startNodeId, endNodeId, false);
    setRoute(nextRoute);
  } catch (error) {
    console.warn("Failed to compute indoor route:", error);
    setRoute(null);
  }
}, [
  buildingData.id,
  destination,
  startLocation,
  indoorMapService,
  resolveDestinationNodeId,
]);

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

const handleSetDestination = useCallback((item: IndoorDestination) => {
  setDestination(item);
  setCurrentLevel(item.floorLevel);
  setSearchQuery(item.label ?? item.id);
  setShowSearchResults(false);
  setShowDirections(false);
  setRoute(null);
}, []);

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
  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setRoute(null);
    setSearchQuery("");
    setShowSearchResults(false);
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

        {startLocation && !showDirections && startLocation.floorLevel === currentLevel && (       
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
            bgColor="none"
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