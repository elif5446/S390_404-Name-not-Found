import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { BuildingNavConfig } from "@/src/indoors/types/Navigation";
import { Graph } from "@/src/indoors/services/Graph";
import { PathFinder } from "@/src/indoors/services/PathFinder";
import { generateRouteSteps } from "@/src/indoors/services/RouteInstructionService";

jest.mock("@/src/indoors/services/Graph");
jest.mock("@/src/indoors/services/PathFinder");
jest.mock("@/src/indoors/services/RouteInstructionService", () => ({
  generateRouteSteps: jest.fn().mockReturnValue([{ instruction: "Test Step" }]),
}));

jest.mock("@/src/utils/tokenStorage", () => ({
  getWheelchairAccessibilityPreference: jest.fn().mockResolvedValue(false),
}));

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
      getAllNodes: jest.fn().mockReturnValue([]),
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
      const allNodes = buildingConfig.floors.flatMap(f => f.nodes);
      expect(mockGraphInstance.addNode.mock.calls.map(c => c[0])).toEqual(allNodes);
    });

    it("adds all edges from every floor", () => {
      service.loadBuilding(buildingConfig);
      const allEdges = buildingConfig.floors.flatMap(f => f.edges);
      allEdges.forEach(edge => {
        expect(mockGraphInstance.addEdge).toHaveBeenCalledWith(edge);
      });
    });

    it("adds inter-floor edges after floor edges", () => {
      mockGraphInstance.getNode.mockImplementation((id: string) => {
        const allNodes = buildingConfig.floors.flatMap(f => f.nodes);
        return allNodes.find(n => n.id === id);
      });

      service.loadBuilding(buildingConfig);

      buildingConfig.interFloorEdges!.forEach(edge => {
        expect(mockGraphInstance.addEdge).toHaveBeenCalledWith(edge, false);
      });
    });

    it("handles failure to set default location gracefully", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      // Throw an error inside default location setting implicitly (e.g., node not found internally)
      const badConfig = { ...buildingConfig, defaultStartNodeId: "INVALID" };

      expect(() => service.loadBuilding(badConfig)).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[IndoorMapService] Failed to set default location"));
      warnSpy.mockRestore();
    });
  });

  describe("getGraph", () => {
    it("returns the graph instance", () => {
      expect(service.getGraph()).toBeDefined();
      expect(service.getGraph()).toBe(mockGraphInstance);
    });
  });

  describe("getRoute", () => {
    it("delegates to PathFinder and returns the result", async () => {
      const route = await service.getRoute("A", "B");
      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith("A", "B", false);
      expect(route).toBe(mockRoute);
    });

    it("passes accessibleOnly flag to PathFinder", async () => {
      await service.getRoute("A", "B", true);
      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith("A", "B", true);
    });
  });

  describe("Location Management", () => {
    it("setUserLocation successfully sets user location", () => {
      const mockNode = { id: "A", floorId: "floor-1" };
      mockGraphInstance.getNode.mockReturnValue(mockNode as any);

      service.setUserLocation("A");
      const userLoc = service.getUserLocation();
      expect(userLoc?.nodeId).toBe("A");
    });

    it("setUserLocation throws error if node does not exist in graph", () => {
      mockGraphInstance.getNode.mockReturnValue(undefined);

      expect(() => service.setUserLocation("non-existent")).toThrow("Node: non-existent does not exist in the graph");
    });

    it("getRouteFromCurrentLocation throws error if user location is not set", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(service.getRouteFromCurrentLocation("B")).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith("[IndoorMapService] User location not set. Cannot calculate route.");
      warnSpy.mockRestore();
    });

    it("getRouteFromCurrentLocation calls pathfinder with current user location", () => {
      const mockNode = { id: "A", floorId: "floor-1" };
      mockGraphInstance.getNode.mockReturnValue(mockNode as any);

      service.setUserLocation("A");
      service.getRouteFromCurrentLocation("B", true);

      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith("A", "B", true);
    });

    it("getStartNode returns the configured default start node", () => {
      const mockNode = { id: "A", floorId: "floor-1" };
      mockGraphInstance.getNode.mockReturnValue(mockNode as any);

      service.loadBuilding(buildingConfig);
      const startNode = service.getStartNode();

      expect(startNode?.id).toBe("A");
    });
  });

  describe("Node Retrieval Methods", () => {
    describe("getNodeByRoomNumber", () => {
      it("returns exact match if exists", () => {
        const mockNode = { id: "BUILDING1_847", type: "room" };
        mockGraphInstance.getNode.mockReturnValue(mockNode as any);

        const result = service.getNodeByRoomNumber("BUILDING1", "847");
        expect(result).toEqual(mockNode);
        expect(mockGraphInstance.getNode).toHaveBeenCalledWith("BUILDING1_847");
      });

      it("returns fallback match if exact match does not exist", () => {
        const mockNode = { id: "SOMEPREFIX_847A", type: "room" };
        mockGraphInstance.getNode.mockReturnValue(undefined);
        mockGraphInstance.getAllNodes.mockReturnValue([{ id: "OTHER_111" }, mockNode] as any);

        const result = service.getNodeByRoomNumber("BUILDING1", "847a-");
        expect(result).toEqual(mockNode);
      });

      it("returns null if no match is found", () => {
        mockGraphInstance.getNode.mockReturnValue(undefined);
        mockGraphInstance.getAllNodes.mockReturnValue([{ id: "OTHER_111" }] as any);

        const result = service.getNodeByRoomNumber("BUILDING1", "999");
        expect(result).toBeNull();
      });
    });

    describe("getNearestRoomNode", () => {
      it("returns the closest valid node within 150 pixels", () => {
        const validNode1 = { id: "1", floorId: "F1", type: "room", x: 0, y: 0 };
        const validNode2 = { id: "2", floorId: "F1", type: "bathroom", x: 100, y: 0 }; // distance 100
        const invalidNode = { id: "3", floorId: "F1", type: "wall", x: 50, y: 0 }; // closer, but invalid type
        const wrongFloor = { id: "4", floorId: "F2", type: "room", x: 0, y: 0 };

        mockGraphInstance.getAllNodes.mockReturnValue([validNode1, validNode2, invalidNode, wrongFloor] as any);

        const result = service.getNearestRoomNode("F1", 110, 0); // distance to validNode2 is 10
        expect(result).toEqual(validNode2);
      });

      it("returns null if nearest node is 150 pixels or further away", () => {
        const farNode = { id: "1", floorId: "F1", type: "room", x: 200, y: 0 };
        mockGraphInstance.getAllNodes.mockReturnValue([farNode] as any);

        const result = service.getNearestRoomNode("F1", 0, 0); // distance 200
        expect(result).toBeNull();
      });
    });

    describe("getEntranceNode", () => {
      it("returns the first entrance node if available", () => {
        const entrance = { id: "entrance-1", type: "entrance" };
        mockGraphInstance.getEntranceNodes.mockReturnValue([entrance] as any);

        expect(service.getEntranceNode()).toEqual(entrance);
      });

      it("returns null if no entrance nodes are found", () => {
        mockGraphInstance.getEntranceNodes.mockReturnValue([]);
        expect(service.getEntranceNode()).toBeNull();
      });
    });
  });

  describe("Routing Utility Methods", () => {
    describe("getRouteDurationSeconds", () => {
      const mockRouteWithFloors = {
        totalDistance: 13.5, // 13.5 meters / 1.35 mps = 10 seconds
        nodes: [
          { id: "1", floorId: "L1" },
          { id: "2", floorId: "L1" },
          { id: "3", floorId: "L2" }, // One floor change here
        ],
      };

      it("calculates duration with walking speed and floor change penalties", () => {
        // 13.5m / 1.35mps = 10s
        // + 15s penalty for 1 floor change (L1 -> L2)
        // Total = 25s
        const duration = service.getRouteDurationSeconds(mockRouteWithFloors as any, 1);
        expect(duration).toBe(25);
      });

      it("returns 0 if route or distance is missing", () => {
        expect(service.getRouteDurationSeconds(null)).toBe(0);
        expect(service.getRouteDurationSeconds({ totalDistance: 0 } as any)).toBe(0);
      });
    });

    describe("getRouteInstructions", () => {
      it("generates routing instructions using the RouteInstructionService", () => {
        const mockNodes = [{ id: "A" }, { id: "B" }];
        const mockRouteObj = { nodes: mockNodes } as any;

        const result = service.getRouteInstructions(mockRouteObj);

        expect(generateRouteSteps).toHaveBeenCalledWith(mockNodes);
        expect(result).toEqual({ steps: [{ instruction: "Test Step" }] });
      });
    });
  });
});
