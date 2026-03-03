import { getShuttleRouteIfApplicable } from "../../api/shuttleEngine";
import { distanceMetersBetween } from "@/src/utils/geometry";
import { getLocalShuttleSchedule } from "../../api/shuttleSyncService";
import { getDirections } from "../../api/directions";
import { LatLng } from "react-native-maps";

jest.mock("@/src/utils/geometry", () => ({
  distanceMetersBetween: jest.fn(),
}));

jest.mock("../../api/shuttleSyncService", () => ({
  getLocalShuttleSchedule: jest.fn(),
}));

jest.mock("../../api/directions", () => ({
  getDirections: jest.fn(),
}));

const mockDistanceMetersBetween = distanceMetersBetween as jest.Mock;
const mockGetLocalShuttleSchedule = getLocalShuttleSchedule as jest.Mock;
const mockGetDirections = getDirections as jest.Mock;

describe("shuttleRouting.ts", () => {
  const START_SGW: LatLng = { latitude: 45.457, longitude: -73.638 };
  const DEST_LOY: LatLng = { latitude: 45.497, longitude: -73.578 };
  const FAR_AWAY: LatLng = { latitude: 0, longitude: 0 };

  const mockSchedule = {
    monday_thursday: {
      SGW: ["09:00", "09:30", "10:00", "10:30"],
      LOY: ["09:15", "09:45", "10:15", "10:45"],
    },
    friday: {
      SGW: ["09:00", "10:00"],
      LOY: ["09:30", "10:30"],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalShuttleSchedule.mockResolvedValue(mockSchedule);
    // default distance mock: everything is far away unless overridden
    mockDistanceMetersBetween.mockReturnValue(5000);
    // default directions mock: walking takes 5 mins and 400 meters
    mockGetDirections.mockResolvedValue([
      {
        duration: "5 min",
        distance: "400 m",
        steps: [{ instruction: "Walk straight", polylinePoints: [] }],
        polylinePoints: [],
      },
    ]);
  });

  describe("Distance Eligibility", () => {
    it("returns null if the start location is too far from both campuses", async () => {
      // start is far, dest is close to loy (distance to loy < 800)
      mockDistanceMetersBetween.mockImplementation((coord1, coord2) => {
        if (coord1 === DEST_LOY && coord2.latitude > 45.49) return 100; // Close to LOY
        return 5000; // Far from everything else
      });

      const result = await getShuttleRouteIfApplicable(FAR_AWAY, DEST_LOY);
      expect(result).toBeNull();
    });

    it("returns null if the destination is too far from both campuses", async () => {
      mockDistanceMetersBetween.mockImplementation((coord1, coord2) => {
        if (coord1 === START_SGW && coord2.latitude < 45.46) return 100; // Close to SGW
        return 5000;
      });

      const result = await getShuttleRouteIfApplicable(START_SGW, FAR_AWAY);
      expect(result).toBeNull();
    });
  });

  describe("Schedule and Time", () => {
    beforeEach(() => {
      // setup a valid sgw -> loy proximity for these tests
      mockDistanceMetersBetween.mockImplementation((coord1, coord2) => {
        // start is close to sgw, dest is close to loy
        if (coord1 === START_SGW && coord2.latitude < 45.49) return 200;
        if (coord1 === DEST_LOY && coord2.latitude > 45.49) return 200;
        return 5000;
      });
    });

    it("returns null on weekends (Sunday)", async () => {
      // sunday, march 1, 2026
      const sunday = new Date(2026, 2, 1, 10, 0);
      const result = await getShuttleRouteIfApplicable(
        START_SGW,
        DEST_LOY,
        sunday,
      );
      expect(result).toBeNull();
    });

    it("returns null if no buses are left for the day", async () => {
      // monday, 11:00 pm (schedule only goes up to 10:30)
      const lateNight = new Date(2026, 2, 2, 23, 0);
      const result = await getShuttleRouteIfApplicable(
        START_SGW,
        DEST_LOY,
        lateNight,
        "leave",
      );
      expect(result).toBeNull();
    });
  });

  describe("Successful Route Generation", () => {
    beforeEach(() => {
      // setup a valid loy -> sgw proximity
      mockDistanceMetersBetween.mockImplementation((coord, targetStop) => {
        if (coord === START_SGW || coord === DEST_LOY) return 200; // Everything is close
        return 5000;
      });
    });

    it("calculates 'leave' time correctly and uses walking API data", async () => {
      // monday, 9:05 am. next bus from sgw should be 09:30 (accounting for 5 min walk)
      const mondayMorning = new Date(2026, 2, 2, 9, 5);

      const result = await getShuttleRouteIfApplicable(
        START_SGW,
        DEST_LOY,
        mondayMorning,
        "leave",
      );

      expect(result).not.toBeNull();
      expect(result?.isShuttle).toBe(true);

      // walk to shuttle, shuttle, walk to dest
      expect(result?.steps.length).toBe(3);
      expect(result?.steps[1].travelMode).toBe("TRANSIT");
      expect(result?.steps[1].transitVehicleType).toBe("Shuttle");
      expect(result?.steps[1].instruction).toContain("Departs at 09:30");

      // eta should be calculated based on arrival + walk time
      expect(result?.eta).toContain("ETA");
    });

    it("calculates 'arrive' time correctly and falls back if walking API fails", async () => {
      // force walking api to fail to test the manual fallback distance calculations
      mockGetDirections.mockRejectedValue(new Error("API Failed"));

      // monday, 10:20 am. target arrival.
      // walk from loy is ~3 mins. shuttle is 30 mins. walk to sgw is ~3 mins.
      // total travel ~36 mins. must catch a bus before 9:44. the 09:30 sgw bus works.
      const targetArrival = new Date(2026, 2, 2, 10, 20);

      const result = await getShuttleRouteIfApplicable(
        START_SGW,
        DEST_LOY,
        targetArrival,
        "arrive",
      );

      expect(result).not.toBeNull();

      // verify fallback steps were created
      expect(result?.steps[0].travelMode).toBe("WALK");
      expect(result?.steps[0].instruction).toBe(
        "Walk to SGW Hall Building Shuttle Stop",
      );
      expect(result?.steps[2].instruction).toBe("Walk to destination");

      // eta string for 'arrive' mode should format as 'leave by hh:mm'
      expect(result?.eta).toContain("Leave by");
    });
  });
});
