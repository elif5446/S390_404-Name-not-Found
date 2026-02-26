import { Node } from "../types/navigation";
import { Route } from "../types/routes";
import { Graph } from "./Graph";

export class PathFinder {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  findShortestPath(startNodeId: string, endNodeId: string): Route {
    const startNode = this.graph.getNode(startNodeId);
    const endNode = this.graph.getNode(endNodeId);

    if (!startNode || !endNode) {
      throw new Error(`PathFinder: start or end node not found`);
    }

    // gScore = actual cost from start to this node
    // fScore = gScore + heuristic (estimated cost to end)
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // the list of nodes we still need to explore
    const openSet = new Set<string>();

    // the list of nodes we already explored
    const closedSet = new Set<string>();

    // cameFrom tracks which node we came from to reconstruct the path at the end
    const cameFrom = new Map<string, string>();

    // initialize with start node
    gScore.set(startNodeId, 0);
    fScore.set(startNodeId, this.heuristic(startNode, endNode));
    openSet.add(startNodeId);

    while (openSet.size > 0) {
      // get the node in openSet with the lowest fScore
      const currentId = this.getLowestFScore(openSet, fScore);

      // we reached the destination
      if (currentId === endNodeId) {
        return this.buildRoute(cameFrom, currentId, gScore.get(currentId)!);
      }

      openSet.delete(currentId);
      closedSet.add(currentId);

      // explore neighbors
      const neighbors = this.graph.getNeighbors(currentId);

      for (const neighbor of neighbors) {
        // skip already explored nodes
        if (closedSet.has(neighbor.id)) continue;

        const edge = this.graph.getEdge(currentId, neighbor.id);
        if (!edge) continue;

        // calculate the cost to reach this neighbor through current node
        const tentativeGScore =
          (gScore.get(currentId) ?? Infinity) + edge.weight!;

        if (tentativeGScore < (gScore.get(neighbor.id) ?? Infinity)) {
          // this is a better path to this neighbor so update
          cameFrom.set(neighbor.id, currentId);
          gScore.set(neighbor.id, tentativeGScore);
          fScore.set(
            neighbor.id,
            tentativeGScore + this.heuristic(neighbor, endNode),
          );
          openSet.add(neighbor.id);
        }
      }
    }

    throw new Error(
      `PathFinder: no path found between ${startNodeId} and ${endNodeId}`,
    );
  }

  // straight line distance between two nodes — estimates how far we are from the goal
  private heuristic(nodeA: Node, nodeB: Node): number {
    return Math.sqrt(
      Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2),
    );
  }

  // finds the node in the open set with the lowest fScore
  private getLowestFScore(
    openSet: Set<string>,
    fScore: Map<string, number>,
  ): string {
    let lowest: string | null = null;
    let lowestScore = Infinity;

    for (const nodeId of openSet) {
      const score = fScore.get(nodeId) ?? Infinity;
      if (score < lowestScore) {
        lowestScore = score;
        lowest = nodeId;
      }
    }

    if (!lowest) {
      throw new Error("PathFinder: open set is empty");
    }

    return lowest;
  }

  // reconstructs the path by walking backwards from cameFrom
  private buildRoute(
    cameFrom: Map<string, string>,
    endNodeId: string,
    totalDistance: number,
  ): Route {
    const path: string[] = [];
    let current = endNodeId;

    while (cameFrom.has(current)) {
      path.unshift(current);
      current = cameFrom.get(current)!;
    }

    path.unshift(current); // add the start node

    const nodes = path.map((id) => this.graph.getNode(id)!);
    const instructions = this.buildInstructions(nodes);

    return {
      nodes,
      totalDistance,
      instructions,
    };
  }

  // generates human readable instructions from the node sequence
  private buildInstructions(nodes: Node[]): string[] {
    const instructions: string[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (i === 0) {
        instructions.push(`Start at ${node.label ?? "your location"}`);
      } else if (i === nodes.length - 1) {
        instructions.push(`Arrive at ${node.label ?? "your destination"}`);
      } else if (node.label) {
        instructions.push(`Continue towards ${node.label}`);
      }
      // hallway nodes with no label are silently skipped
    }

    return instructions;
  }
}
