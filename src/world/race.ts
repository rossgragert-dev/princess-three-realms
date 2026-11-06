// v0.4c: Mermaid River Race — pure checkpoint logic. Gentle by design: nothing is ever lost, missed rings never
// restart the race and only the optional Star Challenge has a clock.
export type RaceMode = 'free' | 'friendly' | 'star';
export interface Ring { x: number; y: number }

/** Rings follow the river's current from the headwaters to the lagoon. Open water only (verified by tests). */
export const RING_RADIUS = 1.35;
export const FRIENDLY_RINGS = 6;
/** Star Challenge: par times in ms for 3, 2 and 1 stars. Finishing at any time still counts. */
export const STAR_PAR_MS = [45_000, 70_000, 100_000] as const;

export interface RaceState {
  mode: RaceMode;
  rings: Ring[];
  next: number;
  passed: number;
  startedAt: number | null;
  elapsedMs: number;
  done: boolean;
}

export function startRace(mode: RaceMode, course: Ring[]): RaceState {
  const rings = mode === 'free' ? [] : mode === 'friendly' ? course.slice(0, FRIENDLY_RINGS) : course.slice();
  return { mode, rings, next: 0, passed: 0, startedAt: null, elapsedMs: 0, done: false };
}

/** Is a point inside a ring? */
export const inRing = (p: { x: number; y: number }, r: Ring) => Math.hypot(p.x - r.x, p.y - r.y) <= RING_RADIUS;

export type RaceEvent = 'none' | 'ring' | 'finish';

/**
 * Advance with the swimmer's position (tile units) and the current time. Only the next ring counts; swimming the
 * wrong way, circling or missing a ring never costs anything. The clock starts at the first ring.
 */
export function stepRace(s: RaceState, p: { x: number; y: number }, now: number): RaceEvent {
  if (s.done || s.rings.length === 0) return 'none';
  if (s.startedAt !== null) s.elapsedMs = Math.max(0, now - s.startedAt);
  if (!inRing(p, s.rings[s.next])) return 'none';
  if (s.startedAt === null) s.startedAt = now;
  s.elapsedMs = Math.max(0, now - s.startedAt);
  s.next += 1;
  s.passed += 1;
  if (s.next >= s.rings.length) { s.done = true; return 'finish'; }
  return 'ring';
}

/** 3, 2, 1 or 0 stars for a finished Star Challenge. (Zero is just "swim again": it never removes anything.) */
export function starsFor(ms: number): 0 | 1 | 2 | 3 {
  if (ms <= STAR_PAR_MS[0]) return 3;
  if (ms <= STAR_PAR_MS[1]) return 2;
  if (ms <= STAR_PAR_MS[2]) return 1;
  return 0;
}

/** Unit direction to the next ring (for the big arrow); null once finished or in free swim. */
export function guideDir(s: RaceState, p: { x: number; y: number }): { x: number; y: number; dist: number } | null {
  if (s.done || s.rings.length === 0) return null;
  const r = s.rings[s.next];
  const dx = r.x - p.x, dy = r.y - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d, dist: d };
}

/** Where the friendly companion waits: a little ahead of the swimmer, toward the next ring. */
export function companionPos(s: RaceState, p: { x: number; y: number }, lead = 2.2): { x: number; y: number } {
  const g = guideDir(s, p);
  if (!g) return { x: p.x + 1.5, y: p.y - 1 };
  const d = Math.min(lead, g.dist);
  return { x: p.x + g.x * d, y: p.y + g.y * d };
}

/** Race progress for the picture HUD: filled rings out of total. */
export const progress = (s: RaceState) => ({ done: s.passed, total: s.rings.length });
