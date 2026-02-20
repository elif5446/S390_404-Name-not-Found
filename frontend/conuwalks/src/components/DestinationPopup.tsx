import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SFSymbol } from "expo-symbols";
import { BlurView } from "expo-blur";
import { DirectionStep, useDirections } from "@/src/context/DirectionsContext";
import { getDirections } from "@/src/api/directions";

interface DestinationPopupProps {
  visible: boolean;
  onClose: () => void;
}

interface PlatformIconProps {
  materialName: React.ComponentProps<typeof MaterialIcons>["name"];
  iosName: SFSymbol;
  size: number;
  color: string;
}

const DestinationPopup: React.FC<DestinationPopupProps> = ({
  visible,
  onClose,
}) => {
  const campusPink = "#B03060";
  const mode = useColorScheme() || "light";
  const isDark = mode === "dark";

  const PlatformIcon = ({ materialName, iosName, size, color }: PlatformIconProps) => {
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

  const {
    routes,
    selectedRouteIndex,
    setSelectedRouteIndex,
    routeData,
    setRouteData,
    clearRouteData,
    loading,
    error,
    travelMode,
    setTravelMode,
    destinationBuildingId,
    destinationCoords,
    startBuildingId,
    startCoords,
    setIsNavigationActive,
  } = useDirections();

  const [navigationRouteId, setNavigationRouteId] = useState<string | null>(null);
  const [modeDurationCache, setModeDurationCache] = useState<
    Partial<Record<"walking" | "driving" | "transit" | "bicycling", string>>
  >({});
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const dragStartRef = useRef(0);
  const dismissDistance = Dimensions.get("window").height * 0.45;

  const routeScopeKey = `${startBuildingId ?? "-"}->${destinationBuildingId ?? "-"}`;

  const getTransitBadgeLabel = (step: DirectionStep): string => {
    if (step.transitVehicleType) {
      const normalized = step.transitVehicleType.toLowerCase();
      if (normalized.includes("subway") || normalized.includes("metro")) {
        return "Metro";
      }
      if (normalized.includes("bus") || normalized.includes("shuttle")) {
        return "Bus";
      }
      return step.transitVehicleType;
    }
    return "Transit";
  };

  const getRouteTransitSummary = (steps: DirectionStep[]): string | null => {
    const labels = steps
      .filter(
        (step) =>
          step.transitLineShortName ||
          step.transitLineName ||
          step.transitVehicleType
      )
      .map((step) => {
        const rawVehicle = (step.transitVehicleType || "Transit").toLowerCase();
        const vehicleLabel =
          rawVehicle.includes("subway") || rawVehicle.includes("metro")
            ? "Metro"
            : rawVehicle.includes("bus") || rawVehicle.includes("shuttle")
              ? "Bus"
              : "Transit";

        const lineLabel = (step.transitLineShortName || step.transitLineName || "").trim();
        return lineLabel ? `${vehicleLabel} ${lineLabel}` : vehicleLabel;
      });

    if (labels.length === 0) {
      return null;
    }

    const compressedLabels = labels.filter((label, index) => {
      if (index === 0) {
        return true;
      }
      return label !== labels[index - 1];
    });

    return compressedLabels.join(" → ");
  };

  const selectedRoute = routes[selectedRouteIndex] || routeData;
  const transitSteps = (selectedRoute?.steps || []).filter(
    (step) =>
      step.transitLineName ||
      step.transitLineShortName ||
      step.transitDepartureStop ||
      step.transitArrivalStop ||
      step.transitHeadsign
  );

  const formatMinutes = (minutes: number): string => {
    const rounded = Math.max(1, Math.round(minutes));
    if (rounded >= 60) {
      const hours = Math.floor(rounded / 60);
      const remainingMinutes = rounded % 60;
      return remainingMinutes > 0
        ? `${hours} h ${remainingMinutes} min`
        : `${hours} h`;
    }
    return `${rounded} min`;
  };

  const normalizeDurationLabel = (value: string): string => {
    const lower = value.toLowerCase();

    if (lower.includes("h") || lower.includes("hour")) {
      const hourMatch = lower.match(/(\d+)\s*h/);
      const minuteMatch = lower.match(/(\d+)\s*(min|mins|minute|minutes)/);
      const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
      const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0;
      return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
    }

    const minuteMatch = lower.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (minuteMatch) {
      const minutes = Number.parseInt(minuteMatch[1], 10);
      return formatMinutes(minutes);
    }

    return value;
  };

  useEffect(() => {
    setModeDurationCache({});
    setNavigationRouteId(null);
  }, [routeScopeKey]);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.setValue(0);
    }
  }, [visible, sheetTranslateY]);

  useEffect(() => {
    const activeRoute = routes[selectedRouteIndex] || routeData;
    if (!activeRoute) {
      return;
    }

    const normalizedDuration = normalizeDurationLabel(activeRoute.duration);
    setModeDurationCache((previousCache) => {
      if (previousCache[travelMode] === normalizedDuration) {
        return previousCache;
      }
      return {
        ...previousCache,
        [travelMode]: normalizedDuration,
      };
    });

  }, [routes, selectedRouteIndex, routeData, travelMode]);

  useEffect(() => {
    if (!visible || !startCoords || !destinationCoords) {
      return;
    }

    let isCancelled = false;
    const allModes: Array<"walking" | "driving" | "transit" | "bicycling"> = [
      "walking",
      "transit",
      "bicycling",
      "driving",
    ];

    const fetchModeDurations = async () => {
      const results = await Promise.allSettled(
        allModes.map(async (modeKey) => {
          const fetchedRoutes = await getDirections(startCoords, destinationCoords, modeKey);
          const duration = fetchedRoutes[0]?.duration;
          return {
            modeKey,
            duration: duration ? normalizeDurationLabel(duration) : null,
          };
        })
      );

      if (isCancelled) {
        return;
      }

      setModeDurationCache((previousCache) => {
        const nextCache = { ...previousCache };

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.duration) {
            nextCache[result.value.modeKey] = result.value.duration;
          }
        });

        return nextCache;
      });
    };

    void fetchModeDurations();

    return () => {
      isCancelled = true;
    };
  }, [
    visible,
    startCoords?.latitude,
    startCoords?.longitude,
    destinationCoords?.latitude,
    destinationCoords?.longitude,
    routeScopeKey,
  ]);

  const getModeDurationLabel = (
    modeKey: "walking" | "driving" | "transit" | "bicycling"
  ): string => {
    const cachedDuration = modeDurationCache[modeKey];
    if (cachedDuration) {
      return cachedDuration;
    }

    const selectedDuration = routeData?.duration || routes[selectedRouteIndex]?.duration;

    if (modeKey === travelMode && selectedDuration) {
      return normalizeDurationLabel(selectedDuration);
    }

    return "--";
  };

  const handleClose = () => {
    setIsNavigationActive(false);
    clearRouteData();
    onClose();
  };

  const handleSelectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    const selected = routes[index];
    if (selected) {
      setRouteData(selected);
    }
  };

  const handleStartNavigation = (routeId: string, index: number) => {
    const selected = routes[index];
    if (selected) {
      setSelectedRouteIndex(index);
      setRouteData(selected);
      setIsNavigationActive(true);
      setNavigationRouteId(routeId);
      onClose();
      return;
    }

    setNavigationRouteId(routeId);
  };

  const dragHandlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation((value) => {
          dragStartRef.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue = Math.max(0, dragStartRef.current + gestureState.dy);
        sheetTranslateY.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 1.05) {
          Animated.timing(sheetTranslateY, {
            toValue: dismissDistance,
            duration: 170,
            useNativeDriver: true,
          }).start(() => {
            sheetTranslateY.setValue(0);
            handleClose();
          });
          return;
        }

        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 11,
        }).start();
      },
    })
  ).current;

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor:
                  Platform.OS === "android"
                    ? "#FFFFFF"
                    : "transparent",
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}

          <View style={styles.dragHandleTouchArea} {...dragHandlePanResponder.panHandlers}>
            <View style={[styles.dragHandle, { backgroundColor: isDark ? "#7A7A7C" : "#B8B8BC" }]} />
          </View>

          <View style={styles.header}>
            <View style={[styles.headerSide, styles.headerSideLeft]}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Close directions"
                accessibilityHint="Closes the directions panel"
              >
                {Platform.OS === "ios" ? (
                  <View
                    style={[
                      styles.closeButtonCircle,
                      { backgroundColor: isDark ? "#00000031" : "#85858522" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: isDark ? "#FFFFFF" : "#333333" },
                      ]}
                    >
                      ✕
                    </Text>
                  </View>
                ) : (
                  <PlatformIcon materialName="close" iosName="xmark" size={22} color={campusPink} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.title}>
                Directions
              </Text>
            </View>

            <View style={[styles.headerSide, styles.headerSideRight]} />
          </View>

          <View style={[styles.transportRow, { backgroundColor: isDark ? "#3A3A3C" : "#E6E6E9" }]}>
            {([
              { mode: "walking", icon: "directions-walk" },
              { mode: "transit", icon: "directions-transit" },
              { mode: "bicycling", icon: "directions-bike" },
              { mode: "driving", icon: "directions-car" },
            ] as const).map((option) => {
              const active = option.mode === travelMode;
              const displayDuration = getModeDurationLabel(option.mode);
              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.transportButton,
                    {
                      backgroundColor: active ? campusPink : "transparent",
                    },
                  ]}
                  onPress={() => setTravelMode(option.mode)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.mode} mode`}
                  accessibilityHint={`Updates routes for ${option.mode} transportation`}
                >
                  <PlatformIcon
                    materialName={option.icon}
                    iosName={
                      option.mode === "walking"
                        ? "figure.walk"
                        : option.mode === "transit"
                          ? "tram.fill"
                          : option.mode === "bicycling"
                            ? "bicycle"
                            : "car.fill"
                    }
                    size={15}
                    color={active ? "#FFFFFF" : isDark ? "#F5F5F5" : "#202020"}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: active ? "#FFFFFF" : isDark ? "#F5F5F5" : "#202020",
                      fontSize: 9,
                      fontWeight: "600",
                    }}
                  >
                    {displayDuration}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.centerInline}>
                <ActivityIndicator color="#B03060" />
                <Text style={{ color: isDark ? "#FFFFFF" : "#111111" }}>Loading routes...</Text>
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
                        borderColor: selected ? "#C48BA1" : isDark ? "#3F3F42" : "#ECECEF",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.durationText}>
                        {route.duration}
                      </Text>
                      <Text style={styles.etaText}>
                        {route.eta}
                      </Text>
                      {travelMode === "transit" && !!transitSummary && (
                        <Text style={styles.routeTransitSummary} numberOfLines={1}>
                          {transitSummary}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.distanceText}>
                      {route.distance}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleStartNavigation(route.id, index)}
                      style={[
                        styles.startButton,
                        navigationRouteId === route.id && { opacity: 0.8 },
                      ]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Start navigation for route ${index + 1}`}
                      accessibilityHint="Begins turn by turn navigation with this route"
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
                  <Text style={{ color: isDark ? "#AFAFAF" : "#666666" }}>
                    Detailed transit lines are not available for this route yet.
                  </Text>
                )}
              </View>
            )}

          </ScrollView>
          </Animated.View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  sheet: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    marginHorizontal: 0,
    marginBottom: 0,
    minHeight: 300,
    maxHeight: "80%",
    overflow: "hidden",
  },
  dragHandle: {
    width: 38,
    height: 3,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 6,
  },
  dragHandleTouchArea: {
    alignSelf: "stretch",
    paddingTop: 4,
    paddingBottom: 6,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    minHeight: 46,
    marginBottom: 6,
  },
  headerSide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  headerSideLeft: {
    left: 0,
  },
  headerSideRight: {
    right: 0,
    alignItems: "flex-end",
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#B03060",
    textAlign: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  closeButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: "center",
  },
  transportRow: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  transportButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "row",
    gap: 2,
  },
  routeList: {
    marginTop: 2,
    maxHeight: 380,
  },
  routeCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  durationText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#B03060",
    lineHeight: 26,
  },
  etaText: {
    color: "#C48BA1",
    marginTop: 0,
    fontSize: 14,
    fontWeight: "500",
  },
  routeTransitSummary: {
    color: "#6E6E73",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  distanceText: {
    color: "#C48BA1",
    marginRight: 10,
    fontWeight: "500",
    fontSize: 14,
  },
  startButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#B03060",
    alignItems: "center",
    justifyContent: "center",
  },
  centerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transitSection: {
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  transitSectionTitle: {
    color: "#B03060",
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 2,
  },
  transitCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  transitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transitLineName: {
    color: "#B03060",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
    paddingRight: 8,
  },
  transitTypeBadge: {
    backgroundColor: "#ECECEF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  transitTypeBadgeText: {
    color: "#5F5F63",
    fontSize: 11,
    fontWeight: "700",
  },
  transitHeadsign: {
    color: "#C48BA1",
    fontSize: 13,
    fontWeight: "500",
  },
  transitStops: {
    color: "#6E6E73",
    fontSize: 13,
    fontWeight: "500",
  },
});

export default DestinationPopup;
