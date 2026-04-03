import { guessRoomLocation, guessFutureRoomLocation } from "./schedule";
import { SGWBuildingSearchMetadata } from "../data/metadata/SGW.BuildingMetaData"
import { LoyolaBuildingSearchMetadata } from "../data/metadata/LOY.BuildingMetadata"
import { BuildingEvent, parseLocation } from "../hooks/useBuildingEvents";
import { CalendarEvent } from "../api/calendarApi";
import { LatLng } from "react-native-maps/lib/sharedTypes";

// Building aliases for more flexible search input
const BUILDING_ALIASES: Record<string, string[]> = {
  "MB": ["JMSB", "Business School", "John Molson"],
  "ER": ["Engineering", "ER Building", "Engineering Research", "Engineering Research Building"],
  "FG": ["Faubourg", "FG Building"],
  "FB": ["Faubourg", "Faubourg Building", "Faubourg Ste-Catherine", "Faubourg Ste-Catherine Building"],
  "EV": ["EV Building", "Engineering", "Computer Science", "Engineering, Computer Science and Visual Arts Integrated Building", "Visual Arts"],
  "LB": ["Library", "Webster Library"],
  "H": ["Hall", "Hall Building", "Henry F. Hall Building"],
  "LS": ["Learning Square", "LS Building"],
  "GM": ["GM Building", "Guy", "Guy-de Maisonneuve", "Maisonneuve"],
  "CL": ["CL Annex", "CL Building"],
  "VL": ["Vanier Library", "Vanier", "Vanier Library Building"],
  "CJ": ["CJ Building", "Communication Studies", "Journalism", "Communication Studies and Journalism Building"],
  "SP": ["Richard", "SP Building", "Richard SP Building", "Richard J. Renaud Science Complex", "Science Complex", "J Renaud"],
  "AD": ["Administration", "Admin Building", "Administration Building", "Admin", "Loyola Student Services"],
  "CC": ["Central", "Central Building"],
  "HU": ["Applied Science", "Applied Science Hub"],
  "FC": ["F.C.", "F.C. Smith", "F.C. Smith Building", "Smith"],
};

const matchBuildingName = (input: string, buildingId: string, buildingName: string): boolean => {
    const normalizedInput = input.trim().toLowerCase();
    const normalizedName = buildingName.trim().toLowerCase();
    const lowerBuildingId = buildingId.trim().toLowerCase();

    if (normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName)) {
    return true;
  }

  if (lowerBuildingId === normalizedInput || lowerBuildingId.includes(normalizedInput)) {
    return true;
  }
  
  const aliases = BUILDING_ALIASES[buildingId] || [];
  if (aliases.some(alias => alias.toLowerCase().includes(normalizedInput))) {
    return true;
  }
  
  return false;
}
export const processStartPointSearch = (input: string, todayEvents: BuildingEvent[]): { buildingName: string; roomNumber: string | null; isLocation: boolean } => {
    return searchStartPoint(input, todayEvents)[1] || searchStartPoint(input, todayEvents)[0];
}
export const processDestinationSearch = (input: string, events: CalendarEvent[]): { buildingName: string; roomNumber: string | null; isLocation: boolean } | null => {
    return searchDestination(input, events)[0];
}

export const searchStartPoint = (input: string, todayEvents: BuildingEvent[], userLocationBuildingId: string | null = null): { buildingName: string; roomNumber: string | null; isLocation: boolean }[] => {
    return search(input, null, todayEvents, userLocationBuildingId);
}
export const searchDestination = (input: string, events: CalendarEvent[]): { buildingName: string; roomNumber: string | null; isLocation: boolean }[] => {
    return search(input, events);
}

const search = (input: string, events: CalendarEvent[] | null = null, todayEvents: BuildingEvent[] | null = null, userLocationBuildingId: string | null = null) => {
    if (events === null && todayEvents === null) return [];
    const location = events === null
      ? guessRoomLocation(null, todayEvents) ?? { buildingCode: userLocationBuildingId, roomNumber: null }
      : guessFutureRoomLocation(events);

    const inputTrim = input.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const [preBuildingInput, preRoomInput] = inputTrim.split(/\s+(?=\S*\d)/, 2);
    const buildingInput = preBuildingInput || "";
    const roomInput = preRoomInput || "";

    const filterCampusSearchMetadata = (metadata: Record<string, {name: string; coordinates: LatLng;}>) => {
        return Object.entries(metadata).filter(([id, data]) => {
            if(!buildingInput) return id === location?.buildingCode;
            return matchBuildingName(buildingInput, id, data.name);
        })
    }
    const filteredBuildings = [
        ...filterCampusSearchMetadata(SGWBuildingSearchMetadata),
        ...filterCampusSearchMetadata(LoyolaBuildingSearchMetadata)
    ];
    
    
    const preRoomNumbers = events === null
      ? todayEvents!.map(event => parseLocation(event.location)).filter(event => event != null)
      : events.map(event => parseLocation(event.location)).filter(event => event != null);
    const roomNumbers = preRoomNumbers.map(room => ({buildingCode: room.buildingCode.toUpperCase(), roomNumber: room.roomNumber.toUpperCase()}));

    const searchSuggestions = [
        ...(events === null ? [{buildingName: "Current", roomNumber: "Location", isLocation: true}] : []),
        ...filteredBuildings.flatMap(([id, data]) => {
            const isLocation = location?.buildingCode === id;
            const rooms = roomNumbers.filter(room => room?.buildingCode === id && room.roomNumber.startsWith(roomInput));
            return [
                ...rooms
                    .reduce((total: { buildingName: string; roomNumber: string | null; isLocation: boolean }[], room) => ([
                        ...total,
                        {buildingName: data.name || "", roomNumber: room?.roomNumber, isLocation: isLocation && location?.roomNumber === room?.roomNumber}
                    ]), [])
                    .sort((a, b) => {
                        if (!isLocation) return 0;
                        if (location?.roomNumber === a.roomNumber && location?.roomNumber !== b.roomNumber) return 1;
                        if (location?.roomNumber !== a.roomNumber && location?.roomNumber === b.roomNumber) return -1;
                        return 0;
                    }),
                ...(!roomInput || rooms.map(room => room.roomNumber).includes(roomInput?.toUpperCase() ?? "") ? [] : [{buildingName: data.name || "", roomNumber: roomInput?.toUpperCase() ?? null, isLocation}]),
                ...(roomInput ? [] : [{buildingName: data.name || "", roomNumber: null, isLocation}])
            ];
        }).sort((a, b) => {
            const buildingCodeA = filteredBuildings.find(build => build[1].name.toLowerCase() === a.buildingName.toLowerCase())?.[0];
            const buildingCodeB = filteredBuildings.find(build => build[1].name.toLowerCase() === b.buildingName.toLowerCase())?.[0];
            if (location?.buildingCode === buildingCodeA && location?.buildingCode !== buildingCodeB) return 1;
            if (location?.buildingCode !== buildingCodeA && location?.buildingCode === buildingCodeB) return -1;
            return 0;
        })
    ]

    return searchSuggestions.slice(0, 10); // 10 search suggestions at most
}