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
  // bounded quantifier to ensure safe execution times
  const match = location.match(
    /^(?:(?:SGW|LOY)[\s-]{0,10})?([A-Za-z]{1,15})[\s-]{1,10}(.{1,50})$/i,
  );

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
  }, [events, buildingId, campus]);

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
