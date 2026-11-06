// Shared map-building helpers (a tiny deterministic grid builder) used by maps.ts and kingdomMaps.ts.
import { ITEM, type TileName } from '../content/frameIndex';
import type { PropDef, Tile } from './types';

// ---------------------------------------------------------------- tiny deterministic builder
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Grid {
  cells: TileName[][];
  constructor(public w: number, public h: number, fill: TileName) {
    this.cells = Array.from({ length: h }, () => Array<TileName>(w).fill(fill));
  }
  set(x: number, y: number, t: TileName) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y][x] = t;
  }
  get(x: number, y: number): TileName {
    return this.cells[y][x];
  }
  rect(x: number, y: number, w: number, h: number, t: TileName) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, t);
  }
  /** Fill a rectangle choosing randomly (seeded) from `tiles`. */
  mix(x: number, y: number, w: number, h: number, tiles: TileName[], seed: number) {
    const r = mulberry32(seed);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, tiles[Math.floor(r() * tiles.length)]);
  }
  /** Replace cells currently in `over` with a random pick from `tiles` at probability `p`. */
  scatter(x: number, y: number, w: number, h: number, tiles: TileName[], p: number, seed: number, over: (t: TileName) => boolean) {
    const r = mulberry32(seed);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const cx = x + i, cy = y + j;
        if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) continue;
        const roll = r(), pick = r();
        if (roll < p && over(this.get(cx, cy))) this.set(cx, cy, tiles[Math.floor(pick * tiles.length)]);
      }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, t: TileName | ((d: number) => TileName)) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d <= 1) this.set(x, y, typeof t === 'function' ? t(d) : t);
      }
  }
}

export const isGrass = (t: TileName) => t.startsWith('grass');
export const isSand = (t: TileName) => t.startsWith('sand');
export const item = (name: keyof typeof ITEM) => ({ key: 'items', frame: ITEM[name] });
export const npc = (name: string) => ({ key: `npc_${name}`, anim: `${name}_idle` });
export const tile = (x: number, y: number): Tile => ({ x, y });
export const col = (x: number, y0: number, y1: number): Tile[] => Array.from({ length: y1 - y0 + 1 }, (_, i) => tile(x, y0 + i));

export const TREE_BLOCK: [number, number][] = [[0, 0]];

export function trees(list: [number, number, 'a' | 'b'][]): PropDef[] {
  return list.map(([x, y, k]) => ({ key: k === 'a' ? 'tree_a' : 'tree_b', x, y, blocks: TREE_BLOCK }));
}

