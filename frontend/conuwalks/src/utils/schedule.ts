import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useBuildingEvents, parseLocation } from "../hooks/useBuildingEvents";

// Current room location
export const guessRoomLocation = (buildingId: string = '', campus: 'SGW' | 'LOY' = 'SGW'): { buildingCode: string; roomNumber: string; } | null => {
    if (buildingId) {
        return guessRoomLocationFromScheduleAndBuilding(buildingId, campus);
    }
    return guessRoomLocationFromSchedule();
}
const guessRoomLocationFromSchedule = (): { buildingCode: string; roomNumber: string; } | null => {
    const { events } = useGoogleCalendar();
    const event = events.find(event => {
        const startString = event.start.dateTime || event.start.date;
        if (!startString) return false;

        const endString = event.end.dateTime || event.end.date;
        if (!endString) return false;

        const start = new Date(startString)
        const end = new Date(endString);
        const now = Date.now();

        return now >= +start && now <= +end + 600000; // 600,000 ms = 10 min
    });

    if (!event?.location) return null;
    return parseLocation(event.location);
}
const guessRoomLocationFromScheduleAndBuilding = (buildingId: string, campus: 'SGW' | 'LOY' = 'SGW'): { buildingCode: string; roomNumber: string; } | null => {
    const { todayEvents } = useBuildingEvents(buildingId, campus);
    const event = todayEvents.find(event => {
        const now = Date.now();
        return now >= +event.start && now <= +event.end + 600000; // 600,000 ms = 10 min
    })

    const buildingCode = event?.buildingCode;
    if (!buildingCode) return null;

    const roomNumber = event?.roomNumber;
    if (!roomNumber) return null;

    return { buildingCode, roomNumber };
}

// Room the user might be heading to next
export const guessFutureRoomLocation = (buildingId: string = '', campus: 'SGW' | 'LOY' = 'SGW'): { buildingCode: string; roomNumber: string; } | null => {
    if (buildingId) {
        return guessFutureRoomLocationFromScheduleAndBuilding(buildingId, campus);
    }
    return guessFutureRoomLocationFromSchedule();
}
const guessFutureRoomLocationFromSchedule = (): { buildingCode: string; roomNumber: string; } | null => {
    const { events } = useGoogleCalendar();

    const now = Date.now();
    const event = events
        .filter(event => +event.start >= now)
        .sort((a, b) => +a.start - +b.start)[0];

    if (!event?.location) return null;
    return parseLocation(event.location);
}
const guessFutureRoomLocationFromScheduleAndBuilding = (buildingId: string, campus: 'SGW' | 'LOY' = 'SGW'): { buildingCode: string; roomNumber: string; } | null => {
    const { nextEvent } = useBuildingEvents(buildingId, campus);

    const buildingCode = nextEvent?.buildingCode;
    if (!buildingCode) return null;

    const roomNumber = nextEvent?.roomNumber;
    if (!roomNumber) return null;

    return { buildingCode, roomNumber };
}