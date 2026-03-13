import { BuildingNavConfig, Node } from "../types/Navigation";
import { Route, UserLocation } from "../types/Routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";

//use this file to load The Building Data, to find the fastest path.
//Return:S
//     route{
//     Nodes:Node[]
//     distance: number (can be converted to time later)
//     }

export class IndoorMapService {
  private graph: Graph;
  private pathFinder: PathFinder;

  constructor() {
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
  }

  loadBuilding(config: BuildingNavConfig): void {
    //this will reset the graph everytime a new building is pressed
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
    
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
  }

  getGraph(): Graph {
    return this.graph;
  }
  
  //you can find a route by giving a start and end node
  async getRoute(startNodeId: string, endNodeId: string, accessibleOnly: boolean | null = null): Promise<Route> {
    const wheelchairOnly = accessibleOnly ?? await getWheelchairAccessibilityPreference();
    return this.pathFinder.findShortestPath(startNodeId, endNodeId, wheelchairOnly);
  }

}
