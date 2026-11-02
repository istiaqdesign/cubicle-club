// Office floor plan, in stage pixels (the stage is 1280×720 and scaled to fit).
// Characters are anchored at their feet; z-index follows the y position so
// things lower on screen are drawn in front.

export const STAGE = { w: 1280, h: 720 };

/** Character sprite box. Anchored at the bottom centre (the feet). */
export const CHAR = { w: 120, h: 168 };

export interface Pt {
  x: number;
  y: number;
}

/** The walkway between the back and front rows of desks. */
export const AISLE_Y = 470;

const ROWS = [
  { seatY: 398, deskTop: 338, z: 458, visitY: 478 },
  { seatY: 598, deskTop: 538, z: 658, visitY: 612 },
];

// Desk slots, filled in the order agents join. exitDx = which side they get up.
const DESKS = [
  { x: 230, row: 0, exitDx: 135 },
  { x: 500, row: 0, exitDx: 135 },
  { x: 770, row: 0, exitDx: 135 },
  { x: 360, row: 1, exitDx: -135 },
  { x: 640, row: 1, exitDx: 135 },
  // Sixth desk, by the window side of the board, for new hires.
  { x: 1040, row: 0, exitDx: -135 },
];

/** Most agents the floor fits. */
export const MAX_DESKS = DESKS.length;

export const BOSS = { x: 1040, deskTop: 538, z: 668, laneX: 870 };
export const BOSS_QUEUE: Pt[] = [
  { x: 870, y: 684 },
  { x: 795, y: 690 },
  { x: 720, y: 696 },
];

export function desk(slot: number) {
  const d = DESKS[slot % DESKS.length];
  const row = ROWS[d.row];
  return { ...d, ...row };
}

export const seatPoint = (slot: number): Pt => ({ x: desk(slot).x, y: desk(slot).seatY });
export const seatZ = (slot: number) => desk(slot).z - 6;

export type Loc =
  | { kind: 'seat'; slot: number }
  | { kind: 'visit'; slot: number }
  | { kind: 'boss'; q: number }
  /** Just outside the office (left edge), where new hires arrive and retirees leave. */
  | { kind: 'door' }
  /** Anywhere else: path runs from the aisle to the spot. */
  | { kind: 'spot'; path: Pt[] };

// Coffee corner: two people chatting in front of the machine.
const COFFEE_LANE_X = 54;
export const COFFEE_SPOTS: Pt[] = [
  { x: 58, y: 344 },
  { x: 158, y: 336 },
];
export const coffeeLoc = (i: number): Loc => ({
  kind: 'spot',
  path: [{ x: COFFEE_LANE_X, y: AISLE_Y }, { x: COFFEE_LANE_X, y: COFFEE_SPOTS[0].y }, COFFEE_SPOTS[i]],
});

// Award ceremony: winner on a podium in the aisle, everyone else around it.
export const PODIUM = { x: 500, y: 452 };
export const CROWD_SPOTS: Pt[] = [
  { x: 380, y: 478 },
  { x: 620, y: 478 },
  { x: 280, y: 470 },
  { x: 720, y: 470 },
  { x: 820, y: 466 },
];
export const aisleLoc = (p: Pt): Loc => ({ kind: 'spot', path: [{ x: p.x, y: AISLE_Y }, p] });

// Rivals square up in the aisle.
export const FACE_OFF: Pt[] = [
  { x: 440, y: 482 },
  { x: 560, y: 482 },
];

// Performance reviews happen in front of your desk.
export const REVIEW_SPOT: Pt = { x: 1000, y: 706 };
export const reviewLoc: Loc = { kind: 'spot', path: [{ x: BOSS.laneX, y: AISLE_Y }, { x: BOSS.laneX, y: REVIEW_SPOT.y }, REVIEW_SPOT] };

// A cake table for retirement parties, next to the guest of honour.
export const CAKE_SPOT: Pt = { x: 590, y: 470 };

/** Points from the aisle to a location (last point = the location itself). */
export const DOOR: Pt = { x: -90, y: AISLE_Y };

export function accessPath(loc: Loc): Pt[] {
  if (loc.kind === 'spot') return loc.path;
  if (loc.kind === 'door') return [DOOR];
  if (loc.kind === 'boss') {
    const q = BOSS_QUEUE[Math.min(loc.q, BOSS_QUEUE.length - 1)];
    return [{ x: BOSS.laneX, y: AISLE_Y }, { x: BOSS.laneX, y: BOSS_QUEUE[0].y }, q];
  }
  const d = desk(loc.slot);
  const exitX = d.x + d.exitDx;
  if (loc.kind === 'seat') {
    return [{ x: exitX, y: AISLE_Y }, { x: exitX, y: d.seatY }, { x: d.x, y: d.seatY }];
  }
  // Visiting: stand in front of a back-row desk, or beside a front-row one.
  if (d.row === 0) return [{ x: d.x - 60, y: AISLE_Y }, { x: d.x - 60, y: d.visitY }];
  return [{ x: exitX, y: AISLE_Y }, { x: exitX, y: d.visitY }];
}
