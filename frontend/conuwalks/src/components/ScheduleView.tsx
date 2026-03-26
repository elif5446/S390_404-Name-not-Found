import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import PlatformIcon from "./ui/PlatformIcon";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { CalendarEvent } from "@/src/api/calendarApi";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import {
  calculatePolygonCenter,
  distanceMetersBetween,
} from "@/src/utils/geometry";
import { parseLocation } from "@/src/hooks/useBuildingEvents";
import { LatLng } from "react-native-maps";

interface EnhancedEvent extends CalendarEvent {
  formattedDate?: string;
  formattedTime?: string;
  isToday?: boolean;
}

interface ScheduleViewProps {
  onNavigateToClass?: () => void;
}

const getBuildingCenter = (buildingCode: string): LatLng | null => {
  const geoData = SGWBuildingMetadata[buildingCode] ? SGW : LOY;
  const feature = geoData.features?.find(
    (item: any) => item.properties?.id === buildingCode,
  );

  if (feature?.geometry?.type === "Polygon" && feature.geometry.coordinates) {
    const polygonCoords = feature.geometry.coordinates[0];

    // Convert [longitude, latitude] to { latitude, longitude }
    const latLngCoords: LatLng[] = polygonCoords
      .filter((coord) => coord.length >= 2)
      .map((coord) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

    if (latLngCoords.length === 0) return null;

    let centerCoords = calculatePolygonCenter(latLngCoords);

    if (!centerCoords || Number.isNaN(centerCoords.latitude)) {
      let sumLat = 0,
        sumLng = 0;
      latLngCoords.forEach((coord) => {
        sumLat += coord.latitude;
        sumLng += coord.longitude;
      });
      centerCoords = {
        latitude: sumLat / latLngCoords.length,
        longitude: sumLng / latLngCoords.length,
      };
    }
    return centerCoords;
  }
  return null;
};

const NavigationButton = ({
  location,
  userLocation,
  onNavigate,
}: {
  location: string;
  userLocation: any;
  onNavigate: (loc: string) => void;
}) => {
  const parsed = parseLocation(location);
  const buildingCode = parsed?.buildingCode;

  const coords = useMemo(() => {
    if (!buildingCode) return null;
    return getBuildingCenter(buildingCode);
  }, [buildingCode]);

  // use a synchronous ETA calculation inside list items instead of making thrashing API calls
  const etaLabel = useMemo(() => {
    if (!userLocation || !coords) return "Dir";
    const walkingMetersPerSecond = 1.35;
    const meters = distanceMetersBetween(userLocation, coords);
    const minutes = Math.max(
      1,
      Math.round(meters / walkingMetersPerSecond / 60),
    );

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    return `${minutes} min`;
  }, [userLocation, coords]);

  return (
    <TouchableOpacity
      onPress={() => onNavigate(location)}
      style={{
        marginLeft: 12,
        padding: 10,
        backgroundColor: "#B03060",
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        minWidth: 80,
      }}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          width: 24,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 4,
        }}
      >
        <PlatformIcon
          materialName="subdirectory-arrow-right"
          iosName="arrow.turn.up.right"
          size={15}
          color="#B03060"
        />
      </View>
      <Text
        style={{
          color: "#FFF",
          fontWeight: "bold",
          marginLeft: 4,
          fontSize: 12,
        }}
      >
        {etaLabel}
      </Text>
    </TouchableOpacity>
  );
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass }) => {
  const mode = useColorScheme() || "light";
  const { events, loading, fetchUpcomingEvents } = useGoogleCalendar();
  const {
    setStartPoint,
    setDestination,
    setShowDirections,
    startCoords, // included for the auto-load fix
  } = useDirections();
  const { location: userLocation } = useUserLocation();

  const widgetBg = mode === "dark" ? "#000" : "#fff";
  const secondaryTextColor = mode === "dark" ? "#BBB" : "#555";

  // fix by forcing the global startCoords to update as soon as userLocation is found
  useEffect(() => {
    if (userLocation && !startCoords) {
      setStartPoint("USER", userLocation, "Your Location");
    }
  }, [userLocation, startCoords, setStartPoint]);

  // fix: empty dependency array explicitly prevents infinite fetching loops
  useEffect(() => {
    fetchUpcomingEvents(50);
  }, []);

  const handleGoToClass = useCallback(
    (location?: string) => {
      if (!location) return;

      const parsed = parseLocation(location);
      const buildingCode = parsed?.buildingCode;

      if (!buildingCode) return;

      const buildingMetadata =
        SGWBuildingMetadata[buildingCode] ||
        LoyolaBuildingMetadata[buildingCode];

      if (!buildingMetadata) return;

      const coordinates = getBuildingCenter(buildingCode);

      if (coordinates) {
        // safely check for userLocation so navigation still works even if GPS isn't ready
        if (userLocation) {
          setStartPoint("USER", userLocation, "Your Location");
        }

        setDestination(buildingCode, coordinates, buildingMetadata.name);
        setShowDirections(true);
        onNavigateToClass?.();
      }
    },
    [
      userLocation,
      setStartPoint,
      setDestination,
      setShowDirections,
      onNavigateToClass,
    ],
  );

  const groupedArray = useMemo(() => {
    const enhancedEvents: EnhancedEvent[] = events.map((event) => {
      const startStr = event.start?.dateTime || event.start?.date || "";
      const endStr = event.end?.dateTime || event.end?.date || "";

      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const eventDate = new Date(startDate);
      eventDate.setHours(0, 0, 0, 0);

      const isToday = eventDate.getTime() === today.getTime();
      const isTomorrow =
        eventDate.getTime() === new Date(today.getTime() + 86400000).getTime();

      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };

      let formattedDate = startDate.toLocaleDateString("en-US", options);
      if (isToday) formattedDate = "Today";
      else if (isTomorrow) formattedDate = "Tomorrow";

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      const startTime = event.start?.dateTime
        ? startDate.toLocaleTimeString("en-US", timeOptions)
        : "";
      const endTime = event.end?.dateTime
        ? endDate.toLocaleTimeString("en-US", timeOptions)
        : "";

      const formattedTime =
        startTime && endTime ? `${startTime} - ${endTime}` : startTime;

      return { ...event, formattedDate, formattedTime, isToday };
    });

    const groupedByDate = enhancedEvents.reduce<
      Record<string, EnhancedEvent[]>
    >((acc, event) => {
      const dateKey = event.formattedDate || "No Date";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    }, {});

    return Object.entries(groupedByDate).map(([date, items]) => ({
      date,
      events: items,
    }));
  }, [events]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#B03060" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: mode === "dark" ? "#121212" : "#F0F2F5",
      }}
    >
      {groupedArray.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: mode === "dark" ? "#fff" : "#333",
            }}
          >
            No Upcoming Events
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedArray}
          keyExtractor={(item) => item.date}
          renderItem={({ item: dateGroup }) => {
            const dateHeadingColor =
              dateGroup.date === "Today"
                ? "#B03060"
                : mode === "dark"
                  ? "#fff"
                  : "#333";
            return (
              <View key={dateGroup.date} style={{ paddingHorizontal: 16 }}>
                <Text
                  style={{
                    marginTop: 24,
                    marginBottom: 12,
                    fontSize: 18,
                    fontWeight: "800",
                    color: dateHeadingColor,
                  }}
                >
                  {dateGroup.date}
                </Text>

                {dateGroup.events.map((event) => (
                  <View
                    key={event.id}
                    style={{
                      backgroundColor: widgetBg,
                      borderLeftWidth: 6,
                      borderLeftColor: "#B03060",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      shadowColor: "#000",
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: mode === "dark" ? "#fff" : "#111",
                          flex: 1,
                        }}
                        numberOfLines={2}
                      >
                        {event.summary}
                      </Text>

                      {event.location && (
                        <NavigationButton
                          location={event.location}
                          userLocation={userLocation}
                          onNavigate={handleGoToClass}
                        />
                      )}
                    </View>

                    {event.formattedTime && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <MaterialIcons
                          name="access-time"
                          size={20}
                          color={secondaryTextColor}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 17,
                            color: secondaryTextColor,
                            fontWeight: "500",
                          }}
                        >
                          {event.formattedTime}
                        </Text>
                      </View>
                    )}

                    {event.location && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <MaterialIcons
                          name="place"
                          size={20}
                          color={secondaryTextColor}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 17,
                            color: secondaryTextColor,
                            fontWeight: "500",
                          }}
                          numberOfLines={1}
                        >
                          {event.location}
                        </Text>
                      </View>
                    )}

                    {event.description && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: mode === "dark" ? "#999" : "#777",
                          marginTop: 8,
                          fontStyle: "italic",
                        }}
                        numberOfLines={2}
                      >
                        {event.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleView;
