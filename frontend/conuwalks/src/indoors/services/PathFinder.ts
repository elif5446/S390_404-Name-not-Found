import { Node } from "../types/Navigation";
import { Route } from "../types/Routes";
import { Graph } from "./Graph";

//this class is the A* implementation for finding the shortest path.
export class PathFinder {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  findShortestPath(
    startNodeId: string,
    endNodeId: string,
    accessibleOnly: boolean = false,
  ): Route {
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
        return this.buildRoute(cameFrom, currentId, gScore.get(currentId));
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
        if (accessibleOnly && !edge.accessible) continue;

        // calculate the cost to reach this neighbor through current node
        if (edge.weight === undefined) {
          throw new Error(
            `Edge between ${currentId} and ${neighbor.id} has no weight`,
          );
        }
        const tentativeGScore =
          (gScore.get(currentId) ?? Infinity) + edge.weight;

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

  // straight line distance between two nodes (estimates how far we are from the goal)
  private heuristic(nodeA: Node, nodeB: Node): number {
    const spatialDistance = Math.sqrt(
      Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2),
    );

    // add an arbitrary penalty if the floors don't match
    const floorPenalty = nodeA.floorId !== nodeB.floorId ? 500 : 0;

    return spatialDistance + floorPenalty;
  }

  // finds the node in the open set with the lowest fScore
  private getLowestFScore(
    openSet: Set<string>,
    fScore: Map<string, number>,
  ): string {
    let lowest: string | undefined;
    let lowestScore = Infinity;

    for (const nodeId of openSet) {
      const score = fScore.get(nodeId) ?? Infinity;
      if (score < lowestScore) {
        lowestScore = score;
        lowest = nodeId;
      }
    }
    return lowest!;
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

    return {
      nodes,
      totalDistance,
    };
  }
}
