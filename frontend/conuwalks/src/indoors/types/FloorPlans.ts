import { ImageSourcePropType } from "react-native";
import { SvgProps } from "react-native-svg";
import { LatLng } from "react-native-maps";

interface FloorBase {
  id: string;
  level: number;
  label: string;
  bounds: {
    northEast: LatLng;
    southWest: LatLng;
  };
}

interface FloorPng extends FloorBase {
  type: "png";
  image: ImageSourcePropType;
}

interface FloorSvg extends FloorBase {
  type: "svg";
  image: React.FC<SvgProps>;
  viewBox?: string;
}

// Union type
export type FloorData = FloorPng | FloorSvg;

export interface BuildingIndoorConfig {
  id: string;
  name: string;
  floors: FloorData[];
  defaultFloor: number;
}
