import { Node } from "../types/Navigation";

export type RouteStep = {
  id: string;
  text: string;
  node: Node;
};

// Vector / geometry

function vec(from: { x: number; y: number }, to: { x: number; y: number }) {
  return { dx: to.x - from.x, dy: to.y - from.y };
}

function magnitude(v: { dx: number; dy: number }) {
  return Math.sqrt(v.dx * v.dx + v.dy * v.dy);
}

function normalise(v: { dx: number; dy: number }) {
  const len = magnitude(v) || 1;
  return { dx: v.dx / len, dy: v.dy / len };
}

function cosSim(a: { dx: number; dy: number }, b: { dx: number; dy: number }) {
  const na = normalise(a);
  const nb = normalise(b);
  return na.dx * nb.dx + na.dy * nb.dy;
}

function crossSign(a: { dx: number; dy: number }, b: { dx: number; dy: number }): number {
  const na = normalise(a);
  const nb = normalise(b);
  return na.dx * nb.dy - na.dy * nb.dx;
}

function runDistance(nodes: Node[], fromIdx: number, toIdx: number): number {
  let d = 0;
  const s = Math.max(0, fromIdx);
  const e = Math.min(toIdx, nodes.length - 1);
  for (let k = s; k < e; k++) {
    d += magnitude(vec(nodes[k], nodes[k + 1]));
  }
  return d;
}

// Turn / transit classification

type TurnKind = "straight" | "left" | "right";

function classifyTurn(from: { dx: number; dy: number }, to: { dx: number; dy: number }): TurnKind {
  const cos = cosSim(from, to);
  if (cos > 0.75) return "straight";
  return crossSign(from, to) > 0 ? "right" : "left";
}

type TransitKind = "elevator" | "escalator" | "stairs";

function getTransitKind(node: Node): TransitKind | null {
  if (node.type === "elevator") return "elevator";
  if (node.type === "escalator") return "escalator";
  if (node.type === "stairs") return "stairs";
  return null;
}

function floorNum(floorId: string): number {
  const n = Number(floorId.split("_").pop());
  return isNaN(n) ? 0 : n;
}

// Approach vector

function buildApproachVec(nodes: Node[], i: number): { dx: number; dy: number } {
  let acc = vec(nodes[i - 1], nodes[i]);
  for (let k = i - 1; k >= 1; k--) {
    const seg = vec(nodes[k - 1], nodes[k]);
    if (cosSim(acc, seg) < 0.7) break;
    acc = { dx: acc.dx + seg.dx, dy: acc.dy + seg.dy };
  }
  return acc;
}

// Label helpers─

function roomLabel(node: Node): string {
  const raw = node.label ?? node.id;
  if (/^room\s+/i.test(raw)) return raw.trim();
  return `Room ${raw.trim()}`;
}

function destinationLabel(node: Node): string {
  switch (node.type) {
    case "entrance":
      return "the building entrance";
    case "bathroom":
      return node.label ?? "the washroom";
    case "food":
      return node.label ?? "the food location";
    case "helpDesk":
      return node.label ?? "the help desk";
    default:
      return roomLabel(node);
  }
}

// Open-floor detection

const OPEN_FLOOR_NUMBERS = new Set([1, 2]);

function isOpenFloor(floorId: string): boolean {
  return OPEN_FLOOR_NUMBERS.has(floorNum(floorId));
}

// Segment types
interface StartSegment {
  kind: "start";
  node: Node;
  initialVec: { dx: number; dy: number };
}
interface StraightSegment {
  kind: "straight";
  node: Node;
  onOpenFloor: boolean;
  nextTransitKind: TransitKind | null;
}
interface TurnSegment {
  kind: "turn";
  node: Node;
  direction: "left" | "right";
}
interface TransitSegment {
  kind: "transit";
  node: Node;
  transitKind: TransitKind;
  fromFloor: number;
  toFloor: number;
}
interface ArriveSegment {
  kind: "arrive";
  node: Node;
  approachTurn?: "left" | "right";
}

type Segment = StartSegment | StraightSegment | TurnSegment | TransitSegment | ArriveSegment;

// Core: path -> segments

export function buildSegments(nodes: Node[]): Segment[] {
  const segs: Segment[] = [];

  if (nodes.length < 2) return segs;

  segs.push({
    kind: "start",
    node: nodes[0],
    initialVec: vec(nodes[0], nodes[1]),
  });

  let lastActionIdx = 0;
  let i = 1;

  while (i < nodes.length) {
    const curr = nodes[i];
    const prev = nodes[i - 1];
    const isLast = i === nodes.length - 1;

    //  Case A: transit node─
    if (getTransitKind(curr) !== null) {
      maybeEmitStraight(segs, nodes, lastActionIdx, i, getTransitKind(curr));

      let j = i;
      let chosenKind: TransitKind = getTransitKind(curr)!;
      const fromFloor = floorNum(curr.floorId);

      while (j < nodes.length && getTransitKind(nodes[j]) !== null) {
        const kk = getTransitKind(nodes[j])!;
        if (kk === "elevator") chosenKind = "elevator";
        else if (kk === "escalator" && chosenKind !== "elevator") chosenKind = "escalator";
        j++;
      }

      const toFloor = j < nodes.length ? floorNum(nodes[j].floorId) : floorNum(nodes[j - 1].floorId);

      if (toFloor !== fromFloor) {
        segs.push({ kind: "transit", node: curr, transitKind: chosenKind, fromFloor, toFloor });
      }

      lastActionIdx = j;
      i = j + 1;
      continue;
    }

    //  Case B: floor boundary without transit node
    if (curr.floorId !== prev.floorId) {
      i++;
      continue;
    }

    //Case C: final destination
    if (isLast) {
      maybeEmitStraight(segs, nodes, lastActionIdx, i);
      let lastTurn: TurnSegment | undefined;
      for (let k = segs.length - 1; k >= 0; k--) {
        if (segs[k].kind === "turn") {
          lastTurn = segs[k] as TurnSegment;
          break;
        }
      }
      segs.push({ kind: "arrive", node: curr, approachTurn: lastTurn?.direction });
      break;
    }

    //Case D: turn detection
    const next = nodes[i + 1];

    if (getTransitKind(next) !== null || next.floorId !== curr.floorId) {
      i++;
      continue;
    }

    const approachVec = buildApproachVec(nodes, i);
    const departVec = vec(curr, next);
    const turn = classifyTurn(approachVec, departVec);

    if (turn !== "straight" && !isOpenFloor(curr.floorId)) {
      maybeEmitStraight(segs, nodes, lastActionIdx, i);
      segs.push({ kind: "turn", node: curr, direction: turn });
      lastActionIdx = i;
    }

    i++;
  }

  return segs;
}

function maybeEmitStraight(
  segs: Segment[],
  nodes: Node[],
  fromIdx: number,
  toIdx: number,
  nextTransitKind: TransitKind | null = null,
): void {
  const dist = runDistance(nodes, fromIdx, toIdx);
  if (dist > 10) {
    const onOpenFloor = isOpenFloor(nodes[Math.max(fromIdx, 0)].floorId);
    segs.push({ kind: "straight", node: nodes[fromIdx], onOpenFloor, nextTransitKind });
  }
}

// Segment -> text─

function segmentToText(seg: Segment): string {
  switch (seg.kind) {
    case "start": {
      const { node, initialVec } = seg;

      if (node.type === "entrance") {
        const cos = cosSim(initialVec, { dx: 0, dy: -1 });
        const cross = crossSign({ dx: 0, dy: -1 }, initialVec);
        if (cos < 0.75) {
          return cross > 0 ? "Enter the building and turn right into the corridor" : "Enter the building and turn left into the corridor";
        }
        return "Enter the building and continue straight";
      }

      if (["room", "bathroom", "food", "helpDesk"].includes(node.type ?? "")) {
        const cos = cosSim(initialVec, { dx: 0, dy: -1 });
        const cross = crossSign({ dx: 0, dy: -1 }, initialVec);
        if (cos < 0.75) {
          return cross > 0 ? "Exit the room and turn right into the hallway" : "Exit the room and turn left into the hallway";
        }
        return "Exit the room and continue straight into the hallway";
      }

      if (node.type === "hallway") {
        return "Head into the corridor";
      }

      return `Start at ${node.label ?? node.id} and head into the corridor`;
    }

    case "straight": {
      if (seg.onOpenFloor && seg.nextTransitKind) {
        const target = seg.nextTransitKind === "elevator" ? "elevator" : seg.nextTransitKind === "escalator" ? "escalator" : "stairs";
        return `Walk to the ${target}`;
      }
      if (seg.onOpenFloor) {
        return "Walk across the open area";
      }
      return "Continue straight in the hallway";
    }

    case "turn":
      return seg.direction === "left" ? "Turn left at the next hallway" : "Turn right at the next hallway";

    case "transit": {
      const verb =
        seg.transitKind === "elevator" ? "Take the elevator" : seg.transitKind === "escalator" ? "Take the escalator" : "Take the stairs";
      const dir = seg.toFloor > seg.fromFloor ? "up" : "down";
      return `${verb} ${dir} to Floor ${seg.toFloor}`;
    }

    case "arrive": {
      const dest = destinationLabel(seg.node);
      if (seg.approachTurn === "left") return `Your destination is on the left — ${dest}`;
      if (seg.approachTurn === "right") return `Your destination is on the right — ${dest}`;
      return `You have arrived at ${dest}`;
    }
  }
}

//Public API
export function generateRouteSteps(nodes: Node[]): RouteStep[] {
  if (!nodes || nodes.length < 2) return [];

  const segments = buildSegments(nodes);

  const collapsed: Segment[] = [];
  for (const seg of segments) {
    if (seg.kind === "straight" && collapsed[collapsed.length - 1]?.kind === "straight") {
      continue;
    }
    collapsed.push(seg);
  }

  // Remove a "straight" or "turn" immediately before "arrive" — both are redundant
  const filtered = collapsed.filter((seg, idx) => {
    if (seg.kind !== "turn" && seg.kind !== "straight") return true;
    const next = collapsed[idx + 1];
    const nextNext = collapsed[idx + 2];
    return !(next?.kind === "arrive" || nextNext?.kind === "arrive");
  });

  return filtered.map((seg, idx) => ({
    id: `step-${idx}-${seg.kind}`,
    text: segmentToText(seg),
    node: seg.node,
  }));
}

/**
 * Estimates walking time from a path of nodes.
 * Uses a rough scale of 80 map-pixels per second at normal walking pace.
 */
export function estimateWalkMinutes(nodes: Node[]): number {
  if (!nodes || nodes.length < 2) return 1;
  let dist = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    dist += magnitude(vec(nodes[i], nodes[i + 1]));
  }
  return Math.max(1, Math.round(dist / 80 / 60));
}
