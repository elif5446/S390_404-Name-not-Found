// ScheduleSection.tsx
import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BuildingEvent } from "../hooks/useBuildingEvents";
import scheduleStyles from "../styles/scheduleSection";

interface ScheduleSectionProps {
  eventsLoading: boolean;
  todayEvents: BuildingEvent[];
  nextEvent: BuildingEvent | null;
  campusPink: string;
  directionsEtaLabel?: string;
  onDirectionsPress: () => void;
  mode: "light" | "dark";
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  eventsLoading,
  todayEvents,
  nextEvent,
  campusPink,
  directionsEtaLabel,
  onDirectionsPress,
  mode,
}) => {
  const renderDirectionButton = (eventName?: string) => (
    <TouchableOpacity
      onPress={onDirectionsPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        backgroundColor: campusPink,
        paddingVertical: 4,
        paddingHorizontal: 7,
        gap: 5,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Directions to ${eventName || "class"}, ${directionsEtaLabel || "--"}`}
      accessibilityHint="Opens directions panel"
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons
          name="subdirectory-arrow-right"
          size={12}
          color={campusPink}
        />
      </View>
      <Text
        style={{
          color: "#FFFFFF",
          fontWeight: "700",
          fontSize: 12,
          lineHeight: 14,
        }}
      >
        {directionsEtaLabel || "--"}
      </Text>
    </TouchableOpacity>
  );

  const renderSchedule = (event: BuildingEvent, showDate: boolean = false) => (
    <View style={scheduleStyles.eventContent}>
      <Text
        style={[
          scheduleStyles.eventTitle,
          { color: mode === "dark" ? "#FFFFFF" : "#333333" },
        ]}
      >
        {event.courseName}
      </Text>
      <View style={scheduleStyles.eventDetailsRow}>
        <Text
          style={[
            scheduleStyles.eventTime,
            { color: mode === "dark" ? "#CCCCCC" : "#585858" },
          ]}
        >
          {showDate ? (
            <>
              {event.start.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}{" "}
              at{" "}
              {event.start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          ) : (
            <>
              {event.start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {event.end.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          )}
        </Text>
        {event.roomNumber && (
          <Text
            style={[
              scheduleStyles.eventRoom,
              { color: mode === "dark" ? "#CCCCCC" : "#585858" },
            ]}
          >
            Room {event.roomNumber}
          </Text>
        )}
      </View>
    </View>
  );

  const renderScheduleItem = (
    event: BuildingEvent,
    showDate: boolean = false,
    showBorder: boolean = false,
  ) => (
    <View
      style={[
        scheduleStyles.eventItemWithButton,
        showBorder && scheduleStyles.eventItemBorder,
      ]}
    >
      {renderSchedule(event, showDate)}
      {renderDirectionButton(event.courseName)}
    </View>
  );

  if (eventsLoading) {
    return (
      <View style={scheduleStyles.section}>
        <View style={scheduleStyles.scheduleHeader}>
          <Text
            style={[
              scheduleStyles.sectionTitle,
              { color: mode === "dark" ? "#FFFFFF" : "#333333" },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Schedule
          </Text>
          <ActivityIndicator size="small" color="#666666" />
        </View>
      </View>
    );
  }

  if (todayEvents.length === 0) {
    return (
      <View style={scheduleStyles.section}>
        <View style={scheduleStyles.scheduleHeader}>
          <Text
            style={[
              scheduleStyles.sectionTitle,
              { color: mode === "dark" ? "#FFFFFF" : "#333333" },
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            Schedule
          </Text>
        </View>
        <View style={scheduleStyles.noEventsContainer}>
          <Text
            style={[
              scheduleStyles.noEventsText,
              { color: mode === "dark" ? "#999999" : "#666666" },
            ]}
          >
            No classes scheduled in this building today
          </Text>
          {nextEvent && (
            <>
              <Text
                style={[
                  scheduleStyles.nextEventLabel,
                  {
                    color: mode === "dark" ? "#CCCCCC" : "#585858",
                    marginTop: 12,
                  },
                ]}
              >
                Next class in this building:
              </Text>
              {renderScheduleItem(nextEvent, true)}
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={scheduleStyles.section}>
      <View style={scheduleStyles.scheduleHeader}>
        <Text
          style={[
            scheduleStyles.sectionTitle,
            { color: mode === "dark" ? "#FFFFFF" : "#333333" },
          ]}
          accessible={true}
          accessibilityRole="header"
        >
          Schedule
        </Text>
      </View>
      <View style={scheduleStyles.eventsList}>
        {todayEvents.map((event: BuildingEvent, index: number) => (
          <View key={event.id}>
            {renderScheduleItem(event, false, index < todayEvents.length - 1)}
          </View>
        ))}
      </View>
    </View>
  );
};

export default ScheduleSection;
