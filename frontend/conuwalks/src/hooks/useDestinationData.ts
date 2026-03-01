import { useState, useEffect, useCallback, useMemo } from "react";
import { DirectionStep, useDirections } from "@/src/context/DirectionsContext";
import { getDirections } from "@/src/api/directions";

export const useDestinationData = (visible: boolean) => {
  const directions = useDirections();
  const {
    routes,
    selectedRouteIndex,
    routeData,
    travelMode,
    startCoords,
    destinationCoords,
    startBuildingId,
    destinationBuildingId,
  } = directions;

  const [navigationRouteId, setNavigationRouteId] = useState<string | null>(
    null,
  );
  const [modeDurationCache, setModeDurationCache] = useState<
    Partial<Record<"walking" | "driving" | "transit" | "bicycling", string>>
  >({});

  const routeScopeKey = `${startBuildingId ?? "-"}->${destinationBuildingId ?? "-"}`;

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

  const normalizeDurationLabel = useCallback((value: string): string => {
    const lower = value.toLowerCase();
    if (lower.includes("h") || lower.includes("hour")) {
      const hourMatch = lower.match(/(\d{1,10})\s{0,10}h/);
      const minuteMatch = lower.match(/(\d{1,10})\s{0,10}(?:mins?|minutes?)/);
      const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
      const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0;
      return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
    }
    const minuteMatch = lower.match(/(\d{1,10})\s{0,10}(?:mins?|minutes?)/);
    if (minuteMatch) {
      return formatMinutes(Number.parseInt(minuteMatch[1], 10));
    }
    return value;
  }, []);

  useEffect(() => {
    setModeDurationCache({});
    setNavigationRouteId(null);
  }, [routeScopeKey]);

  useEffect(() => {
    const activeRoute = routes[selectedRouteIndex] || routeData;
    if (!activeRoute) return;

    const normalizedDuration = normalizeDurationLabel(activeRoute.duration);
    setModeDurationCache((prev) => {
      if (prev[travelMode] === normalizedDuration) return prev;
      return { ...prev, [travelMode]: normalizedDuration };
    });
  }, [
    routes,
    selectedRouteIndex,
    routeData,
    travelMode,
    normalizeDurationLabel,
  ]);

  useEffect(() => {
    if (!visible || !startCoords || !destinationCoords) return;

    let isCancelled = false;
    const allModes: ("walking" | "driving" | "transit" | "bicycling")[] = [
      "walking",
      "transit",
      "bicycling",
      "driving",
    ];

    const fetchModeDurations = async () => {
      const results = await Promise.allSettled(
        allModes.map(async (modeKey) => {
          const fetchedRoutes = await getDirections(
            startCoords,
            destinationCoords,
            modeKey,
          );
          const duration = fetchedRoutes[0]?.duration;
          return {
            modeKey,
            duration: duration ? normalizeDurationLabel(duration) : null,
          };
        }),
      );

      if (isCancelled) return;

      setModeDurationCache((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.duration) {
            next[result.value.modeKey] = result.value.duration;
          }
        });
        return next;
      });
    };

    void fetchModeDurations();
    return () => {
      isCancelled = true;
    };
  }, [
    visible,
    startCoords,
    destinationCoords,
    routeScopeKey,
    normalizeDurationLabel,
  ]);

  const getModeDurationLabel = useCallback(
    (modeKey: "walking" | "driving" | "transit" | "bicycling"): string => {
      if (modeDurationCache[modeKey]) return modeDurationCache[modeKey]!;
      const selectedDuration =
        routeData?.duration || routes[selectedRouteIndex]?.duration;
      if (modeKey === travelMode && selectedDuration)
        return normalizeDurationLabel(selectedDuration);
      return "--";
    },
    [
      modeDurationCache,
      routeData,
      routes,
      selectedRouteIndex,
      travelMode,
      normalizeDurationLabel,
    ],
  );

  const getTransitBadgeLabel = useCallback((step: DirectionStep): string => {
    const type = (step.transitVehicleType || "").toLowerCase();
    if (type.includes("subway") || type.includes("metro")) return "Metro";
    if (type.includes("bus") || type.includes("shuttle")) return "Bus";
    return step.transitVehicleType || "Transit";
  }, []);

  const getRouteTransitSummary = useCallback(
    (steps: DirectionStep[]): string | null => {
      const labels = steps
        .filter(
          (step) =>
            step.transitLineShortName ||
            step.transitLineName ||
            step.transitVehicleType,
        )
        .map((step) => {
          const type = (step.transitVehicleType || "Transit").toLowerCase();
          const vehicle =
            type.includes("subway") || type.includes("metro")
              ? "Metro"
              : type.includes("bus") || type.includes("shuttle")
                ? "Bus"
                : "Transit";
          const line = (
            step.transitLineShortName ||
            step.transitLineName ||
            ""
          ).trim();
          return line ? `${vehicle} ${line}` : vehicle;
        });

      if (labels.length === 0) return null;
      return labels
        .filter((val, i) => i === 0 || val !== labels[i - 1])
        .join(" → ");
    },
    [],
  );

  const transitSteps = useMemo(() => {
    const selectedRoute = routes[selectedRouteIndex] || routeData;
    return (selectedRoute?.steps || []).filter(
      (step) =>
        step.transitLineName ||
        step.transitLineShortName ||
        step.transitDepartureStop ||
        step.transitArrivalStop ||
        step.transitHeadsign,
    );
  }, [routes, selectedRouteIndex, routeData]);

  return {
    ...directions,
    navigationRouteId,
    setNavigationRouteId,
    getModeDurationLabel,
    getTransitBadgeLabel,
    getRouteTransitSummary,
    transitSteps,
  };
};
