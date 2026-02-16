import CampusPolygons from "@/src/components/polygons";
import CampusLabels from "@/src/components/campusLabels";
import RoutePolyline from "@/src/components/RoutePolyline";
import { CampusConfig } from "@/src/data/campus/campusConfig";

import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, {
  LatLng,
  Circle,
  Region,
  Marker,
  PROVIDER_GOOGLE,
  Polygon,
} from "react-native-maps";
import styles from "@/src/styles/campusMap";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useDirections } from "@/src/context/DirectionsContext";
import { calculatePolygonCenter } from "@/src/utils/geometry";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "@/src/styles/BuildingTheme";
import AdditionalInfoPopup from "./AdditionalInfoPopup";
import DestinationPopup from "./DestinationPopup";

// Convert GeoJSON coordinates to LatLng
const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

const toRadians = (value: number): number => (value * Math.PI) / 180;

const distanceMetersBetween = (pointA: LatLng, pointB: LatLng): number => {
  const earthRadius = 6371000;
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);
  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

interface CampusMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface TransitStopMarker {
  key: string;
  stepIndex: number;
  coordinate: LatLng;
  title: string;
  description: string;
  pinColor: string;
  iconName: "directions-bus" | "subway";
}

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() || "light";

  // Get user's location with permission handling
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
  } = useUserLocation();

  // Get directions context for destination setting
  const {
    destinationBuildingId,
    startBuildingId,
    startCoords,
    routeData,
    travelMode,
    isNavigationActive,
    setDestination,
    setStartPoint,
    clearRouteData,
    showDirections,
    setShowDirections,
    setIsNavigationActive,
  } = useDirections();

  // Use user location if available, otherwise use initial location
  const mapCenter = userLocation || initialLocation;

  // Track map region to scale location circle based on zoom level
  const [mapRegion, setMapRegion] = useState<Region>({
    ...mapCenter,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  });

  // State for additional building info popup
  const [selectedBuilding, setSelectedBuilding] = useState<{
    name: string;
    campus: "SGW" | "LOY";
    coords: LatLng | null;
    visible: boolean;
  }>({
    name: "",
    campus: "SGW",
    coords: null,
    visible: false,
  });
  const [navigationStepIndex, setNavigationStepIndex] = useState(0);
  const [selectedTransitStopKey, setSelectedTransitStopKey] = useState<string | null>(null);

  // Calculate circle radius based on zoom level (longitudeDelta)
  // Larger longitudeDelta = zoomed out = bigger circle
  const circleRadius = Math.max(2.5, mapRegion.longitudeDelta * 2000);

  // Create a ref to the MapView so we can control it
  const mapRef = useRef<MapView>(null);
  const lastCameraUpdateAtRef = useRef(0);
  const ignoreNextMapPressRef = useRef(false);

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

  // Handle building tap to show additional info and set destination
  const handleBuildingPress = (
    buildingName: string,
    campus: "SGW" | "LOY",
    coordinates: LatLng
  ) => {
    setIsNavigationActive(false);

    if (showDirections) {
      setShowDirections(false);
      clearRouteData();
    }

    setSelectedBuilding({
      name: buildingName,
      campus,
      coords: coordinates,
      visible: true,
    });

    // Get building name from metadata for display
    const buildingMetadata =
      campus === "LOY"
        ? LoyolaBuildingMetadata[buildingName]
        : SGWBuildingMetadata[buildingName];

    if (buildingMetadata) {
      setDestination(buildingName, coordinates, buildingMetadata.name);
    }
  };

  // Handle close popup
  const handleClosePopup = () => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
  };

  const directionsEtaLabel = (() => {
    if (!userLocation || !selectedBuilding.coords) {
      return "--";
    }

    const walkingMetersPerSecond = 1.35;
    const meters = distanceMetersBetween(userLocation, selectedBuilding.coords);
    const minutes = Math.max(1, Math.round(meters / walkingMetersPerSecond / 60));

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours} h ${remainingMinutes} min`
        : `${hours} h`;
    }

    return `${minutes} min`;
  })();

  const handleOpenDirectionsPopup = () => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
    setShowDirections(true);
  };

  const handleSetAsDestination = () => {
    if (!selectedBuilding.name) return;

    const buildingMetadata =
      selectedBuilding.campus === "LOY"
        ? LoyolaBuildingMetadata[selectedBuilding.name]
        : SGWBuildingMetadata[selectedBuilding.name];

    const sourceGeo = selectedBuilding.campus === "LOY" ? LOY : SGW;
    const feature = sourceGeo.features.find(
      (item) => (item.properties as { id: string }).id === selectedBuilding.name
    );

    if (!buildingMetadata || !feature || feature.geometry.type !== "Polygon") {
      return;
    }

    const centerCoordinates = calculatePolygonCenter(feature.geometry.coordinates[0]);
    setDestination(selectedBuilding.name, centerCoordinates, buildingMetadata.name);
  };

  const handleDirectionsTrigger = () => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
    handleSetAsDestination();

    if (userLocation) {
      setStartPoint("USER", userLocation, "Your Location");
    }

    handleOpenDirectionsPopup();
  };

  const handleCloseDestinationPopup = () => {
    setShowDirections(false);
  };

  const handleEndNavigation = () => {
    setIsNavigationActive(false);
    setShowDirections(false);
    clearRouteData();
  };

  const mapID =
    colorScheme === "dark"
      ? "eb0ccd6d2f7a95e23f1ec398"
      : "eb0ccd6d2f7a95e117328051"; // Workaround

  const shouldUseLiveUserStart =
    startBuildingId === "USER" && !!userLocation;

  const routeStartLocation = shouldUseLiveUserStart
    ? userLocation
    : startCoords || userLocation || initialLocation;

  const activeInstruction = routeData?.steps?.[navigationStepIndex] || routeData?.steps?.[0];

  const activeInstructionDistanceMeters =
    userLocation && activeInstruction?.endLocation
      ? Math.round(distanceMetersBetween(userLocation, activeInstruction.endLocation))
      : null;

  const recenterButtonTop =
    insets.top + (isNavigationActive && routeData ? 118 : 84);

  const modeLabelMap: Record<"walking" | "driving" | "transit" | "bicycling", string> = {
    walking: "Walking",
    driving: "Driving",
    transit: "Transit",
    bicycling: "Bicycling",
  };

  const transitNavigationStops =
    isNavigationActive && travelMode === "transit" && routeData?.steps
      ? routeData.steps
          .flatMap((step, index) => {
            const hasTransitMeta =
              !!step.transitLineName || !!step.transitLineShortName || !!step.transitVehicleType;
            if (!hasTransitMeta) {
              return [] as TransitStopMarker[];
            }

            const lineLabel = step.transitLineShortName || step.transitLineName || "Transit";
            const normalizedVehicle = (step.transitVehicleType || "Transit").toLowerCase();
            const vehicleLabel =
              normalizedVehicle.includes("subway") || normalizedVehicle.includes("metro")
                ? "Metro"
                : normalizedVehicle.includes("bus") || normalizedVehicle.includes("shuttle")
                  ? "Bus"
                  : "Transit";
            const markerIcon: "directions-bus" | "subway" =
              vehicleLabel === "Metro" ? "subway" : "directions-bus";

            const boardPoint = step.startLocation
              ? {
                  key: `board-${index}`,
                  stepIndex: index,
                  coordinate: step.startLocation,
                  title: `Board ${vehicleLabel} ${lineLabel}`,
                  description: step.transitDepartureStop || step.instruction,
                  pinColor: "#2E8B57",
                  iconName: markerIcon,
                }
              : null;

            const exitPoint = step.endLocation
              ? {
                  key: `exit-${index}`,
                  stepIndex: index,
                  coordinate: step.endLocation,
                  title: `Exit ${vehicleLabel} ${lineLabel}`,
                  description: step.transitArrivalStop || "Continue from this stop",
                  pinColor: "#2D6CDF",
                  iconName: markerIcon,
                }
              : null;

            return [boardPoint, exitPoint].filter(
              (item): item is TransitStopMarker => Boolean(item)
            );
          })
          .filter((item) => item.stepIndex >= navigationStepIndex)
          .slice(0, 4)
      : [];

  const selectedTransitStop =
    transitNavigationStops.find((stop) => stop.key === selectedTransitStopKey) || null;

  useEffect(() => {
    if (showDirections) {
      setSelectedBuilding((previousState) =>
        previousState.visible
          ? { ...previousState, visible: false }
          : previousState
      );
    }
  }, [showDirections]);

  useEffect(() => {
    if (!isNavigationActive) {
      setSelectedTransitStopKey(null);
      return;
    }

    if (
      selectedTransitStopKey &&
      !transitNavigationStops.some((stop) => stop.key === selectedTransitStopKey)
    ) {
      setSelectedTransitStopKey(null);
    }
  }, [isNavigationActive, selectedTransitStopKey, transitNavigationStops]);

  useEffect(() => {
    if (!(showDirections || isNavigationActive) || !routeData) {
      setNavigationStepIndex(0);
      return;
    }

    setNavigationStepIndex((previousIndex) =>
      Math.min(previousIndex, Math.max(0, routeData.steps.length - 1))
    );
  }, [showDirections, isNavigationActive, routeData?.id]);

  useEffect(() => {
    if (!(showDirections || isNavigationActive) || !routeData || !userLocation) {
      return;
    }

    if (!routeData.steps || routeData.steps.length === 0) {
      return;
    }

    const arrivalThresholdByMode: Record<
      "walking" | "driving" | "transit" | "bicycling",
      number
    > = {
      walking: 28,
      bicycling: 45,
      transit: 60,
      driving: 80,
    };

    const currentStep = routeData.steps[navigationStepIndex];
    if (!currentStep?.endLocation) {
      return;
    }

    const metersToStepEnd = distanceMetersBetween(userLocation, currentStep.endLocation);
    if (
      metersToStepEnd <= arrivalThresholdByMode[travelMode] &&
      navigationStepIndex < routeData.steps.length - 1
    ) {
      setNavigationStepIndex((previousIndex) =>
        Math.min(previousIndex + 1, routeData.steps.length - 1)
      );
    }
  }, [
    showDirections,
    isNavigationActive,
    routeData,
    userLocation?.latitude,
    userLocation?.longitude,
    navigationStepIndex,
    travelMode,
  ]);

  useEffect(() => {
    if (!isNavigationActive || !shouldUseLiveUserStart || !userLocation || !mapRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastCameraUpdateAtRef.current < 1000) {
      return;
    }

    lastCameraUpdateAtRef.current = now;
    mapRef.current.animateCamera(
      {
        center: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        pitch: 40,
        zoom: 17,
      },
      {
        duration: 550,
      }
    );
  }, [
    showDirections,
    isNavigationActive,
    shouldUseLiveUserStart,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  // Helper function to render polygons
  const renderPolygons = (
    geojson: typeof SGW | typeof LOY,
    campus: "SGW" | "LOY",
  ) =>
    geojson.features.map((feature) => {
      if (feature.geometry.type !== "Polygon") return null;

      const coordinates = feature.geometry.coordinates[0];
      const properties = feature.properties as { id: string }; // only id now

      const color =
        BuildingTheme[campus][
          properties.id as keyof (typeof BuildingTheme)[typeof campus]
        ] || "#888888";
      const buildingMetadata =
        campus === "LOY"
          ? LoyolaBuildingMetadata[properties.id]
          : SGWBuildingMetadata[properties.id];

      const isSelected = selectedBuilding.visible && selectedBuilding.name === properties.id;
      const isDestination = destinationBuildingId === properties.id;
      const isHighlighted = isDestination || isSelected;

      // Calculate center point of building for directions
      const centerCoordinates = calculatePolygonCenter(coordinates);

      return (
        <React.Fragment key={properties.id}>
          {isHighlighted && (
            <Polygon
              coordinates={polygonFromGeoJSON(coordinates)}
              fillColor="transparent"
              strokeColor="#B0306038"
              strokeWidth={7}
              tappable
              onPress={() =>
                handleBuildingPress(properties.id, campus, centerCoordinates)
              }
              zIndex={1}
            />
          )}

          {isHighlighted && (
            <Polygon
              coordinates={polygonFromGeoJSON(coordinates)}
              fillColor="transparent"
              strokeColor="#FFFFFFE6"
              strokeWidth={2}
              tappable
              onPress={() =>
                handleBuildingPress(properties.id, campus, centerCoordinates)
              }
              zIndex={2}
            />
          )}

          <Polygon
            coordinates={polygonFromGeoJSON(coordinates)}
            fillColor={isDestination ? color + "C8" : isSelected ? color + "BE" : color + "90"} // mostly opaque
            strokeColor={isHighlighted ? "#FFFFFF" : color}
            strokeWidth={isHighlighted ? 2 : 1}
            tappable
            onPress={() =>
              handleBuildingPress(properties.id, campus, centerCoordinates)
            }
            accessibilityLabel={buildingMetadata?.name || properties.id}
            accessibilityRole="button"
            zIndex={3}
          />
        </React.Fragment>
      );
    });

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
        tintColor="#FF2D55"
        initialRegion={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={() => {
          if (ignoreNextMapPressRef.current) {
            ignoreNextMapPressRef.current = false;
            return;
          }
          setSelectedTransitStopKey(null);
        }}
      >

        {/* ---------------- overlays ---------------- */}
        {(Object.keys(CampusConfig) as Array<keyof typeof CampusConfig>).map(
          (campus) => (
            <CampusPolygons
              key={`poly-${campus}`}
              campus={campus}
              geojson={CampusConfig[campus].geojson}
              metadata={CampusConfig[campus].metadata}
            />
          )
        )}

        {/* Render SGW campus */}
        {renderPolygons(SGW, "SGW")}

        {/* Render Loyola campus */}
        {renderPolygons(LOY, "LOY")}

        {/* ---------------- labels ---------------- */}
        {(Object.keys(CampusConfig) as Array<keyof typeof CampusConfig>).map(campus => (
          <CampusLabels
            key={`label-${campus}`}
            campus={campus}
            data={CampusConfig[campus].labels}
            longitudeDelta={mapRegion.longitudeDelta}
          />
        ))}

        {userLocation && ( //Show user's current location if available
          <Circle
            center={userLocation}
            radius={circleRadius}
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

        <RoutePolyline startLocation={routeStartLocation} />

        {transitNavigationStops.map((stop) => (
          <Marker
            key={stop.key}
            coordinate={stop.coordinate}
            onPress={() => {
              ignoreNextMapPressRef.current = true;
              setSelectedTransitStopKey((previousKey) =>
                previousKey === stop.key ? null : stop.key
              );
            }}
            tracksViewChanges={false}
            zIndex={1002}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: stop.pinColor,
                borderWidth: 2,
                borderColor: selectedTransitStopKey === stop.key ? "#FFFFFF" : "#F2F2F7",
              }}
            >
              <MaterialIcons name={stop.iconName} size={16} color="#FFFFFF" />
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedTransitStop && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: insets.bottom + (isNavigationActive && routeData ? 92 : 14),
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.2,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10003,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text
              style={{ color: "#B03060", fontWeight: "700", fontSize: 14, flex: 1, paddingRight: 8 }}
              numberOfLines={2}
            >
              {selectedTransitStop.title}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedTransitStopKey(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#F2F2F7",
              }}
              accessibilityRole="button"
              accessibilityLabel="Close transit stop info"
            >
              <MaterialIcons name="close" size={16} color={colorScheme === "dark" ? "#F2F2F7" : "#1C1C1E"} />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              color: colorScheme === "dark" ? "#D1D1D6" : "#3C3C43",
              fontWeight: "500",
              fontSize: 12,
              marginTop: 5,
            }}
            numberOfLines={2}
          >
            {selectedTransitStop.description}
          </Text>
        </View>
      )}

      {isNavigationActive && routeData && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            top: insets.top + 18,
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.2,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10002,
          }}
        >
          <Text
            style={{
              color: "#B03060",
              fontWeight: "700",
              fontSize: 14,
            }}
            numberOfLines={1}
          >
            {modeLabelMap[travelMode]} • {routeData.duration} • {routeData.distance}
          </Text>
          <Text
            style={{
              color: colorScheme === "dark" ? "#F2F2F7" : "#1C1C1E",
              fontWeight: "600",
              fontSize: 13,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {activeInstruction?.instruction || "Continue on current route"}
          </Text>
          {!!activeInstruction?.distance && (
            <Text
              style={{
                color: colorScheme === "dark" ? "#AFAFAF" : "#6B6B6F",
                fontWeight: "500",
                fontSize: 12,
                marginTop: 1,
              }}
            >
              Next in {activeInstructionDistanceMeters !== null ? `${activeInstructionDistanceMeters} m` : activeInstruction.distance}
            </Text>
          )}
        </View>
      )}

      {isNavigationActive && routeData && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: insets.bottom + 12,
            borderRadius: 18,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colorScheme === "dark" ? "#2C2C2E" : "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.2,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10002,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                color: "#2E8B57",
                fontWeight: "700",
                fontSize: 26,
                lineHeight: 28,
              }}
            >
              {routeData.duration}
            </Text>
            <Text
              style={{
                color: colorScheme === "dark" ? "#AFAFAF" : "#6B6B6F",
                fontWeight: "500",
                fontSize: 12,
                marginTop: 1,
              }}
            >
              {routeData.distance} • {routeData.eta}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleLocationPress}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#F2F2F7",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Recenter navigation"
            >
              <MaterialIcons name="my-location" size={18} color="#5F5F63" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEndNavigation}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#C83A32",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="End trip"
            >
              <MaterialIcons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/*Additional Building Info Popup*/}
      <AdditionalInfoPopup
        visible={selectedBuilding.visible && !showDirections}
        buildingId={selectedBuilding.name}
        campus={selectedBuilding.campus}
        onClose={handleClosePopup}
        onDirectionsTrigger={handleDirectionsTrigger}
        directionsEtaLabel={directionsEtaLabel}
      />

      <DestinationPopup
        visible={showDirections}
        onClose={handleCloseDestinationPopup}
      />

      {userLocation && (
        <TouchableOpacity
          onPress={handleLocationPress}
          activeOpacity={0.85}
          style={{
            position: "absolute",
            right: 16,
            top: recenterButtonTop,
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor:
              Platform.OS === "ios"
                ? "transparent"
                : colorScheme === "dark"
                  ? "#2C2C2E"
                  : "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.18 : 0.22,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10000,
          }}
          accessibilityRole="button"
          accessibilityLabel="Recenter to your location"
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={35}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}
          <MaterialIcons name="navigation" size={20} color="#B03060" />
        </TouchableOpacity>
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
