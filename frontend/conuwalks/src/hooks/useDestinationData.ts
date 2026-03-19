import { useState, useEffect, useCallback, useMemo } from "react";
import { DirectionStep, useDirections } from "@/src/context/DirectionsContext";
import { getDirections } from "@/src/api/directions";
import { calculateIndoorPenaltySeconds } from "@/src/indoors/services/indoorRoutingHelper";
import { formatDurationFromSeconds } from "../utils/time";

export const useDestinationData = (
  visible: boolean,
  overrideDestination?: { latitude: number; longitude: number },
  overrideStart?: { latitude: number; longitude: number },
) => {
  const directions = useDirections();
  const {
    routes,
    selectedRouteIndex,
    routeData,
    travelMode,
    startCoords: contextStart,
    destinationCoords: contextDestination,
    startBuildingId,
    startRoom,
    destinationBuildingId,
    destinationRoom,
  } = directions;

  const [navigationRouteId, setNavigationRouteId] = useState<string | null>(
    null,
  );
  const effectiveDestination = overrideDestination || contextDestination;
  const effectiveStart = overrideStart || contextStart;
  const [baseModeSecondsCache, setBaseModeSecondsCache] = useState<
    Partial<Record<"walking" | "driving" | "transit" | "bicycling", number>>
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
    setBaseModeSecondsCache({});
    setNavigationRouteId(null);
  }, [routeScopeKey]);

  useEffect(() => {
    const activeRoute = routes[selectedRouteIndex] || routeData;
    if (
      !activeRoute ||
      !activeRoute.requestMode ||
      activeRoute.baseDurationSeconds == null
    ) {
      return;
    }

    setBaseModeSecondsCache((prev) => {
      if (prev[activeRoute.requestMode] === activeRoute.baseDurationSeconds) {
        return prev;
      }
      return {
        ...prev,
        [activeRoute.requestMode]: activeRoute.baseDurationSeconds,
      };
    });
  }, [routes, selectedRouteIndex, routeData, travelMode]);

  useEffect(() => {
    // fix to only trigger fetch if we have both start (user) and the specific destination
    if (!visible || !effectiveStart || !effectiveDestination) return;

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
            effectiveStart,
            effectiveDestination,
            modeKey,
          );
          return {
            modeKey,
            baseSeconds: fetchedRoutes[0]?.baseDurationSeconds || null,
          };
        }),
      );

      if (isCancelled) return;

      setBaseModeSecondsCache((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (
            result.status === "fulfilled" &&
            result.value.baseSeconds !== null
          ) {
            next[result.value.modeKey] = result.value.baseSeconds;
          }
        });
        return next;
      });
    };

    void fetchModeDurations();
    return () => {
      isCancelled = true;
    };
  }, [visible, effectiveStart, effectiveDestination, routeScopeKey]);

  const getModeDurationLabel = useCallback(
    (modeKey: "walking" | "driving" | "transit" | "bicycling"): string => {
      const baseSeconds = baseModeSecondsCache[modeKey];

      if (baseSeconds) {
        const indoorPenalty = calculateIndoorPenaltySeconds(
          startBuildingId,
          startRoom,
          destinationBuildingId,
          destinationRoom,
        );
        return formatDurationFromSeconds(baseSeconds + indoorPenalty);
      }

      const activeRoute = routeData || routes[selectedRouteIndex];
      if (
        activeRoute &&
        activeRoute.requestMode === modeKey &&
        activeRoute.duration
      ) {
        return normalizeDurationLabel(activeRoute.duration);
      }
      return "--";
    },
    [
      baseModeSecondsCache,
      routeData,
      routes,
      selectedRouteIndex,
      startBuildingId,
      startRoom,
      destinationBuildingId,
      destinationRoom,
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
