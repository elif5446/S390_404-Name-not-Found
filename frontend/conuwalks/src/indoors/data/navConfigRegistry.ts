import { BuildingNavConfig } from "../types/Navigation";
import { hallBuildingNavConfig } from "./HallBuilding";
import { MBBuildingNavConfig } from "./MBBuilding";

export const navConfigRegistry: Record<string, BuildingNavConfig> = {
  H: hallBuildingNavConfig,
  MB: MBBuildingNavConfig,
};
