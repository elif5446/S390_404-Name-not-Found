import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  syncShuttleScheduleInBackground,
  getLocalShuttleSchedule,
  ShuttleSchedule,
} from "../../api/shuttleSyncService";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe("shuttleSyncService.ts", () => {
  let fetchMock: jest.Mock;

  // a simplified html string mimicking concordia's structure
  const MOCK_HTML_VALID = `
    <html>
      <body>
        <h2>Monday — Thursday</h2>
        <table>
          <tr>
            <td>09:15</td>
            <td>09:30</td>
          </tr>
          <tr>
            <td>09:30</td>
            <td>09:45</td>
          </tr>
        </table>
        <h2>Friday</h2>
        <table>
          <tr>
            <td>10:00</td>
            <td>10:15</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const MOCK_HTML_INVALID = `
    <html>
      <body>
        <h2>No schedule here!</h2>
      </body>
    </html>
  `;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    // silence console warnings and errors for cleaner test output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getLocalShuttleSchedule", () => {
    it("returns cached schedule if it exists in AsyncStorage", async () => {
      const cachedData: ShuttleSchedule = {
        monday_thursday: { SGW: ["10:00"], LOY: ["10:15"] },
        friday: { SGW: ["11:00"], LOY: ["11:15"] },
        last_updated: "2026-03-01T00:00:00Z",
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cachedData),
      );

      const result = await getLocalShuttleSchedule();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        "@concordia_shuttle_schedule",
      );
      expect(result).toEqual(cachedData);
    });

    it("returns FALLBACK_SCHEDULE if AsyncStorage is empty", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getLocalShuttleSchedule();

      expect(result.monday_thursday.LOY.length).toBeGreaterThan(0);
      expect(result.friday.SGW.length).toBeGreaterThan(0);
      expect(result.monday_thursday.LOY[0]).toBe("09:15"); // From fallback
    });

    it("returns FALLBACK_SCHEDULE if AsyncStorage throws an error", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error("Storage corrupted"),
      );

      const result = await getLocalShuttleSchedule();

      expect(console.error).toHaveBeenCalledWith(
        "Error reading shuttle cache:",
        expect.any(Error),
      );
      expect(result.monday_thursday.LOY.length).toBeGreaterThan(0);
    });
  });

  describe("syncShuttleScheduleInBackground", () => {
    it("successfully fetches, parses, and caches valid HTML", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_HTML_VALID,
      });

      await syncShuttleScheduleInBackground();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://www.concordia.ca/maps/shuttle-bus.html",
      );

      // verify asyncstorage.setitem was called with the correctly parsed data
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];

      expect(setItemCall[0]).toBe("@concordia_shuttle_schedule");

      const parsedSchedule = JSON.parse(setItemCall[1]);

      // check monday-thursday parsing
      expect(parsedSchedule.monday_thursday.LOY).toEqual(["09:15", "09:30"]);
      expect(parsedSchedule.monday_thursday.SGW).toEqual(["09:30", "09:45"]);

      // check friday parsing
      expect(parsedSchedule.friday.LOY).toEqual(["10:00"]);
      expect(parsedSchedule.friday.SGW).toEqual(["10:15"]);

      expect(console.log).toHaveBeenCalledWith(
        "Shuttle schedule synced and cached.",
      );
    });

    it("does not update cache if HTML parsing fails or structure changes", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_HTML_INVALID,
      });

      await syncShuttleScheduleInBackground();

      // ensure setitem was not called because the html didn't contain "monday — thursday"
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("logs a warning and does not crash if fetch fails", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await syncShuttleScheduleInBackground();

      expect(console.warn).toHaveBeenCalledWith(
        "Shuttle sync failed, keeping existing cache:",
        expect.any(Error),
      );
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("logs a warning and does not crash on network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network disconnect"));

      await syncShuttleScheduleInBackground();

      expect(console.warn).toHaveBeenCalledWith(
        "Shuttle sync failed, keeping existing cache:",
        expect.any(Error),
      );
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
