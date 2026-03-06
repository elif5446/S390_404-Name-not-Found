import { Graph } from '@/src/indoors/services/Graph';
import { PathFinder } from '@/src/indoors/services/PathFinder';
import { IndoorMapService } from '@/src/indoors/services/IndoorMapService';
import { BuildingNavConfig } from '@/src/indoors/types/Navigation';
import { IndoorLocationTracker } from '@/src/indoors/services/IndoorLocationTracker';

const hallBuildingNavConfig: BuildingNavConfig = {
  buildingId: "H", //needs to match the id of the BuildingIndoorConfig
  defaultStartNodeId: "H_8_N7",
  floors: [
    {
      floorId: "H_8",
      nodes: [
        //halways 
        {id: "H_8_N1", floorId: "H_8", x: 176, y: 795, type: "hallway"},
        {id: "H_8_N2", floorId: "H_8", x: 176, y: 394, type: "hallway"},
        {id: "H_8_N3", floorId: "H_8", x: 176, y: 211, type: "hallway"},
        {id: "H_8_N4", floorId: "H_8", x: 549, y: 211, type: "hallway"},
        {id: "H_8_N5", floorId: "H_8", x: 549, y: 394, type: "hallway"},
        {id: "H_8_N6", floorId: "H_8", x: 549, y: 795, type: "hallway"},
        {id: "H_8_N7", floorId: "H_8", x: 306, y: 394, type: "hallway"},

        //rooms 
        {id: "H_847", floorId: "H_8", x: 188, y: 844, type: "room", label: "Room 847"},
        {id: "H_801", floorId: "H_8", x: 188, y: 168, type: "room", label: "Room 801"},

        //POI


        //interfloor connections (stais, escalators, elevator)
        {id: "H_8_STAIRS", floorId: "H_8", x: 306, y: 359, type: "stairs", label: "Stairwell"},
        {id:"H_8_ELEVATOR", floorId: "H_8", x: 340, y: 352, type: "elevator", label: "Elevator"}


      ],
      edges: [

        //hall to hall
        { nodeAId: "H_8_N1", nodeBId: "H_8_N2", accessible: true },
        { nodeAId: "H_8_N1", nodeBId: "H_8_N6", accessible: true },
        { nodeAId: "H_8_N2", nodeBId: "H_8_N3", accessible: true },
        { nodeAId: "H_8_N2", nodeBId: "H_8_N7", accessible: true },
        { nodeAId: "H_8_N7", nodeBId: "H_8_N5", accessible: true },
        { nodeAId: "H_8_N3", nodeBId: "H_8_N4", accessible: true },
        { nodeAId: "H_8_N4", nodeBId: "H_8_N5", accessible: true },
        { nodeAId: "H_8_N5", nodeBId: "H_8_N6", accessible: true },

        //hall to class 
        { nodeAId: "H_8_N3", nodeBId: "H_801", accessible: true },
        { nodeAId: "H_8_N1", nodeBId: "H_847", accessible: true },

        //hall to POI

        //hall to interfloor connection 
        { nodeAId: "H_8_N7", nodeBId: "H_8_ELEVATOR", accessible: true },
        { nodeAId: "H_8_N7", nodeBId: "H_8_STAIRS", accessible: false },
      ]
    },
    {
      floorId: "H_9",
      nodes: [
        //halways 
        {id: "H_9_N1", floorId: "H_9", x: 291, y: 346, type: "hallway"},

        //rooms 
        {id: "H_964", floorId: "H_9", x: 274, y: 379, type: "room"},

        //POI


        //interfloor connections (stais, escalators, elevator)
        {id: "H_9_STAIRS", floorId: "H_9", x: 291, y: 311, type: "stairs", label: "Stairwell"},
        {id: "H_9_ELEVATOR", floorId: "H_9", x: 342, y: 302, type: "elevator", label: "Elevator"}

      ],
      edges: [
        //hall to hall

        //hall to class 
        {nodeAId: "H_9_N1", nodeBId: "H_964", accessible: true},

        //hall to POI

        //hall to interfloor connection 
        {nodeAId: "H_9_ELEVATOR", nodeBId: "H_9_N1" , accessible: true},
        {nodeAId: "H_9_STAIRS", nodeBId: "H_9_N1" , accessible: false}
      ]
    }

  ],
  interFloorEdges: [
    // edges that connect floors
    { nodeAId: "H_8_ELEVATOR", nodeBId: "H_9_ELEVATOR", accessible: true},
    {nodeAId: "H_8_STAIRS", nodeBId: "H_9_STAIRS", accessible: false}
  ]
}

//use this to find the shortest path between any two given nodes
describe('Hall Building Navigation', () => {
  let service: IndoorMapService;
  let locationTracker: IndoorLocationTracker;

  beforeEach(() => {
    service = new IndoorMapService();
    service.loadBuilding(hallBuildingNavConfig);
    locationTracker = new IndoorLocationTracker(service.getGraph());
    locationTracker.setDefaultLocation(hallBuildingNavConfig.defaultStartNodeId);
  });



//you can try changing the nodes to find the shortest route from any of the implemented nodes.
  test('find the route between H_964 and H_801', () => {
    const route = service.getRoute('H_964', 'H_801');
    console.log('Path:', route.nodes.map(n => n.id).join(' → '));
    console.log('Total distance:', route.totalDistance);
  });

  //see how the route can be found using users current location
  test('find the route from the default start node to H_964', () => {
    const userLocation = locationTracker.getUserLocation();
    const route = service.getRoute(userLocation!.nodeId, 'H_964');
    console.log('Path:', route.nodes.map(n => n.id).join(' → '));
    console.log('Total distance:', route.totalDistance);
  });
});