import { Node } from './navigation';

export interface Route {
  nodes: Node[];
  totalDistance: number;
  instructions: string[];
}

//users location based on nodes (if user is outside then they will need to find the first entrance node)
export interface UserLocation {
  nodeId: string;
  floorId: string;
}