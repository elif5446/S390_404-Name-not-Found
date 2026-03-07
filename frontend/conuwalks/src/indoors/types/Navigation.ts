import { LatLng } from 'react-native-maps';
//we can add the POIs later
export type NodeType = 'room' | 'hallway' | 'elevator' | 'stairs' | 'entrance' | 'bathroom'| 'escalator';

export interface Node {
  id: string;
  floorId: string;
  x: number;
  y: number;
  type: NodeType;
  label?: string;
  isEntrance?: boolean;
}

export interface Edge {
  nodeAId: string;
  nodeBId: string;
  weight? : number;
  accessible: boolean;
}

//this was only made cause we do not initially add a weight to the edges in the buildingNavConfig files. 
//so this is a way to inforce that a weight will be added later
export interface WeighedEdge extends Edge{
  weight: number;
}

export interface FloorNavData {
  floorId: string;
  nodes: Node[];
  edges: Edge[];
}

export interface BuildingNavConfig {
  buildingId: string;
  defaultStartNodeId: string;
  floors: FloorNavData[];
  interFloorEdges?: Edge[];
}