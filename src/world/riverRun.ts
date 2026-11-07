// v0.4d.5: the River Race as a classic scrolling 2D run. Pure course + scoring logic (no Phaser) so it is unit-testable.
// Gentle by design: no time penalties anywhere, bumps only slow her for a moment, nothing is ever lost.
import type { RaceMode } from './race';

export const LANE_MIN = 56;          // stage x range the mermaid can swim in
export const LANE_MAX = 456;
export type ItemKind = 'ring' | 'kelp' | 'rock' | 'pearl';
export interface RunItem { kind: ItemKind; x: number; d: number }

/** Distance (px) of the first ring and the gap between rings. */
export const FIRST = 320;
export const GAP = 190;
export const RUN_RINGS: Record<Exclude<RaceMode, 'free'>, number> = { friendly: 8, star: 14 };

/** Small deterministic generator so a course is identical in tests and in play for the same seed. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/** A wandering lane path for rings: each ring is at most ~150 px sideways of the last so it is always reachable. */
export function buildCourse(mode: RaceMode, seed = 7, startD = 0, count?: number): RunItem[] {
  const r = rng(seed);
  const n = count ?? (mode === 'free' ? 12 : RUN_RINGS[mode]);
  const items: RunItem[] = [];
  let x = 256;
  for (let i = 0; i < n; i++) {
    const d = startD + FIRST + i * GAP;
    x = Math.min(LANE_MAX - 30, Math.max(LANE_MIN + 30, x + (r() - 0.5) * 300));
    if (mode !== 'free' || i % 2 === 0) items.push({ kind: 'ring', x, d });
    else items.push({ kind: 'pearl', x, d });
    // one or two obstacles half-way to the next ring, always well clear of both rings' lanes
    const od = d + GAP / 2;
    const k = mode === 'star' && i > 2 ? 2 : 1;
    for (let j = 0; j < k; j++) {
      for (let tries = 0; tries < 12; tries++) {
        const ox = LANE_MIN + r() * (LANE_MAX - LANE_MIN);
        if (Math.abs(ox - x) < 90) continue;
        if (items.some((it) => it.kind !== 'pearl' && Math.abs(it.d - od) < 30 && Math.abs(it.x - ox) < 110)) continue;
        items.push({ kind: r() < 0.5 ? 'kelp' : 'rock', x: ox, d: od + (j ? 36 : 0) }); break;
      }
    }
    if (mode !== 'free' && r() < 0.6) items.push({ kind: 'pearl', x: Math.min(LANE_MAX, Math.max(LANE_MIN, x + (r() - 0.5) * 120)), d: d + GAP * 0.3 });
  }
  return items;
}

export const finishDistance = (mode: Exclude<RaceMode, 'free'>) => FIRST + RUN_RINGS[mode] * GAP + 60;

/** Stars come from rings collected (never from time or bumps): finish = 1, most rings = 2, nearly all = 3. */
export function starsForRun(passed: number, total: number): 1 | 2 | 3 {
  if (passed >= Math.ceil(total * 0.85)) return 3;
  if (passed >= Math.ceil(total * 0.55)) return 2;
  return 1;
}

/** Speed in px/s: gentle cruise, brief boost after a ring, short slow-down after a bump. Nothing ever stops her. */
export function speedAt(base: number, boostMs: number, slowMs: number): number {
  return base * (boostMs > 0 ? 1.35 : 1) * (slowMs > 0 ? 0.55 : 1);
}

/** Does the swimmer at x touch an item whose centre is `dy` px ahead? */
export const touches = (sx: number, ix: number, dy: number, rx: number, ry: number) => Math.abs(sx - ix) <= rx && Math.abs(dy) <= ry;
