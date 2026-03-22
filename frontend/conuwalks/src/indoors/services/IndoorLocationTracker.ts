import { Node } from "../types/Navigation";
import { UserLocation } from "../types/Routes";
import { Graph } from "./Graph";

export class IndoorLocationTracker {
  private graph: Graph;
  private userLocation: UserLocation | null = null;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  setGraph(graph: Graph): void {
    this.graph = graph;
    this.userLocation = null;
  }

  setUserLocation(nodeId: string): void {
    const node = this.graph.getNode(nodeId);
    if (!node) {
      throw new Error(`Node: ${nodeId} does not exist in the graph`);
    }
    this.userLocation = { nodeId: node.id, floorId: node.floorId };
  }

  setDefaultLocation(defaultStartNodeId: string): void {
    const startNode = this.graph.getNode(defaultStartNodeId);
    if (startNode) {
      this.userLocation = {
        nodeId: defaultStartNodeId,
        floorId: startNode.floorId,
      };
    } else {
      throw new Error(
        `IndoorLocationTracker: defaultStartNodeId "${defaultStartNodeId}" not found in graph`,
      );
    }
  }

  getUserLocation(): UserLocation | null {
    return this.userLocation;
  }

  getStartNode(): Node | null {
    if (!this.userLocation) return null;
    return this.graph.getNode(this.userLocation.nodeId) ?? null;
  }

  resetLocation(): void {
    this.userLocation = null;
  }
}
