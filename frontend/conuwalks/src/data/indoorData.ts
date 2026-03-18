import { BuildingIndoorConfig } from "@/src/indoors/types/FloorPlans";

import H1_SVG from "@/assets/floor/H-1.svg"
import H2_SVG from "@/assets/floor/H-2.svg"
import H8_SVG from "@/assets/floor/H-8.svg";
import H9_SVG from "@/assets/floor/H-9.svg";
import MB1_SVG from "@/assets/floor/MB-1.svg";
import MBS2_SVG from "@/assets/floor/MB-S2.svg";
import VL1_SVG from "@/assets/floor/VL-1.svg";
import VL2_SVG from "@/assets/floor/VL-2.svg";

export const INDOOR_DATA: Record<string, BuildingIndoorConfig> = {
  H: {
    id: "H",
    name: "Hall Building",
    defaultFloor: 8,
    floors: [
      {
        id: "H_1",
        level: 1,
        label: "1",
        type: "svg" as const,
        image: H1_SVG,
        viewBox: "0 0 1024 1024",
        bounds: {
          northEast: { latitude: 45.49769, longitude: -73.5783 }, //change later 
          southWest: { latitude: 45.49682, longitude: -73.57954 }, //change later
        },
      },
      {
        id: "H_2",
        level: 2,
        label: "2",
        type: "svg" as const,
        image: H2_SVG,
        viewBox: "0 0 1024 1024",
        bounds: {
          northEast: { latitude: 45.49769, longitude: -73.5783 },// change later 
          southWest: { latitude: 45.49682, longitude: -73.57954 },// change later
        },
      },
      {
        id: "H_8",
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
        id: "H_9",
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
        id: "MB_S2",
        level: 1,
        label: "S2",
        type: "svg" as const,
        image: MBS2_SVG,
        bounds: {
          northEast: { latitude: 45.495425, longitude: -73.578806 },
          southWest: { latitude: 45.495133, longitude: -73.579162 },
        },
      },
      {
        id: "MB_1",
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
        id: "VL_1",
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
        id: "VL_2",
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
