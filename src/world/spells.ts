// v0.4a.1: princess wand projectile — pure targeting, flight and reaction rules (no Phaser).
import { ITEM } from '../content/frameIndex';
import type { MapDef } from './types';

export type SpellKind = 'tree' | 'fountain' | 'flower' | 'glow' | 'banner';
export interface SpellTarget { id: string; kind: SpellKind; x: number; y: number; r: number }
export interface Pt { x: number; y: number }

export const RANGE_TILES = 6;
export const COOLDOWN_MS = 420;
export const CONE_DEG = 50;
export const SHOT_TILES_PER_SEC = 16;

/** Explicit spell-target data: which scenery reacts to the wand, and how big its "hit" is (tiles). */
export const SPELL_PROPS: Record<string, { kind: SpellKind; r: number; dy?: number }> = {
  tree_a: { kind: 'tree', r: 1.1, dy: -0.5 }, tree_b: { kind: 'tree', r: 1.1, dy: -0.5 },
  fountain: { kind: 'fountain', r: 1.8, dy: -0.4 }, bush: { kind: 'flower', r: 1 },
  castle_gate: { kind: 'banner', r: 1.5, dy: -0.5 }, ribbon: { kind: 'banner', r: 1.5 }
};
const SPELL_ITEM_FRAMES: Record<number, { kind: SpellKind; r: number }> = { [ITEM.mushroom]: { kind: 'glow', r: 0.9 } };

export interface Reaction { fx: 'blossom' | 'spray' | 'bloom' | 'glow' | 'shimmer'; ms: number; sfx: 'shimmer' | 'bloom' | 'spray' }
export const REACTIONS: Record<SpellKind, Reaction> = {
  tree: { fx: 'blossom', ms: 3500, sfx: 'bloom' },
  fountain: { fx: 'spray', ms: 4000, sfx: 'spray' },
  flower: { fx: 'bloom', ms: 3000, sfx: 'bloom' },
  glow: { fx: 'glow', ms: 3500, sfx: 'shimmer' },
  banner: { fx: 'shimmer', ms: 3000, sfx: 'shimmer' }
};

const cache = new Map<string, SpellTarget[]>();
/** Every eligible target on a map, in tile units (centres). */
export function targetsOf(map: MapDef): SpellTarget[] {
  const hit = cache.get(map.id); if (hit) return hit;
  const out: SpellTarget[] = [];
  map.props.forEach((p, i) => {
    const d = p.key === 'items' && p.frame !== undefined ? SPELL_ITEM_FRAMES[p.frame] : SPELL_PROPS[p.key];
    if (!d) return;
    out.push({ id: `${p.key}@${p.x},${p.y}#${i}`, kind: d.kind, x: p.x + 0.5 + (p.ox ?? 0) / 16, y: p.y + 0.5 + ((d as { dy?: number }).dy ?? 0), r: d.r });
  });
  map.ground.forEach((row, y) => row.forEach((t, x) => { if (t.startsWith('flower_')) out.push({ id: `${t}@${x},${y}`, kind: 'flower', x: x + 0.5, y: y + 0.5, r: 0.7 }); }));
  cache.set(map.id, out);
  return out;
}

export const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } } as const;
export const norm = (v: Pt): Pt => { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; };

/** Gentle aim assist: the best target inside a cone around the facing direction, else straight ahead. */
export function aim(from: Pt, facing: Pt, targets: readonly SpellTarget[], range = RANGE_TILES, coneDeg = CONE_DEG): { dir: Pt; target?: SpellTarget } {
  const f = norm(facing);
  let best: SpellTarget | undefined, bestScore = Infinity;
  for (const t of targets) {
    const dx = t.x - from.x, dy = t.y - from.y, d = Math.hypot(dx, dy);
    if (d > range + t.r || d < 0.01) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * f.x + dy * f.y) / d))) * 180 / Math.PI;
    // targets larger than the cone gap still count when the ray would clip them
    const slack = Math.asin(Math.min(1, t.r / d)) * 180 / Math.PI;
    if (ang - slack > coneDeg) continue;
    const score = ang + d * 2;
    if (score < bestScore) { bestScore = score; best = t; }
  }
  if (!best) return { dir: f };
  return { dir: norm({ x: best.x - from.x, y: best.y - from.y }), target: best };
}

export interface Flight { end: Pt; hit?: SpellTarget; dist: number; blocked: boolean }
/** Walk the shot forward: it ends on a target, on the first solid tile, or at full range. */
export function fly(from: Pt, dir: Pt, targets: readonly SpellTarget[], solid: (tx: number, ty: number) => boolean, range = RANGE_TILES, step = 0.15): Flight {
  const d = norm(dir);
  for (let s = step; s <= range + 1e-6; s += step) {
    const p = { x: from.x + d.x * s, y: from.y + d.y * s };
    for (const t of targets) if (Math.hypot(t.x - p.x, t.y - p.y) <= t.r && Math.hypot(t.x - from.x, t.y - from.y) > t.r * 0.6) return { end: p, hit: t, dist: s, blocked: false };
    if (solid(Math.floor(p.x), Math.floor(p.y))) return { end: { x: from.x + d.x * (s - step), y: from.y + d.y * (s - step) }, dist: s - step, blocked: true };
  }
  return { end: { x: from.x + d.x * range, y: from.y + d.y * range }, dist: range, blocked: false };
}

export const ready = (now: number, last: number): boolean => now - last >= COOLDOWN_MS;

/** Temporary-effect book-keeping: a target can be re-triggered any time; each shot restarts its timer. */
export class Effects {
  private until = new Map<string, number>();
  start(id: string, ms: number, now: number): boolean { const was = this.active(id, now); this.until.set(id, now + ms); return !was; }
  active(id: string, now: number): boolean { return (this.until.get(id) ?? 0) > now; }
  count(now: number): number { let n = 0; for (const v of this.until.values()) if (v > now) n++; return n; }
}
