import CampusLabels from "@/src/components/campusLabels";
import { CampusConfig } from "@/src/data/campus/campusConfig";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
  Vibration,
} from "react-native";
import MapView, {
  Circle,
  Region,
  Marker,
  PROVIDER_GOOGLE,
  Polygon,
  LongPressEvent,
} from "react-native-maps";
import styles from "@/src/styles/campusMap";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "@/src/styles/BuildingTheme";
import AdditionalInfoPopup from "./AdditionalInfoPopup";

import IndoorMapOverlay from "@/src/components/indoor/IndoorMapOverlay";
import { INDOOR_DATA } from "@/src/data/indoorData";
import { polygonFromGeoJSON, isPointInPolygon } from "@/src/utils/geo"; // Assume this moved to utils as per best practice

interface CampusMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
}) => {
  // Get user's location with permission handling
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
  } = useUserLocation();

  const mapRef = useRef<MapView>(null); // Create a ref to the MapView so we can control it
  const mapCenter = userLocation || initialLocation;

  // Track map region to scale location circle based on zoom level
  const [mapRegion, setMapRegion] = useState<Region>({
    ...mapCenter,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  });

  // State for building info popup
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

  // Handle clicking on the location circle to zoom in
  const handleLocationPress = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.003, // Zoom in closer
          longitudeDelta: 0.003,
        },
        500,
      ); // 500ms animation
    }
  };

  const handlePolygonPress = useCallback(
    (buildingId: string, campus: "SGW" | "LOY") => {
      console.log(`Single Tap: ${buildingId}`);
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

    const findBuildingAtPoint = (geojson: any) => {
      for (const feature of geojson.features) {
        if (feature.geometry.type === "Polygon") {
          const rawCoords = feature.geometry.coordinates[0];
          const polygonCoords = polygonFromGeoJSON(rawCoords);
          if (isPointInPolygon(coordinate, polygonCoords)) {
            return feature.properties.id;
          }
        }
      }
      return null;
    };

    let foundId = findBuildingAtPoint(SGW);
    if (!foundId) foundId = findBuildingAtPoint(LOY);

    if (foundId) {
      console.log(`Long press detected inside building: ${foundId}`);

      if (INDOOR_DATA[foundId]) {
        setIndoorBuildingId(foundId);
        setSelectedBuilding((prev) => ({ ...prev, visible: false }));
      } else {
        console.log("No indoor data for this building.");
      }
    }
  }, []);

  // Center map on selected building
  // const buildingMetadata = campus == "SGW" ? SGWBuildingMetadata[buildingName] : LoyolaBuildingMetadata[buildingName];
  // if (buildingMetadata && mapRef.current) {
  //   mapRef.current.animateToRegion(
  //     {
  //       latitude: buildingMetadata.location.latitude,
  //       longitude: buildingMetadata.location.longitude,
  //       latitudeDelta: 0.003,
  //       longitudeDelta: 0.003,
  //     }, 500)
  // };

  const renderedPolygons = useMemo(() => {
    const render = (geojson: typeof SGW | typeof LOY, campus: "SGW" | "LOY") =>
      geojson.features.map((feature: any) => {
        if (feature.geometry.type !== "Polygon") return null;

        const coordinates = feature.geometry.coordinates[0];
        const properties = feature.properties as { id: string };
        const color =
          BuildingTheme[campus][
            properties.id as keyof (typeof BuildingTheme)[typeof campus]
          ] || "#888888";
        const buildingMetadata =
          campus === "LOY"
            ? LoyolaBuildingMetadata[properties.id]
            : SGWBuildingMetadata[properties.id];
        //   console.log(
        //     `${campus}, Building: ${properties.id}, Color: ${color}, Name: ${buildingMetadata?.name}`,
        //   );

        return (
          <Polygon
            key={`${campus}-${properties.id}`}
            coordinates={polygonFromGeoJSON(coordinates)}
            fillColor={color + "90"}
            strokeColor={color}
            strokeWidth={1}
            tappable={true}
            onPress={() => handlePolygonPress(properties.id, campus)}
            accessibilityLabel={buildingMetadata?.name || properties.id}
            accessibilityRole="button"
            zIndex={1}
          />
        );
      });

    return {
      sgw: render(SGW, "SGW"),
      loy: render(LOY, "LOY"),
    };
  }, [handlePolygonPress]); // recreate if handles change; shouldn't

  const mapID =
    useColorScheme() === "dark"
      ? "eb0ccd6d2f7a95e23f1ec398"
      : "eb0ccd6d2f7a95e117328051"; // Workaround

  return (
    <View style={styles.container}>
      <MapView
        key={mapID} // Rerender when mode (light/dark) changes
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        googleMapId={Platform.OS === "android" ? mapID : undefined} // Style
        style={styles.map}
        pitchEnabled={false} // No 3D
        maxDelta={0}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        showsPointsOfInterest={false} // takes out the information off all businesses
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        showsUserLocation={false}
        moveOnMarkerPress={false}
        tintColor="#FF2D55"
        region={{
          ...initialLocation,
          latitudeDelta: 0.0043,
          longitudeDelta: 0.0043,
        }}
        onRegionChange={setMapRegion}
        onLongPress={handleMapLongPress}
      >
        {/* ---------------- overlays ---------------- */}
        {renderedPolygons.sgw}
        {renderedPolygons.loy}

        {/* ---------------- labels ---------------- */}
        {(Object.keys(CampusConfig) as (keyof typeof CampusConfig)[]).map(
          (campus) => (
            <CampusLabels
              key={`label-${campus}`}
              campus={campus}
              data={CampusConfig[campus].labels}
              longitudeDelta={mapRegion.longitudeDelta}
            />
          ),
        )}

        {userLocation && ( // Show user's current location if available
          <Circle
            center={userLocation}
            radius={Math.max(2.5, mapRegion.longitudeDelta * 2000)}
            fillColor="#B03060BF"
            strokeColor="#FFFFFF"
            strokeWidth={2}
            zIndex={9999}
          />
        )}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            onPress={handleLocationPress}
            tracksViewChanges={false}
            zIndex={1001}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#B03060",
              }}
            />
          </Marker>
        )}
      </MapView>

      {/* Indoor Overlay (Conditionally Rendered) */}
      {indoorBuildingId && INDOOR_DATA[indoorBuildingId] && (
        <IndoorMapOverlay
          buildingData={INDOOR_DATA[indoorBuildingId]}
          onExit={() => setIndoorBuildingId(null)}
        />
      )}

      {/* Existing Popup (Hide if indoors) */}
      {!indoorBuildingId && (
        <AdditionalInfoPopup
          visible={selectedBuilding.visible}
          buildingId={selectedBuilding.name}
          campus={selectedBuilding.campus}
          onClose={() => setSelectedBuilding((p) => ({ ...p, visible: false }))}
        />
      )}

      {locationLoading && (
        <View style={{ position: "absolute", top: 20, right: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {locationError && (
        <View
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "#B03060", fontSize: 12 }}>
            {locationError}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CampusMap;
