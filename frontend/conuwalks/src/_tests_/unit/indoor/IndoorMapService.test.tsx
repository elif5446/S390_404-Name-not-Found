import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingNavConfig, NodeType } from "@/src/indoors/types/Navigation";
import { Graph } from "@/src/indoors/services/Graph";
import { PathFinder } from "@/src/indoors/services/PathFinder";

jest.mock("@/src/indoors/services/Graph");
jest.mock("@/src/indoors/services/PathFinder");

const MockGraph = Graph as jest.MockedClass<typeof Graph>;
const MockPathFinder = PathFinder as jest.MockedClass<typeof PathFinder>;

// Two floors:
//   Floor 1: entrance-1(0,10) --- A (0,0) --- B (10,0)
//   Floor 2: C(0,0)
//   Inter-floor: B ── C (staircase/elevator)

const mockRoute = { nodes: ["node-1", "node-2"], distance: 10 };

const buildingConfig: BuildingNavConfig = {
  buildingId: "building-1",
  defaultStartNodeId: "A",
  floors: [
    {
      floorId: "floor-1",
      nodes: [
        {
          id: "A",
          floorId: "floor-1",
          x: 0,
          y: 0,
          type: "room",
          isEntrance: true,
        },
        { id: "B", floorId: "floor-1", x: 10, y: 0, type: "room" },
        {
          id: "entrance-1",
          floorId: "floor-1",
          x: 0,
          y: 10,
          type: "entrance",
          isEntrance: true,
        },
      ],
      edges: [
        { nodeAId: "A", nodeBId: "B", accessible: true },
        { nodeAId: "A", nodeBId: "entrance-1", accessible: true },
      ],
    },
    {
      floorId: "floor-2",
      nodes: [{ id: "C", floorId: "floor-2", x: 0, y: 0, type: "room" }],
      edges: [],
    },
  ],
  interFloorEdges: [{ nodeAId: "B", nodeBId: "C", accessible: true }],
};

describe("IndoorMapService", () => {
  let service: IndoorMapService;
  let mockGraphInstance: jest.Mocked<Graph>;
  let mockPathFinderInstance: jest.Mocked<PathFinder>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGraphInstance = {
      addNode: jest.fn(),
      addEdge: jest.fn(),
      getNode: jest.fn(),
      getEntranceNodes: jest.fn(),
    } as unknown as jest.Mocked<Graph>;

    mockPathFinderInstance = {
      findShortestPath: jest.fn().mockReturnValue(mockRoute),
    } as unknown as jest.Mocked<PathFinder>;

    MockGraph.mockImplementation(() => mockGraphInstance);
    MockPathFinder.mockImplementation(() => mockPathFinderInstance);

    service = new IndoorMapService();
  });

  describe("constructor", () => {
    it("creates a Graph and a PathFinder", () => {
      expect(MockGraph).toHaveBeenCalledTimes(1);
      expect(MockPathFinder).toHaveBeenCalledTimes(1);
    });
  });

  describe("loadBuilding", () => {
    it("resets the graph and pathfinder on each call", () => {
      service.loadBuilding(buildingConfig);
      service.loadBuilding(buildingConfig);

      // Each loadBuilding creates fresh Graph and PathFinder instances (plus the one in the constructor)
      expect(MockGraph).toHaveBeenCalledTimes(3);
      expect(MockPathFinder).toHaveBeenCalledTimes(3);
    });

    it("adds all nodes from every floor", () => {
      service.loadBuilding(buildingConfig);
      const allNodes = buildingConfig.floors.flatMap((f) => f.nodes);
      expect(mockGraphInstance.addNode.mock.calls.map((c) => c[0])).toEqual(
        allNodes,
      );
    });

    it("adds all edges from every floor", () => {
      service.loadBuilding(buildingConfig);
      const allEdges = buildingConfig.floors.flatMap((f) => f.edges);
      allEdges.forEach((edge) => {
        expect(mockGraphInstance.addEdge).toHaveBeenCalledWith(edge);
      });
    });

    it("adds inter-floor edges after floor edges", () => {
      service.loadBuilding(buildingConfig);
      buildingConfig.interFloorEdges!.forEach((edge) => {
        expect(mockGraphInstance.addEdge).toHaveBeenCalledWith(edge);
      });
    });
  });
  describe("getRoute", () => {
    it("delegates to PathFinder and returns the result", () => {
      const route = service.getRoute("A", "B");
      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith(
        "A",
        "B",
        false,
      );
      expect(route).toBe(mockRoute);
    });

    it("passes accessibleOnly flag to PathFinder", () => {
      service.getRoute("A", "B", true);
      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith(
        "A",
        "B",
        true,
      );
    });
  });
});
