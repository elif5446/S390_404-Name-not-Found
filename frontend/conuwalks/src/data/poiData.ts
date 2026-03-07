import { POI, POICategory } from "@/src/types/poi";


const POI_DATA: Record<string, POI[]> = {
  // Hall Building – Floor 8
  // From bottom floor plan image: 807, 809, 811, 813, 815, 817, 819 (top row)
  // Right column: 821, 823, 825, 827, 829
  // Left side: 801, 803, 805
  "H-8": [
    // ── Top-row labs (left to right) ───────────────────────────────────────
    {
      id: "H-8-lab-807",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "807",
      floor: 8,
      mapPosition: { x: 0.09, y: 0.15 },
    },
    {
      id: "H-8-lab-809",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "809",
      floor: 8,
      mapPosition: { x: 0.21, y: 0.15 },
    },
    {
      id: "H-8-lab-811",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "811",
      floor: 8,
      mapPosition: { x: 0.33, y: 0.15 },
    },
    {
      id: "H-8-lab-813",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "813",
      floor: 8,
      mapPosition: { x: 0.45, y: 0.15 },
    },
    {
      id: "H-8-lab-815",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "815",
      floor: 8,
      mapPosition: { x: 0.57, y: 0.15 },
    },
    {
      id: "H-8-lab-817",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "817",
      floor: 8,
      mapPosition: { x: 0.69, y: 0.15 },
    },
    {
      id: "H-8-lab-819",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "819",
      floor: 8,
      mapPosition: { x: 0.81, y: 0.15 },
    },
    // ── Left-side rooms ────────────────────────────────────────────────────
    {
      id: "H-8-lab-801",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "801",
      floor: 8,
      mapPosition: { x: 0.08, y: 0.27 },
    },
    {
      id: "H-8-lab-803",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "803",
      floor: 8,
      mapPosition: { x: 0.08, y: 0.42 },
    },
    {
      id: "H-8-lab-805",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "805",
      floor: 8,
      mapPosition: { x: 0.08, y: 0.57 },
    },
    // ── Right-column rooms (top to bottom) ─────────────────────────────────
    {
      id: "H-8-lab-821",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "821",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.25 },
    },
    {
      id: "H-8-lab-823",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "823",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.40 },
    },
    {
      id: "H-8-lab-825",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "825",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.55 },
    },
    {
      id: "H-8-lab-827",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "827",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.69 },
    },
    {
      id: "H-8-lab-829",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "829",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.82 },
    },
    // ── Washrooms ──────────────────────────────────────────────────────────
    {
      id: "H-8-wc-shared",
      label: "WC",
      category: "WC_SHARED" as POICategory,
      description: "Shared Washroom",
      room: "836",
      floor: 8,
      mapPosition: { x: 0.36, y: 0.58 },
    },
    // ── Additional room targets from floor plan ───────────────────────────
    {
      id: "H-8-room-833",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "833",
      floor: 8,
      mapPosition: { x: 0.90, y: 0.94 },
    },
    {
      id: "H-8-room-835",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "835",
      floor: 8,
      mapPosition: { x: 0.79, y: 0.94 },
    },
    {
      id: "H-8-room-839",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "839",
      floor: 8,
      mapPosition: { x: 0.57, y: 0.93 },
    },
    {
      id: "H-8-room-841",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Computer Lab",
      room: "841",
      floor: 8,
      mapPosition: { x: 0.46, y: 0.93 },
    },
    {
      id: "H-8-room-843",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "843",
      floor: 8,
      mapPosition: { x: 0.35, y: 0.93 },
    },
    {
      id: "H-8-room-845",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "845",
      floor: 8,
      mapPosition: { x: 0.24, y: 0.93 },
    },
    {
      id: "H-8-room-847",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "847",
      floor: 8,
      mapPosition: { x: 0.13, y: 0.93 },
    },
  ],

  // Hall Building – Floor 9
  // From top floor plan image: 909, 911, 913, 915, 917, 919 (top row)
  // Right column: 921, 923, 925, 927, 929
  // Left side: 901, 903, 905
  "H-9": [
    // ── Top-row labs (left to right) ───────────────────────────────────────
    {
      id: "H-9-lab-909",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "909",
      floor: 9,
      mapPosition: { x: 0.09, y: 0.15 },
    },
    {
      id: "H-9-lab-911",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "911",
      floor: 9,
      mapPosition: { x: 0.21, y: 0.15 },
    },
    {
      id: "H-9-lab-913",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "913",
      floor: 9,
      mapPosition: { x: 0.33, y: 0.15 },
    },
    {
      id: "H-9-lab-915",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "915",
      floor: 9,
      mapPosition: { x: 0.45, y: 0.15 },
    },
    {
      id: "H-9-lab-917",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "917",
      floor: 9,
      mapPosition: { x: 0.57, y: 0.15 },
    },
    {
      id: "H-9-lab-919",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "919",
      floor: 9,
      mapPosition: { x: 0.69, y: 0.15 },
    },
    // ── Left-side rooms ────────────────────────────────────────────────────
    {
      id: "H-9-lab-901",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "901",
      floor: 9,
      mapPosition: { x: 0.08, y: 0.27 },
    },
    {
      id: "H-9-lab-903",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "903",
      floor: 9,
      mapPosition: { x: 0.08, y: 0.42 },
    },
    {
      id: "H-9-lab-905",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "905",
      floor: 9,
      mapPosition: { x: 0.08, y: 0.57 },
    },
    // ── Right-column rooms including washrooms ─────────────────────────────
    {
      id: "H-9-lab-921",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "921",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.25 },
    },
    {
      id: "H-9-lab-923",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "923",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.40 },
    },
    {
      id: "H-9-lab-925",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "925",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.55 },
    },
    {
      id: "H-9-lab-927",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "927",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.69 },
    },
    {
      id: "H-9-lab-929",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "929",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.82 },
    },
    // ── Washrooms (from mockup) ────────────────────────────────────────────
    {
      id: "H-9-wc-m",
      label: "WC M",
      category: "WC_M" as POICategory,
      description: "Boys Washroom",
      room: "912",
      floor: 9,
      mapPosition: { x: 0.92, y: 0.34 },
    },
    {
      id: "H-9-wc-f",
      label: "WC F",
      category: "WC_F" as POICategory,
      description: "Girls Washroom",
      room: "916",
      floor: 9,
      mapPosition: { x: 0.92, y: 0.48 },
    },
    {
      id: "H-9-wc-a",
      label: "WC A",
      category: "WC_A" as POICategory,
      description: "Accessibility Washroom",
      room: "918",
      floor: 9,
      mapPosition: { x: 0.92, y: 0.62 },
    },
    // ── Other facilities (from mockup) ─────────────────────────────────────
    {
      id: "H-9-print",
      label: "Print",
      category: "PRINT" as POICategory,
      description: "Print Station",
      room: "930",
      floor: 9,
      mapPosition: { x: 0.66, y: 0.60 },
    },
    {
      id: "H-9-it",
      label: "IT",
      category: "IT" as POICategory,
      description: "IT Help Desk",
      room: "933",
      floor: 9,
      mapPosition: { x: 0.75, y: 0.70 },
    },
    // ── Additional room targets from floor plan ───────────────────────────
    {
      id: "H-9-room-935",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "935",
      floor: 9,
      mapPosition: { x: 0.90, y: 0.93 },
    },
    {
      id: "H-9-room-937",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "937",
      floor: 9,
      mapPosition: { x: 0.79, y: 0.93 },
    },
    {
      id: "H-9-room-939",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "939",
      floor: 9,
      mapPosition: { x: 0.68, y: 0.93 },
    },
    {
      id: "H-9-room-941",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "941",
      floor: 9,
      mapPosition: { x: 0.57, y: 0.93 },
    },
    {
      id: "H-9-room-943",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "943",
      floor: 9,
      mapPosition: { x: 0.46, y: 0.93 },
    },
    {
      id: "H-9-room-945",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "945",
      floor: 9,
      mapPosition: { x: 0.35, y: 0.93 },
    },
    {
      id: "H-9-room-947",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "947",
      floor: 9,
      mapPosition: { x: 0.24, y: 0.93 },
    },
  ],
};

/**
 * Returns the POI list for the given building + floor combination.
 * @param buildingId  e.g. "H"
 * @param floor       numeric floor level
 */
export function getPOIsForFloor(buildingId: string, floor: number): POI[] {
  return POI_DATA[`${buildingId}-${floor}`] ?? [];
}

/** Human-readable category labels used in filter chips. */
export const CATEGORY_LABELS: Record<POICategory, string> = {
  WC_F: "WC F",
  WC_M: "WC M",
  WC_A: "WC A",
  WC_SHARED: "WC",
  LAB: "Lab",
  ROOM: "Room",
  PRINT: "Print",
  IT: "IT",
};

// Returns the unique categories present for a given building + floor.
 
export function getCategoriesForFloor(
  buildingId: string,
  floor: number,
): POICategory[] {
  const pois = getPOIsForFloor(buildingId, floor);
  const seen = new Set<POICategory>();
  pois.forEach((p) => seen.add(p.category));
  return Array.from(seen);
}


 // Returns mock directions from a starting room to a POI.
 
export function getDirectionsForPOI(
  poi: POI,
  startingRoom: string,
  sourcePOI?: POI | null,
): { steps: string[]; estimatedMinutes: number } {
  const destination = `${poi.description} (H-${poi.room})`;

  if (sourcePOI) {
    const dx = poi.mapPosition.x - sourcePOI.mapPosition.x;
    const dy = poi.mapPosition.y - sourcePOI.mapPosition.y;
    const horizontalFirst = Math.abs(dx) >= Math.abs(dy);
    const horizontalTurn = dx >= 0 ? "Turn right" : "Turn left";
    const verticalMove = dy >= 0 ? "Continue south" : "Continue north";
    const distance = Math.sqrt(dx * dx + dy * dy);
    const estimatedMinutes = Math.max(1, Math.round(distance * 8));

    return {
      steps: [
        `Exit ${sourcePOI.description} (H-${sourcePOI.room}) to the main corridor`,
        horizontalFirst ? `${horizontalTurn} and proceed along the corridor` : `${verticalMove} through the corridor`,
        horizontalFirst ? `${verticalMove} toward room H-${poi.room}` : `${horizontalTurn} toward room H-${poi.room}`,
        `Arrive at ${destination}`,
      ],
      estimatedMinutes,
    };
  }

  return {
    steps: [
      `Start from room H-${startingRoom}`,
      "Head north along main corridor",
      poi.category === "WC_M" || poi.category === "WC_SHARED"
        ? "Turn left"
        : "Turn Right",
      `Arrive at ${destination}`,
    ],
    estimatedMinutes: 1,
  };
}
