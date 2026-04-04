import React, { useMemo } from "react";
import { Marker, Callout } from "react-native-maps";
import { View, Text, ScrollView, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { POIPlace } from "@/src/api/places";

const POI_ICONS: Record<string, { icon: string; color: string }> = {
  Restaurants: { icon: "restaurant", color: "#800020" },
  "Coffee shops": { icon: "local-cafe", color: "#6D4C41" },
  Banks: { icon: "account-balance", color: "#1565C0" },
  Hotels: { icon: "hotel", color: "#7B1FA2" },
  Libraries: { icon: "local-library", color: "#2E7D32" },
  Bars: { icon: "local-bar", color: "#F57C00" },
};

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface OutdoorPOIMarkersProps {
  campus: "SGW" | "LOY";
  poiType: string;
  pois: POIPlace[];
  radiusMeters?: number;
  onPOIPress?: (poi: POIPlace) => void;
}

const CAMPUS_COORDS = {
  SGW: { latitude: 45.497, longitude: -73.578 },
  LOY: { latitude: 45.458, longitude: -73.639 },
};

function getColor(poi: POIPlace): string {
  if (poi.isOpen === true) {
    return "green";
  } else if (poi.isOpen === false) {
    return "red";
  }
  return "gray";
}

function isOpen(poi: POIPlace): string {
  if (poi.isOpen === true) {
    return "Open";
  } else if (poi.isOpen === false) {
    return "Closed";
  }
  return "Hours unknown";
}

const OutdoorPOIMarkers: React.FC<OutdoorPOIMarkersProps> = ({ campus, poiType, pois, radiusMeters = 1000, onPOIPress }) => {
  const origin = CAMPUS_COORDS[campus];
  const { icon, color } = POI_ICONS[poiType] || { icon: "place", color: "#B03060" };

  const filtered = useMemo(() => {
    return pois.filter(p => {
      const d = getDistanceFromLatLonInMeters(origin.latitude, origin.longitude, p.latitude, p.longitude);
      return d <= radiusMeters;
    });
  }, [pois, origin, radiusMeters]);

  return (
    <>
      {filtered.map(poi => (
        <Marker
          key={poi.id}
          coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 1 }}
        >
          {/* Marker Bubble */}
          <View
            style={{
              alignItems: "center",
              overflow: Platform.OS === "android" ? "visible" : "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: color,
                borderRadius: 20,
                padding: Platform.OS === "android" ? 8 : 6,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons name={icon as any} size={24} color="#fff" />
            </View>

            {/* Triangle tip */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderTopWidth: 8,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: color,
                marginTop: Platform.OS === "android" ? 0 : -1,
              }}
            />
          </View>

          {/* Callout */}
          <Callout>
            <View
              testID="callout-container"
              style={{
                width: 200,
                padding: 8,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{poi.name}</Text>

              <Text style={{ color: getColor(poi) }}>{isOpen(poi)}</Text>

              {/* Keep stacked layout but limit vertical height */}
              {poi.openHours && (
                <ScrollView style={{ maxHeight: 80, marginTop: 4 }}>
                  {poi.openHours.map((line, idx) => (
                    <Text key={`${line}-${idx}`} style={{ fontSize: 12, color: "#555", lineHeight: 16 }}>
                      {line}
                    </Text>
                  ))}
                </ScrollView>
              )}
            </View>
          </Callout>
        </Marker>
      ))}
    </>
  );
};

export default OutdoorPOIMarkers;
