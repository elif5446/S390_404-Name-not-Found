import { SFSymbol } from "expo-symbols";

export interface OpeningHours {
  weekdays: string;
  weekend: string;
}

export interface BuildingMetadata {
  name: string;
  address?: string;
  description?: string;
  openingHours?: string | OpeningHours;
  facilities?: string[];
}

export interface AccessibilityIconDef {
  key: string;
  sf: SFSymbol;
  material: "elevator" | "accessible" | "subway";
  label: string;
}
