// v0.4a.1: princess wand projectile — pure targeting, flight and reaction rules (no Phaser).
import { ITEM } from '../content/frameIndex';
import type { MapDef } from './types';

export type SpellKind = 'tree' | 'fountain' | 'flower' | 'glow' | 'banner';
export interface SpellTarget { id: string; kind: SpellKind; x: number; y: number; r: number; /** tiles this scenery blocks: running into one of them is a direct hit */ tiles?: string[] }
export interface Pt { x: number; y: number }

export const RANGE_TILES = 6;
/** The unicorn's horn beam is short and sweet. */
export const HORN_RANGE = 3;
export const COOLDOWN_MS = 420;
export const SHOT_TILES_PER_SEC = 16;

/** Explicit spell-target data: which scenery reacts to the wand, and how big its "hit" is (tiles). */
export const SPELL_PROPS: Record<string, { kind: SpellKind; r: number; dy?: number }> = {
  tree_a: { kind: 'tree', r: 0.75 }, tree_b: { kind: 'tree', r: 0.75 },
  fountain: { kind: 'fountain', r: 1.45, dy: -0.5 }, bush: { kind: 'flower', r: 0.65 },
  castle_gate: { kind: 'banner', r: 1.3, dy: -0.5 }, ribbon: { kind: 'banner', r: 1.2 }
};
const SPELL_ITEM_FRAMES: Record<number, { kind: SpellKind; r: number }> = { [ITEM.mushroom]: { kind: 'glow', r: 0.6 } };

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
    out.push({ id: `${p.key}@${p.x},${p.y}#${i}`, kind: d.kind, tiles: p.blocks?.map(([dx, dy]) => `${p.x + dx},${p.y + dy}`), x: p.x + 0.5 + (p.ox ?? 0) / 16, y: p.y + 0.5 + ((d as { dy?: number }).dy ?? 0), r: d.r });
  });
  map.ground.forEach((row, y) => row.forEach((t, x) => { if (t.startsWith('flower_')) out.push({ id: `${t}@${x},${y}`, kind: 'flower', x: x + 0.5, y: y + 0.5, r: 0.5 }); }));
  cache.set(map.id, out);
  return out;
}

export const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } } as const;
export const norm = (v: Pt): Pt => { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; };

/** The princess's wand always flies exactly the way she is facing (no aim assist, no homing). */
export const facingVector = (dir: keyof typeof DIRS): Pt => ({ ...DIRS[dir] });

export interface Flight { end: Pt; hit?: SpellTarget; dist: number; blocked: boolean }
/** Walk the shot forward along a fixed straight line: it ends on a target, on the first solid tile, or at full range. */
export function fly(from: Pt, dir: Pt, targets: readonly SpellTarget[], solid: (tx: number, ty: number) => boolean, range = RANGE_TILES, step = 0.15): Flight {
  const d = norm(dir);
  for (let s = step; s <= range + 1e-6; s += step) {
    const p = { x: from.x + d.x * s, y: from.y + d.y * s };
    for (const t of targets) if (Math.hypot(t.x - p.x, t.y - p.y) <= t.r && Math.hypot(t.x - from.x, t.y - from.y) > t.r * 0.6) return { end: p, hit: t, dist: s, blocked: false };
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (solid(tx, ty)) {
      const own = targets.find((t) => t.tiles?.includes(`${tx},${ty}`));
      if (own) return { end: p, hit: own, dist: s, blocked: false };
    }
    if (solid(tx, ty)) return { end: { x: from.x + d.x * (s - step), y: from.y + d.y * (s - step) }, dist: s - step, blocked: true };
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
