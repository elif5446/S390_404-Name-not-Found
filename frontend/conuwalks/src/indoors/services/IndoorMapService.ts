import { BuildingNavConfig, Node } from "../types/Navigation";
import { Route, UserLocation } from "../types/Routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";
import { getWheelchairAccessibilityPreference } from "@/src/utils/tokenStorage";
import { IndoorLocationTracker } from "./IndoorLocationTracker";
import { generateRouteSteps, RouteStep } from "@/src/indoors/services/RouteInstructionService";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// ─── POI helpers (outside the class) ────────────────────────────────────────

const NODE_COORD_MAX = 1024;

const NODE_TYPE_CONFIG: Record<string, {
  category: string;
  icon: string;
  iconLib: "ion" | "mci";
  bg: string;
  iconColor: string;
  label: string;
} | null> = {
  hallway: null,
  room: null,
  lab: {
    category: "LAB",
    icon: "desktop-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Lab",
  },
  bathroom: null,
  elevator: {
    category: "ELEVATOR",
    icon: "elevator",
    iconLib: "mci",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Elevator",
  },
  stairs: {
    category: "STAIRS",
    icon: "stairs",
    iconLib: "mci",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Stairs",
  },
  escalator: {
    category: "ESCALATOR",
    icon: "escalator",
    iconLib: "mci",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Escalator",
  },
  entrance: {
    category: "ENTRANCE",
    icon: "enter-outline",
    iconLib: "ion",
    bg: "#6EC1E4",
    iconColor: "#2d2d2d",
    label: "Entrance",
  },
  food: {
    category: "FOOD",
    icon: "coffee",
    iconLib: "mci",
    bg: "#F7C873",
    iconColor: "#2d2d2d",
    label: "Food",
  },
  helpDesk: {
    category: "HELP_DESK",
    icon: "shield-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Help Desk",
  },
  printer: {
    category: "PRINT",
    icon: "print-outline",
    iconLib: "ion",
    bg: "#B76E79",
    iconColor: "#2d2d2d",
    label: "Printer",
  },
};

function resolveBathroomConfig(label: string = ""): {
  category: string;
  icon: string;
  iconLib: "ion" | "mci";
  bg: string;
  iconColor: string;
  label: string;
} {
  const l = label.toLowerCase();
  if (l.includes("women") || l.includes("female") || l.includes("wc f")) {
    return { category: "WC_F", icon: "female-outline", iconLib: "ion", bg: "#F2C4CE", iconColor: "#c0395a", label: "WC F" };
  }
  if (l.includes("men") || l.includes("male") || l.includes("wc m")) {
    return { category: "WC_M", icon: "male-outline", iconLib: "ion", bg: "#C4D9F2", iconColor: "#3A7BD5", label: "WC M" };
  }
  if (l.includes("handicap") || l.includes("accessible")) {
    return { category: "WC_A", icon: "accessibility-outline", iconLib: "ion", bg: "#A0C4A0", iconColor: "#fff", label: "WC A" };
  }
  return { category: "WC_SHARED", icon: "human-male-female", iconLib: "mci", bg: "#B0A7D1", iconColor: "#fff", label: "WC" };
}

export interface DynamicPOI {
  id: string;
  nodeId: string;
  floorId: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  iconLib: "ion" | "mci";
  bg: string;
  iconColor: string;
  mapPosition: { x: number; y: number };
}

// ─── Service class ───────────────────────────────────────────────────────────

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
    this.graph = new Graph();
    this.pathFinder = new PathFinder(this.graph);
    this.locationTracker.setGraph(this.graph);

    for (const floor of config.floors) {
      for (const node of floor.nodes) {
        this.graph.addNode(node);
      }
      for (const edge of floor.edges) {
        this.graph.addEdge(edge);
      }
    }

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
        console.warn(`Failed to set default location: ${e}`);
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
  ): Promise<Route> {
    const wheelchairOnly =
      accessibleOnly ?? (await getWheelchairAccessibilityPreference());
    return this.pathFinder.findShortestPath(startNodeId, endNodeId, wheelchairOnly);
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

  getRouteFromCurrentLocation(endNodeId: string, accessibleOnly: boolean = false): Route {
    const userLoc = this.getUserLocation();
    if (!userLoc) {
      throw new Error("IndoorMapService: user location not set");
    }
    return this.pathFinder.findShortestPath(userLoc.nodeId, endNodeId, accessibleOnly);
  }

  getStartNode(): Node | null {
    return this.locationTracker.getStartNode();
  }

  getNodeByRoomNumber(buildingId: string, roomNumber: string): Node | null {
    const cleanRoom = roomNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const allNodes = this.graph.getAllNodes();

    const exactId = `${buildingId}_${cleanRoom}`;
    let targetNode = this.graph.getNode(exactId);
    if (targetNode) return targetNode;

    targetNode = allNodes.find((n) => {
      const cleanId = n.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleanId.endsWith(cleanRoom);
    });

    return targetNode || null;
  }

  getNearestRoomNode(floorId: string, x: number, y: number): Node | null {
    const nodesOnFloor = this.graph
      .getAllNodes()
      .filter((n) => n.floorId === floorId && (n.type === "room" || n.type === "poi"));

    let nearestNode: Node | null = null;
    let minDistance = Infinity;

    for (const node of nodesOnFloor) {
      const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
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

  public getRouteDurationSeconds(route: Route | null, pixelToMeterRatio: number = 1): number {
    if (!route || !route.totalDistance) return 0;

    const distanceInMeters = route.totalDistance * pixelToMeterRatio;
    const WALKING_SPEED_MPS = 1.35;
    let baseSeconds = distanceInMeters / WALKING_SPEED_MPS;
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
    return { steps: generateRouteSteps(route.nodes) };
  }

  public getPOIsFromConfig(buildingId: string, floorId: string | null = null): DynamicPOI[] {
    const config = navConfigRegistry[buildingId];
    if (!config) return [];

    const floors = floorId
      ? config.floors.filter((f) => f.floorId === floorId)
      : config.floors;

    const results: DynamicPOI[] = [];

    for (const floor of floors) {
      for (const node of floor.nodes) {
        const type = node.type;

        if (type === "hallway") continue;

        let cfg;

        if (type === "bathroom") {
          cfg = resolveBathroomConfig(node.label);
        } else {
          cfg = NODE_TYPE_CONFIG[type];
          if (!cfg) continue;
        }

        results.push({
          id: `${buildingId}-poi-${node.id}`,
          nodeId: node.id,
          floorId: floor.floorId,
          label: cfg.label,
          description: node.label ?? cfg.label,
          category: cfg.category,
          icon: cfg.icon,
          iconLib: cfg.iconLib,
          bg: cfg.bg,
          iconColor: cfg.iconColor,
          mapPosition: {
            x: Number((node.x / NODE_COORD_MAX).toFixed(3)),
            y: Number((node.y / NODE_COORD_MAX).toFixed(3)),
          },
        });
      }
    }

    return results;
  }
}