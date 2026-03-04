import React, { useEffect, useRef, useCallback } from "react";
import { Polyline , LatLng } from "react-native-maps";
import { getDirections, decodePolyline } from "@/src/api/directions";
import { useDirections, DirectionStep } from "@/src/context/DirectionsContext";

const getStepColorAndStyle = (step: DirectionStep, isIOS: boolean) => {
  const mode = (step.travelMode || "").toUpperCase();

  if (mode === "WALK" || mode === "WALKING") {
    return {
      color: "#A970FF",
      width: 5,
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

  const requestKey =
    effectiveStartLocation && destinationCoords
      ? `${effectiveStartLocation.latitude.toFixed(6)},${effectiveStartLocation.longitude.toFixed(6)}->${destinationCoords.latitude.toFixed(6)},${destinationCoords.longitude.toFixed(6)}:${travelMode}`
      : null;

  const shouldShowRoute = showDirections || isNavigationActive;

  // Fetch directions when destination, start, or travel mode changes
  const fetchRoute = useCallback(async () => {
    console.log("RoutePolyline: fetchRoute called", {
      showDirections,
      isNavigationActive,
      hasStart: !!effectiveStartLocation,
      hasDestination: !!destinationCoords,
      mode: travelMode,
    });

    if (!shouldShowRoute) {
      return;
    }

    if (!effectiveStartLocation || !destinationCoords) {
      console.log("RoutePolyline: Missing start or destination, skipping");
      setRoutes([]);
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
        .map((route) => {
          const decodedPoints = decodePolyline(route.overviewPolyline);
          return {
            ...route,
            polylinePoints: decodedPoints,
          };
        })
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

        const isApiConfigurationError =
          errorMessage.toLowerCase().includes("not been used") ||
          errorMessage.toLowerCase().includes("disabled") ||
          errorMessage.toLowerCase().includes("legacy api") ||
          errorMessage.toLowerCase().includes("request denied");

        if (isApiConfigurationError && requestKey) {
          blockedRequestKeyRef.current = requestKey;
        }

        setError(errorMessage);
        setRoutes([]);
        setLoading(false);
      }
    }
  }, [
    effectiveStartLocation,
    destinationCoords,
    travelMode,
    showDirections,
    isNavigationActive,
    shouldShowRoute,
    requestKey,
    setRoutes,
    setRouteData,
    setLoading,
    setError,
  ]);

  useEffect(() => {
    blockedRequestKeyRef.current = null;

    // Debounce the fetch to prevent rapid API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchRoute();
    }, 300); // Wait 300ms after dependencies change before fetching

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

  // Don't render if no points
  if (!shouldShowRoute || !routeData || routeData.polylinePoints.length === 0) {
    return null;
  }

  const campusPink = "#B03060";
  const isWalking = travelMode === "walking";

  return (
    <>
      {routeData.steps.map((step, index) => {
        if (!step.startLocation || !step.endLocation) return null;
  
        const mode = step.travelMode;
  
        const getColor = () => {
          switch (mode) {
            case "WALK":
            case "WALKING":
              return "#666666"; // grey walking
            case "TRANSIT":
              return "#1E90FF"; // blue transit
            case "BICYCLE":
            case "BICYCLING":
              return "#32CD32"; // green bike
            case "DRIVE":
            case "DRIVING":
              return "#FF3B30"; // red drive
            default:
              return "#B03060";
          }
        };
  
        const isWalking =
          mode === "WALK" || mode === "WALKING";
  
        return (
          <Polyline
            key={`step-${index}`}
            coordinates={[step.startLocation, step.endLocation]}
            strokeColor={getColor()}
            strokeWidth={isWalking ? 3 : 5}
            lineDashPattern={isWalking ? [4, 6] : undefined}
            lineCap="round"
            lineJoin="round"
            zIndex={zIndex}
            geodesic
          />
        );
      })}
    </>
  );
};

export default RoutePolyline;
