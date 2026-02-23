import { useState, useEffect } from "react";
import { useGoogleCalendar } from "./useGoogleCalendar";

export interface BuildingEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  location: string;
  roomNumber?: string;
  buildingCode?: string;
  courseName: string;
}

const parseLocation = (location: string = "") => {
  // matches SGW or LOY at the start, ignores it, 
  // and captures building code (e.g., "H") and room (e.g., "820")
  const match = location.match(/^(?:(?:SGW|LOY)[\s-]*)?([A-Za-z]+)[\s-]+(.+)$/i);

  if (match) {
    return {
      buildingCode: match[1].toUpperCase(),
      roomNumber: match[2].trim(),
    };
  }
  return null;
};

export const useBuildingEvents = (
  buildingId: string,
  campus: "SGW" | "LOY",
) => {
  const { events, fetchUpcomingEvents, loading, error } = useGoogleCalendar();
  const [buildingEvents, setBuildingEvents] = useState<BuildingEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<BuildingEvent[]>([]);
  const [nextEvent, setNextEvent] = useState<BuildingEvent | null>(null);

  // Filter events for this building
  useEffect(() => {
    // if no buildingId or events, explicitly clear state to prevent stale data
    if (!events || events.length === 0 || !buildingId) {
      setBuildingEvents([]);
      setTodayEvents([]);
      setNextEvent(null);
      return;
    }

    const filtered: BuildingEvent[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (!event.location) continue;

      const parsed = parseLocation(event.location);
      if (!parsed) continue;

      if (parsed.buildingCode !== buildingId.toUpperCase()) continue;

      const startDateString = event.start?.dateTime || event.start?.date;
      const endDateString = event.end?.dateTime || event.end?.date;
      if (!startDateString || !endDateString) continue;

      // Create valid BuildingEvent object
      const buildingEvent: BuildingEvent = {
        id: event.id,
        summary: event.summary,
        start: new Date(startDateString),
        end: new Date(endDateString),
        location: event.location,
        roomNumber: parsed.roomNumber,
        buildingCode: parsed.buildingCode,
        courseName: event.summary || "Untitled Event",
      };

      filtered.push(buildingEvent);
    }

    setBuildingEvents(filtered);

    // Filter for today's events
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFiltered = filtered
      .filter((event) => event.start >= today && event.start < tomorrow)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    setTodayEvents(todayFiltered);

    // Find next upcoming event
    const upcoming = filtered
      .filter((event) => event.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    setNextEvent(upcoming[0] || null);
  }, [events, buildingId]);

  useEffect(() => {
    fetchUpcomingEvents(50);
  }, []);

  return {
    buildingEvents,
    todayEvents,
    nextEvent,
    loading,
    error,
    refresh: () => fetchUpcomingEvents(50),
  };
};
