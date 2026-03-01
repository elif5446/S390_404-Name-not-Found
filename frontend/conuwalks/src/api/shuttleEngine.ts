import { LatLng } from "react-native-maps";
import { RouteData, DirectionStep } from "@/src/context/DirectionsContext";
import { distanceMetersBetween } from "@/src/utils/geometry";
import { getLocalShuttleSchedule, ShuttleSchedule } from "./shuttleSyncService";
import { getDirections } from "./directions";

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
  const h = d.match(/(\d+)\s*h/);
  const m = d.match(/(\d+)\s*min/);
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
};

const parseDist = (d?: string) => {
  if (!d) return 0;
  if (d.includes("km")) return parseFloat(d.replace(/[^\d.]/g, "")) * 1000;
  return parseFloat(d.replace(/[^\d.]/g, ""));
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
  const targetTotalMinutes =
    targetDate.getHours() * 60 + targetDate.getMinutes();

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
      if (
        h * 60 + m + SHUTTLE_DURATION_MINS + walkFromMins <=
        targetTotalMinutes
      ) {
        return times[i];
      }
    }
  }
  return null;
};

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

  const isSGWtoLOY =
    distToSGW < MAX_WALKING_DISTANCE && destToLOY < MAX_WALKING_DISTANCE;
  const isLOYtoSGW =
    distToLOY < MAX_WALKING_DISTANCE && destToSGW < MAX_WALKING_DISTANCE;

  if (!isSGWtoLOY && !isLOYtoSGW) return null;

  const OriginStop = isSGWtoLOY ? SGW_STOP : LOY_STOP;
  const DestStop = isSGWtoLOY ? LOY_STOP : SGW_STOP;
  const departingCampus = isSGWtoLOY ? "SGW" : "LOY";

  // fetch walking portion from api
  let walkToRoute: RouteData | null = null;
  let walkFromRoute: RouteData | null = null;
  let walkToMins = 0,
    walkFromMins = 0,
    walkToDist = 0,
    walkFromDist = 0;

  try {
    const w1 = await getDirections(startCoords, OriginStop, "walking");
    if (w1 && w1.length > 0) {
      walkToRoute = w1[0];
      walkToMins = parseDur(walkToRoute.duration);
      walkToDist = parseDist(walkToRoute.distance);
    }
  } catch (e) {
    walkToMins = Math.max(
      1,
      Math.round((isSGWtoLOY ? distToSGW : distToLOY) / 80),
    );
  }

  try {
    const w2 = await getDirections(DestStop, destinationCoords, "walking");
    if (w2 && w2.length > 0) {
      walkFromRoute = w2[0];
      walkFromMins = parseDur(walkFromRoute.duration);
      walkFromDist = parseDist(walkFromRoute.distance);
    }
  } catch (e) {
    walkFromMins = Math.max(
      1,
      Math.round((isSGWtoLOY ? destToLOY : destToSGW) / 80),
    );
  }

  // determine shuttle schedule factoring in walk times
  const schedule = await getLocalShuttleSchedule();
  const timeStr = getApplicableDeparture(
    departingCampus,
    targetTime,
    schedule,
    timeMode,
    walkToMins,
    walkFromMins,
  );
  if (!timeStr) return null;

  const [depH, depM] = timeStr.split(":").map(Number);
  const departureDate = new Date(targetTime);
  departureDate.setHours(depH, depM, 0, 0);
  const arrivalDate = new Date(departureDate);
  arrivalDate.setMinutes(arrivalDate.getMinutes() + SHUTTLE_DURATION_MINS);

  // calculate full trip duration (start walking -> finish final walk)
  let tripStart: Date, tripEnd: Date;
  if (timeMode === "leave") {
    tripStart = targetTime;
    tripEnd = new Date(arrivalDate.getTime() + walkFromMins * 60000);
  } else {
    tripEnd = targetTime;
    tripStart = new Date(departureDate.getTime() - walkToMins * 60000);
  }

  const totalDurationMins = Math.round(
    (tripEnd.getTime() - tripStart.getTime()) / 60000,
  );
  const totalDistance =
    (walkToDist || (isSGWtoLOY ? distToSGW : distToLOY)) +
    7200 +
    (walkFromDist || (isSGWtoLOY ? destToLOY : destToSGW));

  const formatDur = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
  const formatDist = (m: number) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  const etaString =
    timeMode === "leave"
      ? `${tripEnd.getHours()}:${tripEnd.getMinutes().toString().padStart(2, "0")} ETA`
      : `Leave by ${tripStart.getHours()}:${tripStart.getMinutes().toString().padStart(2, "0")}`;

  // assemble master route
  const fullPolyline: LatLng[] = [];
  const fullSteps: DirectionStep[] = [];

  // step a: walk to shuttle
  if (walkToRoute && walkToRoute.steps.length > 0) {
    fullSteps.push(...walkToRoute.steps);
    fullPolyline.push(...walkToRoute.polylinePoints);
  } else {
    fullSteps.push({
      instruction: `Walk to ${departingCampus === "SGW" ? "SGW Hall Building" : "Loyola Campus"} Shuttle Stop`,
      distance: formatDist(isSGWtoLOY ? distToSGW : distToLOY),
      duration: `${walkToMins} min`,
      travelMode: "WALK",
      startLocation: startCoords,
      endLocation: OriginStop,
      polylinePoints: [startCoords, OriginStop],
    });
    fullPolyline.push(startCoords, OriginStop);
  }

  // step b: shuttle trip
  const shuttlePolyline = isSGWtoLOY
    ? [...SHUTTLE_STREET_PATH]
    : [...SHUTTLE_STREET_PATH].reverse();

  fullSteps.push({
    instruction: `Take the Concordia Shuttle to ${isSGWtoLOY ? "Loyola Campus" : "SGW Hall Building"} (Departs at ${timeStr})`,
    distance: "7.2 km",
    duration: "30 min",
    travelMode: "TRANSIT",
    transitVehicleType: "Shuttle",
    transitLineShortName: "C",
    transitLineName: "Concordia Student Shuttle",
    startLocation: OriginStop,
    endLocation: DestStop,
    polylinePoints: shuttlePolyline,
  });
  fullPolyline.push(...shuttlePolyline);

  // step c: walk to destination
  if (walkFromRoute && walkFromRoute.steps.length > 0) {
    fullSteps.push(...walkFromRoute.steps);
    fullPolyline.push(...walkFromRoute.polylinePoints);
  } else {
    fullSteps.push({
      instruction: `Walk to destination`,
      distance: formatDist(isSGWtoLOY ? destToLOY : destToSGW),
      duration: `${walkFromMins} min`,
      travelMode: "WALK",
      startLocation: DestStop, endLocation: destinationCoords,
      polylinePoints: [DestStop, destinationCoords]
    });
    fullPolyline.push(DestStop, destinationCoords);
  }

  return {
    id: `shuttle-${Date.now()}`,
    isShuttle: true,
    requestMode: "transit",
    distance: formatDist(totalDistance),
    duration: formatDur(totalDurationMins),
    eta: etaString,
    overviewPolyline: "",
    polylinePoints: fullPolyline,
    departureDate: departureDate.toISOString(),
    arrivalDate: arrivalDate.toISOString(),
    steps: fullSteps,
  };
};
