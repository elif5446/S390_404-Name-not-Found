import { POI, POICategory } from "@/src/types/poi";
import { hallBuildingNavConfig } from "@/src/indoors/data/HallBuilding";

const NODE_COORD_MAX = 1024;

const hallNodesById = new Map(
  hallBuildingNavConfig.floors.flatMap((floor) =>
    floor.nodes.map((node) => [node.id, node] as const),
  ),
);

const mapPositionFromNode = (
  nodeId: string,
  fallback: POI["mapPosition"],
): POI["mapPosition"] => {
  const node = hallNodesById.get(nodeId);
  if (!node) return fallback;

  return {
    x: Number((node.x / NODE_COORD_MAX).toFixed(3)),
    y: Number((node.y / NODE_COORD_MAX).toFixed(3)),
  };
};
//9th floor nodes 
const hallFloor9RoomPOIs: POI[] =
  hallBuildingNavConfig.floors
    .find((floor) => floor.floorId === "H_9")
    ?.nodes.filter(
      (node) => node.type === "room" && /^H_\d+(?:\.\d+)?$/.test(node.id) && node.id !== "H_967",
    )
    .map((node) => {
      const room = node.id.slice(2);
      return {
        id: `H-9-room-${room}`,
        label: "Room",
        category: "ROOM" as POICategory,
        description: "Classroom",
        room,
        floor: 9,
        mapPosition: mapPositionFromNode(node.id, {
          x: Number((node.x / NODE_COORD_MAX).toFixed(3)),
          y: Number((node.y / NODE_COORD_MAX).toFixed(3)),
        }),
      };
    }) ?? [];


const POI_DATA: Record<string, POI[]> = {
  // Hall Building – Floor 8
  // From bottom floor plan image: 807, 809, 811, 813, 815, 817, 819 (top row)
  // Right column: 821, 823, 825, 827, 829
  // Left side: 801, 803, 805
  "H-8": [
    //  Top-row labs (left to right) 
    {
      id: "H-8-lab-807",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "807",
      floor: 8,
      mapPosition: mapPositionFromNode("H_807", { x: 0.446, y: 0.112 }),
    },
    {
      id: "H-8-lab-809",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "809",
      floor: 8,
      // No explicit H_809 node yet in HallBuilding graph, keep nearest visual fallback.
      mapPosition: { x: 0.370, y: 0.119 },
    },
    {
      id: "H-8-lab-811",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "811",
      floor: 8,
      mapPosition: mapPositionFromNode("H_811", { x: 0.633, y: 0.112 }),
    },
    {
      id: "H-8-lab-813",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "813",
      floor: 8,
      mapPosition: mapPositionFromNode("H_813", { x: 0.719, y: 0.112 }),
    },
    {
      id: "H-8-lab-815",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "815",
      floor: 8,
      mapPosition: mapPositionFromNode("H_815", { x: 0.804, y: 0.112 }),
    },
    {
      id: "H-8-lab-817",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "817",
      floor: 8,
      mapPosition: mapPositionFromNode("H_817", { x: 0.928, y: 0.112 }),
    },
    {
      id: "H-8-lab-819",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "819",
      floor: 8,
      mapPosition: mapPositionFromNode("H_819", { x: 0.928, y: 0.229 }),
    },
    //Left-side rooms
    {
      id: "H-8-lab-801",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "801",
      floor: 8,
      mapPosition: mapPositionFromNode("H_801", { x: 0.195, y: 0.111 }),
    },
    {
      id: "H-8-lab-803",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "803",
      floor: 8,
      mapPosition: mapPositionFromNode("H_803", { x: 0.286, y: 0.112 }),
    },
    {
      id: "H-8-lab-805",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "805",
      floor: 8,
      mapPosition: mapPositionFromNode("H_805.02", { x: 0.370, y: 0.119 }),
    },
    //Right-column rooms (top to bottom) 
    {
      id: "H-8-lab-821",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "821",
      floor: 8,
      mapPosition: mapPositionFromNode("H_821", { x: 0.928, y: 0.316 }),
    },
    {
      id: "H-8-lab-823",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "823",
      floor: 8,
      mapPosition: mapPositionFromNode("H_823", { x: 0.928, y: 0.406 }),
    },
    {
      id: "H-8-lab-825",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "825",
      floor: 8,
      mapPosition: mapPositionFromNode("H_825", { x: 0.928, y: 0.494 }),
    },
    {
      id: "H-8-lab-827",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "827",
      floor: 8,
      mapPosition: mapPositionFromNode("H_827", { x: 0.928, y: 0.586 }),
    },
    {
      id: "H-8-lab-829",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "829",
      floor: 8,
      mapPosition: mapPositionFromNode("H_829", { x: 0.928, y: 0.698 }),
    },
    //  Washrooms 
    {
      id: "H-8-wc-shared",
      label: "WC",
      category: "WC_SHARED" as POICategory,
      description: "Shared Washroom",
      room: "836",
      floor: 8,
      mapPosition: mapPositionFromNode("H_8_BATHROOM_1", { x: 0.367, y: 0.282 }),
    },
    {
      id: "H-8-elevator-1",
      label: "Elevator",
      category: "ELEVATOR" as POICategory,
      description: "Elevator",
      room: "E1",
      floor: 8,
      mapPosition: { x: 0.330, y: 0.340 },
    },
    {
      id: "H-8-stairs-1",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S1",
      floor: 8,
      mapPosition: { x: 0.288, y: 0.288},
    },
    {
      id: "H-8-stairs-2",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S2",
      floor: 8,
      mapPosition: mapPositionFromNode("H_8_STAIRS_2", { x: 0.3, y: 0.710 }),
    },
    {
      id: "H-8-stairs-3",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S3",
      floor: 8,
      mapPosition: { x: 0.705, y: 0.710 },
    },
    {
      id: "H-8-stairs-4",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S4",
      floor: 8,
      mapPosition: { x: 0.705, y: 0.282 },
    },
    //  Additional room targets from floor plan 
    {
      id: "H-8-room-833",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "833",
      floor: 8,
      mapPosition: mapPositionFromNode("H_833", { x: 0.812, y: 0.881 }),
    },
    {
      id: "H-8-room-835",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "835",
      floor: 8,
      mapPosition: mapPositionFromNode("H_835", { x: 0.723, y: 0.881 }),
    },
    {
      id: "H-8-room-841",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Computer Lab",
      room: "841",
      floor: 8,
      mapPosition: mapPositionFromNode("H_841", { x: 0.464, y: 0.881 }),
    },
    {
      id: "H-8-room-843",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "843",
      floor: 8,
      mapPosition: mapPositionFromNode("H_843", { x: 0.370, y: 0.881 }),
    },
    {
      id: "H-8-room-845",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "845",
      floor: 8,
      mapPosition: mapPositionFromNode("H_845", { x: 0.280, y: 0.881 }),
    },
    {
      id: "H-8-room-847",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "847",
      floor: 8,
      mapPosition: mapPositionFromNode("H_847", { x: 0.195, y: 0.881 }),
    },
    {
      id: "H-8-room-867",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "867",
      floor: 8,
      mapPosition: mapPositionFromNode("H_867", { x: 0.059, y: 0.113 }),
    },
    {
      id: "H-8-room-865",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "865",
      floor: 8,
      mapPosition: mapPositionFromNode("H_865", { x: 0.072, y: 0.167 }),
    },
    {
      id: "H-8-room-863",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "863",
      floor: 8,
      mapPosition: mapPositionFromNode("H_863", { x: 0.072, y: 0.228 }),
    },
    {
      id: "H-8-room-861",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "861",
      floor: 8,
      mapPosition: mapPositionFromNode("H_861", { x: 0.072, y: 0.313 }),
    },
    {
      id: "H-8-room-859",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "859",
      floor: 8,
      mapPosition: mapPositionFromNode("H_859", { x: 0.072, y: 0.402 }),
    },
    {
      id: "H-8-room-857",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "857",
      floor: 8,
      mapPosition: mapPositionFromNode("H_857", { x: 0.072, y: 0.494 }),
    },
    {
      id: "H-8-room-855",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "855",
      floor: 8,
      mapPosition: mapPositionFromNode("H_855", { x: 0.072, y: 0.579 }),
    },
    {
      id: "H-8-room-853",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "853",
      floor: 8,
      mapPosition: mapPositionFromNode("H_853", { x: 0.072, y: 0.671 }),
    },
    {
      id: "H-8-room-851.03",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "851.03",
      floor: 8,
      mapPosition: mapPositionFromNode("H_851.03", { x: 0.05, y: 0.787 }),
    },
    {
      id: "H-8-room-851.02",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "851.02",
      floor: 8,
      mapPosition: mapPositionFromNode("H_851.02", { x: 0.05, y: 0.737 }),
    },
    {
      id: "H-8-room-851.01",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "851.01",
      floor: 8,
      mapPosition: mapPositionFromNode("H_851.01", { x: 0.119, y: 0.738 }),
    },
    {
      id: "H-8-room-849",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "849",
      floor: 8,
      mapPosition: mapPositionFromNode("H_849", { x: 0.077, y: 0.881 }),
    },
    {
      id: "H-8-room-831",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "831",
      floor: 8,
      mapPosition: mapPositionFromNode("H_831", { x: 0.928, y: 0.881 }),
    },
    {
      id: "H-8-room-837",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "837",
      floor: 8,
      mapPosition: mapPositionFromNode("H_837", { x: 0.633, y: 0.881 }),
    },
    {
      id: "H-8-room-852",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "852",
      floor: 8,
      mapPosition: mapPositionFromNode("H_852", { x: 0.244, y: 0.641 }),
    },
    {
      id: "H-8-room-854",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "854",
      floor: 8,
      mapPosition: mapPositionFromNode("H_854", { x: 0.257, y: 0.581 }),
    },
    {
      id: "H-8-room-862",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "862",
      floor: 8,
      mapPosition: mapPositionFromNode("H_862", { x: 0.369, y: 0.479 }),
    },
    {
      id: "H-8-room-842",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "842",
      floor: 8,
      mapPosition: mapPositionFromNode("H_842", { x: 0.369, y: 0.581 }),
    },
    {
      id: "H-8-room-820",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "820",
      floor: 8,
      mapPosition: mapPositionFromNode("H_820", { x: 0.67, y: 0.445 }),
    },
    {
      id: "H-8-room-822",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "822",
      floor: 8,
      mapPosition: mapPositionFromNode("H_822", { x: 0.739, y: 0.593 }),
    },
    {
      id: "H-8-room-832.06",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "832.06",
      floor: 8,
      mapPosition: mapPositionFromNode("H_832.06", { x: 0.635, y: 0.592 }),
    },
    {
      id: "H-8-room-805.03",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "805.03",
      floor: 8,
      mapPosition: mapPositionFromNode("H_805.03", { x: 0.37, y: 0.073 }),
    },
    {
      id: "H-8-room-805.01",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "805.01",
      floor: 8,
      mapPosition: mapPositionFromNode("H_805.01", { x: 0.37, y: 0.159 }),
    },
    {
      id: "H-8-room-805.02",
      label: "Room",
      category: "ROOM" as POICategory,
      description: "Classroom",
      room: "805.02",
      floor: 8,
      mapPosition: mapPositionFromNode("H_805.02", { x: 0.37, y: 0.119 }),
    },
  ],

  // Hall Building – Floor 9
  "H-9": [
    // Computer Labs (user-provided list)
    {
      id: "H-9-lab-913",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "913",
      floor: 9,
      mapPosition: mapPositionFromNode("H_913", { x: 0.98, y: 0.02 }),
    },
    {
      id: "H-9-lab-915",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "915",
      floor: 9,
      mapPosition: mapPositionFromNode("H_915", { x: 0.802, y: 0.110 }),
    },
    {
      id: "H-9-lab-917",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "917",
      floor: 9,
      mapPosition: mapPositionFromNode("H_917", { x: 0.915, y: 0.115 }),
    },
    {
      id: "H-9-lab-921",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "921",
      floor: 9,
      mapPosition: mapPositionFromNode("H_921", { x: 0.915, y: 0.319 }),
    },
    {
      id: "H-9-lab-928",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "928",
      floor: 9,
      mapPosition: mapPositionFromNode("H_928", { x: 0.85, y: 0.80 }),
    },
    {
      id: "H-9-lab-929",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "929",
      floor: 9,
      mapPosition: mapPositionFromNode("H_929", { x: 0.894, y: 0.862 }),
    },
    {
      id: "H-9-lab-931",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "931",
      floor: 9,
      mapPosition: mapPositionFromNode("H_931", { x: 0.88, y: 0.82 }),
    },
    {
      id: "H-9-lab-933",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "933",
      floor: 9,
      mapPosition: mapPositionFromNode("H_933", { x: 0.735, y: 0.890 }),
    },
    {
      id: "H-9-lab-967",
      label: "Lab",
      category: "LAB" as POICategory,
      description: "Computer Lab",
      room: "967",
      floor: 9,
      mapPosition: mapPositionFromNode("H_967", { x: 0.071, y: 0.162 }),
    },

    // Washrooms
    {
      id: "H-9-wc-f",
      label: "WC F",
      category: "WC_F" as POICategory,
      description: "Womens Washroom",
      room: "B1",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_BATHROOM_1_W", { x: 0.347, y: 0.275 }),
    },
    {
      id: "H-9-wc-m",
      label: "WC M",
      category: "WC_M" as POICategory,
      description: "Mens Washroom",
      room: "B2",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_BATHROOM_2_M", { x: 0.614, y: 0.286 }),
    },

    // IT Help Desk (example location, adjust as needed)
    {
      id: "H-9-it",
      label: "IT",
      category: "IT" as POICategory,
      description: "IT Help Desk",
      room: "IT",
      floor: 9,
      mapPosition: { x: 0.50, y: 0.50 },
    },

    // Printer (example location, adjust as needed)
    {
      id: "H-9-print",
      label: "Print",
      category: "PRINT" as POICategory,
      description: "Printer",
      room: "PR1",
      floor: 9,
      mapPosition: { x: 0.60, y: 0.60 },
    },

    // Elevator
    {
      id: "H-9-elevator-1",
      label: "Elevator",
      category: "ELEVATOR" as POICategory,
      description: "Elevator",
      room: "E1",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_ELEVATOR", { x: 0.350, y: 0.348 }),
    },

    // Stairs
    {
      id: "H-9-stairs-1",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S1",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_STAIRS_1", { x: 0.300, y: 0.356 }),
    },
    {
      id: "H-9-stairs-2",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S2",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_STAIRS_2", { x: 0.692, y: 0.710 }),
    },
    {
      id: "H-9-stairs-3",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S3",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_STAIRS_3", { x: 0.288, y: 0.707 }),
    },
    {
      id: "H-9-stairs-4",
      label: "Stairs",
      category: "STAIRS" as POICategory,
      description: "Stairs",
      room: "S4",
      floor: 9,
      mapPosition: mapPositionFromNode("H_9_STAIRS_4", { x: 0.697, y: 0.284 }),
    },
  ],

};

/**
 * Returns the POI list for the given building + floor combination.
 * @param buildingId  "H"
 * @param floor       numeric floor level
 */
export function getPOIsForFloor(buildingId: string, floor: number): POI[] {
  return POI_DATA[`${buildingId}-${floor}`] ?? [];
}

//category labels used in filter chips.
export const CATEGORY_LABELS: Record<POICategory, string> = {
  WC_F: "WC F",
  WC_M: "WC M",
  WC_A: "WC A",
  WC_SHARED: "WC",
  LAB: "Lab",
  ROOM: "Room",
  STAIRS: "Stairs",
  ELEVATOR: "Elevator",
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
    const estimatedMinutes = Math.min(2, Math.max(1, Math.round(distance * 8)));

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
