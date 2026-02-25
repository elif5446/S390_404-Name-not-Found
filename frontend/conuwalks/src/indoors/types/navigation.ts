import { LatLng } from 'react-native-maps';
//we can add the POIs later
export type NodeType = 'room' | 'hallway' | 'elevator' | 'stairs' | 'entrance';

export interface Node {
  id: string;
  floorId: string;
  x: number;
  y: number;
  type: NodeType;
  label?: string;
  isEntrance?: boolean;
  entranceLocation?: LatLng;
}

export interface Edge {
  nodeAId: string;
  nodeBId: string;
  accessible: boolean;
}

export interface FloorNavData {
  floorId: string;
  nodes: Node[];
  edges: Edge[];
}

export interface BuildingNavConfig {
  buildingId: string;
  floors: FloorNavData[];
}