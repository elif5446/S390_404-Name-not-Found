import React, { memo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import PlatformIcon from "./ui/PlatformIcon";
import { DirectionStep } from "@/src/context/DirectionsContext";
import { styles } from "../styles/DestinationPopup";

interface DestinationContentProps {
  isDark: boolean;
  loading: boolean;
  error: string | null;
  routes: any[];
  selectedRouteIndex: number;
  travelMode: string;
  navigationRouteId: string | null;
  transitSteps: DirectionStep[];
  getRouteTransitSummary: (steps: DirectionStep[]) => string | null;
  getTransitBadgeLabel: (step: DirectionStep) => string;
  handleSelectRoute: (index: number) => void;
  handleStartNavigation: (routeId: string, index: number) => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// helper function
const RouteList = memo(
  ({
    routes,
    loading,
    error,
    isDark,
    selectedRouteIndex,
    handleSelectRoute,
    handleStartNavigation,
    navigationRouteId,
    getRouteTransitSummary,
    travelMode,
  }: any) => {
    if (loading) {
      return (
        <View style={styles.centerInline}>
          <ActivityIndicator color="#B03060" />
          <Text style={{ color: isDark ? "#FFFFFF" : "#111111" }}>Loading routes...</Text>
        </View>
      );
    }

    if (error) {
      return <Text style={{ color: "#FF4444" }}>{error}</Text>;
    }

    if (routes.length === 0) {
      return <Text style={{ color: isDark ? "#AFAFAF" : "#666666" }}>Select a destination to see available routes.</Text>;
    }

    return (
      <>
        {routes.map((route: any, index: number) => {
          const selected = index === selectedRouteIndex;
          const transitSummary = getRouteTransitSummary(route.steps || []);
          const unselectedBorderColor = isDark ? "#3F3F42" : "#ECECEF";
          const borderColor = selected ? "#C48BA1" : unselectedBorderColor;
          return (
            <TouchableOpacity
              key={route.id}
              onPress={() => handleSelectRoute(index)}
              style={[
                styles.routeCard,
                {
                  backgroundColor: isDark ? "#323235" : "#F8F8FA",
                  borderColor,
                },
              ]}
              testID={`route-card-${index}`}
            >
              <View style={{ flex: 1 }}>
                {route.isShuttle && (
                  <View style={styles.shuttleBadgeContainer}>
                    <View style={styles.shuttleBadgeIcon}>
                      <Text style={styles.shuttleBadgeLetter}>C</Text>
                    </View>
                    <Text style={styles.shuttleBadgeText}>Concordia Shuttle</Text>
                  </View>
                )}
                <Text style={styles.durationText}>{route.duration}</Text>
                <Text style={styles.etaText}>{route.eta}</Text>
                {travelMode === "transit" && !!transitSummary && (
                  <Text style={styles.routeTransitSummary} numberOfLines={1}>
                    {transitSummary}
                  </Text>
                )}
              </View>
              <Text style={styles.distanceText}>{route.distance}</Text>
              <TouchableOpacity
                onPress={() => handleStartNavigation(route.id, index)}
                style={[styles.startButton, navigationRouteId === route.id && { opacity: 0.8 }]}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Start navigation for route ${index + 1}`}
                accessibilityHint="Begins turn by turn navigation with this route"
                testID="navigate-button"
              >
                <PlatformIcon materialName="subdirectory-arrow-right" iosName="arrow.turn.up.right" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </>
    );
  },
);

RouteList.displayName = "RouteListl";

const DestinationContent: React.FC<DestinationContentProps> = props => {
  // extracting variables from props for the transit section
  const { travelMode, routes, transitSteps, isDark, getTransitBadgeLabel } = props;
  return (
    <ScrollView
      ref={props.scrollViewRef}
      onScroll={props.onScroll}
      scrollEventThrottle={16}
      style={[styles.routeList, { flex: 1, maxHeight: "100%" }]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <RouteList
        loading={props.loading}
        error={props.error}
        routes={props.routes}
        isDark={props.isDark}
        selectedRouteIndex={props.selectedRouteIndex}
        handleSelectRoute={props.handleSelectRoute}
        handleStartNavigation={props.handleStartNavigation}
        navigationRouteId={props.navigationRouteId}
        getRouteTransitSummary={props.getRouteTransitSummary}
        travelMode={props.travelMode}
      />

      {travelMode === "transit" && routes.length > 0 && (
        <View style={styles.transitSection}>
          <Text style={styles.transitSectionTitle}>Transit details</Text>
          {transitSteps.length > 0 ? (
            transitSteps.map((step, index) => {
              const lineLabel = step.transitLineShortName || step.transitLineName || "Transit";
              const vehicleLabel = getTransitBadgeLabel(step);
              const stopLabel =
                step.transitDepartureStop && step.transitArrivalStop
                  ? `${step.transitDepartureStop} → ${step.transitArrivalStop}`
                  : step.instruction;
              return (
                <View
                  key={`${lineLabel}-${index}`}
                  style={[
                    styles.transitCard,
                    {
                      backgroundColor: isDark ? "#323235" : "#F8F8FA",
                      borderColor: isDark ? "#3F3F42" : "#ECECEF",
                    },
                  ]}
                >
                  <View style={styles.transitCardHeader}>
                    <Text style={styles.transitLineName}>{lineLabel}</Text>
                    <View style={styles.transitTypeBadge}>
                      <Text style={styles.transitTypeBadgeText}>{vehicleLabel}</Text>
                    </View>
                  </View>
                  {!!step.transitHeadsign && (
                    <Text style={styles.transitHeadsign} numberOfLines={1}>
                      Toward {step.transitHeadsign}
                    </Text>
                  )}
                  <Text style={styles.transitStops} numberOfLines={2}>
                    {stopLabel}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: isDark ? "#AFAFAF" : "#666666" }}>Detailed transit lines are not available for this route yet.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default memo(DestinationContent);
