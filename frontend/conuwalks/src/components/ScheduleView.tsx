import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGoogleCalendar } from "@/src/hooks/useGoogleCalendar";
import { useDirections } from "@/src/context/DirectionsContext";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import { CalendarEvent } from "@/src/api/calendarApi";
import { LoyolaBuildingMetadata } from "@/src/data/metadata/LOY.BuildingMetadata";
import { SGWBuildingMetadata } from "@/src/data/metadata/SGW.BuildingMetaData";
import SGW from "@/src/data/campus/SGW.geojson";
import LOY from "@/src/data/campus/LOY.geojson";
import { calculatePolygonCenter } from "@/src/utils/geometry";
import { parseLocation } from "@/src/hooks/useBuildingEvents";

interface EnhancedEvent extends CalendarEvent {
  formattedDate?: string;
  formattedTime?: string;
  isToday?: boolean;
}

interface ScheduleViewProps {
  onNavigateToClass?: () => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass }) => {
  const mode = useColorScheme() || "light";
  const { events, loading, error, fetchUpcomingEvents } = useGoogleCalendar();
  const { setStartPoint, setDestination, setShowDirections } = useDirections();
  const { location: userLocation } = useUserLocation();

  // Higher contrast widget background colors
  const widgetBg = mode === "dark" ? "#000" : "#fff";
  const secondaryTextColor = mode === "dark" ? "#BBB" : "#555";

  useEffect(() => {
    fetchUpcomingEvents(50);
  }, []);

  const handleGoToClass = (location?: string) => {
    if (!location || !userLocation) return;
    // reuse the parseLocation implementation from the hook
    const parsed = parseLocation(location);
    const buildingCode = parsed?.buildingCode;
    if (!buildingCode) return;

    const buildingMetadata =
      SGWBuildingMetadata[buildingCode] || LoyolaBuildingMetadata[buildingCode];
    if (!buildingMetadata) return;

    const geoData = SGWBuildingMetadata[buildingCode] ? SGW : LOY;
    const feature = geoData.features?.find(
      (item: any) => item.properties?.id === buildingCode,
    );

    if (feature?.geometry?.type === "Polygon" && feature.geometry.coordinates) {
      const polygonCoords = feature.geometry.coordinates[0];
      let coordinates = calculatePolygonCenter(polygonCoords);

      if (!coordinates || isNaN(coordinates.latitude)) {
        let sumLat = 0,
          sumLng = 0;
        polygonCoords.forEach((coord: [number, number]) => {
          sumLng += coord[0];
          sumLat += coord[1];
        });
        coordinates = {
          latitude: sumLat / polygonCoords.length,
          longitude: sumLng / polygonCoords.length,
        };
      }

      setStartPoint("USER", userLocation, "Your Location");
      setDestination(buildingCode, coordinates, buildingMetadata.name);
      setShowDirections(true);
      onNavigateToClass?.();
    }
  };

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

  const groupedArray = useMemo(() => {
    const groupedByDate = enhancedEvents.reduce<Record<string, EnhancedEvent[]>>(
      (acc, event) => {
        const dateKey = event.formattedDate || "No Date";
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
      },
      {},
    );

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
      {enhancedEvents.length === 0 ? (
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
          renderItem={({ item: dateGroup }) => (
            <View key={dateGroup.date} style={{ paddingHorizontal: 16 }}>
              <Text
                style={{
                  marginTop: 24,
                  marginBottom: 12,
                  fontSize: 18,
                  fontWeight: "800",
                  color:
                    dateGroup.date === "Today"
                      ? "#B03060"
                      : mode === "dark"
                        ? "#fff"
                        : "#333",
                }}
              >
                {dateGroup.date}
              </Text>

              {dateGroup.events.map((event) => (
                <View
                  key={event.id}
                  style={{
                    backgroundColor: widgetBg,
                    borderLeftWidth: 5,
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
                      <TouchableOpacity
                        onPress={() => handleGoToClass(event.location)}
                        style={{
                          marginLeft: 12,
                          padding: 10,
                          backgroundColor: "#B03060",
                          borderRadius: 25,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <MaterialIcons
                          name="directions"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text
                          style={{
                            color: "#FFF",
                            fontWeight: "bold",
                            marginLeft: 4,
                            fontSize: 12,
                          }}
                        >
                          GO
                        </Text>
                      </TouchableOpacity>
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
          )}
          contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleView;
