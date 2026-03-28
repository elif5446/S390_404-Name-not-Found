import { LatLng } from "react-native-maps";
import { RouteData } from "@/src/context/DirectionsContext";

export type TravelMode = "walking" | "driving" | "transit" | "bicycling"| "shuttle";
export type GoogleTravelMode = "walking" | "driving" | "transit" | "bicycling";
export type RoutesApiTravelMode = "WALK" | "DRIVE" | "TRANSIT" | "BICYCLE";

/**
 * Each travel mode strategy encapsulates:
 *  - how it mutates the Routes API request body for time selection
 *  - how it mutates a legacy Directions API URL for time selection
 *  - how it builds a human-readable fallback instruction from a raw step
 *  - the API travel mode enum value it maps to (null for non-Google modes)
 */
export interface ITravelModeStrategy {
  /** The Routes API / Directions API enum for this mode. Null for shuttle. */
  readonly apiMode: RoutesApiTravelMode | null;

  /**
   * Mutates `body` in-place to add time-selection fields for the Routes API.
   * Returns the safe (possibly clamped to future) target time actually used.
   */
  applyTimeToRoutesBody(
    body: Record<string, unknown>,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Date | null;

  /**
   * Returns a new URL string with time-selection params appended for the
   * legacy Directions API.
   */
  applyTimeToLegacyUrl(
    url: string,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): { url: string; safeTargetTime: Date | null };

  /**
   * Builds a human-readable navigation instruction from a raw step object.
   * Receives the already-stripped (no HTML) instruction string so each
   * strategy only needs to handle its own fallback logic.
   */
  buildStepInstruction(strippedInstruction: string, rawStep: Record<string, unknown>): string;

  /**
   * Fetches and returns route data for this mode.
   * Google-based strategies delegate to the shared API helpers;
   * the shuttle strategy reads the local schedule directly.
   */
  fetchRoutes(
    start: LatLng,
    destination: LatLng,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Promise<RouteData[]>;
}