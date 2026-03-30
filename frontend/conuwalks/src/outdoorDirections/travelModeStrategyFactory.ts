import { GoogleTravelMode, ITravelModeStrategy } from "./TravelModeStrategy";
import { WalkingStrategy } from "./walkingStrategy";
import { DrivingStrategy } from "./drivingStrategy";
import { TransitStrategy } from "./transitStrategy";
import { BicyclingStrategy } from "./bicyclingStrategy";

// Strategies are stateless so we only need one instance each
const strategies: Record<GoogleTravelMode, ITravelModeStrategy> = {
  walking: new WalkingStrategy(),
  driving: new DrivingStrategy(),
  transit: new TransitStrategy(),
  bicycling: new BicyclingStrategy(),
};

/**
 * Returns the strategy for the given travel mode.
 * Throws if an unknown mode is passed so callers get a loud failure
 * rather than a silent undefined.
 */
export const getStrategy = (mode: GoogleTravelMode): ITravelModeStrategy => {
  const strategy = strategies[mode];
  if (!strategy) throw new Error(`No strategy registered for travel mode: "${mode}"`);
  return strategy;
};