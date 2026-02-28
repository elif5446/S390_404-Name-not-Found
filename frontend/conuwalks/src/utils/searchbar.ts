import { guessRoomLocation, guessFutureRoomLocation } from "./schedule";
import { SGWBuildingSearchMetadata } from "../data/metadata/SGW.BuildingMetaData"
import { LoyolaBuildingSearchMetadata } from "../data/metadata/LOY.BuildingMetadata"
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { parseLocation } from "../hooks/useBuildingEvents";

export const searchStart = (input: string): { buildingName: string; roomNumber: string | null; isLocation: boolean }[] => {
    return search(input, false);
}

export const searchDestination = (input: string): { buildingName: string; roomNumber: string | null; isLocation: boolean }[] => {
    return search(input, true);
}

const search = (input: string, isDestination: boolean = true) => {
    const location = isDestination ? guessFutureRoomLocation() : guessRoomLocation();
    const [buildingInput, roomInput] = input.split(/\s+(?=\S*\d)/, 2);

    const filteredBuildings = [
        ...Object.entries(SGWBuildingSearchMetadata).filter(building => {
            if(!input || !buildingInput) return building.keys.name === location?.buildingCode;
            return building.keys.name.startsWith(buildingInput) || building.values.name.startsWith(buildingInput)
        }),
        ...Object.entries(LoyolaBuildingSearchMetadata).filter(building => {
            if(!input || !buildingInput) return building.keys.name === location?.buildingCode;
            return building.keys.name.startsWith(buildingInput) || building.values.name.startsWith(buildingInput)
        })
    ];

    const {events} = useGoogleCalendar();
    const roomNumbers = events
        .map(event => parseLocation(event.location))
        .filter(event => event != null);

    const searchSuggestions = [
        ...(isDestination ? [] : [{buildingName: "Current", roomNumber: "Location", isLocation: true}]),
        ...filteredBuildings.flatMap(building => {
            const isLocation = location?.buildingCode === building.keys.name;
            const rooms = roomNumbers.filter(room => room?.buildingCode === building.keys.name && room.roomNumber.startsWith(roomInput));
            return [
                ...rooms
                    .reduce((total: { buildingName: string; roomNumber: string | null; isLocation: boolean }[], room) => ([
                        ...total, {buildingName: room?.buildingCode || "",
                        roomNumber: room?.roomNumber, isLocation: isLocation && location?.roomNumber === room?.roomNumber}
                    ]), [])
                    .sort((a, b) => {
                        if (!isLocation) return 0;
                        if (location?.roomNumber === a.roomNumber && location?.roomNumber !== b.roomNumber) return 1;
                        if (location?.roomNumber !== a.roomNumber && location?.roomNumber === b.roomNumber) return -1;
                        return 0;
                    }),
                {buildingName: building.values.name, roomNumber: null, isLocation}
            ];
        }).sort((a, b) => {
            const buildingCodeA = filteredBuildings.find(build => build.values.name === a.buildingName)?.keys.name;
            const buildingCodeB = filteredBuildings.find(build => build.values.name === b.buildingName)?.keys.name;
            if (location?.buildingCode === buildingCodeA && location?.buildingCode !== buildingCodeB) return 1;
            if (location?.buildingCode !== buildingCodeA && location?.buildingCode === buildingCodeB) return -1;
            return 0;
        })
    ]

    return searchSuggestions.slice(0, 10); // 10 search suggestions at most
}

export const processStartSearch = (input: string): { buildingName: string; roomNumber: string | null; isLocation: boolean } | null => {
    return searchStart(input)[0];
}
export const processDestinationSearch = (input: string): { buildingName: string; roomNumber: string | null; isLocation: boolean } | null => {
    return searchDestination(input)[0];
}