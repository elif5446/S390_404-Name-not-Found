import { Graph } from "@/src/indoors/services/Graph";
import { Node, Edge } from "@/src/indoors/types/Navigation";

const makeNode = (
  id: string,
  x: number,
  y: number,
  isEntrance = false,
): Node => ({
  id,
  floorId: "floor-1",
  x,
  y,
  type: isEntrance ? "entrance" : "hallway",
  isEntrance,
});

const makeEdge = (
  nodeAId: string,
  nodeBId: string,
  accessible = true,
): Edge => ({
  nodeAId,
  nodeBId,
  accessible,
});

describe("Graph", () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new Graph();
  });

  describe("addNode", () => {
    it("should add node and retrieve node with getNode", () => {
      const node = makeNode("A", 0, 0);
      graph.addNode(node);
      expect(graph.getNode("A")).toEqual(node);
    });

    it("should return undefined when getting node that does not exist", () => {
      expect(graph.getNode("nonexistent")).toBeUndefined();
    });

    it("should throw an error when adding a node with a duplicate id", () => {
      graph.addNode(makeNode("A", 0, 0));
      expect(() => graph.addNode(makeNode("A", 10, 20))).toThrow(
        /already exists/i,
      );
    });
  });

  describe("getAllNodes", () => {
    it("should return an empty array when no nodes have been added", () => {
      expect(graph.getAllNodes()).toEqual([]);
    });

    it("should return all added nodes", () => {
      const a = makeNode("A", 0, 0);
      const b = makeNode("B", 3, 4);
      graph.addNode(a);
      graph.addNode(b);
      expect(graph.getAllNodes()).toHaveLength(2);
      expect(graph.getAllNodes()).toEqual(expect.arrayContaining([a, b]));
    });
  });

  describe("getEntranceNodes", () => {
    it("should return only nodes marked as entrances", () => {
      graph.addNode(makeNode("A", 0, 0, true));
      graph.addNode(makeNode("B", 1, 1, false));
      graph.addNode(makeNode("C", 2, 2, true));

      const entrances = graph.getEntranceNodes();
      expect(entrances).toHaveLength(2);
      expect(entrances.map((n) => n.id)).toEqual(
        expect.arrayContaining(["A", "C"]),
      );
    });

    it("should return an empty array when there are no entrance nodes", () => {
      graph.addNode(makeNode("A", 0, 0, false));
      expect(graph.getEntranceNodes()).toEqual([]);
    });
  });

  describe("addEdge", () => {
    beforeEach(() => {
      graph.addNode(makeNode("A", 0, 0));
      graph.addNode(makeNode("B", 3, 4));
    });

    it("should throw when nodeA does not exist", () => {
      expect(() => graph.addEdge(makeEdge("MISSING", "B"))).toThrow(
        /missing node/i,
      );
    });

    it("should throw when nodeB does not exist", () => {
      expect(() => graph.addEdge(makeEdge("A", "MISSING"))).toThrow(
        /missing node/i,
      );
    });

    it("should calculate the correct Euclidean weight", () => {
      // distance from (0,0) to (3,4) = 5
      graph.addEdge(makeEdge("A", "B"));
      const edge = graph.getEdge("A", "B");
      expect(edge).toBeDefined();
      expect(edge!.weight).toBeCloseTo(5, 5);
    });

    it("should create a bidirectional edge by default (A→B and B→A)", () => {
      graph.addEdge(makeEdge("A", "B"));
      expect(graph.getEdge("A", "B")).toBeDefined();
      expect(graph.getEdge("B", "A")).toBeDefined();
    });

    it("should have the same weight in both directions", () => {
      graph.addEdge(makeEdge("A", "B"));
      expect(graph.getEdge("A", "B")!.weight).toBeCloseTo(
        graph.getEdge("B", "A")!.weight,
        5,
      );
    });
    it("should create a one-way edge when oneWay is true (A→B only)", () => {
      graph.addEdge(makeEdge("A", "B"), true);
      expect(graph.getEdge("A", "B")).toBeDefined();
      expect(graph.getEdge("B", "A")).toBeUndefined();
    });

    it("should create a bidirectional edge when oneWay is false", () => {
      graph.addEdge(makeEdge("A", "B"), false);
      expect(graph.getEdge("A", "B")).toBeDefined();
      expect(graph.getEdge("B", "A")).toBeDefined();
    });
  });

  describe("getEdge", () => {
    it("should return undefined for nodes with no edges", () => {
      graph.addNode(makeNode("A", 0, 0));
      graph.addNode(makeNode("B", 1, 1));
      expect(graph.getEdge("A", "B")).toBeUndefined();
    });

    it("should return undefined for a non-existent nodeId", () => {
      // implementation uses '|| []' fallback so this safely returns undefined
      expect(graph.getEdge("nonexistent", "B")).toBeUndefined();
    });
  });

  describe("getNeighbors", () => {
    it("should return an empty array for a completely unknown nodeId", () => {
      expect(graph.getNeighbors("nonexistent")).toEqual([]);
    });

    it("should return correct neighbors after adding edges", () => {
      const a = makeNode("A", 0, 0);
      const b = makeNode("B", 1, 0);
      const c = makeNode("C", 0, 1);
      graph.addNode(a);
      graph.addNode(b);
      graph.addNode(c);
      graph.addEdge(makeEdge("A", "B"));
      graph.addEdge(makeEdge("A", "C"));

      const neighbors = graph.getNeighbors("A");
      expect(neighbors).toHaveLength(2);
      expect(neighbors.map((n) => n.id)).toEqual(
        expect.arrayContaining(["B", "C"]),
      );
    });

    it("should reflect bidirectionality (B should list A as a neighbor)", () => {
      graph.addNode(makeNode("A", 0, 0));
      graph.addNode(makeNode("B", 1, 0));
      graph.addEdge(makeEdge("A", "B"));

      expect(graph.getNeighbors("B").map((n) => n.id)).toContain("A");
    });
  });

  describe("full graph loading example", () => {
    /**
     *  A -----B ----- C
     *         |
     *         D
     */
    beforeEach(() => {
      graph.addNode(makeNode("A", 0, 0, true));
      graph.addNode(makeNode("B", 3, 0));
      graph.addNode(makeNode("C", 3, 4));
      graph.addNode(makeNode("D", 6, 0));
      graph.addEdge(makeEdge("A", "B"));
      graph.addEdge(makeEdge("B", "C"));
      graph.addEdge(makeEdge("B", "D"));
    });

    it("should have 4 nodes in total", () => {
      expect(graph.getAllNodes()).toHaveLength(4);
    });

    it("should have 1 entrance node", () => {
      expect(graph.getEntranceNodes()).toHaveLength(1);
      expect(graph.getEntranceNodes()[0].id).toBe("A");
    });

    it("A->B weight should be 3", () => {
      expect(graph.getEdge("A", "B")!.weight).toBeCloseTo(3, 5);
    });

    it("B should have 3 neighbors (A, C, D)", () => {
      expect(graph.getNeighbors("B")).toHaveLength(3);
    });

    it("A should only have B as a neighbor", () => {
      const neighbors = graph.getNeighbors("A");
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].id).toBe("B");
    });
  });
});
