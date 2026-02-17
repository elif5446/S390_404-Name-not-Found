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
  LatLng,
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

// helper; define here so it's not calculated on every frame update
const getCentroid = (coords: LatLng[]): LatLng => {
  const lat = coords.reduce((s, c) => s + c.latitude, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.longitude, 0) / coords.length;
  return { latitude: lat, longitude: lng };
};

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

  const handleLocationPress = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        500,
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
      console.log(`Single Tap Building: ${buildingId}`);
      setSelectedBuilding({
        name: buildingId,
        campus,
        visible: true,
      });
    },
    [],
  );

  const handleMapLongPress = useCallback((e: LongPressEvent) => {
    const coordinate = e.nativeEvent.coordinate;
    console.log("Map Long Press:", coordinate);

    const findBuildingId = (geojson: any) => {
      const feature = geojson.features.find((f: GeoJsonFeature) => {
        if (f.geometry.type === "Polygon") {
          const rawCoords = f.geometry.coordinates[0];
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
        .map((feature: GeoJsonFeature, index: number) => {
          const { id: buildingId } = feature.properties;
          const coordinates = polygonFromGeoJSON(
            feature.geometry.coordinates[0],
          );

          const themeColor =
            BuildingTheme[campus][
              buildingId as keyof (typeof BuildingTheme)[typeof campus]
            ];
          const color = themeColor || "#888888";

          // metadata for accessibility
          const meta =
            campus === "LOY"
              ? LoyolaBuildingMetadata[buildingId]
              : SGWBuildingMetadata[buildingId];
          const name = meta?.name || buildingId;

          //   console.log(
          //     `${campus}, Building: ${buildingId}, Color: ${color}, Name: ${buildingMetadata?.name}`,
          //   );

          return (
            <React.Fragment key={`group-${buildingId}`}>
              <Polygon
                key={`${campus}-${buildingId}`}
                coordinates={coordinates}
                fillColor={color + "90"} // add transparency
                strokeColor={color}
                strokeWidth={1}
                tappable={true}
                onPress={() => handlePolygonPress(buildingId, campus)}
                importantForAccessibility="no-hide-descendants"
                accessibilityLabel={name}
                accessibilityRole="button"
                zIndex={1}
              />

              <Marker
                coordinate={getCentroid(coordinates)}
                onPress={() => handlePolygonPress(buildingId, campus)}
                zIndex={200}
                tracksViewChanges={true}
                title={name || buildingId}
                importantForAccessibility="yes"
                accessibilityLabel={name || buildingId}
                accessibilityRole="button"
                accessibilityHint="Tap to view details"
              >
                <View
                  style={{
                    width: 0.3 / regionData.longitudeDelta,
                    height: 0.3 / regionData.longitudeDelta,
                    backgroundColor: "white",
                    opacity: 0.01,
                  }}
                  collapsable={false}
                  importantForAccessibility="yes"
                  accessible={true}
                  accessibilityLabel={name || buildingId}
                  accessibilityRole="button"
                  accessibilityHint="Tap to view details"
                >
                  {Platform.OS === "android" && (
                    <Text style={{ width: 1, height: 1, opacity: 0 }}> </Text>
                  )}
                </View>
              </Marker>
            </React.Fragment>
          );
        });
    };

    return {
      sgwPolygons: generatePolygons(SGW, "SGW"),
      loyPolygons: generatePolygons(LOY, "LOY"),
    };
  }, [handlePolygonPress, regionData.longitudeDelta]);

  const mapID = useMemo(() => {
    return colorScheme === "dark"
      ? "eb0ccd6d2f7a95e23f1ec398"
      : "eb0ccd6d2f7a95e117328051";
  }, [colorScheme]);

  return (
    <View style={styles.container}>
      <MapView
        key={mapID}
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        googleMapId={Platform.OS === "android" ? mapID : undefined}
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
        showsPointsOfInterest={false}
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
              tracksViewChanges={false}
              zIndex={9999}
              title={"Current Location"}
              accessibilityLabel={"Current Location"}
              importantForAccessibility="yes"
            >
              <View
                style={{
                  borderRadius: 6,
                  backgroundColor: "#B03060",
                }}
                accessible={true}
                accessibilityLabel={"Current Location"}
                importantForAccessibility="yes"
              />
            </Marker>
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
