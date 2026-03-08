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
//   TouchableOpacity,
//   Animated,
//   useWindowDimensions,
//   Pressable,
//   TextInput,
//   ScrollView,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
// import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
// import DestinationMarker from "./DestinationMarker";
// import MapContent from "./IndoorMap";
// import FloorPicker from "./FloorPicker";
// import { styles } from "@/src/styles/IndoorMap.styles";
// import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

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

//   // Adjust longitude for latitude (Geographic projection correction)
//   const latRadians = (northEast.latitude * Math.PI) / 180;
//   const lonScale = Math.cos(latRadians);
//   const geographicRatio = (lonDiff * lonScale) / latDiff;

//   const calculatedHeight = screenWidth / geographicRatio;
//   return isFinite(calculatedHeight) ? calculatedHeight : screenHeight;
// };

// type IndoorDestination = {
//   id: string;
//   x: number;
//   y: number;
//   floorLevel: number;
//   label?: string;
// };

// type IndoorHotspot = {
//   id: string;
//   x: number;
//   y: number;
//   floorLevel: number;
//   label: string;
// };

// interface Props {
//   buildingData: BuildingIndoorConfig;
//   onExit: () => void;
// }

// const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
//   const { width, height } = useWindowDimensions();
//   const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
//   const [destination, setDestination] = useState<IndoorDestination | null>(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const zoomRef = useRef<ReactNativeZoomableView>(null);
//   const isMounted = useRef(true);
//   const activeFloor = useMemo(
//     () => buildingData.floors.find((f) => f.level === currentLevel),
//     [buildingData.floors, currentLevel],
//   );

//   // calculate Aspect Ratio strictly based on Geodata
//   // returns a safe height or defaults to screen height if data is missing
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

//     return navConfig.floors.flatMap((floor) =>
//       floor.nodes
//         .filter((node) => node.type === "room")
//         .map((node) => ({
//           id: node.id,
//           x: node.x,
//           y: node.y,
//           floorLevel: parseInt(node.floorId.split("_")[1], 10),
//           label: node.label ?? node.id,
//         }))
//     );
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


//    const handleSetDestination = useCallback((item: IndoorDestination) => {
//   setDestination(item);
//   setCurrentLevel(item.floorLevel);
//   setSearchQuery(item.label ?? item.id);
//   setShowSearchResults(false);
// }, []);
//   const handleClearDestination = useCallback(() => {
//     setDestination(null);
//     setSearchQuery("");
//     setShowSearchResults(false);
//   }, []);





//   // inital fade in
//   useEffect(() => {
//     isMounted.current = true;

//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 400,
//       useNativeDriver: true,
//     }).start();

//     return () => {
//       isMounted.current = false;
//     };
//   }, [fadeAnim]);

//   // floor transtion
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
//         // once the old map is entirely invisible, swap the state data
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
//         <TouchableOpacity onPress={onExit} style={{ padding: 20 }}>
//           <Text>Exit</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Map Area */}
//       <View style={styles.mapContainer}
//        >
//         <Animated.View style={[styles.mapCanvas, { opacity: fadeAnim }]}>
//           <ReactNativeZoomableView
//             ref={zoomRef}
//             maxZoom={3.0}
//             minZoom={1.0}
//             zoomStep={0.5}
//             initialZoom={1.0}
//             bindToBorders={true}
//             visualTouchFeedbackEnabled={false} // Disables tap ripple effects
//             contentWidth={width}
//             contentHeight={contentHeight}
//           >
            
//             <View style={{ width, height: contentHeight }}>
//   <MapContent
//     floor={activeFloor}
//     width={width}
//     height={contentHeight}
//   />

   
//   {hotspots
//     .filter((spot) => spot.floorLevel === currentLevel)
//     .map((spot) => {
//       const isSelected = destination?.id === spot.id;

//       return (
//         <Pressable
//           key={spot.id}
//           onPress={() =>
//             handleSetDestination({
//               id: spot.id,
//               x: spot.x,
//               y: spot.y,
//               floorLevel: spot.floorLevel,
//               label: spot.label,
//             })
//           }
//           style={{
//             position: "absolute",
//             left: offsetX + spot.x * scale - 16,
//             top: offsetY + spot.y * scale - 8,
//             paddingHorizontal: 4,
//             paddingVertical: 2,
//           }}
//           accessibilityRole="button"
//           accessibilityLabel={`Set destination to ${spot.label}`}
//         >
//           <Text
//             style={{
//               fontSize: 12,
//               fontWeight: "600",
//               color: isSelected ? "#E5486B" : "#2c2b2aff",
//             }}
//           >
//             {spot.label.replace("Room ", "")}
//           </Text>
//         </Pressable>
//       );
//     })}
//     {destination && destination.floorLevel === currentLevel && (
//     <DestinationMarker
//       x={offsetX + destination.x * scale -6}
//       y={offsetY + destination.y * scale + 2}
//     />
//   )}
// </View>
//           </ReactNativeZoomableView>
//         </Animated.View>
//       </View>

//       <SafeAreaView style={styles.headerWrapper} edges={["top"]}>
//         <View
//           style={styles.headerContent}
//           accessible={true}
//           accessibilityLabel={`${buildingData.name} Floor ${activeFloor.label}`}
//         >
//           <Text
//             style={styles.buildingTitle}
//             numberOfLines={1}
//             accessibilityRole="header"
//           >
//             {buildingData.name}
//           </Text>
//           <View style={styles.floorBadge}>
//             <Text style={styles.floorTitle}>Floor {activeFloor.label}</Text>
//           </View>
//         </View>
//       </SafeAreaView>
      
//       <FloorPicker
//         floors={buildingData.floors}
//         currentFloor={currentLevel}
//         onFloorSelect={handleFloorChange}
//       />

//       <View
//        pointerEvents="box-none"
//         style={{
//           position: "absolute",
//           left: 16,
//           right: 16,
//           bottom: 24,
//           zIndex: 50,
//           elevation: 12,
//         }}
//       >
//         <View
//           pointerEvents="auto"
//           style={{
//             backgroundColor: "#F6F3EE",
//             borderRadius: 24,
//             padding: 14,
//             borderWidth: 1,
//             borderColor: "#E4DDD3",
//           }}
//         >


//   {/* START CARD */}
//   <View
//     style={{
//       backgroundColor: "#F2EFEB",
//       borderRadius: 18,
//       paddingHorizontal: 16,
//       paddingVertical: 16,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//     }}
//   >
//     <Text
//       style={{
//         fontSize: 18,
//         fontWeight: "700",
//         color: "#E5486B",
//       }}
//     >
//       {/* start not implemented yet */}
//     </Text>

//     <Text
//       style={{
//         fontSize: 16,
//         color: "#9C948B",
//       }}
//     >
//       Start
//     </Text>
//   </View>

//   <View
//     style={{
//       backgroundColor: "#F2EFEB",
//       borderRadius: 18,
//       paddingHorizontal: 16,
//       paddingVertical: 12,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//     }}
//   >

//     {/* LEFT SIDE (Room number OR typing) */}
//     <View style={{ flex: 1 }}>
//       <TextInput
//         value={searchQuery}
//         onChangeText={(text) => {
//           setSearchQuery(text);
//           setShowSearchResults(text.trim().length > 0);
//         }}
//         placeholder=""
//         editable
//         autoCorrect={false}
//         autoCapitalize="none"
//         style={{
//           fontSize: 18,
//           fontWeight: "700",
//           color: "#E5486B",
//           paddingVertical: 0,
//         }}
//       />
//     </View>


//     {/* RIGHT SIDE */}
//     <View
//       style={{
//         flexDirection: "row",
//         alignItems: "center",
//       }}
//     >
//       <Text
//         style={{
//           fontSize: 16,
//           color: "#9C948B",
//           marginRight: 12,
//         }}
//       >
//         Destination
//       </Text>

//       <TouchableOpacity
//         activeOpacity={0.8}
//         style={{
//           width: 38,
//           height: 38,
//           borderRadius: 19,
//           backgroundColor: "#E5486B",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
//       </TouchableOpacity>
//     </View>
//   </View>

// </View>
//           {/* Search results */}
//           {showSearchResults && filteredRooms.length > 0 && (
//             <View
//               style={{
//                 marginTop: 10,
//                 backgroundColor: "#FFFFFF",
//                 borderRadius: 14,
//                 borderWidth: 1,
//                 borderColor: "#E3DDD4",
//                 maxHeight: 160,
//                 overflow: "hidden",
//               }}
//             >
//               <ScrollView keyboardShouldPersistTaps="always">
//                 {filteredRooms.map((room) => (
//                   <Pressable
//                     key={room.id}
//                     onPress={() =>
//                       handleSetDestination({
//                         id: room.id,
//                         x: room.x,
//                         y: room.y,
//                         floorLevel: room.floorLevel,
//                         label: room.label,
//                       })
//                     }
//                     style={{
//                       paddingHorizontal: 14,
//                       paddingVertical: 12,
//                       borderBottomWidth: 1,
//                       borderBottomColor: "#F0ECE6",
//                     }}
//                   >
//                     <Text
//                       style={{
//                         fontSize: 14,
//                         fontWeight: "600",
//                         color: "#3C3732",
//                       }}
//                     >
//                       {room.label}
//                     </Text>
//                     <Text
//                       style={{
//                         fontSize: 12,
//                         color: "#8A837A",
//                         marginTop: 2,
//                       }}
//                     >
//                       Floor {room.floorLevel}
//                     </Text>
//                   </Pressable>
//                 ))}
//               </ScrollView>
//             </View>
//           )}

//           {/* Bottom actions row */}
//           <View
//             style={{
//               flexDirection: "row",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginTop: 14,
//             }}
//           >
//             <TouchableOpacity
//               activeOpacity={0.8}
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 backgroundColor: "#ECE6DD",
//                 borderRadius: 14,
//                 paddingHorizontal: 14,
//                 paddingVertical: 10,
//                 opacity: 0.7,
//               }}
//             >
//               <Ionicons name="swap-vertical-outline" size={18} color="#7A746C" />
//               <Text
//                 style={{
//                   marginLeft: 8,
//                   color: "#7A746C",
//                   fontWeight: "600",
//                 }}
//               >
//                 Directions
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={onExit}
//               activeOpacity={0.8}
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 backgroundColor: "#D9385E",
//                 borderRadius: 14,
//                 paddingHorizontal: 14,
//                 paddingVertical: 10,
//               }}
//             >
//               <Ionicons name="close" size={18} color="#FFFFFF" />
//               <Text
//                 style={{
//                   marginLeft: 8,
//                   color: "#FFFFFF",
//                   fontWeight: "600",
//                 }}
//               >
//                 Exit
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
    
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
import { View, Text, Animated, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";
import MapContent from "./IndoorMap";
import FloorPicker from "./FloorPicker";
import DestinationMarker from "./DestinationMarker";
import IndoorBottomPanel from "./IndoorBottomPanel";
import IndoorRoomLabels from "./IndoorRoomLabels";
import { styles } from "@/src/styles/IndoorMap.styles";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

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

type IndoorDestination = {
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label?: string;
};

type IndoorHotspot = {
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label: string;
};

interface Props {
  buildingData: BuildingIndoorConfig;
  onExit: () => void;
}

const IndoorMapOverlay: React.FC<Props> = ({ buildingData, onExit }) => {
  const { width, height } = useWindowDimensions();
  const [currentLevel, setCurrentLevel] = useState(buildingData.defaultFloor);
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomRef = useRef<ReactNativeZoomableView>(null);
  const isMounted = useRef(true);

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
        onExit={onExit}
      />
    </View>
  );
};

export default IndoorMapOverlay;