import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
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

  useEffect(() => {
    fetchUpcomingEvents(50);
    // Only fetch once on component mount
  }, []);

  // Handle Go to Class button press
  const handleGoToClass = (location?: string) => {
    if (!location || !userLocation) {
      console.log("Missing location or userLocation:", { location, userLocation });
      return;
    }

    // Parsing building code from location
    const buildingCode = location.split(" ")[0]?.trim();
    if (!buildingCode) {
      console.log("Could not parse building code from:", location);
      return;
    }

    // Try to find the building in both campuses
    const buildingMetadata =
      SGWBuildingMetadata[buildingCode] ||
      LoyolaBuildingMetadata[buildingCode];

    if (!buildingMetadata) {
      console.log("Building not found in metadata:", buildingCode);
      return;
    }

    // Determine which campus
    const geoData = SGWBuildingMetadata[buildingCode] ? SGW : LOY;

    // Find building from geojson
    const feature = geoData.features?.find(
      (item: any) => item.properties?.id === buildingCode,
    );

    if (!feature) {
      console.log("Feature not found in geojson:", buildingCode);
      return;
    }

    if (feature.geometry?.type === "Polygon" && feature.geometry.coordinates) {
      const polygonCoords = feature.geometry.coordinates[0];

      if (!polygonCoords || polygonCoords.length === 0) {
        console.log("Empty polygon coordinates:", polygonCoords);
        return;
      }

      // Calculate center manually if calculatePolygonCenter fails
      let coordinates = calculatePolygonCenter(polygonCoords);

      if (!coordinates || isNaN(coordinates.latitude) || isNaN(coordinates.longitude)) {
        console.log("calculatePolygonCenter returned invalid coords, computing manually");
        // Manual calculation: average of all coordinates
        let sumLat = 0, sumLng = 0;
        polygonCoords.forEach((coord: [number, number]) => {
          sumLng += coord[0];
          sumLat += coord[1];
        });
        coordinates = {
          latitude: sumLat / polygonCoords.length,
          longitude: sumLng / polygonCoords.length,
        };
      }

      if (coordinates && !isNaN(coordinates.latitude) && !isNaN(coordinates.longitude)) {
        console.log("Navigating to:", buildingCode, coordinates);
        // Set start point (user location)
        setStartPoint("USER", userLocation, "Your Location");
        // Set destination building
        setDestination(buildingCode, coordinates, buildingMetadata.name);
        // Show directions popup
        setShowDirections(true);
        // Switch to map view
        onNavigateToClass?.();
      } else {
        console.log("Invalid coordinates:", coordinates);
      }
    }
  };


  // Format dates and enhance events
  const enhancedEvents: EnhancedEvent[] = events.map((event) => {
    const startStr = event.start?.dateTime || event.start?.date || "";
    const startDate = new Date(startStr);
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
    const formattedTime = event.start?.dateTime
      ? startDate.toLocaleTimeString("en-US", timeOptions)
      : "";

    return {
      ...event,
      formattedDate,
      formattedTime,
      isToday,
    };
  });

  // Group events by date
  const groupedByDate = enhancedEvents.reduce<
    Record<string, EnhancedEvent[]>
  >((acc, event) => {
    const dateKey = event.formattedDate || "No Date";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const groupedArray = Object.entries(groupedByDate).map(([date, items]) => ({
    date,
    events: items,
  }));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: mode === "dark" ? "#000" : "#fff",
        }}
      >
        <Text
          style={{
            color: mode === "dark" ? "#ff6b6b" : "#c92a2a",
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          Error loading schedule
        </Text>
        <Text
          style={{
            color: mode === "dark" ? "#ccc" : "#555",
            fontSize: 14,
            marginTop: 8,
          }}
        >
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: mode === "dark" ? "#000" : "#fff",
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
              marginBottom: 8,
            }}
          >
            No Upcoming Events
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: mode === "dark" ? "#ccc" : "#666",
              textAlign: "center",
            }}
          >
            You don't have any scheduled events in the coming days.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedArray}
          keyExtractor={(item) => item.date}
          renderItem={({ item: dateGroup }) => (
            <View key={dateGroup.date} style={{ paddingHorizontal: 16 }}>
              {/* Date Header */}
              <Text
                style={{
                  marginTop: 24,
                  marginBottom: 12,
                  fontSize: 16,
                  fontWeight: "700",
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

              {/* Events for this date */}
              {dateGroup.events.map((event) => (
                <View
                  key={event.id}
                  style={{
                    backgroundColor:
                      mode === "dark" ? "#1a1a1a" : "#f8f9fa",
                    borderLeftWidth: 4,
                    borderLeftColor: "#B03060",
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  {/* Event Title + Go to Class Button */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
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
                          marginLeft: 8,
                          padding: 6,
                          backgroundColor: "#B03060",
                          borderRadius: 6,
                        }}
                        accessible={true}
                        accessibilityLabel="Go to class location"
                        accessibilityRole="button"
                      >
                        <MaterialIcons
                          name="directions"
                          size={18}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Time */}
                  {event.formattedTime && (
                    <Text
                      style={{
                        fontSize: 13,
                        color: mode === "dark" ? "#aaa" : "#666",
                        marginBottom: 6,
                      }}
                    >
                      Time: {event.formattedTime}
                    </Text>
                  )}

                  {/* Location */}
                  {event.location && (
                    <Text
                      style={{
                        fontSize: 13,
                        color: mode === "dark" ? "#aaa" : "#666",
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                    >
                      Location: {event.location}
                    </Text>
                  )}

                  {/* Description (if available) */}
                  {event.description && (
                    <Text
                      style={{
                        fontSize: 12,
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
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleView;

