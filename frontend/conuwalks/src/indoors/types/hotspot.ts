export type IndoorHotspot = {
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label: string;
};

export type IndoorDestination = {
  buildingId: string;
  id: string;
  x: number;
  y: number;
  floorLevel: number;
  label?: string;
};
