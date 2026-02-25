import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SFSymbol } from "expo-symbols";
import { styles } from "../styles/DestinationPopup";
import { DirectionStep } from "@/src/context/DirectionsContext";

const PlatformIcon = ({
  materialName,
  iosName,
  size,
  color,
}: {
  materialName: any;
  iosName: SFSymbol;
  size: number;
  color: string;
}) => {
  if (Platform.OS === "ios")
    return (
      <SymbolView
        name={iosName}
        size={size}
        weight="medium"
        tintColor={color}
      />
    );
  return <MaterialIcons name={materialName} size={size} color={color} />;
};

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
  onScroll: (e: any) => void;
}

const DestinationContent: React.FC<DestinationContentProps> = ({
  isDark,
  loading,
  error,
  routes,
  selectedRouteIndex,
  travelMode,
  navigationRouteId,
  transitSteps,
  getRouteTransitSummary,
  getTransitBadgeLabel,
  handleSelectRoute,
  handleStartNavigation,
  scrollViewRef,
  onScroll,
}) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={[styles.routeList, { flex: 1, maxHeight: "100%" }]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.centerInline}>
          <ActivityIndicator color="#B03060" />
          <Text style={{ color: isDark ? "#FFFFFF" : "#111111" }}>
            Loading routes...
          </Text>
        </View>
      ) : error ? (
        <Text style={{ color: "#FF4444" }}>{error}</Text>
      ) : routes.length > 0 ? (
        routes.map((route, index) => {
          const selected = index === selectedRouteIndex;
          const transitSummary = getRouteTransitSummary(route.steps || []);
          return (
            <TouchableOpacity
              key={route.id}
              onPress={() => handleSelectRoute(index)}
              accessible={false}
              style={[
                styles.routeCard,
                {
                  backgroundColor: isDark ? "#323235" : "#F8F8FA",
                  borderColor: selected
                    ? "#C48BA1"
                    : isDark
                      ? "#3F3F42"
                      : "#ECECEF",
                },
              ]}
            >
              <View style={{ flex: 1 }}>
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
                style={[
                  styles.startButton,
                  navigationRouteId === route.id && { opacity: 0.8 },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Start navigation for route ${index + 1}`}
              >
                <PlatformIcon
                  materialName="subdirectory-arrow-right"
                  iosName="arrow.turn.up.right"
                  size={14}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={{ color: isDark ? "#AFAFAF" : "#666666" }}>
          Select a destination to see available routes.
        </Text>
      )}

      {travelMode === "transit" && routes.length > 0 && (
        <View style={styles.transitSection}>
          <Text style={styles.transitSectionTitle}>Transit details</Text>
          {transitSteps.length > 0 ? (
            transitSteps.map((step, index) => {
              const lineLabel =
                step.transitLineShortName || step.transitLineName || "Transit";
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
                      <Text style={styles.transitTypeBadgeText}>
                        {vehicleLabel}
                      </Text>
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
            <Text style={{ color: isDark ? "#AFAFAF" : "#666666" }}>
              Detailed transit lines are not available for this route yet.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default memo(DestinationContent);
