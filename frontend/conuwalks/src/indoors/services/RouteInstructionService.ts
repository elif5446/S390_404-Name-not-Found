import { Node } from "../types/Navigation";

export type RouteStep = {
  id: string;
  text: string;
};

function getDirectionVector(
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return {
    dx: to.x - from.x,
    dy: to.y - from.y,
  };
}

function getReadableDestinationLabel(node: { label?: string; id: string }) {
  const raw = node.label ?? node.id;
  const cleaned = raw.replace(/^Room\s+/i, "").trim();
  return `Room ${cleaned}`;
}

function getFloorNumber(floorId: string) {
  const parts = floorId.split("_");
  return parts[parts.length - 1];
}

function getFloorTransitionInstruction(
  fromNode: { type?: string; floorId: string },
  toNode: { type?: string; floorId: string },
) {
  const fromFloor = Number(getFloorNumber(fromNode.floorId));
  const toFloor = Number(getFloorNumber(toNode.floorId));

  const direction =
    !isNaN(fromFloor) && !isNaN(toFloor)
      ? toFloor > fromFloor
        ? "up"
        : "down"
      : "";

  if (fromNode.type === "elevator" || toNode.type === "elevator") {
    return `Take the elevator${direction ? ` ${direction}` : ""} to Floor ${toFloor}`;
  }

  if (fromNode.type === "escalator" || toNode.type === "escalator") {
    return `Take the escalator${direction ? ` ${direction}` : ""} to Floor ${toFloor}`;
  }

  if (fromNode.type === "stairs" || toNode.type === "stairs") {
    return `Take the stairs${direction ? ` ${direction}` : ""} to Floor ${toFloor}`;
  }

  return `Go to Floor ${toFloor}`;
}

function getInitialHallwayInstruction(vec: { dx: number; dy: number }) {
  if (Math.abs(vec.dx) >= Math.abs(vec.dy)) {
    return vec.dx > 0
      ? "Exit the room and turn right into the hallway"
      : "Exit the room and turn left into the hallway";
  }

  return "Exit the room and continue into the hallway";
}

function getTurnInstruction(
  prev: { dx: number; dy: number },
  next: { dx: number; dy: number },
): "straight" | "left" | "right" {
  const cross = prev.dx * next.dy - prev.dy * next.dx;
  const dot = prev.dx * next.dx + prev.dy * next.dy;

  if (Math.abs(cross) < 40 || dot > 0) {
    return "straight";
  }

  return cross > 0 ? "right" : "left";
}

export function generateRouteSteps(nodes: Node[]): RouteStep[] {
  if (!nodes || nodes.length < 2) return [];

  const steps: RouteStep[] = [];
  const firstVec = getDirectionVector(nodes[0], nodes[1]);

  steps.push({
    id: "start",
    text: getInitialHallwayInstruction(firstVec),
  });

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    if (prev.floorId !== curr.floorId) {
      steps.push({
        id: `${prev.id}-${curr.id}-floor`,
        text: getFloorTransitionInstruction(prev, curr),
      });
      continue;
    }

    if (i < nodes.length - 1) {
      const next = nodes[i + 1];

      if (curr.floorId !== next.floorId) continue;

      const prevVec = getDirectionVector(prev, curr);
      const nextVec = getDirectionVector(curr, next);
      const turn = getTurnInstruction(prevVec, nextVec);

      if (turn === "left") {
        steps.push({
          id: `${curr.id}-left`,
          text: "Turn left at the hallway",
        });
      } else if (turn === "right") {
        steps.push({
          id: `${curr.id}-right`,
          text: "Turn right at the hallway",
        });
      } else if (i === 1 || i === nodes.length - 2) {
        steps.push({
          id: `${curr.id}-straight`,
          text: "Continue along the hallway",
        });
      }
    }
  }

  const lastNode = nodes[nodes.length - 1];
  steps.push({
    id: "end",
    text: `Arrive at ${getReadableDestinationLabel(lastNode)}`,
  });

  return steps;
}