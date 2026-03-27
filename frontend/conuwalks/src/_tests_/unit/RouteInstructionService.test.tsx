import { buildSegments, generateRouteSteps, estimateWalkMinutes } from "@/src/indoors/services/RouteInstructionService";
import { Node } from "@/src/indoors/types/Navigation";

const createNode = (id: string, x: number, y: number, type: string = "hallway", floorId: string = "H_8", label?: string): Node => {
  return { id, x, y, type, floorId, label } as Node;
};

describe("Navigation Route Logic", () => {
  describe("estimateWalkMinutes", () => {
    it("returns 1 minute for very short routes or empty routes", () => {
      expect(estimateWalkMinutes([])).toBe(1);
      expect(estimateWalkMinutes([createNode("A", 0, 0)])).toBe(1);
      expect(estimateWalkMinutes([createNode("A", 0, 0), createNode("B", 10, 0)])).toBe(1);
    });

    it("calculates walking time based on 80px per second", () => {
      // 4800 pixels / 80px per sec = 60 seconds = 1 minute
      const nodes = [createNode("A", 0, 0), createNode("B", 4800, 0)];
      expect(estimateWalkMinutes(nodes)).toBe(1);

      // 9600 pixels / 80px per sec = 120 seconds = 2 minutes
      const longerNodes = [createNode("A", 0, 0), createNode("B", 9600, 0)];
      expect(estimateWalkMinutes(longerNodes)).toBe(2);
    });
  });

  describe("Text Generation & Vector Logic (Start & Arrive)", () => {
    it("generates correct entrance orientation text (Straight)", () => {
      // vector pointing up (0, -20)
      const nodes = [createNode("E", 0, 20, "entrance", "H_1"), createNode("A", 0, 0, "hallway", "H_1")];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and continue straight");
    });

    it("generates correct entrance orientation text (Right Turn)", () => {
      // vector pointing right (20, 0)
      const nodes = [createNode("E", 0, 0, "entrance", "H_1"), createNode("A", 20, 0, "hallway", "H_1")];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and turn right into the corridor");
    });

    it("generates correct entrance orientation text (Left Turn)", () => {
      // vector pointing left (-20, 0)
      const nodes = [createNode("E", 0, 0, "entrance", "H_1"), createNode("A", -20, 0, "hallway", "H_1")];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and turn left into the corridor");
    });

    it("generates specific arrival text based on destination node type", () => {
      const nodes = [createNode("A", 0, 0, "entrance"), createNode("B", 0, 20, "bathroom", "H_8", "Washroom 812")];
      const steps = generateRouteSteps(nodes);
      const arriveStep = steps[steps.length - 1];
      expect(arriveStep.text).toContain("Washroom 812");
    });
  });

  describe("Turn Classification & Open Floor Logic", () => {
    it("detects a right turn on a closed floor (e.g. Floor 8)", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_8"),
        createNode("2", 0, 50, "hallway", "H_8"),
        createNode("3", -50, 50, "hallway", "H_8"), // Turning right (screen coords)
        createNode("4", -50, 100, "room", "H_8"),
        createNode("5", -50, 150, "room", "H_8"),
      ];
      const segments = buildSegments(nodes);

      const turnSeg = segments.find(s => s.kind === "turn") as any;
      expect(turnSeg).toBeDefined();
      expect(turnSeg.direction).toBe("right");
    });

    it("ignores turns and emits 'open area' text on open floors (e.g. Floor 1)", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_1"),
        createNode("2", 0, 50, "hallway", "H_1"),
        createNode("3", -50, 50, "hallway", "H_1"),
        createNode("4", -50, 100, "room", "H_1"),
      ];
      const segments = buildSegments(nodes);

      // should not contain a turn segment because h_1 is an open floor
      const turnSeg = segments.find(s => s.kind === "turn");
      expect(turnSeg).toBeUndefined();

      const straightSeg = segments.find(s => s.kind === "straight") as any;
      expect(straightSeg.onOpenFloor).toBe(true);
    });
  });

  describe("Transit (Elevators, Stairs, Escalators)", () => {
    it("generates correct transit steps crossing floors", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_8"),
        createNode("2", 0, 20, "elevator", "H_8"),
        createNode("3", 0, 20, "elevator", "H_9"),
        createNode("4", 0, 40, "room", "H_9", "901"),
      ];

      const steps = generateRouteSteps(nodes);

      // look for the transit text in the generated steps
      const transitStep = steps.find(s => s.text.includes("Take the elevator up to Floor 9"));
      expect(transitStep).toBeDefined();
    });

    it("prioritizes elevators over escalators if both exist in a node cluster", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_1"),
        createNode("2", 0, 20, "escalator", "H_1"),
        createNode("3", 0, 20, "elevator", "H_1"), // Elevator takes priority
        createNode("4", 0, 20, "elevator", "H_2"),
        createNode("5", 0, 40, "room", "H_2"),
      ];

      const segments = buildSegments(nodes);
      const transitSeg = segments.find(s => s.kind === "transit") as any;

      expect(transitSeg).toBeDefined();
      expect(transitSeg.transitKind).toBe("elevator");
      expect(transitSeg.fromFloor).toBe(1);
      expect(transitSeg.toFloor).toBe(2);
    });
  });

  describe("Redundancy Filtering", () => {
    it("filters out straight and turn segments immediately before arrival", () => {
      const nodes = [
        createNode("1", 0, 0, "entrance", "H_8"),
        createNode("2", 0, 50, "hallway", "H_8"),
        createNode("3", 10, 50, "room", "H_8", "801"),
      ];

      const steps = generateRouteSteps(nodes);

      expect(steps.length).toBe(2);
      expect(steps[0].text).toContain("Enter the building");
      expect(steps[1].text).toContain("Your destination is on the left");

      // ensure no standalone turn step was emitted
      const turnStep = steps.find(s => s.text.includes("Turn"));
      expect(turnStep).toBeUndefined();
    });
  });
});
