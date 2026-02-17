import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
  StyleSheet,
} from "react-native";
import MapView, {
  Circle,
  Region,
  Marker,
  PROVIDER_GOOGLE,
  Polygon,
  LongPressEvent,
  MapPressEvent,
} from "react-native-maps";

// data
import { CampusConfig } from "@/src/data/campus/campusConfig";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { INDOOR_DATA } from "@/src/data/indoorData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "@/src/styles/BuildingTheme";
import AdditionalInfoPopup, {AdditionalInfoPopupHandle} from "./AdditionalInfoPopup";

// components
import CampusLabels from "@/src/components/campusLabels";
import AdditionalInfoPopup from "./AdditionalInfoPopup";
import IndoorMapOverlay from "@/src/components/indoor/IndoorMapOverlay";

// hooks
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { polygonFromGeoJSON, isPointInPolygon } from "@/src/utils/geo";
import styles from "@/src/styles/campusMap";

// types
interface CampusMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface GeoJsonFeature {
  type: string;
  properties: {
    id: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
}) => {
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView>(null);

  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
  } = useUserLocation();

  const INITIAL_DELTA = 0.008;
  const mapCenter = userLocation || initialLocation;

  // only track completed changes to prevent re-rendering
  const [regionData, setRegionData] = useState<Region>({
    ...mapCenter,
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
  });

  const [selectedBuilding, setSelectedBuilding] = useState<{
    name: string;
    campus: "SGW" | "LOY";
    visible: boolean;
  }>({
    name: "",
    campus: "SGW",
    visible: false,
  });

  const [indoorBuildingId, setIndoorBuildingId] = useState<string | null>(null);

  // handle clicking on the location circle to zoom in
  const handleLocationPress = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        500, // ms
      );
    }
  }, [userLocation]);

  const handleMapPress = useCallback(
    (e: MapPressEvent) => {
      // dismiss popup when clicking empty map space
      if (selectedBuilding.visible) {
        setSelectedBuilding((prev) => ({ ...prev, visible: false }));
      }
    },
    [selectedBuilding.visible, setSelectedBuilding],
  );

  const handlePolygonPress = useCallback(
    (buildingId: string, campus: "SGW" | "LOY") => {
      // prevent event bubbling if necessary (though MapView usually handles this distinct from MapPress)
      console.log(`Single Tap Building: ${buildingId}`);
      setSelectedBuilding({
        name: buildingId,
        campus,
        visible: true,
      });
    },
    [],
  );

  const handleClosePopup = () => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
  };
  const handleMapLongPress = useCallback((e: LongPressEvent) => {
    const coordinate = e.nativeEvent.coordinate;
    console.log("Map Long Press:", coordinate);

    // Helper to search a specific GeoJSON dataset
    const findBuildingId = (geojson: any) => {
      const feature = geojson.features.find((f: GeoJsonFeature) => {
        if (f.geometry.type === "Polygon") {
          const rawCoords = f.geometry.coordinates[0];
          // ensure polygonFromGeoJSON is efficient
          // or memoize the parsed polygons if datasets are huge
          const polygonCoords = polygonFromGeoJSON(rawCoords);
          return isPointInPolygon(coordinate, polygonCoords);
        }
        return false;
      });
      return feature?.properties?.id || null;
    };

    const foundId = findBuildingId(SGW) || findBuildingId(LOY);

    if (foundId) {
      console.log(`Long press on building: ${foundId}`);
      if (INDOOR_DATA[foundId]) {
        setIndoorBuildingId(foundId);
        setSelectedBuilding((prev) => ({ ...prev, visible: false }));
      }
    }
  }, []);

  // memoize the polygon lists so they don't re-calculate on every render
  const { sgwPolygons, loyPolygons } = useMemo(() => {
    const generatePolygons = (geojson: any, campus: "SGW" | "LOY") => {
      return geojson.features
        .filter((f: GeoJsonFeature) => f.geometry.type === "Polygon")
        .map((feature: GeoJsonFeature) => {
          const { id } = feature.properties;
          const coordinates = feature.geometry.coordinates[0];

          const themeColor =
            BuildingTheme[campus][
              id as keyof (typeof BuildingTheme)[typeof campus]
            ];
          const color = themeColor || "#888888";

          // metadata for accessibility
          const meta =
            campus === "LOY"
              ? LoyolaBuildingMetadata[id]
              : SGWBuildingMetadata[id];
          const name = meta?.name || id;

          //   console.log(
          //     `${campus}, Building: ${properties.id}, Color: ${color}, Name: ${buildingMetadata?.name}`,
          //   );

          return (
            <Polygon
              key={`${campus}-${id}`}
              coordinates={polygonFromGeoJSON(coordinates)}
              fillColor={color + "90"} // add transparency
              strokeColor={color}
              strokeWidth={1}
              tappable={true}
              onPress={() => handlePolygonPress(id, campus)}
              accessibilityLabel={name}
              accessibilityRole="button"
              zIndex={1}
            />
          );
        });
    };

    return {
      sgwPolygons: generatePolygons(SGW, "SGW"),
      loyPolygons: generatePolygons(LOY, "LOY"),
    };
  }, [handlePolygonPress]);

  const mapID = useMemo(() => {
    return colorScheme === "dark"
      ? "eb0ccd6d2f7a95e23f1ec398"
      : "eb0ccd6d2f7a95e117328051"; // Workaround
  }, [colorScheme]);

  return (
    <View style={styles.container}>
      <MapView
        key={mapID} // Rerender when mode (light/dark) changes
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        googleMapId={Platform.OS === "android" ? mapID : undefined} // Style
        style={styles.map}
        // uncontrolled Map Props
        initialRegion={{
          ...initialLocation,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        }}
        onRegionChangeComplete={setRegionData} // update state only when drag ends
        onLongPress={handleMapLongPress}
        onPress={handleMapPress}
        // visual Configuration
        maxDelta={0}
        tintColor="#FF2D55"
        pitchEnabled={false} // no 3d
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        showsPointsOfInterest={false} // takes out the information off all businesses
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        showsUserLocation={false} // We render our own custom marker
        moveOnMarkerPress={false}
        toolbarEnabled={false} // Hide Google Maps toolbar on Android
        loadingEnabled={true}
        rotateEnabled={false}
      >
        {/* ---------------- overlays ---------------- */}
        {sgwPolygons}
        {loyPolygons}

        {/* ---------------- labels ---------------- */}
        {(Object.keys(CampusConfig) as (keyof typeof CampusConfig)[]).map(
          (campus) => (
            <CampusLabels
              key={`label-${campus}`}
              campus={campus}
              data={CampusConfig[campus].labels}
              longitudeDelta={regionData.longitudeDelta}
            />
          ),
        )}

        {/* ---------------- user location ---------------- */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              // scale radius based on zoom level
              radius={Math.max(5, regionData.longitudeDelta * 2000)}
              fillColor="#B03060BF"
              strokeColor="#FFFFFF"
              strokeWidth={2}
              zIndex={9999}
            />
            <Marker
              coordinate={userLocation}
              onPress={handleLocationPress}
              tracksViewChanges={false} // Optimization: static image doesn't need tracking
              zIndex={1001}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={localStyles.userMarker} />
            </Marker>
          </>
        )}
      </MapView>

      {/* ---------------- ui overlay ---------------- */}
      {/* Indoor Overlay (Conditionally Rendered) */}
      {indoorBuildingId && INDOOR_DATA[indoorBuildingId] && (
        <IndoorMapOverlay
          buildingData={INDOOR_DATA[indoorBuildingId]}
          onExit={() => setIndoorBuildingId(null)}
        />
      )}

      {/* building info popup (hide if indoors) */}
      {!indoorBuildingId && (
        <AdditionalInfoPopup
          visible={selectedBuilding.visible}
          buildingId={selectedBuilding.name}
          campus={selectedBuilding.campus}
          onClose={() => setSelectedBuilding((p) => ({ ...p, visible: false }))}
        />
      )}

      {locationLoading && (
        <View style={localStyles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {locationError && (
        <View style={localStyles.errorContainer}>
          <Text style={localStyles.errorText}>{locationError}</Text>
        </View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  userMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#B03060",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  loaderContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "#ffebee", // Light red background
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef9a9a",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default CampusMap;
