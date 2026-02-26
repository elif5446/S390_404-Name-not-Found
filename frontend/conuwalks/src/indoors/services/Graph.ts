import { Node, Edge } from "../types/navigation";

//This class will create the whole indoor mapping system for 
// a selected building. pathfinder to find the shortest path to the users destination.
export class Graph {
  private nodes: Map<string, Node>; //key is nodeId
  private edges: Map<string, Edge[]>; //key is nodeId and the list of edges its connected to
  private entranceNodes: Node[] = []; //used for MappingService

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
    if (node.isEntrance) {
        this.entranceNodes.push(node);
    }
  }

  addEdge(edge: Edge): void {
    const nodeA = this.nodes.get(edge.nodeAId);
    const nodeB = this.nodes.get(edge.nodeBId);

    // checking to make sure both nodes exist before adding them!!!
    if (!nodeA || !nodeB) {
      throw new Error(`Edge references missing node: ${edge.nodeAId} -> ${edge.nodeBId}`);
    }

    //calculate the distance of the edge with Euclidean distance formula
    const weightedEdge = {
    ...edge,
    weight: Math.sqrt(
        Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2)
    )
    };

    //this will store the edges to be bi-directional since in the buildingNavConfig we only make one edge for each pair of nodes.
    if (!this.edges.has(edge.nodeAId)) {
      this.edges.set(edge.nodeAId, []); 
    }
    if (!this.edges.has(edge.nodeBId)) {
      this.edges.set(edge.nodeBId, []);
    }
    
    this.edges.get(edge.nodeAId)!.push(weightedEdge);
    this.edges.get(edge.nodeBId)!.push({ ...weightedEdge, nodeAId: edge.nodeBId, nodeBId: edge.nodeAId });
  }


    getNeighbors(nodeId: string): Node[] {
    const connectedEdges = this.edges.get(nodeId) || [];

    return connectedEdges.map(edge => {
        const node = this.nodes.get(edge.nodeBId);
                //extra precaution just incase node does not exist in the node Map
        if (!node) {
        throw new Error(`getNeighbors: could not find node ${edge.nodeBId} referenced by edge from ${nodeId}`);
        }
        return node;
    });
    }

    getEdge(nodeAId: string, nodeBId: string): Edge | undefined {
    const connectedEdges = this.edges.get(nodeAId) || [];
    return connectedEdges.find(edge => edge.nodeBId === nodeBId);
  }

    getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

    getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
    }

    getEntranceNodes(): Node[] {
    return this.entranceNodes;
    }
}
