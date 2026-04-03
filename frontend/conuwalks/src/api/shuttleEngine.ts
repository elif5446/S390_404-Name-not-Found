import { LatLng } from "react-native-maps";
import { RouteData, DirectionStep } from "@/src/context/DirectionsContext";
import { distanceMetersBetween } from "@/src/utils/geometry";
import { getLocalShuttleSchedule, ShuttleSchedule } from "./shuttleSyncService";
import { getDirections } from "@/src/outdoorDirections/directionsService";

const SGW_STOP: LatLng = { latitude: 45.457795, longitude: -73.6389265 };
const LOY_STOP: LatLng = { latitude: 45.4970723, longitude: -73.578448 };
const MAX_WALKING_DISTANCE = 800;
const SHUTTLE_DURATION_MINS = 30;

const SHUTTLE_STREET_PATH: LatLng[] = [
  SGW_STOP,
  { latitude: 45.4592248, longitude: -73.6372367 },
  { latitude: 45.4597102, longitude: -73.6366037 },
  { latitude: 45.4606095, longitude: -73.6348656 },
  { latitude: 45.4616931, longitude: -73.6328217 },
  { latitude: 45.4636947, longitude: -73.6290506 },
  { latitude: 45.4638866, longitude: -73.6287716 },
  { latitude: 45.4650416, longitude: -73.6266527 },
  { latitude: 45.4659183, longitude: -73.6249092 },
  { latitude: 45.4667911, longitude: -73.6232784 },
  { latitude: 45.467773, longitude: -73.6214063 },
  { latitude: 45.4704441, longitude: -73.6162135 },
  { latitude: 45.4713243, longitude: -73.6145076 },
  { latitude: 45.4726786, longitude: -73.6118844 },
  { latitude: 45.4740103, longitude: -73.6092398 },
  { latitude: 45.4744504, longitude: -73.6087409 },
  { latitude: 45.4759926, longitude: -73.6069706 },
  { latitude: 45.4774295, longitude: -73.6053023 },
  { latitude: 45.4791485, longitude: -73.6033175 },
  { latitude: 45.4810555, longitude: -73.6011502 },
  { latitude: 45.4823456, longitude: -73.5996267 },
  { latitude: 45.4841998, longitude: -73.5975024 },
  { latitude: 45.4856102, longitude: -73.5958931 },
  { latitude: 45.4861969, longitude: -73.5952225 },
  { latitude: 45.4868287, longitude: -73.5944823 },
  { latitude: 45.4870694, longitude: -73.5940263 },
  { latitude: 45.4877802, longitude: -73.5921326 },
  { latitude: 45.4879983, longitude: -73.5918376 },
  { latitude: 45.4892017, longitude: -73.5903141 },
  { latitude: 45.4907586, longitude: -73.5886136 },
  { latitude: 45.4915484, longitude: -73.5877124 },
  { latitude: 45.4928758, longitude: -73.5856202 },
  { latitude: 45.4935677, longitude: -73.584483 },
  { latitude: 45.4938009, longitude: -73.5842148 },
  { latitude: 45.4947748, longitude: -73.5833833 },
  { latitude: 45.4958653, longitude: -73.582423 },
  { latitude: 45.4966249, longitude: -73.5817793 },
  { latitude: 45.4960646, longitude: -73.5800466 },
  { latitude: 45.4957487, longitude: -73.5792902 },
  { latitude: 45.4961511, longitude: -73.5792366 },
  { latitude: 45.4963504, longitude: -73.5790864 },
  LOY_STOP,
];

export type ShuttleRouteData = RouteData & {
  departureDate: string;
  arrivalDate: string;
};

const parseDur = (d?: string) => {
  if (!d) return 0;
  const h = /(\d{1,5})\s{0,5}h/.exec(d);
  const m = /(\d{1,5})\s{0,5}min/.exec(d);
  return (h ? Number.parseInt(h[1], 10) * 60 : 0) + (m ? Number.parseInt(m[1], 10) : 0);
};

const parseDist = (d?: string) => {
  if (!d) return 0;
  if (d.includes("km")) return Number.parseFloat(d.replaceAll(/[^\d.]/g, "")) * 1000;
  return Number.parseFloat(d.replaceAll(/[^\d.]/g, ""));
};

/**
 * Finds the next available departure time from the schedule based on the current time.
 */
const getApplicableDeparture = (
  campus: "SGW" | "LOY",
  targetDate: Date,
  schedule: ShuttleSchedule,
  timeMode: "leave" | "arrive",
  walkToMins: number,
  walkFromMins: number,
): string | null => {
  const day = targetDate.getDay();
  if (day === 0 || day === 6) return null; // No weekend service

  const scheduleType = day === 5 ? "friday" : "monday_thursday";
  const times: string[] = schedule[scheduleType][campus];

  if (!times || !Array.isArray(times)) return null;

  const targetTotalMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

  if (timeMode === "leave") {
    // find the first bus that departs >= target time
    const earliestArrivalAtStop = targetTotalMinutes + walkToMins;
    for (const timeStr of times) {
      const [h, m] = timeStr.split(":").map(Number);
      if (h * 60 + m >= earliestArrivalAtStop) return timeStr;
    }
  } else {
    // find the latest bus that arrives <= target time
    for (let i = times.length - 1; i >= 0; i--) {
      const [h, m] = times[i].split(":").map(Number);
      if (h * 60 + m + SHUTTLE_DURATION_MINS + walkFromMins <= targetTotalMinutes) {
        return times[i];
      }
    }
  }
  return null;
};

//  module-level formatters 
const formatDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const formatDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

//  helper: fetch one walk leg, falling back to a straight-line estimate 
type WalkLeg = { route: RouteData | null; mins: number; dist: number };

const fetchWalkLeg = async (from: LatLng, to: LatLng, fallbackDist: number): Promise<WalkLeg> => {
  try {
    const results = await getDirections(from, to, "walking");
    if (results && results.length > 0) {
      const route = results[0];
      return { route, mins: parseDur(route.duration), dist: parseDist(route.distance) };
    }
  } catch (e) {
    console.log("skipping...", e);
  }
  return { route: null, mins: Math.max(1, Math.round(fallbackDist / 80)), dist: 0 };
};

//  helper: compute the overall trip window 
const computeTripWindow = (
  timeMode: "leave" | "arrive",
  targetTime: Date,
  departureDate: Date,
  arrivalDate: Date,
  walkToMins: number,
  walkFromMins: number,
) => {
  const tripStart = timeMode === "leave" ? targetTime : new Date(departureDate.getTime() - walkToMins * 60000);
  const tripEnd = timeMode === "leave" ? new Date(arrivalDate.getTime() + walkFromMins * 60000) : targetTime;
  return { tripStart, tripEnd, totalDurationMins: Math.round((tripEnd.getTime() - tripStart.getTime()) / 60000) };
};

//  helper: build a walk leg (steps + polyline), using API result or fallback
const buildWalkLeg = (
  walkRoute: RouteData | null,
  instruction: string,
  distanceStr: string,
  durationMins: number,
  from: LatLng,
  to: LatLng,
): { steps: DirectionStep[]; polyline: LatLng[] } => {
  if (walkRoute && walkRoute.steps.length > 0) {
    return { steps: walkRoute.steps, polyline: walkRoute.polylinePoints };
  }
  return {
    steps: [{ instruction, distance: distanceStr, duration: `${durationMins} min`, travelMode: "walking", startLocation: from, endLocation: to, polylinePoints: [from, to] }],
    polyline: [from, to],
  };
};

//  main entry point 
export const getShuttleRouteIfApplicable = async (
  startCoords: LatLng,
  destinationCoords: LatLng,
  targetTime: Date = new Date(),
  timeMode: "leave" | "arrive" = "leave",
): Promise<ShuttleRouteData | null> => {
  const distToSGW = distanceMetersBetween(startCoords, SGW_STOP);
  const distToLOY = distanceMetersBetween(startCoords, LOY_STOP);
  const destToSGW = distanceMetersBetween(destinationCoords, SGW_STOP);
  const destToLOY = distanceMetersBetween(destinationCoords, LOY_STOP);

  const isSGWtoLOY = distToSGW < MAX_WALKING_DISTANCE && destToLOY < MAX_WALKING_DISTANCE;
  const isLOYtoSGW = distToLOY < MAX_WALKING_DISTANCE && destToSGW < MAX_WALKING_DISTANCE;

  if (!isSGWtoLOY && !isLOYtoSGW) return null;

  const originStop = isSGWtoLOY ? SGW_STOP : LOY_STOP;
  const destStop = isSGWtoLOY ? LOY_STOP : SGW_STOP;
  const departingCampus = isSGWtoLOY ? "SGW" : "LOY";
  const startDistMeters = isSGWtoLOY ? distToSGW : distToLOY;
  const destDistMeters = isSGWtoLOY ? destToLOY : destToSGW;

  const walkTo = await fetchWalkLeg(startCoords, originStop, startDistMeters);
  const walkFrom = await fetchWalkLeg(destStop, destinationCoords, destDistMeters);

  const schedule = await getLocalShuttleSchedule();
  const timeStr = getApplicableDeparture(departingCampus, targetTime, schedule, timeMode, walkTo.mins, walkFrom.mins);
  if (!timeStr) return null;

  const [depH, depM] = timeStr.split(":").map(Number);
  const departureDate = new Date(targetTime);
  departureDate.setHours(depH, depM, 0, 0);
  const arrivalDate = new Date(departureDate);
  arrivalDate.setMinutes(arrivalDate.getMinutes() + SHUTTLE_DURATION_MINS);

  const { tripStart, tripEnd, totalDurationMins } = computeTripWindow(
    timeMode, targetTime, departureDate, arrivalDate, walkTo.mins, walkFrom.mins,
  );

  const totalDistance = (walkTo.dist || startDistMeters) + 7200 + (walkFrom.dist || destDistMeters);

  const etaString =
    timeMode === "leave"
      ? `${tripEnd.getHours()}:${tripEnd.getMinutes().toString().padStart(2, "0")} ETA`
      : `Leave by ${tripStart.getHours()}:${tripStart.getMinutes().toString().padStart(2, "0")}`;

  const shuttlePolyline = isSGWtoLOY ? [...SHUTTLE_STREET_PATH] : [...SHUTTLE_STREET_PATH].reverse();
  const stopLabel = departingCampus === "SGW" ? "SGW Hall Building" : "Loyola Campus";
  const destLabel = isSGWtoLOY ? "Loyola Campus" : "SGW Hall Building";

  const walkToLeg = buildWalkLeg(walkTo.route, `Walk to ${stopLabel} Shuttle Stop`, formatDist(startDistMeters), walkTo.mins, startCoords, originStop);
  const shuttleStep: DirectionStep = {
    instruction: `Take the Concordia Shuttle to ${destLabel} (Departs at ${timeStr})`,
    distance: "7.2 km",
    duration: "30 min",
    travelMode: "transit",
    transitVehicleType: "Shuttle",
    transitLineShortName: "C",
    transitLineName: "Concordia Student Shuttle",
    startLocation: originStop,
    endLocation: destStop,
    polylinePoints: shuttlePolyline,
  };
  const walkFromLeg = buildWalkLeg(walkFrom.route, `Walk to destination`, formatDist(destDistMeters), walkFrom.mins, destStop, destinationCoords);

  return {
    id: `shuttle-${Date.now()}`,
    isShuttle: true,
    requestMode: "transit",
    distance: formatDist(totalDistance),
    duration: formatDur(totalDurationMins),
    baseDurationSeconds: totalDurationMins * 60,
    eta: etaString,
    overviewPolyline: "",
    polylinePoints: [...walkToLeg.polyline, ...shuttlePolyline, ...walkFromLeg.polyline],
    departureDate: departureDate.toISOString(),
    arrivalDate: arrivalDate.toISOString(),
    steps: [...walkToLeg.steps, shuttleStep, ...walkFromLeg.steps],
  };
};
