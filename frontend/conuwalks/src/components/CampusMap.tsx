import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import MapView, {
  LatLng,
  Circle,
  Region,
  Marker,
  PROVIDER_GOOGLE,
  Polygon,
  LongPressEvent,
} from "react-native-maps";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { SymbolView, SFSymbol } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CampusLabels from "@/src/components/campusLabels";
import RoutePolyline from "@/src/components/RoutePolyline";
import { CampusConfig } from "@/src/data/campus/campusConfig";
import AdditionalInfoPopup, {
  AdditionalInfoPopupHandle,
} from "./AdditionalInfoPopup";
import DestinationPopup, { DestinationPopupHandle } from "./DestinationPopup";

import { useUserLocation } from "@/src/hooks/useUserLocation";
import { useDirections } from "@/src/context/DirectionsContext";
import { calculatePolygonCenter } from "@/src/utils/geometry";
import { isPointInPolygon } from "@/src/utils/geo";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { INDOOR_DATA } from "@/src/data/indoorData";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "@/src/styles/BuildingTheme";
import IndoorMapOverlay from "./indoor/IndoorMapOverlay";
import styles from "@/src/styles/campusMap";

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
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};
const SELECTED_RING_OUTER = "#1C1C1E"; // charcoal (premium, works on all pastels)
const SELECTED_RING_INNER = "#FFFFFF";

const DESTINATION_RING = "#FFFFFF";

const SELECTED_OUTER_WIDTH = 10;
const SELECTED_INNER_WIDTH = 4;

const DESTINATION_OUTER_WIDTH = 8;
const DESTINATION_INNER_WIDTH = 4;
interface CampusMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
  onInfoPopupExpansionChange?: (isExpanded: boolean) => void;
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

interface PlatformIconProps {
  materialName: React.ComponentProps<typeof MaterialIcons>["name"];
  iosName: SFSymbol;
  size: number;
  color: string;
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

const PlatformIcon = ({
  materialName,
  iosName,
  size,
  color,
}: PlatformIconProps) => {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={iosName}
        size={size}
        weight="medium"
        tintColor={color}
      />
    );
  }
  return <MaterialIcons name={materialName} size={size} color={color} />;
};

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
  onInfoPopupExpansionChange,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() || "light";

  // Get user's location with permission handling
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
  } = useUserLocation();

  const INITIAL_DELTA = 0.008;

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
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
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
  const [selectedTransitStopKey, setSelectedTransitStopKey] = useState<
    string | null
  >(null);
  const [indoorBuildingId, setIndoorBuildingId] = useState<string | null>(null);
  const [isInfoPopupExpanded, setIsInfoPopupExpanded] = useState(false);
  const additionalInfoPopupRef = useRef<AdditionalInfoPopupHandle>(null);
  const destinationPopupRef = useRef<DestinationPopupHandle>(null);

  const handleInfoPopupExpansionChange = useCallback(
    (isExpanded: boolean) => {
      setIsInfoPopupExpanded(isExpanded);
      onInfoPopupExpansionChange?.(isExpanded);
    },
    [onInfoPopupExpansionChange],
  );

  // Calculate circle radius based on zoom level (longitudeDelta)
  // Larger longitudeDelta = zoomed out = bigger circle
  const circleRadius = Math.max(2.5, mapRegion.longitudeDelta * 2000);

  // Create a ref to the MapView so we can control it
  const mapRef = useRef<MapView>(null);
  const buildingMarkerRefs = useRef<
    Record<string, { showCallout?: () => void } | null>
  >({});
  const lastCameraUpdateAtRef = useRef(0);
  const ignoreNextMapPressRef = useRef(false);
  const lastBuildingPressAtRef = useRef(0);

  // Handle clicking on the location circle to zoom in
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

  // auto-pan when toggling campuses
  useEffect(() => {
    if (mapRef.current && initialLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        },
        500,
      );
    }
  }, [initialLocation]);

  // Handle building tap to show additional info and set destination
  const handleBuildingPress = useCallback(
    (buildingId: string, campus: "SGW" | "LOY", coords?: LatLng) => {
      ignoreNextMapPressRef.current = true;
      lastBuildingPressAtRef.current = Date.now();

      let coordinates = coords;
      if (!coordinates) {
        const sourceGeo = campus === "LOY" ? LOY : SGW;
        const feature = sourceGeo.features.find(
          (item) => (item as GeoJsonFeature).properties.id === buildingId,
        ) as GeoJsonFeature | undefined;

        if (feature && feature.geometry.type === "Polygon") {
          coordinates = calculatePolygonCenter(feature.geometry.coordinates[0]);
        } else {
          return;
        }
      }

      setIndoorBuildingId(null);
      setIsNavigationActive(false);
      setShowDirections(false);
      clearRouteData();

      setSelectedBuilding({
        name: buildingId,
        campus,
        coords: coordinates,
        visible: true,
      });

      const markerKey = `${campus}-${buildingId}`;
      requestAnimationFrame(() => {
        additionalInfoPopupRef.current?.collapse();
        buildingMarkerRefs.current[markerKey]?.showCallout?.();
      });

      const buildingMetadata =
        campus === "LOY"
          ? LoyolaBuildingMetadata[buildingId]
          : SGWBuildingMetadata[buildingId];

      if (buildingMetadata && coordinates) {
        setDestination(buildingId, coordinates, buildingMetadata.name);
      }
    },
    [setIsNavigationActive, setShowDirections, clearRouteData, setDestination],
  );

  const handleClosePopup = useCallback(() => {
    setIsInfoPopupExpanded(false);
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleMapLongPress = useCallback((e: LongPressEvent) => {
    const coordinate = e.nativeEvent.coordinate;

    const findBuildingId = (geojson: typeof SGW | typeof LOY) => {
      const feature = geojson.features.find((item) => {
        const currentFeature = item as GeoJsonFeature;
        if (currentFeature.geometry.type !== "Polygon") {
          return false;
        }

        const polygonCoords = polygonFromGeoJSON(
          currentFeature.geometry.coordinates[0],
        );
        return isPointInPolygon(coordinate, polygonCoords);
      });

      return (feature?.properties as { id?: string } | undefined)?.id ?? null;
    };

    const foundId = findBuildingId(SGW) || findBuildingId(LOY);

    if (foundId && INDOOR_DATA[foundId]) {
      setIndoorBuildingId(foundId);
      setSelectedBuilding((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastBuildingPressAtRef.current < 250) {
      return;
    }

    if (ignoreNextMapPressRef.current) {
      ignoreNextMapPressRef.current = false;
      return;
    }

    setSelectedTransitStopKey(null);
    additionalInfoPopupRef.current?.minimize();
    destinationPopupRef.current?.minimize();
  }, []);

  const handleMapPanDrag = useCallback(() => {
    if (Date.now() - lastBuildingPressAtRef.current < 200) return;
    additionalInfoPopupRef.current?.minimize();
    destinationPopupRef.current?.minimize();
  }, []);

  const directionsEtaLabel = useMemo(() => {
    if (!userLocation || !selectedBuilding.coords) {
      return "--";
    }

    const walkingMetersPerSecond = 1.35;
    const meters = distanceMetersBetween(userLocation, selectedBuilding.coords);
    const minutes = Math.max(
      1,
      Math.round(meters / walkingMetersPerSecond / 60),
    );

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours} h ${remainingMinutes} min`
        : `${hours} h`;
    }

    return `${minutes} min`;
  }, [userLocation, selectedBuilding.coords]);

  const handleOpenDirectionsPopup = useCallback(() => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
    setShowDirections(true);
  }, [setShowDirections]);

  const handleSetAsDestination = useCallback(() => {
    if (!selectedBuilding.name || !selectedBuilding.coords) return;

    const buildingMetadata =
      selectedBuilding.campus === "LOY"
        ? LoyolaBuildingMetadata[selectedBuilding.name]
        : SGWBuildingMetadata[selectedBuilding.name];

    if (!buildingMetadata) {
      return;
    }

    setDestination(
      selectedBuilding.name,
      selectedBuilding.coords,
      buildingMetadata.name,
    );
  }, [selectedBuilding, setDestination]);

  const handleDirectionsTrigger = useCallback(() => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
    handleSetAsDestination();

    if (userLocation) {
      setStartPoint("USER", userLocation, "Your Location");
    }

    handleOpenDirectionsPopup();
  }, [
    handleSetAsDestination,
    userLocation,
    setStartPoint,
    handleOpenDirectionsPopup,
  ]);

  const handleCloseDestinationPopup = useCallback(() => {
    setShowDirections(false);
  }, [setShowDirections]);

  const handleEndNavigation = useCallback(() => {
    setIsNavigationActive(false);
    setShowDirections(false);
    clearRouteData();
  }, [clearRouteData, setIsNavigationActive, setShowDirections]);

  const shouldUseLiveUserStart = startBuildingId === "USER" && !!userLocation;

  const routeStartLocation = shouldUseLiveUserStart
    ? userLocation
    : startCoords || userLocation || initialLocation;

  const activeInstruction =
    routeData?.steps?.[navigationStepIndex] || routeData?.steps?.[0];

  const activeInstructionDistanceMeters =
    userLocation && activeInstruction?.endLocation
      ? Math.round(
          distanceMetersBetween(userLocation, activeInstruction.endLocation),
        )
      : null;

  const recenterButtonTop =
    insets.top + (isNavigationActive && routeData ? 118 : 84);
  const isSheetVisibleForAccessibility =
    (selectedBuilding.visible && !showDirections) || showDirections;

  const modeLabelMap: Record<
    "walking" | "driving" | "transit" | "bicycling",
    string
  > = {
    walking: "Walking",
    driving: "Driving",
    transit: "Transit",
    bicycling: "Bicycling",
  };

  // Wrapped in useMemo to prevent dependency warning and unnecessary re-evaluations
  const transitNavigationStops = useMemo(() => {
    if (!(isNavigationActive && travelMode === "transit" && routeData?.steps)) {
      return [];
    }

    return routeData.steps
      .flatMap((step, index) => {
        const hasTransitMeta =
          !!step.transitLineName ||
          !!step.transitLineShortName ||
          !!step.transitVehicleType;
        if (!hasTransitMeta) {
          return [] as TransitStopMarker[];
        }

        const lineLabel =
          step.transitLineShortName || step.transitLineName || "Transit";
        const normalizedVehicle = (
          step.transitVehicleType || "Transit"
        ).toLowerCase();
        const vehicleLabel =
          normalizedVehicle.includes("subway") ||
          normalizedVehicle.includes("metro")
            ? "Metro"
            : normalizedVehicle.includes("bus") ||
                normalizedVehicle.includes("shuttle")
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
          (item): item is TransitStopMarker => Boolean(item),
        );
      })
      .filter((item) => item.stepIndex >= navigationStepIndex)
      .slice(0, 4);
  }, [isNavigationActive, travelMode, routeData?.steps, navigationStepIndex]);

  const selectedTransitStop =
    transitNavigationStops.find(
      (stop) => stop.key === selectedTransitStopKey,
    ) || null;

  useEffect(() => {
    if (showDirections) {
      setSelectedBuilding((previousState) =>
        previousState.visible
          ? { ...previousState, visible: false }
          : previousState,
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
      !transitNavigationStops.some(
        (stop) => stop.key === selectedTransitStopKey,
      )
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
      Math.min(previousIndex, Math.max(0, routeData.steps.length - 1)),
    );
  }, [showDirections, isNavigationActive, routeData?.id, routeData]);

  useEffect(() => {
    if (
      !(showDirections || isNavigationActive) ||
      !routeData ||
      !userLocation ||
      !routeData.steps ||
      routeData.steps.length === 0
    ) {
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

    const metersToStepEnd = distanceMetersBetween(
      userLocation,
      currentStep.endLocation,
    );
    if (
      metersToStepEnd <= arrivalThresholdByMode[travelMode] &&
      navigationStepIndex < routeData.steps.length - 1
    ) {
      setNavigationStepIndex((previousIndex) =>
        Math.min(previousIndex + 1, routeData.steps.length - 1),
      );
    }
  }, [
    showDirections,
    isNavigationActive,
    routeData,
    navigationStepIndex,
    travelMode,
    userLocation,
  ]);

  useEffect(() => {
    if (
      !isNavigationActive ||
      !shouldUseLiveUserStart ||
      !userLocation ||
      !mapRef.current
    ) {
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
      },
    );
  }, [
    showDirections,
    isNavigationActive,
    shouldUseLiveUserStart,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

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

          const isSelected =
            selectedBuilding.visible && selectedBuilding.name === buildingId;
          const isDestination = destinationBuildingId === buildingId;
          const hasSelection = selectedBuilding.visible && !!selectedBuilding.name;
          const dimOthers = hasSelection && !isSelected; // dim everything except selected
          // Calculate center point of building for directions
          const centerCoordinates = calculatePolygonCenter(coordinates);
          const markerKey = `${campus}-${buildingId}`;

          
return (
  <React.Fragment key={buildingId}>
    {}
    <Polygon
      key={`${campus}-${buildingId}-base`}
      coordinates={coordinates}
      fillColor={
        isSelected
          ? color + "F0"
          : isDestination
            ? color + "C8"
            : dimOthers
              ? color + "55"
              : color + "90"
      }
      strokeColor={
        isSelected
          ? "rgba(0,0,0,0.20)"
          : "rgba(0,0,0,0.12)"
      }
      strokeWidth={1}
      tappable
      onPress={() => handleBuildingPress(buildingId, campus, centerCoordinates)}
      accessibilityLabel={name}
      accessibilityRole="button"
      zIndex={3}
    />

    {}
    {isSelected && (
      <>
        <Polygon
          key={`${campus}-${buildingId}-selected`}
          coordinates={coordinates}
          fillColor="transparent"
          strokeColor="#1C1C1E"
          strokeWidth={5}
          tappable
          onPress={() =>
            handleBuildingPress(buildingId, campus, centerCoordinates)
          }
          zIndex={5}
        />
      </>
    )}

    {}
    {isDestination && !isSelected && (
      <Marker
        key={`${campus}-${buildingId}-dest-pin`}
        coordinate={centerCoordinates}
        anchor={{ x: 0.5, y: 1 }}
        zIndex={1000}
        onPress={() =>
          handleBuildingPress(buildingId, campus, centerCoordinates)
        }
        accessibilityLabel={`${name} destination`}
        accessibilityRole="button"
      >
        <MaterialIcons name="place" size={26} color="#B03060" />
      </Marker>
    )}


              <Marker
                ref={(markerRef) => {
                  buildingMarkerRefs.current[markerKey] = markerRef as {
                    showCallout?: () => void;
                  } | null;
                }}
                coordinate={centerCoordinates}
                onPress={() =>
                  handleBuildingPress(buildingId, campus, centerCoordinates)
                }
                zIndex={200}
                tracksViewChanges={true}
                title={name}
                importantForAccessibility="yes"
                accessibilityLabel={name}
                accessibilityRole="button"
                accessibilityHint="Tap to view details"
              >
                <View
                  style={{
                    width: 0.3 / mapRegion.longitudeDelta,
                    height: 0.3 / mapRegion.longitudeDelta,
                    backgroundColor: "#FFFFFF",
                    opacity: 0.01,
                  }}
                  collapsable={false}
                  importantForAccessibility="yes"
                  accessible={true}
                  accessibilityLabel={name}
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
  }, [
    destinationBuildingId,
    handleBuildingPress,
    mapRegion.longitudeDelta,
    selectedBuilding.name,
    selectedBuilding.visible,
  ]);

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
        initialRegion={{
          ...initialLocation,
          latitudeDelta: INITIAL_DELTA,
          longitudeDelta: INITIAL_DELTA,
        }}
        onRegionChangeComplete={setMapRegion} // update state only when drag ends
        onLongPress={handleMapLongPress}
        onPress={handleMapPress}
        onPanDrag={handleMapPanDrag}
        tintColor="#FF2D55"
        pitchEnabled={false} // no 3d
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        showsPointsOfInterest={false}
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        showsUserLocation={false}
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        loadingEnabled
        rotateEnabled={false}
        accessibilityElementsHidden={isSheetVisibleForAccessibility}
        importantForAccessibility={
          isSheetVisibleForAccessibility ? "no-hide-descendants" : "yes"
        }
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
              longitudeDelta={mapRegion.longitudeDelta}
              onLabelPress={(buildingId) =>
                handleBuildingPress(buildingId, campus)
              }
            />
          ),
        )}

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
            zIndex={9999}
            title={"Current Location"}
            accessibilityLabel={"Current Location"}
            importantForAccessibility="yes"
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#B03060",
              }}
              accessible={true}
              accessibilityLabel={"Current Location"}
              importantForAccessibility="yes"
            />
          </Marker>
        )}

        <RoutePolyline startLocation={routeStartLocation} />

        {transitNavigationStops.map((stop) => (
          <Marker
            key={stop.key}
            coordinate={stop.coordinate}
            onPress={() => {
              setSelectedTransitStopKey((previousKey) =>
                previousKey === stop.key ? null : stop.key,
              );
            }}
            tracksViewChanges={false}
            zIndex={1002}
            accessibilityLabel={stop.title}
            accessibilityHint={stop.description}
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
                borderColor:
                  selectedTransitStopKey === stop.key ? "#FFFFFF" : "#F2F2F7",
              }}
            >
              <PlatformIcon
                materialName={stop.iconName}
                iosName={stop.iconName === "subway" ? "tram.fill" : "bus.fill"}
                size={16}
                color="#FFFFFF"
              />
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#B03060",
                fontWeight: "700",
                fontSize: 14,
                flex: 1,
                paddingRight: 8,
              }}
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
              <MaterialIcons
                name="close"
                size={16}
                color={colorScheme === "dark" ? "#F2F2F7" : "#1C1C1E"}
              />
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
            backgroundColor:
              Platform.OS === "ios"
                ? "transparent"
                : colorScheme === "dark"
                  ? "#2C2C2E"
                  : "#FFFFFF",
            borderWidth: Platform.OS === "ios" ? 1 : 0,
            borderColor:
              colorScheme === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.2,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10002,
            overflow: "hidden",
          }}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`${modeLabelMap[travelMode]} navigation. ${routeData.duration}, ${routeData.distance}. ${activeInstruction?.instruction || "Continue on current route"}`}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={35}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text
            style={{
              color: "#B03060",
              fontWeight: "700",
              fontSize: 14,
            }}
            numberOfLines={1}
          >
            {modeLabelMap[travelMode]} • {routeData.duration} •{" "}
            {routeData.distance}
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
              Next in{" "}
              {activeInstructionDistanceMeters !== null
                ? `${activeInstructionDistanceMeters} m`
                : activeInstruction.distance}
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
            backgroundColor:
              Platform.OS === "ios"
                ? "transparent"
                : colorScheme === "dark"
                  ? "#2C2C2E"
                  : "#FFFFFF",
            borderWidth: Platform.OS === "ios" ? 1 : 0,
            borderColor:
              colorScheme === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.2,
            shadowRadius: 4,
            elevation: Platform.OS === "ios" ? 0 : 4,
            zIndex: 10002,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
          accessible={false}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={35}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View>
            <Text
              style={{
                color: "#B03060",
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
              onPress={handleEndNavigation}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#C83A32",
                alignItems: "center",
                justifyContent: "center",
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="End trip"
              accessibilityHint="Ends active navigation and closes route guidance"
            >
              <PlatformIcon
                materialName="close"
                iosName="xmark"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {indoorBuildingId && INDOOR_DATA[indoorBuildingId] && (
        <IndoorMapOverlay
          buildingData={INDOOR_DATA[indoorBuildingId]}
          onExit={() => setIndoorBuildingId(null)}
        />
      )}

      {!indoorBuildingId && (
        <AdditionalInfoPopup
          ref={additionalInfoPopupRef}
          visible={selectedBuilding.visible && !showDirections}
          buildingId={selectedBuilding.name}
          campus={selectedBuilding.campus}
          onClose={handleClosePopup}
          onDirectionsTrigger={handleDirectionsTrigger}
          directionsEtaLabel={directionsEtaLabel}
          onExpansionChange={handleInfoPopupExpansionChange}
        />
      )}

      <DestinationPopup
        ref={destinationPopupRef}
        visible={showDirections}
        onClose={handleCloseDestinationPopup}
      />

      {userLocation && !indoorBuildingId && !isInfoPopupExpanded && (
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
          accessibilityHint="Moves the map camera back to your current location"
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={35}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}
          <PlatformIcon
            materialName="navigation"
            iosName="location.north.fill"
            size={20}
            color="#B03060"
          />
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
