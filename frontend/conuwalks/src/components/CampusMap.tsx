import CampusPolygons from "@/src/components/polygons";
import CampusLabels from "@/src/components/campusLabels";
import { CampusConfig } from "@/src/data/campus/campusConfig";

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from "react-native";
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
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import BuildingTheme from "@/src/styles/BuildingTheme";
import AdditionalInfoPopup, {AdditionalInfoPopupHandle} from "./AdditionalInfoPopup";

// Convert GeoJSON coordinates to LatLng
const polygonFromGeoJSON = (coordinates: number[][]): LatLng[] =>
  coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

interface CampusMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

const popupRef = useRef<AdditionalInfoPopupHandle>(null);

const CampusMap: React.FC<CampusMapProps> = ({
  initialLocation = { latitude: 45.49599, longitude: -73.57854 },
}) => {
  const {
    location: userLocation,
    error: locationError,
    loading: locationLoading,
  } = useUserLocation();

  const mapCenter = userLocation || initialLocation;

  const [mapRegion, setMapRegion] = useState<Region>({
    ...mapCenter,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
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

  const circleRadius = Math.max(2.5, mapRegion.longitudeDelta * 2000);
  const mapRef = useRef<MapView>(null);

  const handleLocationPress = () => {
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
  };

  const handleBuildingPress = (buildingName: string, campus: "SGW" | "LOY") => {
    setSelectedBuilding({
      name: buildingName,
      campus,
      visible: true,
    });
  };

  const handleClosePopup = () => {
    setSelectedBuilding((prev) => ({ ...prev, visible: false }));
  };

  const mapID =
    useColorScheme() === "dark"
      ? "eb0ccd6d2f7a95e23f1ec398"
      : "eb0ccd6d2f7a95e117328051";

  const renderPolygons = (
    geojson: typeof SGW | typeof LOY,
    campus: "SGW" | "LOY",
  ) =>
    geojson.features.map((feature) => {
      if (feature.geometry.type !== "Polygon") return null;

      const coordinates = polygonFromGeoJSON(feature.geometry.coordinates[0]);
      const buildingId = feature.properties.id;
      const properties = feature.properties as { id: string };

      const color =
        BuildingTheme[campus][
          properties.id as keyof (typeof BuildingTheme)[typeof campus]
        ] || "#888888";
      const buildingMetadata =
        campus === "LOY"
          ? LoyolaBuildingMetadata[properties.id]
          : SGWBuildingMetadata[properties.id];

      return (
      <React.Fragment key={`group-${buildingId}`}>
        <Polygon
          key={properties.id}
          coordinates={coordinates}
          fillColor={color + "90"}
          strokeColor={color}
          strokeWidth={1}
          tappable
          onPress={() => handleBuildingPress(properties.id, campus)}
          importantForAccessibility="no-hide-descendants"
          zIndex={1}
        />

        <Marker
          coordinate={getCentroid(coordinates)}
          onPress={() => handleBuildingPress(buildingId, campus)}
          zIndex={200}
          tracksViewChanges={true}
          title={buildingMetadata?.name || buildingId}
          importantForAccessibility="yes"
          accessibilityLabel={buildingMetadata?.name || buildingId}
          accessibilityRole="button"
          accessibilityHint="Tap to view details"
        >
          <View
            style={{
              width: 0.3/mapRegion.longitudeDelta,
              height: 0.3/mapRegion.longitudeDelta,
              backgroundColor: 'white', 
              opacity: 0.01 
            }}
            collapsable={false}
            importantForAccessibility="yes"
            accessible={true}
            accessibilityLabel={buildingMetadata?.name || buildingId}
            accessibilityRole="button"
            accessibilityHint="Tap to view details"
          >
            {Platform.OS === 'android' && (
              <Text style={{ width: 1, height: 1, opacity: 0 }}> </Text>
            )}
          </View>
        </Marker>
      </React.Fragment>
      );
    });

  const getCentroid = (coords: LatLng[]): LatLng => { 
    const lat = coords.reduce((s, c) => s + c.latitude, 0)/coords.length;
    const lng = coords.reduce((s, c) => s + c.longitude, 0)/coords.length;
    return { latitude: lat, longitude: lng };
  };

  return (
    <View style={styles.container}>
      <MapView
        key={mapID}
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        googleMapId={Platform.OS === "android" ? mapID : undefined}
        style={styles.map}
        pitchEnabled={false}
        maxDelta={0}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        showsPointsOfInterest={false}
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        tintColor="#FF2D55"
        region={{
          ...initialLocation,
          latitudeDelta: 0.0043,
          longitudeDelta: 0.0043,
        }}
        onRegionChange={setMapRegion}
        //The popup will go down (to 300px view) if user interacts with the map
        onPress={() => popupRef.current?.collapse()}
        onPanDrag={() => selectedBuilding.visible && popupRef.current?.collapse()}
      >
        {(Object.keys(CampusConfig) as Array<keyof typeof CampusConfig>).map(
          (campus) => (
            <CampusPolygons
              key={`poly-${campus}`}
              campus={campus}
              geojson={CampusConfig[campus].geojson}
              metadata={CampusConfig[campus].metadata}
            />
        ))}

        {renderPolygons(SGW, "SGW")}
        {renderPolygons(LOY, "LOY")}

        {(Object.keys(CampusConfig) as Array<keyof typeof CampusConfig>).map(campus => (
          <CampusLabels
            key={`label-${campus}`}
            campus={campus}
            data={CampusConfig[campus].labels}
            longitudeDelta={mapRegion.longitudeDelta}
          />
        ))}

        {userLocation && (
          <Circle
            center={userLocation}
            radius={circleRadius}
            fillColor="#B03060BF"
            strokeColor="#FFFFFF"
            strokeWidth={2}
            zIndex={9998}
            importantForAccessibility="no"
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
                borderRadius: 6,
                backgroundColor: "#B03060"
              }}
              accessible={true}
              accessibilityLabel={"Current Location"}
              importantForAccessibility="yes"
            />
          </Marker>
        )}
      </MapView>

      <AdditionalInfoPopup
        ref={popupRef}
        visible={selectedBuilding.visible}
        buildingId={selectedBuilding.name}
        campus={selectedBuilding.campus}
        onClose={handleClosePopup}
      />

      {locationLoading && (
        <View style={{ position: "absolute", top: 20, right: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {locationError && (
        <View style={{ position: "absolute", top: 20, left: 20, right: 20, backgroundColor: "#fff", padding: 10, borderRadius: 5 }}>
          <Text style={{ color: "#B03060", fontSize: 12 }}>{locationError}</Text>
        </View>
      )}
    </View>
  );
};

export default CampusMap;