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
          entranceLocation: { latitude: 45.5, longitude: -73.6 },
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
      getNode: jest.fn().mockReturnValue({
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room",
        isEntrance: true,
      }),
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

    it("initialises userLocation as null", () => {
      expect(service.getUserLocation()).toBeNull();
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

    it("sets userLocation to defaultStartNodeId when node is found", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      service.loadBuilding(buildingConfig);

      expect(service.getUserLocation()).toEqual({
        nodeId: "A",
        floorId: "floor-1",
      });
    });

    it("resets a previously set userLocation before applying default", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      service.setUserLocation("B");
      service.loadBuilding(buildingConfig);

      // should now be the default, not B
      expect(service.getUserLocation()).toEqual({
        nodeId: "A",
        floorId: "floor-1",
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

  describe("setUserLocation / getUserLocation", () => {
    it("stores and returns the user location", () => {
      const nodeB = {
        id: "B",
        floorId: "floor-1",
        x: 10,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeB);

      service.setUserLocation("B");

      expect(service.getUserLocation()).toEqual({
        nodeId: "B",
        floorId: "floor-1",
      });
    });

    it("throws when the node does not exist in the graph", () => {
      mockGraphInstance.getNode.mockReturnValue(
        undefined as unknown as ReturnType<Graph["getNode"]>,
      );

      expect(() => service.setUserLocation("nonexistent")).toThrow(
        "Node: nonexistent does not exist in the graph",
      );
    });
  });

  describe("getRouteFromCurrentLocation", () => {
    it("throws if userLocation is not set", () => {
      expect(() => service.getRouteFromCurrentLocation("B")).toThrow(
        "IndoorMapService: user location not set",
      );
    });

    it("uses the current userLocation as start node", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      service.setUserLocation("A");
      const route = service.getRouteFromCurrentLocation("B");

      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith(
        "A",
        "B",
        false,
      );
      expect(route).toBe(mockRoute);
    });

    it("passes accessibleOnly flag into PathFinder", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      service.setUserLocation("A");
      service.getRouteFromCurrentLocation("B", true);

      expect(mockPathFinderInstance.findShortestPath).toHaveBeenCalledWith(
        "A",
        "B",
        true,
      );
    });
  });
  describe("getStartNode", () => {
    it("returns null when userLocation is not set", () => {
      expect(service.getStartNode()).toBeNull();
    });

    it("returns the node from the graph when userLocation is set", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      service.setUserLocation("A");

      expect(service.getStartNode()).toBe(nodeA);
      expect(mockGraphInstance.getNode).toHaveBeenCalledWith("A");
    });
  });
});
