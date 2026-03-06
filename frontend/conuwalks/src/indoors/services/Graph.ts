import { Node, Edge, WeighedEdge } from "../types/Navigation";

//This class will create the whole indoor mapping system for
// a selected building. This graph will then be passed to pathfinder to get the shortest path
export class Graph {
  private nodes: Map<string, Node>; //key is nodeId
  private edges: Map<string, Edge[]>; //key is nodeId and value is the list of edges its connected to

  //navigation between floors uses a predefined cost (in terms of pixel distance). Can be changed but for now we favour escalators over stairs,
  //stairs over elevator (if you add accessiblity as true in pathFinder you will see that elevator path will be taken)
  private readonly FLOOR_TRANSITION_COSTS: Record<string, number> = {
    elevator: 500,    
    escalator: 50,   
    stairs: 150,    
  };

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(node: Node): void {
    if (this.nodes.has(node.id)){
        throw new Error(`Node with id "${node.id}" already exists`);
    }
    this.nodes.set(node.id, node);
  }

  addEdge(edge: Edge): void {
    const nodeA = this.nodes.get(edge.nodeAId);
    const nodeB = this.nodes.get(edge.nodeBId);

    // checking to make sure both nodes exist before adding them
    if (!nodeA || !nodeB) {
      throw new Error(
        `Edge references missing node: ${edge.nodeAId} -> ${edge.nodeBId}`,
      );
    }
      //calculate the distance of the edge with Euclidean distance formula (note that no edges are assigned an initial weight)
      // recall nodes on different floors use a fixed cost
      const weight = nodeA.floorId !== nodeB.floorId
        ? this.getTransitionCost(nodeA, nodeB)
        : Math.sqrt(
            Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2)
          );

    
    const weightedEdge: WeighedEdge = {
      ...edge,
      weight,      
    };

    //this will store the edges to be bi-directional since in the buildingNavConfig we only make one edge for each pair of nodes.
    if (!this.edges.has(edge.nodeAId)) {
      this.edges.set(edge.nodeAId, []);
    }
    if (!this.edges.has(edge.nodeBId)) {
      this.edges.set(edge.nodeBId, []);
    }

    this.edges.get(edge.nodeAId)!.push(weightedEdge);
    this.edges
      .get(edge.nodeBId)!
      .push({ ...weightedEdge, nodeAId: edge.nodeBId, nodeBId: edge.nodeAId });
  }

  getNeighbors(nodeId: string): Node[] {
    const connectedEdges = this.edges.get(nodeId) || [];

    return connectedEdges.map((edge) => {
      const node = this.nodes.get(edge.nodeBId);
      //extra precaution just incase node does not exist in the node Map
      if (!node) {
        throw new Error(
          `getNeighbors: could not find node ${edge.nodeBId} referenced by edge from ${nodeId}`,
        );
      }
      return node;
    });
  }

  getEdge(nodeAId: string, nodeBId: string): WeighedEdge | undefined {
    const connectedEdges = this.edges.get(nodeAId) || [];
    return connectedEdges.find((edge) => edge.nodeBId === nodeBId) as WeighedEdge;
  }

  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  //each building will have a specific entrance node to be the initial user location inside the building
  getEntranceNodes(): Node[] {
    return Array.from(this.nodes.values()).filter((n) => n.isEntrance);
  }

    private getTransitionCost(nodeA: Node, nodeB: Node): number {
    // check both nodes since either could be the elevator/stairs
    const type = nodeA.type in this.FLOOR_TRANSITION_COSTS 
      ? nodeA.type 
      : nodeB.type;
      
    return this.FLOOR_TRANSITION_COSTS[type] ?? 100; // default to 100 if type not found
  }

}
