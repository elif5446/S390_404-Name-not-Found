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

  describe("Edge Cases", () => {
    it("returns an empty array if less than 2 nodes are provided", () => {
      expect(generateRouteSteps([])).toEqual([]);
      expect(generateRouteSteps([createNode("A", 0, 0)])).toEqual([]);
    });

    it("collapses multiple consecutive straight segments into one", () => {
      // By adding an extra hallway node, we survive the loop jump caused by the
      // elevator logic. It emits a straight for the elevator, skips the transit
      // (no floor change), and emits a second straight for the final destination.
      const nodes = [
        createNode("1", 0, 0, "entrance", "H_3"),
        createNode("2", 0, 50, "elevator", "H_3"), // dist > 10 (emits straight #1: nodes 0 to 1)
        createNode("3", 0, 100, "hallway", "H_3"), // First node after transit cluster
        createNode("4", 0, 150, "room", "H_3"), // dist > 10 (emits straight #2: nodes 2 to 3)
      ];

      const segments = buildSegments(nodes);
      const straights = segments.filter(s => s.kind === "straight");

      // Verify that the raw builder actually produced 2 consecutive straight segments
      expect(straights.length).toBe(2);

      // generateRouteSteps will collapse them into 1, and then the redundancy filter
      // will remove the remaining straight because it is immediately before "arrive"
      const steps = generateRouteSteps(nodes);
      const straightSteps = steps.filter(s => s.text.includes("Continue straight"));

      expect(straightSteps.length).toBe(0);
    });
  });

  describe("Start Segment Generation", () => {
    it("generates correct text starting from a hallway", () => {
      const nodes = [createNode("H", 0, 0, "hallway", "H_1"), createNode("A", 0, 20, "hallway", "H_1")];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Head into the corridor");
    });

    it("generates correct entrance orientation text (Straight)", () => {
      const nodes = [
        createNode("E", 0, 20, "entrance", "H_1"),
        createNode("A", 0, 0, "hallway", "H_1"), // dx: 0, dy: -20
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and continue straight");
    });

    it("generates correct entrance orientation text (Right Turn)", () => {
      const nodes = [
        createNode("E", 0, 0, "entrance", "H_1"),
        createNode("A", 20, 0, "hallway", "H_1"), // dx: 20, dy: 0
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and turn right into the corridor");
    });

    it("generates correct entrance orientation text (Left Turn)", () => {
      const nodes = [
        createNode("E", 0, 0, "entrance", "H_1"),
        createNode("A", -20, 0, "hallway", "H_1"), // dx: -20, dy: 0
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Enter the building and turn left into the corridor");
    });

    it("generates correct text starting from a room and going straight", () => {
      const nodes = [
        createNode("R", 0, 20, "room", "H_1"),
        createNode("A", 0, 0, "hallway", "H_1"), // dx: 0, dy: -20
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Exit the room and continue straight into the hallway");
    });

    it("generates correct text starting from a room and turning", () => {
      const nodes = [
        createNode("R", 0, 0, "room", "H_1"),
        createNode("A", -20, 0, "hallway", "H_1"), // dx: -20, dy: 0
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Exit the room and turn left into the hallway");
    });

    it("falls back to generic text for unknown start node types", () => {
      const nodes = [createNode("X", 0, 20, "poi", "H_1", "The Statue"), createNode("A", 0, 0, "hallway", "H_1")];
      const steps = generateRouteSteps(nodes);
      expect(steps[0].text).toBe("Start at The Statue and head into the corridor");
    });
  });

  describe("Arrival & Destination Label Logic", () => {
    it("generates specific arrival text based on destination node type (Bathroom)", () => {
      const nodes = [createNode("A", 0, 0, "entrance"), createNode("B", 0, 20, "bathroom", "H_8", "Washroom 812")];
      const steps = generateRouteSteps(nodes);
      const arriveStep = steps[steps.length - 1];
      expect(arriveStep.text).toContain("Washroom 812");
    });

    it("uses fallbacks for specific destination types without labels", () => {
      const testCases = [
        { type: "bathroom", expected: "the washroom" },
        { type: "food", expected: "the food location" },
        { type: "helpDesk", expected: "the help desk" },
        { type: "entrance", expected: "the building entrance" },
      ];

      testCases.forEach(({ type, expected }) => {
        const nodes = [
          createNode("A", 0, 0, "hallway"),
          createNode("B", 0, 20, type, "H_8"), // No label provided
        ];
        const steps = generateRouteSteps(nodes);
        expect(steps[steps.length - 1].text).toContain(expected);
      });
    });

    it("formats generic room numbers correctly if 'room' prefix is missing", () => {
      const nodes = [
        createNode("A", 0, 0, "hallway"),
        createNode("B", 0, 20, "room", "H_8", "804B"), // Label without "Room" prefix
      ];
      const steps = generateRouteSteps(nodes);
      expect(steps[steps.length - 1].text).toContain("Room 804B");
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

    it("detects a left turn on a closed floor", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_8"),
        createNode("2", 0, 50, "hallway", "H_8"), // dx: 0, dy: 50
        createNode("3", 50, 50, "hallway", "H_8"), // Turning left: dx: 50, dy: 0
        createNode("4", 100, 50, "room", "H_8"),
      ];
      const segments = buildSegments(nodes);

      const turnSeg = segments.find(s => s.kind === "turn") as any;
      expect(turnSeg).toBeDefined();
      expect(turnSeg.direction).toBe("left");
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
    it("generates correct transit steps crossing floors going UP", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_8"),
        createNode("2", 0, 20, "elevator", "H_8"),
        createNode("3", 0, 20, "elevator", "H_9"),
        createNode("4", 0, 40, "room", "H_9", "901"),
      ];

      const steps = generateRouteSteps(nodes);
      const transitStep = steps.find(s => s.text.includes("Take the elevator up to Floor 9"));
      expect(transitStep).toBeDefined();
    });

    it("generates correct transit steps crossing floors going DOWN via Stairs", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_4"),
        createNode("2", 0, 20, "stairs", "H_4"),
        createNode("3", 0, 20, "stairs", "H_3"),
        createNode("4", 0, 40, "room", "H_3", "301"),
      ];

      const steps = generateRouteSteps(nodes);
      const transitStep = steps.find(s => s.text.includes("Take the stairs down to Floor 3"));
      expect(transitStep).toBeDefined();
    });

    it("generates correct transit steps via Escalator", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_1"),
        createNode("2", 0, 20, "escalator", "H_1"),
        createNode("3", 0, 20, "escalator", "H_2"),
        createNode("4", 0, 40, "room", "H_2", "201"),
      ];

      const steps = generateRouteSteps(nodes);
      const transitStep = steps.find(s => s.text.includes("Take the escalator up to Floor 2"));
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

    it("safely skips floor boundary changes that have no transit node type", () => {
      const nodes = [
        createNode("1", 0, 0, "hallway", "H_1"),
        createNode("2", 0, 20, "hallway", "H_2"), // changed floor without transit
        createNode("3", 0, 40, "room", "H_2"),
      ];

      const segments = buildSegments(nodes);
      const transitSeg = segments.find(s => s.kind === "transit");

      // Ensure no transit segment was built, and the loop safely continued
      expect(transitSeg).toBeUndefined();
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
