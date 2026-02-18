import { BuildingIndoorConfig } from "@/src/types/indoor";

import H8_SVG from "@/assets/floor/H-8.svg";
import H9_SVG from "@/assets/floor/H-9.svg";
import MB1_SVG from "@/assets/floor/MB-1.svg";
import MBS1_SVG from "@/assets/floor/MB-S2.svg";
import VL1_SVG from "@/assets/floor/VL-1.svg";
import VL2_SVG from "@/assets/floor/VL-2.svg";

export const INDOOR_DATA: Record<string, BuildingIndoorConfig> = {
  H: {
    id: "H",
    name: "Hall Building",
    defaultFloor: 8,
    floors: [
      {
        id: "8",
        level: 8,
        label: "8",
        type: "svg" as const,
        image: H8_SVG,
        viewBox: "0 0 1024 1024",
        bounds: {
          northEast: { latitude: 45.49769, longitude: -73.5783 },
          southWest: { latitude: 45.49682, longitude: -73.57954 },
        },
      },
      {
        id: "9",
        level: 9,
        label: "9",
        type: "svg" as const,
        image: H9_SVG,
        viewBox: "0 0 1024 1024",
        bounds: {
          northEast: { latitude: 45.49769, longitude: -73.5783 },
          southWest: { latitude: 45.49682, longitude: -73.57954 },
        },
      },
    ].sort((a, b) => a.level - b.level),
  },
  MB: {
    id: "MB",
    name: "John Molson Building",
    defaultFloor: 1,
    floors: [
      {
        id: "S1",
        level: 1,
        label: "S1",
        type: "svg" as const,
        image: MBS1_SVG,
        bounds: {
          northEast: { latitude: 45.495425, longitude: -73.578806 },
          southWest: { latitude: 45.495133, longitude: -73.579162 },
        },
      },
      {
        id: "1",
        level: 2,
        label: "1",
        type: "svg" as const,
        image: MB1_SVG,
        bounds: {
          northEast: { latitude: 45.495425, longitude: -73.578806 },
          southWest: { latitude: 45.495133, longitude: -73.579162 },
        },
      },
    ].sort((a, b) => a.level - b.level),
  },
  VL: {
    id: "VL",
    name: "Vanier Library Building",
    defaultFloor: 1,
    floors: [
      {
        id: "1",
        level: 1,
        label: "1",
        type: "svg" as const,
        image: VL1_SVG,
        bounds: {
          northEast: { latitude: 45.459399, longitude: -73.638414 },
          southWest: { latitude: 45.458727, longitude: -73.638939 },
        },
      },
      {
        id: "2",
        level: 2,
        label: "2",
        type: "svg" as const,
        image: VL2_SVG,
        bounds: {
          northEast: { latitude: 45.459399, longitude: -73.638414 },
          southWest: { latitude: 45.458727, longitude: -73.638939 },
        },
      },
    ].sort((a, b) => a.level - b.level),
  },
};
