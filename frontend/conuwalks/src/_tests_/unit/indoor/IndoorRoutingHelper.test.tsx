import { calculateIndoorPenaltySeconds } from "@/src/indoors/services/indoorRoutingHelper";
import { IndoorMapService } from "@/src/indoors/services/IndoorMapService";

const mockLoadBuilding = jest.fn();
const mockGetNodeByRoomNumber = jest.fn();
const mockGetEntranceNode = jest.fn();
const mockGetRoute = jest.fn();
const mockGetRouteDurationSeconds = jest.fn();

jest.mock("@/src/indoors/services/IndoorMapService", () => ({
  IndoorMapService: jest.fn().mockImplementation(() => ({
    loadBuilding: mockLoadBuilding,
    getNodeByRoomNumber: mockGetNodeByRoomNumber,
    getEntranceNode: mockGetEntranceNode,
    getRoute: mockGetRoute,
    getRouteDurationSeconds: mockGetRouteDurationSeconds,
  })),
}));

jest.mock("@/src/indoors/data/navConfigRegistry", () => ({
  navConfigRegistry: {
    BUILDING_A: { id: "BUILDING_A", floors: [] },
    BUILDING_B: { id: "BUILDING_B", floors: [] },
  },
}));

const mockStartNode = { id: "node-start", floorId: "f1", x: 0, y: 0, type: "room" };
const mockEndNode = { id: "node-end", floorId: "f1", x: 10, y: 10, type: "room" };
const mockEntranceNode = { id: "node-entrance", floorId: "f1", x: 5, y: 5, type: "entrance" };
const mockRoute = { nodes: [mockStartNode, mockEndNode], distance: 100 };

describe("calculateIndoorPenaltySeconds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Edge Cases & Invalid Inputs", () => {
    it("returns 0 if start and destination buildings are null", async () => {
      const penalty = await calculateIndoorPenaltySeconds(null, null, null, null);
      expect(penalty).toBe(0);
      expect(mockLoadBuilding).not.toHaveBeenCalled();
    });

    it("returns 0 if buildings are provided but rooms are null", async () => {
      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", null, "BUILDING_A", null);
      expect(penalty).toBe(0);
      expect(mockLoadBuilding).not.toHaveBeenCalled();
    });

    it("returns 0 if building configs do not exist in the registry", async () => {
      const penalty = await calculateIndoorPenaltySeconds("UNKNOWN_BUILDING", "101", "UNKNOWN_BUILDING", "102");
      expect(penalty).toBe(0);
      expect(mockLoadBuilding).not.toHaveBeenCalled();
    });
  });

  describe("CASE 1: Same Building", () => {
    it("calculates the penalty correctly for rooms in the same building", async () => {
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockStartNode).mockReturnValueOnce(mockEndNode);
      mockGetRoute.mockResolvedValueOnce(mockRoute);
      mockGetRouteDurationSeconds.mockReturnValueOnce(45); // 45 seconds penalty

      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", "101", "BUILDING_A", "102");

      expect(mockLoadBuilding).toHaveBeenCalledTimes(1);
      expect(mockGetNodeByRoomNumber).toHaveBeenCalledWith("BUILDING_A", "101");
      expect(mockGetNodeByRoomNumber).toHaveBeenCalledWith("BUILDING_A", "102");
      expect(mockGetRoute).toHaveBeenCalledWith(mockStartNode.id, mockEndNode.id);
      expect(penalty).toBe(45);
    });

    it("catches errors thrown during routing and returns 0", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockStartNode).mockReturnValueOnce(mockEndNode);
      mockGetRoute.mockRejectedValueOnce(new Error("Graph computation failed"));

      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", "101", "BUILDING_A", "102");

      expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to calculate indoor penalty", expect.any(Error));
      expect(penalty).toBe(0);

      consoleWarnSpy.mockRestore();
    });

    it("returns 0 if start or end node cannot be resolved", async () => {
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockStartNode).mockReturnValueOnce(null);

      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", "101", "BUILDING_A", "UNKNOWN");

      expect(mockGetRoute).not.toHaveBeenCalled();
      expect(penalty).toBe(0);
    });
  });

  describe("CASE 2: Different Buildings", () => {
    it("calculates combined penalty (start->entrance) + (entrance->dest)", async () => {
      // Start Building (Room -> Entrance)
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockStartNode); // Start node in A
      mockGetEntranceNode.mockReturnValueOnce(mockEntranceNode); // Entrance of A
      mockGetRoute.mockResolvedValueOnce(mockRoute);
      mockGetRouteDurationSeconds.mockReturnValueOnce(30); // 30s to exit A

      // Destination Building (Entrance -> Room)
      mockGetEntranceNode.mockReturnValueOnce(mockEntranceNode); // Entrance of B
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockEndNode); // Dest node in B
      mockGetRoute.mockResolvedValueOnce(mockRoute);
      mockGetRouteDurationSeconds.mockReturnValueOnce(40); // 40s to reach room in B

      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", "101", "BUILDING_B", "202");

      expect(mockLoadBuilding).toHaveBeenCalledTimes(2);
      expect(penalty).toBe(70); // 30 + 40
    });

    it("calculates penalty only for the start building if destination is invalid/missing", async () => {
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockStartNode);
      mockGetEntranceNode.mockReturnValueOnce(mockEntranceNode);
      mockGetRoute.mockResolvedValueOnce(mockRoute);
      mockGetRouteDurationSeconds.mockReturnValueOnce(25);

      const penalty = await calculateIndoorPenaltySeconds("BUILDING_A", "101", "UNKNOWN", "202");

      expect(mockLoadBuilding).toHaveBeenCalledTimes(1); // Only loaded A
      expect(penalty).toBe(25);
    });

    it("calculates penalty only for the destination building if start is invalid/missing", async () => {
      mockGetEntranceNode.mockReturnValueOnce(mockEntranceNode);
      mockGetNodeByRoomNumber.mockReturnValueOnce(mockEndNode);
      mockGetRoute.mockResolvedValueOnce(mockRoute);
      mockGetRouteDurationSeconds.mockReturnValueOnce(35);

      const penalty = await calculateIndoorPenaltySeconds("UNKNOWN", "101", "BUILDING_B", "202");

      expect(mockLoadBuilding).toHaveBeenCalledTimes(1); // Only loaded B
      expect(penalty).toBe(35);
    });
  });
});
