import { BuildingNavConfig } from "../types/Navigation";
import { hallBuildingNavConfig } from "./HallBuilding";

export const navConfigRegistry: Record<string, BuildingNavConfig> = {
  H: hallBuildingNavConfig,
};
