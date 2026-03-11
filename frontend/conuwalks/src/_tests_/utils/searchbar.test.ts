import {
  processStartPointSearch,
  processDestinationSearch,
  searchStartPoint,
  searchDestination,
} from "../../utils/searchbar";
import * as scheduleUtils from "../../utils/schedule";
import { BuildingEvent } from "../../hooks/useBuildingEvents";
import { CalendarEvent } from "../../api/calendarApi";

jest.mock("../../utils/schedule");
jest.mock("../../data/metadata/SGW.BuildingMetaData", () => ({
  SGWBuildingSearchMetadata: {
    H: {
      name: "Henry F. Hall Building",
      coordinates: { latitude: 0, longitude: 0 },
    },
    LB: {
      name: "Library Building",
      coordinates: { latitude: 0, longitude: 0 },
    },
  },
}));
jest.mock("../../data/metadata/LOY.BuildingMetadata", () => ({
  LoyolaBuildingSearchMetadata: {
    VL: { name: "Vanier Library", coordinates: { latitude: 0, longitude: 0 } },
  },
}));

describe("searchbar utils", () => {
  const mockTodayEvents: BuildingEvent[] = [
    {
      id: "b-1",
      summary: "Lecture",
      courseName: "SOEN390",
      start: Date.now(),
      end: Date.now() + 1000,
      location: "H 801",
      buildingCode: "H",
      roomNumber: "801",
    },
  ];

  const mockCalendarEvents: CalendarEvent[] = [
    {
      id: "c-1",
      summary: "Lab",
      start: { dateTime: new Date(Date.now() + 10000).toISOString() },
      end: { dateTime: new Date(Date.now() + 20000).toISOString() },
      location: "LB 201",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (scheduleUtils.guessRoomLocation as jest.Mock).mockReturnValue({
      buildingCode: "H",
      roomNumber: "801",
    });
    (scheduleUtils.guessFutureRoomLocation as jest.Mock).mockReturnValue({
      buildingCode: "LB",
      roomNumber: "201",
    });
  });

  describe("search logic and filtering", () => {
    test("returns empty array if both events and todayEvents are null", () => {
      const result = searchStartPoint("", null as any);
      expect(result).toEqual([]);
    });

    test("searchStartPoint includes 'Current Location' suggestion", () => {
      const result = searchStartPoint("", mockTodayEvents);
      expect(result[0]).toEqual({
        buildingName: "Current",
        roomNumber: "Location",
        isLocation: true,
      });
    });

    test("filters buildings by building code (case insensitive)", () => {
      const result = searchDestination("h", mockCalendarEvents);
      expect(
        result.some((r) => r.buildingName === "Henry F. Hall Building"),
      ).toBe(true);
    });

    test("filters buildings by building name", () => {
      const result = searchDestination("library", mockCalendarEvents);
      expect(result.some((r) => r.buildingName === "Library Building")).toBe(
        true,
      );

      const result2 = searchDestination("vanier", mockCalendarEvents);
      expect(result2.some((r) => r.buildingName === "Vanier Library")).toBe(
        true,
      );
    });

    test("parses and filters by room number", () => {
      const result = searchStartPoint("H 8", mockTodayEvents);
      expect(
        result.some(
          (r) =>
            r.buildingName === "Henry F. Hall Building" &&
            r.roomNumber === "801",
        ),
      ).toBe(true);
    });

    test("handles room input even if building is not fully matched", () => {
      const result = searchStartPoint("Henry 999", mockTodayEvents);
      expect(
        result.some(
          (r) =>
            r.buildingName === "Henry F. Hall Building" &&
            r.roomNumber === "999",
        ),
      ).toBe(true);
    });
  });

  describe("wrapper functions", () => {
    test("processStartPointSearch returns a single best match", () => {
      const result = processStartPointSearch("H 801", mockTodayEvents);
      expect(result.buildingName).toBe("Henry F. Hall Building");
      expect(result.roomNumber).toBe("801");
    });

    test("processDestinationSearch returns a single best match", () => {
      const result = processDestinationSearch("LB 201", mockCalendarEvents);
      expect(result?.buildingName).toBe("Library Building");
    });
  });

  describe("edge cases for 100% coverage", () => {
    test("handles userLocationBuildingId when no events are found", () => {
      (scheduleUtils.guessRoomLocation as jest.Mock).mockReturnValue(null);
      const result = searchStartPoint("", [], "H");
      expect(
        result.some(
          (r) =>
            r.buildingName === "Henry F. Hall Building" &&
            r.isLocation === true,
        ),
      ).toBe(true);
    });

    test("handles roomInput that is not in the schedule", () => {
      const result = searchDestination("LB 999", mockCalendarEvents);
      expect(
        result.some(
          (r) =>
            r.buildingName === "Library Building" && r.roomNumber === "999",
        ),
      ).toBe(true);
    });

    test("sorts results by building match", () => {
      (scheduleUtils.guessRoomLocation as jest.Mock).mockReturnValue({
        buildingCode: "LB",
        roomNumber: "201",
      });
      const result = searchStartPoint("L", mockTodayEvents);
      expect(result.some((r) => r.buildingName === "Library Building")).toBe(
        true,
      );
    });

    test("handles input with no matching buildings", () => {
      const result = searchDestination("Z", mockCalendarEvents);
      expect(result).toEqual([]);
    });

    test("limits suggestions to 10", () => {
      const manyEvents = Array.from({ length: 15 }, (_, i) => ({
        ...mockTodayEvents[0],
        location: `H ${100 + i}`,
      }));
      const result = searchStartPoint("H", manyEvents);
      expect(result.length).toBeLessThanOrEqual(10); //
    });
  });
});
