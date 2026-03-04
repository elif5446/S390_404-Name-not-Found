import { BuildingNavConfig, Node } from "../types/Navigation";
import { Route, UserLocation } from "../types/Routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";

//use this file to load The Building Data, to find the fastest path.
//Return:S
//     route{
//     Nodes:Node[]
//     distance: number (can be converted to time later)
//     }

export class IndoorMapService {
  private graph: Graph;
  private pathFinder: PathFinder;
  private userLocation: UserLocation | null = null;

  constructor() {
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
  }

  loadBuilding(config: BuildingNavConfig): void {
    //this will reset the graph everytime a new building is pressed
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
    this.userLocation = null;
    

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

    //set default start node as initial user location
    const startNode = this.graph.getNode(config.defaultStartNodeId);
    if (startNode) {
      this.userLocation = { nodeId: config.defaultStartNodeId, floorId: startNode.floorId };
    } else {
      throw new Error(`IndoorMapService: defaultStartNodeId "${config.defaultStartNodeId}" not found in graph`);
    }
  }
  
  //you can find a route by giving a start and end node
  getRoute(startNodeId: string, endNodeId: string, accessibleOnly: boolean = false): Route {
    return this.pathFinder.findShortestPath(startNodeId, endNodeId,accessibleOnly);
  }

  setUserLocation(nodeId: string): void {
    const initialUserLocation = this.graph.getNode(nodeId)
    if(!initialUserLocation){
      throw new Error(`Node: ${nodeId} does not exisit in the graph`);
    }
    this.userLocation = {nodeId: initialUserLocation.id, floorId: initialUserLocation.floorId};
    
  }

  getUserLocation(): UserLocation | null {
    return this.userLocation;
  }

  //find shortest route by giving only an end node (will use the default location or preset location as starting node)
  getRouteFromCurrentLocation(endNodeId: string, accessibleOnly: boolean= false): Route {
    if (!this.userLocation) {
      throw new Error("IndoorMapService: user location not set");
    }
    return this.pathFinder.findShortestPath(
      this.userLocation.nodeId,
      endNodeId,
      accessibleOnly
    );
  }

  //this will get the default start node for the building that is being loaded
  getStartNode(): Node | null {
  if (!this.userLocation) return null;
  return this.graph.getNode(this.userLocation.nodeId) ?? null;
}
}
