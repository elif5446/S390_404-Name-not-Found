import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { POIPlace } from "@/src/api/places";


interface ExtendedPOI extends POIPlace {
  distance: number;
  distanceText: string;
  order: number;
}

interface POIListPanelProps {
  visible: boolean;
  pois: POIPlace[];
  userLocation?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onPOIDirections: (poi: POIPlace) => void;
  onClearPOIs: () => void;
  onUpdatePOIs?: (radius: number) => void;
}

const PANEL_HEIGHT = 450;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`; 
  return `${(meters / 1000).toFixed(2)} km`; 
};

const getPOITypeFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("coffee") || lowerName.includes("cafe") || lowerName.includes("starbucks") || lowerName.includes("tim hortons")) {
    return "coffee";
  }
  if (lowerName.includes("restaurant") || lowerName.includes("food") || lowerName.includes("pizza") || lowerName.includes("burger")) {
    return "restaurant";
  }
  if (lowerName.includes("bank") || lowerName.includes("atm") || lowerName.includes("rbc") || lowerName.includes("td") || lowerName.includes("scotia")) {
    return "bank";
  }
  if (lowerName.includes("hotel") || lowerName.includes("inn") || lowerName.includes("lodge")) {
    return "hotel";
  }
  if (lowerName.includes("library") || lowerName.includes("bibliotheque")) {
    return "library";
  }
  if (lowerName.includes("bar") || lowerName.includes("pub") || lowerName.includes("night club")) {
    return "bar";
  }
  return "generic";
};

const getPOIIcon = (poiType: string): React.ComponentProps<typeof MaterialIcons>["name"] => {
  switch (poiType) {
    case "coffee": return "local-cafe";
    case "restaurant": return "restaurant";
    case "bank": return "account-balance";
    case "hotel": return "hotel";
    case "library": return "local-library";
    case "bar": return "local-bar";
    default: return "place";
  }
};

const poiColor = (poiType: string): string => {
  switch (poiType) {
    case "coffee": return "#6D4C41";
    case "restaurant": return "#E53935";
    case "bank": return "#1565C0";
    case "hotel": return "#7B1FA2";
    case "library": return "#2E7D32";
    case "bar": return "#F57C00";
    default: return "#B03060";
  }
};

const POIListPanel: React.FC<POIListPanelProps> = ({
  visible,
  pois,
  userLocation,
  onClose,
  onPOIDirections,
  onClearPOIs,
  onUpdatePOIs,
}) => {
  const translateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;
// Add at the top of POIListPanel component
const RADIUS_OPTIONS = [1000, 500, 200, 100]; // 1km, 500m, 200m, 100m
const [radius, setRadius] = React.useState<number>(1000);

 //  Trigger POI fetch when radius changes ---
 React.useEffect(() => {
  if (onUpdatePOIs) {
    onUpdatePOIs(radius); // fetch new POIs from parent
  }
}, [radius]);
  const sortedPois = React.useMemo((): ExtendedPOI[] => {
    if (!userLocation || pois.length === 0) {
      return pois.map((poi, index) => ({
        ...poi,
        distance: 0,
        distanceText: "N/A",
        order: index + 1,
      }));
    }

    const getDistance = (poi: POIPlace): number => {
      const R = 6371000;
      const dLat = ((poi.latitude - userLocation.latitude) * Math.PI) / 180;
      const dLon = ((poi.longitude - userLocation.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userLocation.latitude * Math.PI) / 180) *
          Math.cos((poi.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const poisWithDistance = pois.map((poi) => {
      const distance = getDistance(poi);
      return {
        ...poi,
        distance,
        distanceText: formatDistance(distance),
        order: 0,
      };
    });

    const sorted = [...poisWithDistance].sort((a, b) => a.distance - b.distance);
    return sorted.map((poi, index) => ({ ...poi, order: index + 1 }));
  }, [pois, userLocation]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : PANEL_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(0, Math.min(PANEL_HEIGHT, gestureState.dy));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = PANEL_HEIGHT / 2;
        if (gestureState.dy > threshold) {
          Animated.timing(translateY, {
            toValue: PANEL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Add this helper component right before the main return statement
const EmptyStateContent = ({ onClearPOIs }: { onClearPOIs: () => void }) => (
  <View style={styles.inner}>
    <View style={styles.header}>
      <Text style={styles.title}>No places found nearby</Text>
      <TouchableOpacity onPress={onClearPOIs} style={styles.clearButton}>
        <MaterialIcons name="clear" size={24} color="#B03060" />
      </TouchableOpacity>
    </View>
    
    <View style={styles.emptyHint}>
      <MaterialIcons name="search" size={48} color="#B0B0B0" />
      <Text style={styles.emptyText}>
        Try a larger radius or different category
      </Text>
      <Text style={styles.emptySubtext}>Current: {radius >= 1000 ? `${radius/1000}km` : `${radius}m`}</Text>
    </View>
  </View>
);
// NEW: Show empty state when NO POIs OR after sorting/filtering
if (sortedPois.length === 0) {
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateY }] }, { zIndex: 1000 }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={40} tint="light" style={styles.blur}>
          <EmptyStateContent onClearPOIs={onClearPOIs} />
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.androidFallback]}>
          <EmptyStateContent onClearPOIs={onClearPOIs} />
        </View>
      )}
    </Animated.View>
  );
}
  // SCROLLABLE LIST RENDER ITEM
  const renderPOIItem = ({ item }: { item: ExtendedPOI }) => {
    const poiType = getPOITypeFromName(item.name);
    return (
      <TouchableOpacity
        style={styles.poiItem}
        onPress={() => onPOIDirections(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.poiIcon, { backgroundColor: poiColor(poiType) }]}>
          <MaterialIcons name={getPOIIcon(poiType)} size={20} color="white" />
        </View>
        <View style={styles.poiInfo}>
          <Text style={styles.poiName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.poiDistance}>
            #{item.order} • {item.distanceText} away
          </Text>
        </View>
        <MaterialIcons name="directions" size={24} color="#B03060" />
      </TouchableOpacity>
    );
  };

  const content = (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>{sortedPois.length} Places Nearby</Text>
        <TouchableOpacity onPress={onClearPOIs} style={styles.clearButton}>
          <MaterialIcons name="clear" size={24} color="#B03060" />
        </TouchableOpacity>
      </View>
{/* Radius Toggle */}
<View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
  {RADIUS_OPTIONS.map((r) => (
    <TouchableOpacity
      key={r}
      onPress={() => setRadius(r)}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: radius === r ? "#B03060" : "#E6E6E9",
      }}
    >
      <Text style={{ color: radius === r ? "#fff" : "#202020", fontWeight: "600" }}>
        {r >= 1000 ? `${r / 1000} km` : `${r} m`}
      </Text>
    </TouchableOpacity>
  ))}
</View>
      {/* SCROLLABLE FLATLIST */}
      <FlatList
        data={sortedPois}
        renderItem={renderPOIItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      />
    </View>
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateY }] }, { zIndex: 1000 }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={40} tint="light" style={styles.blur}>{content}</BlurView>
      ) : (
        <View style={[styles.blur, styles.androidFallback]}>{content}</View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
  },
  blur: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  androidFallback: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  inner: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#B03060",
  },
  clearButton: {
    padding: 6,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  poiItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  poiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  poiInfo: {
    flex: 1,
    paddingRight: 8,
  },
  poiName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  poiDistance: {
    fontSize: 14,
    color: "#6B6B6F",
    fontWeight: "500",
  },
  emptyHint: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 40,
},
emptyText: {
  fontSize: 18,
  fontWeight: "500",
  color: "#6B6B6F",
  textAlign: "center",
  marginTop: 16,
  marginBottom: 8,
},
emptySubtext: {
  fontSize: 14,
  color: "#9B9B9B",
  textAlign: "center",
},
});

export default POIListPanel;