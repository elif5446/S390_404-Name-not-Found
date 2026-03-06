import { IndoorLocationTracker } from "@/src/indoors/services/IndoorLocationTracker";
import { Graph } from "@/src/indoors/services/Graph";
import { NodeType } from "@/src/indoors/types/Navigation";

jest.mock("@/src/indoors/services/Graph");

const MockGraph = Graph as jest.MockedClass<typeof Graph>;

describe("IndoorLocationTracker", () => {
  let tracker: IndoorLocationTracker;
  let mockGraphInstance: jest.Mocked<Graph>;

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

    MockGraph.mockImplementation(() => mockGraphInstance);

    tracker = new IndoorLocationTracker(mockGraphInstance);
  });

  describe("constructor", () => {
    it("initialises userLocation as null", () => {
      expect(tracker.getUserLocation()).toBeNull();
    });
  });

  describe("setDefaultLocation", () => {
    it("sets userLocation to the given defaultStartNodeId when node is found", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      tracker.setDefaultLocation("A");

      expect(tracker.getUserLocation()).toEqual({
        nodeId: "A",
        floorId: "floor-1",
      });
    });

    it("throws when the defaultStartNodeId is not found in the graph", () => {
      mockGraphInstance.getNode.mockReturnValue(
        undefined as unknown as ReturnType<Graph["getNode"]>
      );

      expect(() => tracker.setDefaultLocation("nonexistent")).toThrow(
        `IndoorLocationTracker: defaultStartNodeId "nonexistent" not found in graph`
      );
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

      tracker.setUserLocation("B");
      tracker.setDefaultLocation("A");

      expect(tracker.getUserLocation()).toEqual({
        nodeId: "A",
        floorId: "floor-1",
      });
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

      tracker.setUserLocation("B");

      expect(tracker.getUserLocation()).toEqual({
        nodeId: "B",
        floorId: "floor-1",
      });
    });

    it("throws when the node does not exist in the graph", () => {
      mockGraphInstance.getNode.mockReturnValue(
        undefined as unknown as ReturnType<Graph["getNode"]>
      );

      expect(() => tracker.setUserLocation("nonexistent")).toThrow(
        "Node: nonexistent does not exist in the graph"
      );
    });
  });

  describe("getStartNode", () => {
    it("returns null when userLocation is not set", () => {
      expect(tracker.getStartNode()).toBeNull();
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

      tracker.setUserLocation("A");

      expect(tracker.getStartNode()).toBe(nodeA);
      expect(mockGraphInstance.getNode).toHaveBeenCalledWith("A");
    });
  });

  describe("resetLocation", () => {
    it("clears userLocation back to null", () => {
      const nodeA = {
        id: "A",
        floorId: "floor-1",
        x: 0,
        y: 0,
        type: "room" as NodeType,
      };
      mockGraphInstance.getNode.mockReturnValue(nodeA);

      tracker.setUserLocation("A");
      tracker.resetLocation();

      expect(tracker.getUserLocation()).toBeNull();
    });
  });
});