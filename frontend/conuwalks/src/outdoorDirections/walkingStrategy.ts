import { ConcreteGoogleStrategy } from "./concreteGoogleStrategy";
 
export class WalkingStrategy extends ConcreteGoogleStrategy {
  readonly apiMode = "WALK" as const;
  readonly googleTravelMode = "walking" as const;
  protected readonly continueFallback = "Walk to next location";
}