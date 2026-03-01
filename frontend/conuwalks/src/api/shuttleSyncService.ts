import AsyncStorage from "@react-native-async-storage/async-storage";

const SHUTTLE_URL = "https://www.concordia.ca/maps/shuttle-bus.html";
const SCHEDULE_CACHE_KEY = "@concordia_shuttle_schedule";

export interface ShuttleSchedule {
  monday_thursday: { SGW: string[]; LOY: string[] };
  friday: { SGW: string[]; LOY: string[] };
  last_updated: string;
}

const FALLBACK_SCHEDULE: ShuttleSchedule = {
  monday_thursday: {
    LOY: [
      "09:15",
      "09:30",
      "09:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "11:45",
      "12:30",
      "12:45",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "15:45",
      "16:30",
      "16:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
      "18:15",
      "18:30",
    ],
    SGW: [
      "09:30",
      "09:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "12:15",
      "12:30",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "16:00",
      "16:15",
      "16:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
      "18:15",
      "18:30",
    ],
  },
  friday: {
    LOY: [
      "09:15",
      "09:30",
      "09:45",
      "10:15",
      "10:45",
      "11:00",
      "11:15",
      "12:00",
      "12:15",
      "12:45",
      "13:00",
      "13:15",
      "13:45",
      "14:15",
      "14:30",
      "14:45",
      "15:15",
      "15:30",
      "15:45",
      "16:45",
      "17:15",
      "17:45",
      "18:15",
    ],
    SGW: [
      "09:45",
      "10:00",
      "10:15",
      "10:45",
      "11:15",
      "11:30",
      "12:15",
      "12:30",
      "13:15",
      "13:45",
      "14:00",
      "14:15",
      "14:45",
      "15:15",
      "15:45",
      "16:00",
      "16:45",
      "17:15",
      "17:45",
      "18:15",
    ],
  },
  last_updated: new Date().toISOString(),
};

/**
 * Parses the Concordia HTML into a clean JSON structure
 */
const parseHTMLToJSON = (html: string): ShuttleSchedule => {
  const schedule: ShuttleSchedule = {
    monday_thursday: { SGW: [], LOY: [] },
    friday: { SGW: [], LOY: [] },
    last_updated: new Date().toISOString(),
  };

  try {
    const monThuSplit = html.split("Monday — Thursday");
    if (monThuSplit.length < 2) return schedule; // parsing failed, return empty to trigger fallback

    const fridaySplit = monThuSplit[1].split("Friday");
    const monThuHTML = fridaySplit[0];
    const fridayHTML = fridaySplit.length > 1 ? fridaySplit[1] : "";

    const extractTimes = (
      blockHTML: string,
      target: { SGW: string[]; LOY: string[] },
    ) => {
      const rows = blockHTML.split(/<tr[^>]*>/i);
      // start at index 1 because index 0 contains everything before the first <tr>
      for (let i = 1; i < rows.length; i++) {
        const rowContent = rows[i].split(/<\/tr>/i)[0];
        const cols: string[] = [];
        const cells = rowContent.split(/<td[^>]*>/i);

        // start at index 1 because index 0 is everything before the first <td>
        for (let j = 1; j < cells.length; j++) {
          const cellContent = cells[j].split(/<\/td>/i)[0];
          const text = cellContent
            .replace(/<[^>]{0,1000}>/g, "")
            .replace(/&nbsp;/g, "")
            .replace(/[^0-9:]/g, "")
            .trim();

          cols.push(text);
        }

        // According to the HTML: col 1 is LOY, col 2 is SGW
        // (Filtering strictly for length === 2 naturally ignores the footnote row)
        if (cols.length === 2) {
          if (cols[0]) target.LOY.push(cols[0]);
          if (cols[1]) target.SGW.push(cols[1]);
        }
      }
    };

    extractTimes(monThuHTML, schedule.monday_thursday);
    if (fridayHTML) {
      extractTimes(fridayHTML, schedule.friday);
    }
  } catch (error) {
    console.error("Error parsing HTML:", error);
  }

  return schedule;
};

/**
 * Fetches the latest HTML, parses it, and caches it.
 * Designed to be called and run silently in the background.
 */
export const syncShuttleScheduleInBackground = async () => {
  try {
    const response = await fetch(SHUTTLE_URL);
    if (!response.ok) throw new Error("Failed to fetch shuttle page");

    const html = await response.text();
    const newSchedule = parseHTMLToJSON(html);

    // only update cache if we successfully parsed data
    if (newSchedule.monday_thursday.LOY.length > 0) {
      await AsyncStorage.setItem(
        SCHEDULE_CACHE_KEY,
        JSON.stringify(newSchedule),
      );
      console.log("Shuttle schedule synced and cached.");
    }
  } catch (error) {
    console.warn("Shuttle sync failed, keeping existing cache:", error);
  }
};

/**
 * Retrieves the schedule from local storage, or returns the fallback.
 */
export const getLocalShuttleSchedule = async (): Promise<ShuttleSchedule> => {
  try {
    const cached = await AsyncStorage.getItem(SCHEDULE_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("Error reading shuttle cache:", error);
  }
  return FALLBACK_SCHEDULE;
};
