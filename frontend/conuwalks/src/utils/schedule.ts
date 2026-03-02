import { parseLocation, BuildingEvent } from "../hooks/useBuildingEvents";
import { CalendarEvent } from "../api/calendarApi";

// Current room location
export const guessRoomLocation = (events: CalendarEvent[] | null = null, todayEvents: BuildingEvent[] | null = null): { buildingCode: string; roomNumber: string; } | null => {
    if (todayEvents) {
        return guessRoomLocationFromScheduleAndBuilding(todayEvents);
    } else if (events) {
        return guessRoomLocationFromSchedule(events);
    }
    return null;
}
const guessRoomLocationFromSchedule = (events: CalendarEvent[]): { buildingCode: string; roomNumber: string; } | null => {
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
const guessRoomLocationFromScheduleAndBuilding = (todayEvents: BuildingEvent[]): { buildingCode: string; roomNumber: string; } | null => {
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
export const guessFutureRoomLocation = (events: CalendarEvent[] | null = null, nextEvent: BuildingEvent | null = null): { buildingCode: string; roomNumber: string; } | null => {
    if (nextEvent) {
        return guessFutureRoomLocationFromScheduleAndBuilding(nextEvent);
    } else if (events) {
        return guessFutureRoomLocationFromSchedule(events);
    }
    return null;
}
const guessFutureRoomLocationFromSchedule = (events: CalendarEvent[]): { buildingCode: string; roomNumber: string; } | null => {
    const now = Date.now();
    const event = events
        .filter(event => +event.start >= now)
        .sort((a, b) => +a.start - +b.start)[0];

    if (!event?.location) return null;
    return parseLocation(event.location);
}
const guessFutureRoomLocationFromScheduleAndBuilding = (nextEvent: BuildingEvent): { buildingCode: string; roomNumber: string; } | null => {
    const buildingCode = nextEvent?.buildingCode;
    if (!buildingCode) return null;

    const roomNumber = nextEvent?.roomNumber;
    if (!roomNumber) return null;

    return { buildingCode, roomNumber };
}