import { LatLng } from "react-native-maps";
import { RouteData } from "@/src/context/DirectionsContext";
import {GoogleTravelMode } from "./TravelModeStrategy";
import {getStrategy} from "./travelModeStrategyFactory"
// Re-export decodePolyline so existing imports keep working
export { decodePolyline } from "@/src/api/googleDirectionsAPI";

/**
 * Fetch directions for the given travel mode.
 *
 * This function is now a thin orchestrator: it validates inputs, resolves
 * the correct strategy via the factory, and delegates all API/schedule logic
 * to that strategy. Adding a new travel mode means adding a new strategy
 * class — this function never needs to change.
 *
 * @param start       - Starting location
 * @param destination - Destination location
 * @param mode        - One of: walking | driving | transit | bicycling | shuttle
 * @param targetTime  - User-selected time (null = now)
 * @param timeMode    - Whether targetTime is a departure or arrival time
 */
export const getDirections = async (
  start: LatLng | null,
  destination: LatLng | null,
  mode: GoogleTravelMode,
  targetTime: Date | null = null,
  timeMode: "leave" | "arrive" = "leave",
): Promise<RouteData[]> => {
  if (!start) throw new Error("Start location is required");
  if (!destination) throw new Error("Destination location is required");

  const strategy = getStrategy(mode);
  return strategy.fetchRoutes(start, destination, targetTime, timeMode);
};