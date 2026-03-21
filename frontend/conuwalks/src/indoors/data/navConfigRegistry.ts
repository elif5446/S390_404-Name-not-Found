import { BuildingNavConfig } from "../types/Navigation";
import { hallBuildingNavConfig } from "./HallBuilding";
import { MBBuildingNavConfig } from "./MBBuilding";
import { VLBuildingNavConfig } from "./VLBuilding";

export const navConfigRegistry: Record<string, BuildingNavConfig> = {
  H: hallBuildingNavConfig,
  MB: MBBuildingNavConfig,
  VL: VLBuildingNavConfig,
};
