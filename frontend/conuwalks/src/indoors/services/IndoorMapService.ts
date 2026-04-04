import { Route, UserLocation } from "../types/Routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";
import { IndoorLocationTracker } from "./IndoorLocationTracker";
import {
  generateRouteSteps,
  RouteStep,
} from "@/src/indoors/services/RouteInstructionService";
import { BuildingNavConfig, Node, NodeType } from "../types/Navigation";

export class IndoorMapService {
  private graph: Graph;
  private pathFinder: PathFinder;
  private readonly locationTracker: IndoorLocationTracker;

  constructor() {
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
    this.locationTracker = new IndoorLocationTracker(this.graph);
  }

  loadBuilding(config: BuildingNavConfig): void {
    //this will reset the graph everytime a new building is pressed
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
    this.locationTracker.setGraph(this.graph);

    // load ALL nodes across ALL floors
    // This ensures no edges fail because a target node hasn't been parsed yet
    for (const floor of config.floors) {
      for (const node of floor.nodes) {
        this.graph.addNode(node);
      }
    }

    // add standard intra-floor edges
    for (const floor of config.floors) {
      for (const edge of floor.edges) {
        this.graph.addEdge(edge);
      }
    }

    // add inter-floor edges (if they exist) after all floors are loaded
    // this is done last because inter-floor edges reference nodes on different floors
    // so all nodes must exist in the graph before these edges can be added.
    //Escalator edges between floors will not be bi-directional
    if (config.interFloorEdges) {
      for (const edge of config.interFloorEdges) {
        const nodeA = this.graph.getNode(edge.nodeAId);
        const nodeB = this.graph.getNode(edge.nodeBId);
        const isEscalator =
          nodeA?.type === "escalator" || nodeB?.type === "escalator";
        this.graph.addEdge(edge, isEscalator);
      }
    }

    if (config.defaultStartNodeId) {
      try {
        this.locationTracker.setDefaultLocation(config.defaultStartNodeId);
      } catch (e) {
        console.warn(`[IndoorMapService] Failed to set default location: ${e}`);
      }
    }
  }

  getGraph(): Graph {
    return this.graph;
  }

  async getRoute(
    startNodeId: string,
    endNodeId: string,
    accessibleOnly: boolean | null = null,
  ): Promise<Route | null> {
    const wheelchairOnly =
      accessibleOnly ?? (await getWheelchairAccessibilityPreference());
    return this.pathFinder.findShortestPath(
      startNodeId,
      endNodeId,
      wheelchairOnly,
    );
  }

  setUserLocation(nodeId: string): void {
    const initialUserLocation = this.graph.getNode(nodeId);
    if (!initialUserLocation) {
      throw new Error(`Node: ${nodeId} does not exist in the graph`);
    }
    this.locationTracker.setUserLocation(nodeId);
  }

  getUserLocation(): UserLocation | null {
    return this.locationTracker.getUserLocation();
  }

  //find shortest route by giving only an end node (will use the default location or preset location as starting node)
  getRouteFromCurrentLocation(
    endNodeId: string,
    accessibleOnly: boolean = false,
  ): Route | null {
    const userLoc = this.getUserLocation();
    if (!userLoc) {
      console.warn(
        "[IndoorMapService] User location not set. Cannot calculate route.",
      );
      return null;
    }
    return this.pathFinder.findShortestPath(
      userLoc.nodeId,
      endNodeId,
      accessibleOnly,
    );
  }

  //this will get the default start node for the building that is being loaded
  getStartNode(): Node | null {
    return this.locationTracker.getStartNode();
  }

  // resolves a raw room string (e.g. "847") to a node ID (e.g. "H_847")
  getNodeByRoomNumber(buildingId: string, roomNumber: string): Node | null {
    const cleanRoom = roomNumber.replaceAll(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const allNodes = this.graph.getAllNodes();

    // try an exact match assuming standard prefix "H_964"
    const exactId = `${buildingId}_${cleanRoom}`;
    let targetNode = this.graph.getNode(exactId);
    if (targetNode) return targetNode;

    // fallback: search all nodes for an ID that ends with the target number
    targetNode = allNodes.find((n) => {
      const cleanId = n.id.replaceAll(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleanId.endsWith(cleanRoom);
    });

    return targetNode || null;
  }

  // finds the nearest room/poi node given cartesian x/y coordinates
  getNearestRoomNode(floorId: string, x: number, y: number): Node | null {
    const validTypes = new Set<NodeType>([
      "room",
      "poi",
      "bathroom",
      "food",
      "helpDesk",
      "elevator",
      "escalator",
      "stairs",
      "entrance",
      "hallway",
    ]);

    const nodesOnFloor = this.graph
      .getAllNodes()
      .filter((n) => n.floorId === floorId && validTypes.has(n.type));

    let nearestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of nodesOnFloor) {
      const distance = Math.sqrt(
        Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2),
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }

    return minDistance < 150 ? nearestNode : null;
  }

  getEntranceNode(): Node | null {
    const entrances = this.graph.getEntranceNodes();
    return entrances.length > 0 ? entrances[0] : null;
  }

  /**
   * Calculates the estimated walking time in seconds for an indoor route.
   * @param route The generated indoor Route object
   * @param pixelToMeterRatio The scale of SVG/Map. (e.g., if 10 pixels = 1 meter, pass 0.1)
   */
  public getRouteDurationSeconds(
    route: Route | null,
    pixelToMeterRatio: number = 1,
  ): number {
    if (!route?.totalDistance) return 0;

    const distanceInMeters = route.totalDistance * pixelToMeterRatio;
    const WALKING_SPEED_MPS = 1.35;

    let baseSeconds = distanceInMeters / WALKING_SPEED_MPS;

    // add a time penalty for floor changes (e.g., 15 seconds per elevator/stair transition)
    const floorChanges = this.calculateFloorChanges(route);
    baseSeconds += floorChanges * 15;

    return Math.round(baseSeconds);
  }

  private calculateFloorChanges(route: Route): number {
    let changes = 0;
    for (let i = 1; i < route.nodes.length; i++) {
      if (route.nodes[i].floorId !== route.nodes[i - 1].floorId) {
        changes++;
      }
    }
    return changes;
  }
  getRouteInstructions(route: Route): { steps: RouteStep[] } {
    return {
      steps: generateRouteSteps(route.nodes),
    };
  }
}
