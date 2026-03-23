import { Graph } from "@/src/indoors/services/Graph";
import { PathFinder } from "@/src/indoors/services/PathFinder";
import { Node, Edge } from "@/src/indoors/types/Navigation";

const makeNode = (
  id: string,
  x: number,
  y: number,
  isEntrance = false,
  label?: string,
): Node => ({
  id,
  floorId: "floor-1",
  x,
  y,
  type: "hallway",
  isEntrance,
  label,
});

const makeEdge = (nodeAId: string, nodeBId: string, accessible = true): Edge => ({
  nodeAId,
  nodeBId,
  accessible,
});

//test graph 
/**
 *       A (0,0) ---- B (3,0) ---- C (3,4)
 *                    |            
 *                    D (6,0) 
 * 
 *       A-> B =3, B-> C =4, B-> D =3, A-> C = 7
 */

function buildSimpleGraph(): { graph: Graph; pathFinder: PathFinder } {
  const graph = new Graph();
  graph.addNode(makeNode("A", 0, 0, true, "Entrance"));
  graph.addNode(makeNode("B", 3, 0, false));
  graph.addNode(makeNode("C", 3, 4, false, "Room 101"));
  graph.addNode(makeNode("D", 6, 0, false, "Room 102"));
  graph.addEdge(makeEdge("A", "B"));
  graph.addEdge(makeEdge("B", "C"));
  graph.addEdge(makeEdge("B", "D"));

  return { graph, pathFinder: new PathFinder(graph) };
}

describe("PathFinder", () =>{
    describe("findShortestPath - error cases", () => {
        it("should throw when the start node does not exist", () => {
            const { pathFinder } = buildSimpleGraph();
            expect(() => pathFinder.findShortestPath("MISSING", "C")).toThrow(
                /start or end node not found/i,
            );
        });

        it("should throw when the end node does not exist", () => {
            const { pathFinder } = buildSimpleGraph();
            expect(() => pathFinder.findShortestPath("A", "MISSING")).toThrow(
                /start or end node not found/i,
            );
        });

        it("should throw when no path exists between start and end node", () => {
            const graph = new Graph();
            graph.addNode(makeNode("A", 0, 0));
            graph.addNode(makeNode("B", 5, 5)); // isolated — no edge
            const pathFinder = new PathFinder(graph);
            expect(() => pathFinder.findShortestPath("A", "B")).toThrow(
                /no path found/i,
            );
        });
    });

    describe("findShortestPath - returns route", () => {
        it("should return a route with nodes, totalDistance, and instructions", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("A", "C");
            expect(route).toHaveProperty("nodes");
            expect(route).toHaveProperty("totalDistance");
        });

        it("should return a single-node route when start equals end", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("A", "A");
            expect(route.nodes).toHaveLength(1);
            expect(route.nodes[0].id).toBe("A");
            expect(route.totalDistance).toBe(0);
        });

        it("should include the start and end node in the route", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("A", "C");
            const ids = route.nodes.map((n) => n.id);
            expect(ids[0]).toBe("A");
            expect(ids.at(-1)).toBe("C");
        });
    });

    describe("findShortestPath - correct results", () => {
        it("should find the direct path A→B→C with correct distance", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("A", "C");
            const ids = route.nodes.map((n) => n.id);
            expect(ids).toEqual(["A", "B", "C"]);
            expect(route.totalDistance).toBeCloseTo(7, 5); // 3 + 4
        });

        it("should find the direct path A→B→D with correct distance", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("A", "D");
            const ids = route.nodes.map((n) => n.id);
            expect(ids).toEqual(["A", "B", "D"]);
            expect(route.totalDistance).toBeCloseTo(6, 5); // 3 + 3
        });

        it("should prefer the shorter path when two routes exist", () => {
            //  A(0,0) --1 -- B(1,0) -- 1 -- C(2,0)
            //   \                        /
            //    ------ D (1, -10) ------

            const graph = new Graph();
            graph.addNode(makeNode("A", 0, 0));
            graph.addNode(makeNode("B", 1, 0));
            graph.addNode(makeNode("C", 2, 0));
            graph.addNode(makeNode("D", 1, 0.1));
            graph.addEdge(makeEdge("A", "B"));
            graph.addEdge(makeEdge("B", "C"));
            graph.addEdge(makeEdge("A", "D"));
            graph.addEdge(makeEdge("D", "C"));
            const pathFinder = new PathFinder(graph);

            const route = pathFinder.findShortestPath("A", "C");
            expect(route.nodes.map((n) => n.id)).toEqual(["A", "B", "C"]);
            expect(route.totalDistance).toBeCloseTo(2, 5); // A→B→C = 1+1
        });

        it("should work when traversing in reverse (C→A)", () => {
            const { pathFinder } = buildSimpleGraph();
            const route = pathFinder.findShortestPath("C", "A");
            const ids = route.nodes.map((n) => n.id);
            expect(ids).toEqual(["C", "B", "A"]);
            expect(route.totalDistance).toBeCloseTo(7, 5);
        });

        it("should exclude inaccessible edges when accessibleOnly is true - doesn't find accessible path", () => {
            const graph = new Graph();
            graph.addNode(makeNode("A", 0, 0));
            graph.addNode(makeNode("B", 1, 0));
            graph.addEdge(makeEdge("A", "B", false)); // inaccessible direct route
            const pf = new PathFinder(graph);

            expect(() => pf.findShortestPath("A", "B", true)).toThrow(/no path found/i);
        });

        it("should exclude inaccessible edges when accessibleOnly is true - only return accessible path", () => {
            const graph = new Graph();
            graph.addNode(makeNode("A", 0, 0));
            graph.addNode(makeNode("B", 1, 0));
            graph.addNode(makeNode("C", 2, 0));
            graph.addEdge(makeEdge("A", "B", false)); // inaccessible direct route
            graph.addEdge(makeEdge("A", "C"));  // accessible longer route
            const pf = new PathFinder(graph);

            const route = pf.findShortestPath("A", "C", true);
            expect(route.nodes.map(n => n.id)).toEqual(["A", "C"]);
        });
    });
})
