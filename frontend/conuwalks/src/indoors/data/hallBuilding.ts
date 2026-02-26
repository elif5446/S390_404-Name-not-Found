import { BuildingNavConfig } from '../types/navigation';

export const hallBuildingNavConfig: BuildingNavConfig = {
  buildingId: "H", //needs to match the id of the BuildingIndoorConfig
  floors: [
    {
      floorId: "H_8",
      nodes: [
        {id: "H_8_N1", floorId: "H_8", x: 185.83244800567627, y: 745.4897308349609, type: "hallway"},
        {id: "H_8_N2", floorId: "H_8", x: 543.8324480056763, y: 754.4897308349609, type: "hallway"},
        {id: "H_8_N3", floorId: "H_8", x: 174.83244800567627, y: 167.48973083496094, type: "hallway"},
        {id: "H_8_N4", floorId: "H_8", x: 535.8324480056763, y: 165.48973083496094, type: "hallway"},
        {id: "H_8_N5", floorId: "H_8", x: 46.928985595703125, y: 15.37481689453125, type: "room"},
        {id: "H_8_N6", floorId: "H_8", x: 41.890228271484375, y: 124.48973083496094, type: "room"},

      ],
      edges: [
        { nodeAId: "H_8_N1", nodeBId: "H_8_N2", accessible: true },
        { nodeAId: "H_8_N1", nodeBId: "H_8_N3", accessible: true },
        { nodeAId: "H_8_N3", nodeBId: "H_8_N4", accessible: true },
        { nodeAId: "H_8_N2", nodeBId: "H_8_N4", accessible: true },
        { nodeAId: "H_8_N1", nodeBId: "H_8_N5", accessible: true },
        { nodeAId: "H_8_N3", nodeBId: "H_8_N6", accessible: true },

      ]
    }
  ],
  interFloorEdges: [
  // edges that connect floors
  { nodeAId: "H_8_elevator", nodeBId: "H_7_elevator", accessible: true },
  { nodeAId: "H_8_stairs", nodeBId: "H_7_stairs", accessible: false }, // not accessible because stairs
]
};