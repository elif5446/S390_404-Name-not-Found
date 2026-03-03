import { Node } from './Navigation';

export interface Route {
  nodes: Node[];
  totalDistance: number;
}

export interface UserLocation {
  nodeId: string;
  floorId: string;
}