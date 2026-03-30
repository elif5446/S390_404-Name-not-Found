export type POICategory =
  | "WC_F"
  | "WC_M"
  | "WC_A"
  | "WC_SHARED"
  | "LAB"
  | "ROOM"
  | "STUDY_ROOM"
  | "STAIRS"
  | "ELEVATOR"
  | "ESCALATOR"
  | "PRINT"
  | "IT"
  | "HELP_DESK"
  | "FOOD"
  | "SECOND_CUP"
  | "MICROWAVE"
  | "VINHS_CAFE"
  | "STUDENT_UNION";

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
  /** Show label under icon (optional, for special POIs like cafes) */
  showLabel?: boolean;
}

export interface POIDirections {
  poi: POI;
  startingRoom: string;
  steps: string[];
  estimatedMinutes: number;
}
