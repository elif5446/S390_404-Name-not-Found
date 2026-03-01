import React, { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { LatLng, Polyline } from "react-native-maps";
import { useDirections, DirectionStep } from "@/src/context/DirectionsContext";
import { getDirections, decodePolyline } from "@/src/api/directions";
import { getShuttleRouteIfApplicable } from "@/src/api/shuttleEngine";

const getStepColorAndStyle = (step: DirectionStep, isIOS: boolean) => {
  const mode = (step.travelMode || "").toUpperCase();

  if (mode === "WALK" || mode === "WALKING") {
    return {
      color: "#B03060",
      dash: isIOS ? [1, 6] : [1, 8],
      width: isIOS ? 3 : 4,
      isWalk: true,
    };
  }

  const type = (step.transitVehicleType || "").toLowerCase();
  const shortName = (step.transitLineShortName || "").toLowerCase();
  const longName = (step.transitLineName || "").toLowerCase();

  let color = "#888888";

  if (type.includes("shuttle")) {
    color = "#B03060";
  } else if (type.includes("subway") || type.includes("metro")) {
    // STM Montreal Metro Colors
    if (
      shortName === "1" ||
      longName.includes("green") ||
      longName.includes("verte")
    )
      color = "#139D48";
    else if (shortName === "2" || longName.includes("orange"))
      color = "#F38031";
    else if (
      shortName === "4" ||
      longName.includes("yellow") ||
      longName.includes("jaune")
    )
      color = "#F1C40F";
    else if (
      shortName === "5" ||
      longName.includes("blue") ||
      longName.includes("bleue")
    )
      color = "#2980B9";
    else color = "#2980B9";
  } else if (type.includes("bus")) {
    color = "#A970FF"; // Light Purple for public buses
  }

  return { color, dash: null, width: 5, isWalk: false };
};

interface RoutePolylineProps {
  startLocation?: LatLng;
  zIndex?: number;
}

/**
 * Component to render the route polyline on the map
 * Handles fetching directions and decoding polyline
 */
const RoutePolyline: React.FC<RoutePolylineProps> = ({
  startLocation,
  zIndex = 5,
}) => {
  const {
    destinationCoords,
    travelMode,
    timeMode,
    targetTime,
    showDirections,
    isNavigationActive,
    routeData,
    setRoutes,
    setRouteData,
    setLoading,
    setError,
  } = useDirections();

  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blockedRequestKeyRef = useRef<string | null>(null);

  // Determine the actual start location to use
  const effectiveStartLocation = startLocation;
  const shouldShowRoute = showDirections || isNavigationActive;

  const requestKey =
    effectiveStartLocation && destinationCoords
      ? `${effectiveStartLocation.latitude.toFixed(6)},${effectiveStartLocation.longitude.toFixed(6)}->${destinationCoords.latitude.toFixed(6)},${destinationCoords.longitude.toFixed(6)}:${travelMode}:${timeMode}:${targetTime ? targetTime.getTime() : "now"}`
      : null;

  // Fetch directions when destination, start, or travel mode changes
  const fetchRoute = useCallback(async () => {
    console.log("RoutePolyline: fetchRoute called", {
      showDirections,
      isNavigationActive,
      hasStart: !!effectiveStartLocation,
      hasDestination: !!destinationCoords,
      mode: travelMode,
    });

    if (!shouldShowRoute || !effectiveStartLocation || !destinationCoords) {
      if (!effectiveStartLocation || !destinationCoords) setRoutes([]);
      console.log("RoutePolyline: Missing start or destination, skipping");
      return;
    }

    // Validate coordinates are valid numbers
    if (
      !Number.isFinite(effectiveStartLocation.latitude) ||
      !Number.isFinite(effectiveStartLocation.longitude) ||
      !Number.isFinite(destinationCoords.latitude) ||
      !Number.isFinite(destinationCoords.longitude)
    ) {
      console.warn("RoutePolyline: Invalid coordinates", {
        start: effectiveStartLocation,
        destination: destinationCoords,
      });
      setRoutes([]);
      return;
    }

    console.log("RoutePolyline: Starting API call", {
      start: effectiveStartLocation,
      destination: destinationCoords,
    });

    if (requestKey && blockedRequestKeyRef.current === requestKey) {
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Fetch directions from API
      const fetchedRoutes = await getDirections(
        effectiveStartLocation,
        destinationCoords,
        travelMode,
        targetTime,
        timeMode,
      );

      console.log("RoutePolyline: API call successful", {
        routesCount: fetchedRoutes.length,
      });

      // Shuttle injection
      if (travelMode === "transit") {
        const routingTime = targetTime || new Date();
        const shuttleRoute = await getShuttleRouteIfApplicable(
          effectiveStartLocation,
          destinationCoords,
          routingTime,
          timeMode,
        );

        if (shuttleRoute) {
          let showShuttle = true;
          const bestPublicRoute = fetchedRoutes[0];

          if (bestPublicRoute && bestPublicRoute.duration) {
            // parse public transit duration
            const durStr = bestPublicRoute.duration;
            const hMatch = durStr.match(/(\d{1,5})\s{0,5}h/);
            const mMatch = durStr.match(/(\d{1,5})\s{0,5}min/);
            const publicMins =
              (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) +
              (mMatch ? parseInt(mMatch[1], 10) : 0);

            const shuttleDepMs = new Date(shuttleRoute.departureDate).getTime();
            const targetTimeMs = routingTime.getTime();

            if (timeMode === "leave") {
              const waitMins = (shuttleDepMs - targetTimeMs) / 60000;
              // hide shuttle if waiting longer than the entire public transit trip
              if (waitMins >= publicMins) {
                showShuttle = false;
              }
            } else {
              // timeMode === "arrive"
              // public transit requires you to leave at: targetTime - publicMins
              const publicDepMs = targetTimeMs - publicMins * 60000;
              const extraEarlyMins = (publicDepMs - shuttleDepMs) / 60000;
              if (extraEarlyMins >= 45) {
                showShuttle = false;
              }
            }
          }

          if (showShuttle) {
            fetchedRoutes.unshift(shuttleRoute);
          }
        }
      }

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log(
          "RoutePolyline: Component unmounted, skipping state update",
        );
        return;
      }

      const decodedRoutes = fetchedRoutes
        .map((route) => ({
          ...route,
          polylinePoints: route.isShuttle
            ? route.polylinePoints // use pre-defined points for shuttle
            : decodePolyline(route.overviewPolyline),
        }))
        .filter((route) => route.polylinePoints.length > 0);

      if (decodedRoutes.length === 0) {
        throw new Error("Failed to decode route polyline");
      }

      setRoutes(decodedRoutes);
      setRouteData(decodedRoutes[0]);
      blockedRequestKeyRef.current = null;

      if (isMountedRef.current) {
        setLoading(false);
      }
    } catch (err) {
      console.error("RoutePolyline: Fetch error", err);
      if (isMountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch directions";
        console.warn("Route fetch error:", errorMessage);

        if (
          errorMessage
            .toLowerCase()
            .match(/not been used|disabled|legacy api|request denied/)
        ) {
          if (requestKey) blockedRequestKeyRef.current = requestKey;
        }

        setError(errorMessage);
        setRoutes([]);
        setLoading(false);
      }
    }
  }, [
    showDirections,
    isNavigationActive,
    effectiveStartLocation,
    destinationCoords,
    travelMode,
    targetTime,
    timeMode,
    shouldShowRoute,
    requestKey,
    setRoutes,
    setRouteData,
    setLoading,
    setError,
  ]);

  useEffect(() => {
    blockedRequestKeyRef.current = null;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchRoute();
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchRoute]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!shouldShowRoute || !routeData || routeData.polylinePoints.length === 0) {
    return null;
  }

  // Rendering logic
  if (travelMode === "transit") {
    const hasStepPolylines = routeData.steps.some(
      (step) => step.polylinePoints && step.polylinePoints.length > 0,
    );

    if (hasStepPolylines) {
      return (
        <>
          {routeData.steps.map((step, idx) => {
            if (!step.polylinePoints || step.polylinePoints.length === 0)
              return null;

            const style = getStepColorAndStyle(step, Platform.OS === "ios");

            return (
              <Polyline
                key={`transit-step-${travelMode}-${routeData.id}-${idx}`}
                coordinates={step.polylinePoints}
                strokeColor={style.color}
                strokeWidth={style.width}
                lineDashPattern={style.dash as any}
                lineCap={style.isWalk ? "round" : "butt"}
                lineJoin="round"
                zIndex={zIndex + (style.isWalk ? 0 : 1)} // Draw vehicles on top of walk dots
                geodesic
              />
            );
          })}
        </>
      );
    }
  }

  let mainColor = "#B03060";
  let isWalking = travelMode === "walking";

  if (travelMode === "driving") mainColor = "#5DADE2";
  if (travelMode === "bicycling") mainColor = "#48C9B0";
  if (routeData.isShuttle) {
    mainColor = "#B03060";
    isWalking = false;
  }

  const defaultDash = isWalking
    ? Platform.OS === "ios"
      ? [1, 6]
      : [1, 8]
    : undefined;

  return (
    <Polyline
      key={`route-${travelMode}-${routeData.id}`}
      coordinates={routeData.polylinePoints}
      strokeColor={mainColor}
      strokeWidth={isWalking ? (Platform.OS === "ios" ? 3 : 4) : 5}
      lineDashPattern={defaultDash as any}
      lineCap={isWalking ? "round" : "butt"}
      lineJoin={isWalking ? "round" : "miter"}
      zIndex={zIndex}
      geodesic
    />
  );
};

export default RoutePolyline;
