import { ConcreteGoogleStrategy } from "./concreteGoogleStrategy";
import { clampToFuture } from "@/src/api/googleDirectionsAPI";

export class TransitStrategy extends ConcreteGoogleStrategy {
  readonly apiMode = "TRANSIT" as const;
  readonly googleTravelMode = "transit" as const;

  // Transit is the only mode that supports arrivalTime
  applyTimeToRoutesBody(
    body: Record<string, unknown>,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): Date | null {
    const safe = clampToFuture(targetTime);
    if (!safe) return null;

    if (timeMode === "arrive") {
      body.arrivalTime = safe.toISOString();
    } else {
      body.departureTime = safe.toISOString();
    }
    return safe;
  }

  // Transit is the only mode that supports arrival_time in the legacy API
  applyTimeToLegacyUrl(
    url: string,
    targetTime: Date | null,
    timeMode: "leave" | "arrive",
  ): { url: string; safeTargetTime: Date | null } {
    const safe = clampToFuture(targetTime);
    if (!safe) return { url, safeTargetTime: null };

    const timeSeconds = Math.floor(safe.getTime() / 1000);
    url += timeMode === "arrive"
      ? `&arrival_time=${timeSeconds}`
      : `&departure_time=${timeSeconds}`;

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
}