import { LatLng } from "react-native-maps";
import { DirectionStep, RouteData } from "@/src/context/DirectionsContext";
import { parseSeconds, formatDurationFromSeconds, calculateEtaFromSeconds } from "@/src/utils/time";
import { ITravelModeStrategy, RoutesApiTravelMode } from "../components/outdoorDirections/TravelModeStrategy";
import { TravelMode } from "../components/outdoorDirections/TravelModeStrategy";

const GOOGLE_DIRECTIONS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";

export const decodePolyline = (polyline: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = (polyline.codePointAt(index++) ?? 0) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = (polyline.codePointAt(index++) ?? 0) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
};

// Formatting helpers
export const formatDistance = (meters: number | undefined): string => {
  if (!meters || meters <= 0) return "0 m";
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
};

export const stripHtml = (input: string | undefined): string =>
  input ? input.replaceAll(/<[^>]{0,1000}>/g, "").trim() || "Continue" : "Continue";

export const toLatLng = (
  value:
    | { latitude?: number; longitude?: number }
    | { lat?: number; lng?: number }
    | undefined,
): LatLng | undefined => {
  if (!value) return undefined;
  const latitude = "latitude" in value ? value.latitude : (value as { lat?: number }).lat;
  const longitude = "longitude" in value ? value.longitude : (value as { lng?: number }).lng;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude: latitude as number, longitude: longitude as number };
};

export const clampToFuture = (targetTime: Date | null): Date | null => {
  if (!targetTime) return null;
  return targetTime.getTime() < Date.now() ? new Date(Date.now() + 10_000) : targetTime;
};

export const isRoutesBlockedError = (message: string): boolean => {
  const n = message.toLowerCase();
  return (
    n.includes("computeroutes are blocked") ||
    n.includes("routes.googleapis.com") ||
    n.includes("google.maps.routing.v2.routes.computeroutes") ||
    n.includes("routes api has not been used") ||
    n.includes("method google.maps.routing.v2.routes.computeroutes are blocked")
  );
};

// Routes API (v2) fetch
export const fetchRoutesApi = async (
  start: LatLng,
  destination: LatLng,
  strategy: ITravelModeStrategy,
  targetTime: Date | null,
  timeMode: "leave" | "arrive",
): Promise<{ rawRoutes: unknown[]; safeTargetTime: Date | null }> => {
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: start.latitude, longitude: start.longitude } } },
    destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
    travelMode: strategy.apiMode as RoutesApiTravelMode,
    computeAlternativeRoutes: true,
    polylineEncoding: "ENCODED_POLYLINE",
    languageCode: "en-US",
    units: "METRIC",
  };

  const safeTargetTime = strategy.applyTimeToRoutesBody(body, targetTime, timeMode);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_DIRECTIONS_API_KEY,
      "X-Goog-FieldMask": [
        "routes.distanceMeters",
        "routes.duration",
        "routes.polyline.encodedPolyline",
        "routes.legs.distanceMeters",
        "routes.legs.duration",
        "routes.legs.steps.travelMode",
        "routes.legs.steps.distanceMeters",
        "routes.legs.steps.staticDuration",
        "routes.legs.steps.startLocation.latLng.latitude",
        "routes.legs.steps.startLocation.latLng.longitude",
        "routes.legs.steps.endLocation.latLng.latitude",
        "routes.legs.steps.endLocation.latLng.longitude",
        "routes.legs.steps.navigationInstruction.instructions",
        "routes.legs.steps.transitDetails.headsign",
        "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
        "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
        "routes.legs.steps.transitDetails.transitLine.name",
        "routes.legs.steps.transitDetails.transitLine.nameShort",
        "routes.legs.steps.transitDetails.transitLine.vehicle.type",
        "routes.legs.steps.transitDetails.transitLine.vehicle.name.text",
        "routes.legs.steps.polyline.encodedPolyline",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  clearTimeout(timeoutId);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error?.message ?? `Routes API failed: ${response.status}`);
  if (!data.routes?.length) throw new Error("No route found between these locations");

  return { rawRoutes: data.routes, safeTargetTime };
};


// Legacy Directions API fetch
export const fetchLegacyApi = async (
  start: LatLng,
  destination: LatLng,
  strategy: ITravelModeStrategy,
  targetTime: Date | null,
  timeMode: "leave" | "arrive",
  modeString: string,
): Promise<{ rawRoutes: unknown[]; safeTargetTime: Date | null }> => {
  const origin = `${start.latitude},${start.longitude}`;
  const dest = `${destination.latitude},${destination.longitude}`;
  const baseUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=${modeString}&alternatives=true&key=${GOOGLE_DIRECTIONS_API_KEY}`;

  const { url, safeTargetTime } = strategy.applyTimeToLegacyUrl(baseUrl, targetTime, timeMode);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  const response = await fetch(url, { method: "GET", signal: controller.signal });
  clearTimeout(timeoutId);

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_message ?? `Directions API failed: ${response.status}`);
  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(
      data.error_message ??
        (data.status === "ZERO_RESULTS"
          ? "No route found between these locations"
          : `Directions API error: ${data.status}`),
    );
  }

  return { rawRoutes: data.routes, safeTargetTime };
};

// Route mappers — convert raw API responses to RouteData[]
export const mapRoutesApiResponse = (
  rawRoutes: unknown[],
  safeTargetTime: Date | null,
  timeMode: "leave" | "arrive",
  modeKey: string,
  strategy: ITravelModeStrategy,
): RouteData[] =>
  (rawRoutes as any[])
    .map((route, index): RouteData | null => {
      const leg = route.legs?.[0];
      const overviewPolyline: string = route.polyline?.encodedPolyline ?? "";
      if (!leg || !overviewPolyline) return null;

      const steps: DirectionStep[] = ((leg.steps ?? []) as any[]).map(step => {
        const polylineStr: string | undefined = step.polyline?.encodedPolyline;
        const instr = strategy.buildStepInstruction(
          stripHtml(step.navigationInstruction?.instructions),
          step,
        );

        return {
          instruction: instr,
          distance: formatDistance(step.distanceMeters),
          duration: formatDurationFromSeconds(parseSeconds(step.staticDuration)),
          startLocation: toLatLng(step.startLocation?.latLng),
          endLocation: toLatLng(step.endLocation?.latLng),
          travelMode: normalizeTravelMode(step.travelMode),
          transitLineName: step.transitDetails?.transitLine?.name,
          transitLineShortName: step.transitDetails?.transitLine?.nameShort,
          transitVehicleType:
            step.transitDetails?.transitLine?.vehicle?.name?.text ??
            step.transitDetails?.transitLine?.vehicle?.type,
          transitHeadsign: step.transitDetails?.headsign,
          transitDepartureStop: step.transitDetails?.stopDetails?.departureStop?.name,
          transitArrivalStop: step.transitDetails?.stopDetails?.arrivalStop?.name,
          polylinePoints: polylineStr ? decodePolyline(polylineStr) : [],
        };
      });

      const outdoorSeconds = parseSeconds(route.duration ?? leg.duration ?? "0s") || 0;

      return {
        id: `route-${index}`,
        requestMode: modeKey as TravelMode,
        polylinePoints: [] as LatLng[],
        distance: formatDistance(route.distanceMeters ?? leg.distanceMeters),
        baseDurationSeconds: outdoorSeconds,
        duration: formatDurationFromSeconds(outdoorSeconds),
        eta: calculateEtaFromSeconds(outdoorSeconds, safeTargetTime, timeMode),
        steps,
        overviewPolyline,
      };
    })
    .filter((r): r is RouteData => r !== null);

export const mapLegacyApiResponse = (
  rawRoutes: unknown[],
  safeTargetTime: Date | null,
  timeMode: "leave" | "arrive",
  modeKey: string,
  strategy: ITravelModeStrategy,
): RouteData[] =>
  (rawRoutes as any[])
    .map((route, index): RouteData | null => {
      const leg = route.legs?.[0];
      const polyline: string | undefined = route.overview_polyline?.points;
      if (!leg || !polyline || !leg.distance || !leg.duration) return null;

      const steps: DirectionStep[] = ((leg.steps ?? []) as any[]).map(step => {
        const polylineStr: string | undefined = step.polyline?.points;
        const instr = strategy.buildStepInstruction(stripHtml(step.html_instructions), step);

        return {
          instruction: instr,
          distance: formatDistance(step.distance?.value),
          duration: step.duration?.text ?? "",
          startLocation: toLatLng(step.start_location),
          endLocation: toLatLng(step.end_location),
          travelMode: normalizeTravelMode(step.travel_mode),
          transitLineName: step.transit_details?.line?.name,
          transitLineShortName: step.transit_details?.line?.short_name,
          transitVehicleType: step.transit_details?.line?.vehicle?.type,
          transitHeadsign: step.transit_details?.headsign,
          transitDepartureStop: step.transit_details?.departure_stop?.name,
          transitArrivalStop: step.transit_details?.arrival_stop?.name,
          polylinePoints: polylineStr ? decodePolyline(polylineStr) : [],
        };
      });

      const outdoorSeconds = parseSeconds(`${leg.duration.value}s`);

      return {
        id: `legacy-route-${index}`,
        requestMode: modeKey as TravelMode,
        polylinePoints: [] as LatLng[],
        distance: leg.distance.text,
        baseDurationSeconds: outdoorSeconds,
        duration: formatDurationFromSeconds(outdoorSeconds),
        eta: calculateEtaFromSeconds(outdoorSeconds, safeTargetTime, timeMode),
        steps,
        overviewPolyline: polyline,
      };
    })
    .filter((r): r is RouteData => r !== null);


// Shared normalizeTravelMode
export const normalizeTravelMode = (
  mode?: string,
): "walking" | "driving" | "transit" | "bicycling" | undefined => {
  if (!mode) return undefined;
  const u = mode.toUpperCase();
  if (u.includes("WALK")) return "walking";
  if (u.includes("DRIVE")) return "driving";
  if (u.includes("BICYCLE")) return "bicycling";
  if (u === "TRANSIT") return "transit";
  return undefined;
};