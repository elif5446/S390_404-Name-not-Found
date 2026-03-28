import { LatLng } from "react-native-maps";
import { RouteData } from "@/src/context/DirectionsContext";
import { ITravelModeStrategy } from "./TravelModeStrategy";
import {
  clampToFuture,
  fetchRoutesApi,
  fetchLegacyApi,
  mapRoutesApiResponse,
  mapLegacyApiResponse,
  isRoutesBlockedError,
} from "@/src/api/googleDirectionsAPI";

export class TransitStrategy implements ITravelModeStrategy {
  readonly apiMode = "TRANSIT" as const;

  applyTimeToRoutesBody(
    body: Record<string, unknown>,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Date | null {
    const safe = clampToFuture(targetTime);
    if (!safe) return null;

    // Transit is the only mode that supports arrivalTime
    if (timeMode === "arrive") {
      body.arrivalTime = safe.toISOString();
    } else {
      body.departureTime = safe.toISOString();
    }
    return safe;
  }

  applyTimeToLegacyUrl(
    url: string,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): { url: string; safeTargetTime: Date | null } {
    const safe = clampToFuture(targetTime);
    if (!safe) return { url, safeTargetTime: null };

    const timeSeconds = Math.floor(safe.getTime() / 1000);
    if (timeMode === "arrive") {
      url += `&arrival_time=${timeSeconds}`;
    } else {
      url += `&departure_time=${timeSeconds}`;
    }
    return { url, safeTargetTime: safe };
  }

  buildStepInstruction(stripped: string, rawStep: Record<string, unknown>): string {
    if (stripped && stripped !== "Continue") return stripped;

    // Routes API shape
    const td = (rawStep as any).transitDetails;
    if (td) {
      const vehicle = td.transitLine?.vehicle?.name?.text ?? "Transit";
      const line = td.transitLine?.nameShort ?? "";
      const headsign = td.headsign ? ` toward ${td.headsign}` : "";
      return `Take ${vehicle} ${line}${headsign}`.trim();
    }

    // Legacy API shape
    const ltd = (rawStep as any).transit_details;
    if (ltd) {
      const vehicle = ltd.line?.vehicle?.name ?? "Transit";
      const line = ltd.line?.short_name ?? "";
      const headsign = ltd.headsign ? ` toward ${ltd.headsign}` : "";
      return `Take ${vehicle} ${line}${headsign}`.trim();
    }

    return "Take transit";
  }

  async fetchRoutes(
    start: LatLng,
    destination: LatLng,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Promise<RouteData[]> {
    try {
      const { rawRoutes, safeTargetTime } = await fetchRoutesApi(start, destination, this, targetTime, timeMode);
      const routes = mapRoutesApiResponse(rawRoutes, safeTargetTime, timeMode, "transit", this);
      if (!routes.length) throw new Error("No route polyline returned from API");
      return routes;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") throw new Error("Directions request timed out. Please try again.");
        if (isRoutesBlockedError(error.message)) {
          const { rawRoutes, safeTargetTime } = await fetchLegacyApi(start, destination, this, targetTime, timeMode, "transit");
          const routes = mapLegacyApiResponse(rawRoutes, safeTargetTime, timeMode, "transit", this);
          if (!routes.length) throw new Error("No route polyline returned from Directions API");
          return routes;
        }
      }
      throw error;
    }
  }
}