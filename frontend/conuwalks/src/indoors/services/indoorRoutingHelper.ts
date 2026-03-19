import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

export const calculateIndoorPenaltySeconds = (
  startBuildingId: string | null,
  startRoom: string | null,
  destinationBuildingId: string | null,
  destinationRoom: string | null,
): number => {
  let penalty = 0;

  const service = new IndoorMapService();

  // calculate start room to entrance
  if (startBuildingId && startRoom && navConfigRegistry[startBuildingId]) {
    service.loadBuilding(navConfigRegistry[startBuildingId]);
    const startNode = service.getNodeByRoomNumber(startBuildingId, startRoom);
    const entrance = service.getEntranceNode();

    if (startNode && entrance) {
      try {
        const route = service.getRoute(startNode.id, entrance.id);
        penalty += service.getRouteDurationSeconds(route);
      } catch (e) {
        console.warn("Failed to calculate start indoor penalty", e);
      }
    }
  }

  // calculate entrance to destination Room
  if (
    destinationBuildingId &&
    destinationRoom &&
    navConfigRegistry[destinationBuildingId]
  ) {
    service.loadBuilding(navConfigRegistry[destinationBuildingId]);
    const endNode = service.getNodeByRoomNumber(
      destinationBuildingId,
      destinationRoom,
    );
    const entrance = service.getEntranceNode();

    if (endNode && entrance) {
      try {
        const route = service.getRoute(entrance.id, endNode.id);
        penalty += service.getRouteDurationSeconds(route);
      } catch (e) {
        console.warn("Failed to calculate destination indoor penalty", e);
      }
    }
  }

  return penalty;
};
