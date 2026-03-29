import { ConcreteGoogleStrategy } from "./concreteGoogleStrategy";
export class DrivingStrategy extends ConcreteGoogleStrategy {
  readonly apiMode = "DRIVE" as const;
  readonly googleTravelMode = "driving" as const;
 
  applyTimeToRoutesBody(
    body: Record<string, unknown>,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Date | null {
    const safe = super.applyTimeToRoutesBody(body, targetTime, timeMode);
    // Only driving supports real-time traffic awareness
    if (safe && timeMode === "leave") {
      body.routingPreference = "TRAFFIC_AWARE";
    }
    return safe;
  }
}
 