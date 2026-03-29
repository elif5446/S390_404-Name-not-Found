import { ConcreteGoogleStrategy } from "./concreteGoogleStrategy";
 
export class BicyclingStrategy extends ConcreteGoogleStrategy {
  readonly apiMode = "BICYCLE" as const;
  readonly googleTravelMode = "bicycling" as const;
}