import { LatLng } from "react-native-maps";
import { DirectionStep, RouteData } from "@/src/context/DirectionsContext";

const GOOGLE_DIRECTIONS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  "";

interface RoutesApiResponse {
  routes?: {
    distanceMeters?: number;
    duration?: string;
    polyline?: {
      encodedPolyline?: string;
    };
    legs?: {
      distanceMeters?: number;
      duration?: string;
      steps?: {
        travelMode?: string;
        distanceMeters?: number;
        staticDuration?: string;
        startLocation?: {
          latLng?: {
            latitude?: number;
            longitude?: number;
          };
        };
        endLocation?: {
          latLng?: {
            latitude?: number;
            longitude?: number;
          };
        };
        navigationInstruction?: {
          instructions?: string;
        };
        transitDetails?: {
          headsign?: string;
          stopDetails?: {
            arrivalStop?: {
              name?: string;
            };
            departureStop?: {
              name?: string;
            };
          };
          transitLine?: {
            name?: string;
            nameShort?: string;
            vehicle?: {
              type?: string;
              name?: {
                text?: string;
              };
            };
          };
        };
      }[];
    }[];
  }[];
  error?: {
    message?: string;
  };
}

interface DirectionsApiResponse {
  status: string;
  error_message?: string;
  routes?: {
    overview_polyline?: {
      points?: string;
    };
    legs?: {
      distance?: {
        text: string;
        value: number;
      };
      duration?: {
        text: string;
        value: number;
      };
      steps?: {
        html_instructions?: string;
        travel_mode?: string;
        start_location?: {
          lat?: number;
          lng?: number;
        };
        end_location?: {
          lat?: number;
          lng?: number;
        };
        distance?: {
          text: string;
          value: number;
        };
        duration?: {
          text: string;
          value: number;
        };
        transit_details?: {
          headsign?: string;
          departure_stop?: {
            name?: string;
          };
          arrival_stop?: {
            name?: string;
          };
          line?: {
            short_name?: string;
            name?: string;
            vehicle?: {
              type?: string;
              name?: string;
            };
          };
        };
      }[];
    }[];
  }[];
}

const parseSeconds = (durationValue: string | undefined): number => {
  if (!durationValue) return 0;
  const parsed = Number.parseFloat(durationValue.replace("s", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDuration = (durationValue: string | undefined): string => {
  const totalSeconds = parseSeconds(durationValue);
  if (totalSeconds <= 0) {
    return "0 min";
  }

  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
};

const formatDistance = (meters: number | undefined): string => {
  if (!meters || meters <= 0) {
    return "0 m";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
};

const formatEta = (durationValue: string | undefined): string => {
  const totalSeconds = parseSeconds(durationValue);
  const etaDate = new Date(Date.now() + totalSeconds * 1000);
  const hours = etaDate.getHours();
  const minutes = etaDate.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes} ETA`;
};

const isRoutesBlockedError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("computeroutes are blocked") ||
    normalized.includes("routes.googleapis.com") ||
    normalized.includes("google.maps.routing.v2.routes.computeroutes") ||
    normalized.includes("routes api has not been used") ||
    normalized.includes(
      "method google.maps.routing.v2.routes.computeroutes are blocked",
    )
  );
};

const stripHtml = (input: string | undefined): string => {
  if (!input) {
    return "Continue";
  }
  // prevent ReDoS flags
  return input.replace(/<[^>]{0,1000}>/g, "").trim() || "Continue";
};

const toLatLng = (
  value:
    | {
        latitude?: number;
        longitude?: number;
      }
    | {
        lat?: number;
        lng?: number;
      }
    | undefined,
): LatLng | undefined => {
  if (!value) {
    return undefined;
  }

  const latitude =
    "latitude" in value ? value.latitude : (value as { lat?: number }).lat;
  const longitude =
    "longitude" in value ? value.longitude : (value as { lng?: number }).lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return undefined;
  }

  return {
    latitude: latitude as number,
    longitude: longitude as number,
  };
};

const fetchLegacyDirections = async (
  start: LatLng,
  destination: LatLng,
  mode: "walking" | "driving" | "transit" | "bicycling",
): Promise<RouteData[]> => {
  const origin = `${start.latitude},${start.longitude}`;
  const destinationValue = `${destination.latitude},${destination.longitude}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationValue)}&mode=${mode}&alternatives=true&key=${GOOGLE_DIRECTIONS_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const response = await fetch(url, {
    method: "GET",
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  const data: DirectionsApiResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_message ||
        `Directions API request failed with status ${response.status}`,
    );
  }

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(
      data.error_message ||
        (data.status === "ZERO_RESULTS"
          ? "No route found between these locations"
          : `Directions API error: ${data.status}`),
    );
  }

  const routes = data.routes
    .map<RouteData | null>((route, index) => {
      const leg = route.legs?.[0];
      const polyline = route.overview_polyline?.points;
      if (!leg || !polyline || !leg.distance || !leg.duration) {
        return null;
      }

      const steps: DirectionStep[] = (leg.steps || []).map((step) => ({
        instruction: stripHtml(step.html_instructions),
        distance: step.distance?.text || "",
        duration: step.duration?.text || "",
        startLocation: toLatLng(step.start_location),
        endLocation: toLatLng(step.end_location),
        travelMode: step.travel_mode,
        transitLineName: step.transit_details?.line?.name,
        transitLineShortName: step.transit_details?.line?.short_name,
        transitVehicleType: step.transit_details?.line?.vehicle?.type,
        transitHeadsign: step.transit_details?.headsign,
        transitDepartureStop: step.transit_details?.departure_stop?.name,
        transitArrivalStop: step.transit_details?.arrival_stop?.name,
      }));

      return {
        id: `legacy-route-${index}`,
        polylinePoints: [],
        distance: leg.distance.text,
        duration: leg.duration.text,
        eta: formatEta(`${leg.duration.value}s`),
        steps,
        overviewPolyline: polyline,
      };
    })
    .filter((item): item is RouteData => item !== null);

  if (!routes.length) {
    throw new Error("No route polyline returned from Directions API");
  }

  return routes;
};

/**
 * Fetch directions from Google Directions API
 * @param start - Starting location (lat, lng)
 * @param destination - Destination location (lat, lng)
 * @param mode - Travel mode (walking, driving, transit, bicycling)
 * @returns Route data with polyline, distance, duration, and steps
 */
export const getDirections = async (
  start: LatLng | null,
  destination: LatLng | null,
  mode: "walking" | "driving" | "transit" | "bicycling",
): Promise<RouteData[]> => {
  // Validate inputs
  if (!start) {
    throw new Error("Start location is required");
  }

  if (!destination) {
    throw new Error("Destination location is required");
  }

  if (!GOOGLE_DIRECTIONS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }

  try {
    // Map modes to Routes API travel mode enum
    const modeMap: Record<
      "walking" | "driving" | "transit" | "bicycling",
      "WALK" | "DRIVE" | "TRANSIT" | "BICYCLE"
    > = {
      walking: "WALK",
      driving: "DRIVE",
      transit: "TRANSIT",
      bicycling: "BICYCLE",
    };

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const body = {
      origin: {
        location: {
          latLng: {
            latitude: start.latitude,
            longitude: start.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode: modeMap[mode],
      computeAlternativeRoutes: true,
      polylineEncoding: "ENCODED_POLYLINE",
      languageCode: "en-US",
      units: "METRIC",
    };

    // Create abort controller with 15 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_DIRECTIONS_API_KEY,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation.latLng.latitude,routes.legs.steps.startLocation.latLng.longitude,routes.legs.steps.endLocation.latLng.latitude,routes.legs.steps.endLocation.latLng.longitude,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.transitDetails.headsign,routes.legs.steps.transitDetails.stopDetails.arrivalStop.name,routes.legs.steps.transitDetails.stopDetails.departureStop.name,routes.legs.steps.transitDetails.transitLine.name,routes.legs.steps.transitDetails.transitLine.nameShort,routes.legs.steps.transitDetails.transitLine.vehicle.type,routes.legs.steps.transitDetails.transitLine.vehicle.name.text",
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timeoutId);

    const data: RoutesApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          `Routes API request failed with status ${response.status}`,
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found between these locations");
    }

    const routes = data.routes
      .map<RouteData | null>((route, index) => {
        const leg = route.legs?.[0];
        if (!leg) {
          return null;
        }

        const overviewPolyline = route.polyline?.encodedPolyline || "";
        if (!overviewPolyline) {
          return null;
        }

        const steps: DirectionStep[] = (leg.steps || []).map((step) => ({
          instruction: step.navigationInstruction?.instructions || "Continue",
          distance: formatDistance(step.distanceMeters),
          duration: formatDuration(step.staticDuration),
          startLocation: toLatLng(step.startLocation?.latLng),
          endLocation: toLatLng(step.endLocation?.latLng),
          travelMode: step.travelMode,
          transitLineName: step.transitDetails?.transitLine?.name,
          transitLineShortName: step.transitDetails?.transitLine?.nameShort,
          transitVehicleType:
            step.transitDetails?.transitLine?.vehicle?.name?.text ||
            step.transitDetails?.transitLine?.vehicle?.type,
          transitHeadsign: step.transitDetails?.headsign,
          transitDepartureStop:
            step.transitDetails?.stopDetails?.departureStop?.name,
          transitArrivalStop:
            step.transitDetails?.stopDetails?.arrivalStop?.name,
        }));

        return {
          id: `route-${index}`,
          polylinePoints: [] as LatLng[],
          distance: formatDistance(route.distanceMeters ?? leg.distanceMeters),
          duration: formatDuration(route.duration ?? leg.duration),
          eta: formatEta(route.duration ?? leg.duration),
          steps,
          overviewPolyline,
        };
      })
      .filter((item): item is RouteData => item !== null);

    if (routes.length === 0) {
      throw new Error("No route polyline returned from API");
    }

    return routes;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Directions request timed out. Please try again.");
      }

      if (start && destination && isRoutesBlockedError(error.message)) {
        return fetchLegacyDirections(start, destination, mode);
      }

      throw error;
    }
    throw new Error("Failed to fetch directions from Google API");
  }
};

/**
 * Decode Google's polyline encoding algorithm
 * @param polyline - Encoded polyline string
 * @returns Array of LatLng coordinates
 */
export const decodePolyline = (polyline: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};
