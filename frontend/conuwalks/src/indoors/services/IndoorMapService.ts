import { BuildingNavConfig, Node } from "../types/Navigation";
import { Route, UserLocation } from "../types/Routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";
import { IndoorLocationTracker } from "./IndoorLocationTracker";

export class IndoorMapService {
  private graph: Graph;
  private pathFinder: PathFinder;
  private locationTracker: IndoorLocationTracker;

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

    //load the floors
    for (const floor of config.floors) {
      for (const node of floor.nodes) {
        this.graph.addNode(node);
      }
      for (const edge of floor.edges) {
        this.graph.addEdge(edge);
      }
    }

    // add inter-floor edges (if they exist) after all floors are loaded
    // this is done last because inter-floor edges reference nodes on different floors
    // so all nodes must exist in the graph before these edges can be added
    if (config.interFloorEdges) {
      for (const edge of config.interFloorEdges) {
        this.graph.addEdge(edge);
      }
    }

    if (config.defaultStartNodeId) {
      try {
        this.locationTracker.setDefaultLocation(config.defaultStartNodeId);
      } catch (e) {
        console.warn(`Failed to set default location: ${e}`);
      }
    }
  }

  getGraph(): Graph {
    return this.graph;
  }

  //you can find a route by giving a start and end node
  getRoute(
    startNodeId: string,
    endNodeId: string,
    accessibleOnly: boolean = false,
  ): Route {
    return this.pathFinder.findShortestPath(
      startNodeId,
      endNodeId,
      accessibleOnly,
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
  ): Route {
    const userLoc = this.getUserLocation();
    if (!userLoc) {
      throw new Error("IndoorMapService: user location not set");
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
    const cleanRoom = roomNumber.replace(/\s+/g, "").toUpperCase();
    const targetId = `${buildingId}_${cleanRoom}`;
    return this.graph.getNode(targetId) || null;
  }

  // finds the nearest room/poi node given cartesian x/y coordinates
  getNearestRoomNode(floorId: string, x: number, y: number): Node | null {
    const nodesOnFloor = this.graph
      .getAllNodes()
      .filter(
        (n) => n.floorId === floorId && (n.type === "room" || n.type === "poi"),
      );

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

    return minDistance < 100 ? nearestNode : null;
  }

  getEntranceNode(): Node | null {
    const entrances = this.graph.getEntranceNodes();
    return entrances.length > 0 ? entrances[0] : null;
  }
}
