import React, { useEffect, useRef, useCallback } from "react";
import { LatLng, Polyline } from "react-native-maps";
import { useDirections } from "@/src/context/DirectionsContext";
import { getDirections, decodePolyline } from "@/src/api/directions";
import { Platform } from "react-native";

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
      ? `${effectiveStartLocation.latitude.toFixed(6)},${effectiveStartLocation.longitude.toFixed(6)}->${destinationCoords.latitude.toFixed(6)},${destinationCoords.longitude.toFixed(6)}:${travelMode}`
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
      );

      console.log("RoutePolyline: API call successful", {
        routesCount: fetchedRoutes.length,
      });

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
          polylinePoints: decodePolyline(route.overviewPolyline),
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

  const campusPink = "#B03060";
  const isWalking = travelMode === "walking";

  return (
    <Polyline
      key={`route-${travelMode}`}
      coordinates={routeData.polylinePoints}
      strokeColor={campusPink}
      strokeWidth={isWalking ? (Platform.OS === "ios" ? 3 : 4) : 5}
      lineDashPattern={isWalking ? [1, 8] : undefined}
      lineCap={isWalking ? "round" : "butt"}
      lineJoin={isWalking ? "round" : "miter"}
      zIndex={zIndex}
      geodesic
    />
  );
};

export default RoutePolyline;
