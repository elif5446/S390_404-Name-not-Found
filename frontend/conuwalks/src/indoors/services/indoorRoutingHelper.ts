import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";
import { navConfigRegistry } from "@/src/indoors/data/navConfigRegistry";

// SVG pixels to real-world meters ratio.
// tweak this value based on your map's scale. (e.g., 0.02 means 50 pixels = 1 meter)
const PIXEL_TO_METER_RATIO = 0.02;

export const calculateIndoorPenaltySeconds = async (
  startBuildingId: string | null,
  startRoom: string | null,
  destinationBuildingId: string | null,
  destinationRoom: string | null,
): Promise<number> => {
  let penalty = 0;
  const service = new IndoorMapService();

  // CASE 1: Start and Destination are in the SAME building
  if (startBuildingId && startBuildingId === destinationBuildingId && startRoom && destinationRoom && navConfigRegistry[startBuildingId]) {
    service.loadBuilding(navConfigRegistry[startBuildingId]);
    const startNode = service.getNodeByRoomNumber(startBuildingId, startRoom);
    const endNode = service.getNodeByRoomNumber(startBuildingId, destinationRoom);

    if (startNode && endNode) {
      try {
        const route = await service.getRoute(startNode.id, endNode.id);
        return service.getRouteDurationSeconds(route, PIXEL_TO_METER_RATIO);
      } catch (e) {
        console.warn("Failed to calculate same-building indoor penalty", e);
      }
    }
    return 0;
  }

  // CASE 2: Start and Destination are in DIFFERENT buildings
  // calculate start room -> entrance
  if (startBuildingId && startRoom && navConfigRegistry[startBuildingId]) {
    service.loadBuilding(navConfigRegistry[startBuildingId]);
    const startNode = service.getNodeByRoomNumber(startBuildingId, startRoom);
    const entrance = service.getEntranceNode();

    if (startNode && entrance) {
      try {
        const route = await service.getRoute(startNode.id, entrance.id);
        penalty += service.getRouteDurationSeconds(route, PIXEL_TO_METER_RATIO);
      } catch (e) {
        console.warn("Failed to calculate start indoor penalty", e);
      }
    }
  }

  // calculate entrance -> destination room
  if (destinationBuildingId && destinationRoom && navConfigRegistry[destinationBuildingId]) {
    service.loadBuilding(navConfigRegistry[destinationBuildingId]);
    const endNode = service.getNodeByRoomNumber(destinationBuildingId, destinationRoom);
    const entrance = service.getEntranceNode();

    if (endNode && entrance) {
      try {
        const route = await service.getRoute(entrance.id, endNode.id);
        penalty += service.getRouteDurationSeconds(route, PIXEL_TO_METER_RATIO);
      } catch (e) {
        console.warn("Failed to calculate destination indoor penalty", e);
      }
    }
  }

  return penalty;
};
