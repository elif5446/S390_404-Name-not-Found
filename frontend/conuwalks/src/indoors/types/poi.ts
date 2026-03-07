export type POICategory =
  | "WC_F"
  | "WC_M"
  | "WC_A"
  | "WC_SHARED"
  | "LAB"
  | "PRINT"
  | "IT";

export interface POI {
  id: string;
  label: string;
  category: POICategory;
  description: string;
  /** Room number, e.g. "841" */
  room: string;
  /** Floor number */
  floor: number;
  mapPosition: { x: number; y: number };
}

export interface POIDirections {
  poi: POI;
  startingRoom: string;
  steps: string[];
  estimatedMinutes: number;
}
