import { LatLng } from "react-native-maps";
import { RouteData } from "@/src/context/DirectionsContext";
import { ITravelModeStrategy, RoutesApiTravelMode, GoogleTravelMode } from "./TravelModeStrategy";
import {
  clampToFuture,
  fetchRoutesApi,
  fetchLegacyApi,
  mapRoutesApiResponse,
  mapLegacyApiResponse,
  isRoutesBlockedError,
} from "@/src/api/googleDirectionsAPI";

export abstract class ConcreteGoogleStrategy implements ITravelModeStrategy {
  abstract readonly apiMode: RoutesApiTravelMode;
  abstract readonly googleTravelMode: GoogleTravelMode;

  /** Override to customize the fallback text when no instruction is available. */
  protected readonly continueFallback: string = "Continue on route";

  applyTimeToRoutesBody(
    body: Record<string, unknown>,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Date | null {
    const safe = clampToFuture(targetTime);
    if (safe && timeMode === "leave") {
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
    if (safe && timeMode === "leave") {
      url += `&departure_time=${Math.floor(safe.getTime() / 1000)}`;
    }
    return { url, safeTargetTime: safe };
  }

  buildStepInstruction(stripped: string, _rawStep: Record<string, unknown>): string {
    if (stripped && stripped !== "Continue") return stripped;
    return this.continueFallback;
  }

  async fetchRoutes(
    start: LatLng,
    destination: LatLng,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Promise<RouteData[]> {
    try {
      const { rawRoutes, safeTargetTime } = await fetchRoutesApi(start, destination, this, targetTime, timeMode);
      const routes = mapRoutesApiResponse(rawRoutes, safeTargetTime, timeMode, this.googleTravelMode, this);
      if (!routes.length) throw new Error("No route polyline returned from API");
      return routes;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") throw new Error("Directions request timed out. Please try again.");
        if (isRoutesBlockedError(error.message)) {
          const { rawRoutes, safeTargetTime } = await fetchLegacyApi(start, destination, this, targetTime, timeMode, this.googleTravelMode);
          const routes = mapLegacyApiResponse(rawRoutes, safeTargetTime, timeMode, this.googleTravelMode, this);
          if (!routes.length) throw new Error("No route polyline returned from Directions API");
          return routes;
        }
      }
      throw error;
    }
  }
}