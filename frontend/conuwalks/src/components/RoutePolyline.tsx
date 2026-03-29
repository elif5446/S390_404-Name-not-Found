import React, { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { LatLng, Polyline, Marker } from "react-native-maps";
import { useDirections, DirectionStep, RouteData } from "@/src/context/DirectionsContext";
import { getDirections, decodePolyline } from "@/src/api/directions";
import { getShuttleRouteIfApplicable } from "@/src/api/shuttleEngine";
import { calculateIndoorPenaltySeconds } from "@/src/indoors/services/indoorRoutingHelper";
import { calculateEtaFromSeconds, formatDurationFromSeconds } from "../utils/time";

const TRANSFER_NODE_FREEZE_DELAY_MS = 250;

const getStepColorAndStyle = (step: DirectionStep, isIOS: boolean) => {
  const mode = (step.travelMode || "").toUpperCase();

  if (mode === "WALK" || mode === "WALKING") {
    return {
      color: "#B03060",
      width: isIOS ? 3 : 4,
      isWalk: true,
    };
  }

  const type = (step.transitVehicleType || "").toLowerCase();
  const shortName = (step.transitLineShortName || "").toLowerCase();
  const longName = (step.transitLineName || "").toLowerCase();

  let color = "#000000";

  if (type.includes("shuttle")) {
    color = "#B03060";
  } else if (type.includes("subway") || type.includes("metro")) {
    // STM Montreal Metro Colors
    if (shortName === "1" || longName.includes("green") || longName.includes("verte")) color = "#139D48";
    else if (shortName === "2" || longName.includes("orange")) color = "#F38031";
    else if (shortName === "4" || longName.includes("yellow") || longName.includes("jaune")) color = "#F1C40F";
    else if (shortName === "5" || longName.includes("blue") || longName.includes("bleue")) color = "#2980B9";
    else color = "#2980B9";
  } else if (type.includes("bus")) {
    color = "#A970FF"; // Light Purple for public buses
  }

  return { color, width: 5, isWalk: false };
};

interface RoutePolylineProps {
  startLocation?: LatLng;
  zIndex?: number;
}

const TransferNodeMarker = ({ coordinate, color, zIndex }: { coordinate: LatLng; color: string; zIndex: number }) => {
  const [trackChanges, setTrackChanges] = useState(true);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (freezeTimeoutRef.current) {
        clearTimeout(freezeTimeoutRef.current);
        freezeTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} zIndex={zIndex} tracksViewChanges={trackChanges} flat>
      <View
        onLayout={() => {
          if (!trackChanges) return;

          if (freezeTimeoutRef.current) {
            clearTimeout(freezeTimeoutRef.current);
            freezeTimeoutRef.current = null;
          }

          freezeTimeoutRef.current = setTimeout(() => {
            setTrackChanges(false);
          }, TRANSFER_NODE_FREEZE_DELAY_MS);
        }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          borderWidth: 4,
          borderColor: color,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 1.5,
          elevation: 2,
        }}
      />
    </Marker>
  );
};

// helper function: extracted the shuttle injection logic to reduce fetchRoute complexity
const injectShuttleRoute = async (
  fetchedRoutes: any[],
  effectiveStartLocation: LatLng,
  destinationCoords: LatLng,
  routingTime: Date,
  timeMode: "leave" | "arrive",
) => {
  const shuttleRoute = await getShuttleRouteIfApplicable(effectiveStartLocation, destinationCoords, routingTime, timeMode);
  if (!shuttleRoute) return fetchedRoutes;

  const durStr = fetchedRoutes[0]?.duration;
  if (!durStr) {
    fetchedRoutes.unshift(shuttleRoute);
    return fetchedRoutes;
  }
  
  const hMatch = /(\d{1,5})\s{0,5}h/.exec(durStr);
  const mMatch = /(\d{1,5})\s{0,5}min/.exec(durStr);
  const publicMins = Number.parseInt(hMatch?.[1] ?? "0")*60 + Number.parseInt(mMatch?.[1] ?? "0");

  const shuttleDepMs = new Date(shuttleRoute.departureDate).getTime();
  const targetTimeMs = routingTime.getTime();

  if (!(
    timeMode === "leave"
    && (shuttleDepMs - targetTimeMs) / 60000 >= publicMins
    || (targetTimeMs - publicMins * 60000 - shuttleDepMs) / 60000 >= 45
  )) {
    fetchedRoutes.unshift(shuttleRoute);
  }

  return fetchedRoutes;
};

/**
 * Component to render the route polyline on the map
 * Handles fetching directions and decoding polyline
 */
const RoutePolyline: React.FC<RoutePolylineProps> = ({ startLocation, zIndex = 5 }) => {
  const {
    startCoords,
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
    startBuildingId,
    startRoom,
    destinationBuildingId,
    destinationRoom,
  } = useDirections();

  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blockedRequestKeyRef = useRef<string | null>(null);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const baseRoutesRef = useRef<RouteData[]>([]);

  // Determine the actual start location to use
  const effectiveStartLocation = startLocation || startCoords;
  const shouldShowRoute = showDirections || isNavigationActive;

  const outdoorRequestKey =
    effectiveStartLocation && destinationCoords
      ? `${effectiveStartLocation.latitude.toFixed(4)},${effectiveStartLocation.longitude.toFixed(4)}->${destinationCoords.latitude.toFixed(4)},${destinationCoords.longitude.toFixed(4)}:${travelMode}:${timeMode}:${targetTime ? targetTime.getTime() : "now"}`
      : null; // This ensures that reopening the same destination won't be falsely blocked.

  const indoorRequestKey = `${startBuildingId}_${startRoom}->${destinationBuildingId}_${destinationRoom}`;

  // helper function to apply the indoor time penalty
  const applyIndoorPatch = useCallback(
    async (routesToPatch: RouteData[]) => {
      if (!routesToPatch.length) return;

      const indoorPenaltyRaw = await calculateIndoorPenaltySeconds(startBuildingId, startRoom, destinationBuildingId, destinationRoom);
      const indoorPenalty = indoorPenaltyRaw || 0;

      const patchedRoutes = routesToPatch.map(route => {
        const newTotalSeconds = route.baseDurationSeconds + indoorPenalty;

        return {
          ...route,
          duration: formatDurationFromSeconds(newTotalSeconds),
          eta: calculateEtaFromSeconds(newTotalSeconds, targetTime, timeMode),
        };
      });

      setRoutes(patchedRoutes);
      setRouteData(patchedRoutes[0]);
    },
    [startBuildingId, startRoom, destinationBuildingId, destinationRoom, targetTime, timeMode, setRoutes, setRouteData],
  );

  // flush the request cache when the route is dismissed or destination is cleared
  useEffect(() => {
    if (!shouldShowRoute || !destinationCoords) {
      lastFetchedKeyRef.current = null;
      blockedRequestKeyRef.current = null;
    }
  }, [shouldShowRoute, destinationCoords]);

  // Fetch directions when destination, start, or travel mode changes
  const fetchRoute = useCallback(async () => {
    if (shouldShowRoute) {
      console.log("RoutePolyline: fetchRoute called", {
        showDirections,
        isNavigationActive,
        hasStart: !!effectiveStartLocation,
        hasDestination: !!destinationCoords,
        mode: travelMode,
      });
    }

    if (!shouldShowRoute || !effectiveStartLocation || !destinationCoords) {
      if (!effectiveStartLocation || !destinationCoords) setRoutes([]);
      // console.log("RoutePolyline: Missing start or destination, skipping");
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

    // block spam during active navigation
    // don't need to check routeData here; if navigation is active, route exists
    if (isNavigationActive) {
      return;
    }

    // block duplicate fetches for the same route parameters
    if (outdoorRequestKey && lastFetchedKeyRef.current === outdoorRequestKey) {
      await applyIndoorPatch(baseRoutesRef.current);
      return;
    }

    // block previously failed/blocked requests
    if (outdoorRequestKey && blockedRequestKeyRef.current === outdoorRequestKey) return;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const isSameBuilding =
        startBuildingId && destinationBuildingId && startBuildingId === destinationBuildingId && startBuildingId !== "USER";

      const isSameLocation =
        Math.abs(effectiveStartLocation.latitude - destinationCoords.latitude) < 0.00001 &&
        Math.abs(effectiveStartLocation.longitude - destinationCoords.longitude) < 0.00001;

      if (isSameBuilding || isSameLocation) {
        console.log("RoutePolyline: Indoor-only route detected. Skipping outdoor API fetch.");

        const mockRoute: RouteData = {
          id: "indoor-only-route",
          distance: "0 m",
          duration: "0 min",
          eta: "",
          baseDurationSeconds: 0,
          polylinePoints: [effectiveStartLocation, destinationCoords],
          overviewPolyline: "",
          steps: [
            {
              instruction: "Navigate indoors",
              distance: "0 m",
              duration: "0 min",
              travelMode: "walking",
              startLocation: effectiveStartLocation,
              endLocation: destinationCoords,
            },
          ],
          isShuttle: false,
          requestMode: "walking",
        };

        if (isMountedRef.current) {
          setRoutes([mockRoute]);
          setRouteData(mockRoute);
          setLoading(false);
          setError(null);
        }

        baseRoutesRef.current = [mockRoute];
        lastFetchedKeyRef.current = outdoorRequestKey;
        blockedRequestKeyRef.current = null;

        await applyIndoorPatch([mockRoute]);
        return;
      }

      // Fetch directions from API
      let fetchedRoutes = await getDirections(effectiveStartLocation, destinationCoords, travelMode, targetTime, timeMode);

      console.log("RoutePolyline: API call successful", {
        routesCount: fetchedRoutes.length,
      });

      // Shuttle injection
      if (travelMode === "transit") {
        fetchedRoutes = await injectShuttleRoute(
          fetchedRoutes,
          effectiveStartLocation,
          destinationCoords,
          targetTime || new Date(),
          timeMode,
        );
      }

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log("RoutePolyline: Component unmounted, skipping state update");
        return;
      }

      const decodedRoutes = fetchedRoutes
        .map(route => ({
          ...route,
          polylinePoints: route.isShuttle ? route.polylinePoints : decodePolyline(route.overviewPolyline),
        }))
        .filter(route => route.polylinePoints.length > 0);

      if (decodedRoutes.length === 0) {
        throw new Error("Failed to decode route polyline");
      }

      setRoutes(decodedRoutes);
      setRouteData(decodedRoutes[0]);
      baseRoutesRef.current = decodedRoutes;
      lastFetchedKeyRef.current = outdoorRequestKey;
      blockedRequestKeyRef.current = null;

      await applyIndoorPatch(decodedRoutes);

      if (isMountedRef.current) {
        setLoading(false);
      }
    } catch (err) {
      console.error("RoutePolyline: Fetch error", err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch directions";
        console.warn("Route fetch error:", errorMessage);

        if (/not been used|disabled|legacy api|request denied/i.exec(errorMessage)) {
          if (outdoorRequestKey) blockedRequestKeyRef.current = outdoorRequestKey;
        }

        setError(errorMessage);
        setRoutes([]);
        setLoading(false);
      }
    }
  }, [
    shouldShowRoute,
    effectiveStartLocation,
    destinationCoords,
    isNavigationActive,
    outdoorRequestKey,
    showDirections,
    travelMode,
    setRoutes,
    applyIndoorPatch,
    startBuildingId,
    destinationBuildingId,
    targetTime,
    timeMode,
    setRouteData,
    setLoading,
    setError,
  ]);

  // recalculate when the indoor rooms change
  useEffect(() => {
    if (baseRoutesRef.current.length > 0) {
      applyIndoorPatch(baseRoutesRef.current);
    }
  }, [indoorRequestKey, applyIndoorPatch]);

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isIOS = Platform.OS === "ios";
  const walkDash = isIOS ? [1, 6] : [1, 8];

  const transferNodes = useMemo(() => {
    if (travelMode !== "transit" || !routeData || !routeData.steps) return [];

    const nodes = [];
    for (let i = 0; i < routeData.steps.length - 1; i++) {
      const currentStep = routeData.steps[i];
      const nextStep = routeData.steps[i + 1];

      // distinguish specific vehicles so a Bus to Metro transfer is recognized
      const currentMode = (currentStep.travelMode === "transit" ? currentStep.transitVehicleType : currentStep.travelMode) || "UNKNOWN";
      const nextMode = (nextStep.travelMode === "transit" ? nextStep.transitVehicleType : nextStep.travelMode) || "UNKNOWN";

      // mode changes, it's a transfer point
      if (currentMode !== nextMode && currentStep.endLocation) {
        const currentStyle = getStepColorAndStyle(currentStep, isIOS);
        const nextStyle = getStepColorAndStyle(nextStep, isIOS);

        const nodeColor = !currentStyle.isWalk ? currentStyle.color : nextStyle.color;

        nodes.push({
          key: `transfer-${routeData.id}-${i}`,
          coordinate: currentStep.endLocation,
          color: nodeColor,
        });
      }
    }
    return nodes;
  }, [routeData, travelMode, isIOS]);

  if (!shouldShowRoute || !routeData || routeData.polylinePoints.length === 0) {
    return null;
  }

  // Rendering logic
  if (travelMode === "transit") {
    return (
      <>
        {routeData.steps.map((step, idx) => {
          if (!step.polylinePoints?.length) return null;

          const style = getStepColorAndStyle(step, isIOS);
          const stepKey = `transit-step-${travelMode}-${routeData.id}-${idx}`;

          return (
            <Polyline
              key={style.isWalk ? `${stepKey}-walk` : `${stepKey}-solid`}
              coordinates={step.polylinePoints}
              strokeColor={style.color}
              strokeWidth={style.width}
              lineDashPattern={style.isWalk ? (walkDash as number[]) : undefined}
              lineCap={style.isWalk ? "round" : "butt"}
              lineJoin="round"
              zIndex={style.isWalk ? zIndex : zIndex + 1}
              geodesic
            />
          );
        })}

        {transferNodes.map(node => (
          <TransferNodeMarker key={node.key} coordinate={node.coordinate} color={node.color} zIndex={zIndex + 3} />
        ))}
      </>
    );
  }

  let mainColor = "#B03060";
  let isWalking = travelMode === "walking";

  if (travelMode === "driving") mainColor = "#5DADE2";
  if (travelMode === "bicycling") mainColor = "#48C9B0";
  if (routeData.isShuttle) {
    mainColor = "#B03060";
    isWalking = false;
  }

  const routeKey = `route-${travelMode}-${routeData.id}`;

  if (isWalking) {
    return (
      <Polyline
        key={`${routeKey}-walk`}
        coordinates={routeData.polylinePoints}
        strokeColor={mainColor}
        strokeWidth={isIOS ? 3 : 4}
        lineDashPattern={walkDash as number[]}
        lineCap="round"
        lineJoin="round"
        zIndex={zIndex}
        geodesic
      />
    );
  }

  return (
    <Polyline
      coordinates={routeData.polylinePoints}
      strokeColor={mainColor}
      strokeWidth={5}
      lineDashPattern={isWalking ? (walkDash as number[]) : undefined}
      lineCap={isWalking ? "round" : "butt"}
      zIndex={zIndex}
      geodesic
    />
  );
};

export default RoutePolyline;
