import { POI, POICategory } from "@/src/types/poi";


const POI_DATA: Record<string, POI[]> = {
  //Hall Building – Floor 8 
  "H-8": [
    {
      id: "H-8-lab",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "841",
      floor: 8,
      mapPosition: { x: 0.26, y: 0.35 },
    },
    {
      id: "H-8-wc",
      label: "WC",
      category: "WC_SHARED" as POICategory,
      description: "Shared Washroom",
      room: "839",
      floor: 8,
      mapPosition: { x: 0.55, y: 0.70 },
    },
  ],

  // Hall Building – Floor 9 
  "H-9": [
    {
      id: "H-9-lab",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "905",
      floor: 9,
      mapPosition: { x: 0.04, y: 0.08 },
    },
    {
      id: "H-9-wc-f",
      label: "WC F",
      category: "WC_F" as POICategory,
      description: "Girls Washroom",
      room: "916",
      floor: 9,
      mapPosition: { x: 0.82, y: 0.58 },
    },
    {
      id: "H-9-wc-m",
      label: "WC M",
      category: "WC_M" as POICategory,
      description: "Boys Washroom",
      room: "912",
      floor: 9,
      mapPosition: { x: 0.82, y: 0.30 },
    },
    {
      id: "H-9-wc-a",
      label: "WC A",
      category: "WC_A" as POICategory,
      description: "Accessibility Washroom",
      room: "918",
      floor: 9,
      mapPosition: { x: 0.82, y: 0.65 },
    },
    {
      id: "H-9-print",
      label: "Print",
      category: "PRINT" as POICategory,
      description: "Print Station",
      room: "H-in front of IT desk",
      floor: 9,
      mapPosition: { x: 0.50, y: 0.50 },
    },
    {
      id: "H-9-it",
      label: "IT",
      category: "IT" as POICategory,
      description: "IT Help Desk",
      room: "939",
      floor: 9,
      mapPosition: { x: 0.54, y: 0.70 },
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
): { steps: string[]; estimatedMinutes: number } {
  const destination = `${poi.description} (H-${poi.room})`;
  return {
    steps: [
      "Head north along main corridor",
      poi.category === "WC_M" || poi.category === "WC_SHARED"
        ? "Turn left"
        : "Turn Right",
      `Arrive at ${destination}`,
    ],
    estimatedMinutes: 1,
  };
}
