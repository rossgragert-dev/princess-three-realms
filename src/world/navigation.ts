import type { Form, QuestFlag } from '../types/game';
import { terrainOf } from './terrain';
import type { TileName } from '../content/frameIndex';
import type { MapDef, ObjDef, Tile } from './types';

export type Flags = Partial<Record<QuestFlag, boolean>>;

const key = (x: number, y: number) => y * 4096 + x;
export const tileKey = (t: Tile) => key(t.x, t.y);

/** Static collision derived from a map: prop footprints and blocking objects. Cached per map. */
const staticCache = new WeakMap<MapDef, Set<number>>();
function staticBlocked(map: MapDef): Set<number> {
  let s = staticCache.get(map);
  if (s) return s;
  s = new Set<number>();
  for (const p of map.props) for (const [dx, dy] of p.blocks ?? []) s.add(key(p.x + dx, p.y + dy));
  staticCache.set(map, s);
  return s;
}

function objectVisible(o: ObjDef, flags: Flags) {
  if (o.showWhen && !flags[o.showWhen]) return false;
  if (o.hideWhen && flags[o.hideWhen]) return false;
  return true;
}

/** Tiles occupied by solid (blocking) objects that are currently present. */
function objectBlocked(map: MapDef, flags: Flags): Set<number> {
  const s = new Set<number>();
  for (const o of map.objects) if (o.blocks && objectVisible(o, flags)) s.add(key(o.x, o.y));
  return s;
}

function gateClosedAt(map: MapDef, flags: Flags): Set<number> {
  const s = new Set<number>();
  for (const g of map.gates) if (!flags[g.flag]) for (const t of g.tiles) s.add(tileKey(t));
  return s;
}

/** Ground tile after quest changes (e.g. the repaired rainbow bridge replaces the ghost bridge). */
export function effectiveTile(map: MapDef, flags: Flags, x: number, y: number): TileName {
  for (const g of map.gates)
    if (flags[g.flag] && g.openTile && g.tiles.some((t) => t.x === x && t.y === y)) return g.openTile;
  return map.ground[y][x];
}

export interface NavGrid {
  map: MapDef;
  form: Form;
  passable(x: number, y: number): boolean;
}

/** `extra` = tiles blocked by movable furniture (keys from `blockKey`). */
export const blockKey = key;
export function makeGrid(map: MapDef, flags: Flags, form: Form, extra?: ReadonlySet<number>): NavGrid {
  const stat = staticBlocked(map);
  const dyn = objectBlocked(map, flags);
  const closed = gateClosedAt(map, flags);
  return {
    map,
    form,
    passable(x, y) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
      const k = key(x, y);
      if (stat.has(k) || dyn.has(k) || closed.has(k) || extra?.has(k)) return false;
      const terr = terrainOf(effectiveTile(map, flags, x, y));
      if (map.medium === 'water') return form === 'mermaid' && terr !== 'solid';
      switch (form) {
        case 'mermaid':
          return map.mermaidAllowed && terr === 'water';
        case 'unicorn':
          return terr === 'land' || terr === 'creek';
        default:
          return terr === 'land';
      }
    }
  };
}

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Breadth-first distance map from `from` over passable tiles. */
export function flood(grid: NavGrid, from: Tile): Map<number, number> {
  const dist = new Map<number, number>();
  if (!grid.passable(from.x, from.y)) return dist;
  dist.set(tileKey(from), 0);
  const q: Tile[] = [from];
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    const d = dist.get(tileKey(c))!;
    for (const [dx, dy] of DIRS) {
      const nx = c.x + dx, ny = c.y + dy;
      if (!grid.passable(nx, ny) || dist.has(key(nx, ny))) continue;
      dist.set(key(nx, ny), d + 1);
      q.push({ x: nx, y: ny });
    }
  }
  return dist;
}

/** A* with a turn penalty so the princess walks in long straight lines rather than staircases. */
export function findPath(grid: NavGrid, from: Tile, to: Tile): Tile[] | null {
  if (!grid.passable(to.x, to.y) || !grid.passable(from.x, from.y)) return null;
  if (from.x === to.x && from.y === to.y) return [from];
  type N = { x: number; y: number; g: number; f: number; dir: number; parent: N | null };
  const open: N[] = [{ x: from.x, y: from.y, g: 0, f: 0, dir: -1, parent: null }];
  const best = new Map<number, number>();
  best.set(key(from.x, from.y) * 4 + 0, 0);
  const closed = new Set<number>();
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.x, cur.y) * 5 + (cur.dir + 1);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === to.x && cur.y === to.y) {
      const out: Tile[] = [];
      for (let n: N | null = cur; n; n = n.parent) out.push({ x: n.x, y: n.y });
      return out.reverse();
    }
    for (let d = 0; d < 4; d++) {
      const nx = cur.x + DIRS[d][0], ny = cur.y + DIRS[d][1];
      if (!grid.passable(nx, ny)) continue;
      const g = cur.g + 1 + (cur.dir !== -1 && cur.dir !== d ? 0.25 : 0);
      const h = Math.abs(nx - to.x) + Math.abs(ny - to.y);
      open.push({ x: nx, y: ny, g, f: g + h, dir: d, parent: cur });
    }
  }
  return null;
}

/** Nearest passable tile to a tapped position (spiral search), or null if the tap is hopeless. */
export function nearestPassable(grid: NavGrid, t: Tile, maxR = 3): Tile | null {
  if (grid.passable(t.x, t.y)) return t;
  for (let r = 1; r <= maxR; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && grid.passable(t.x + dx, t.y + dy)) return { x: t.x + dx, y: t.y + dy };
  return null;
}

/**
 * Where to walk so that `obj` is within its interaction radius. Never returns a tile the player cannot reach.
 * Returns null only when nothing within a generous radius is reachable.
 */
export function approachTile(grid: NavGrid, from: Tile, obj: { x: number; y: number; radius?: number }): Tile | null {
  const dist = flood(grid, from);
  const radius = obj.radius ?? 1.6;
  let best: { t: Tile; score: number } | null = null;
  for (const [k, d] of dist) {
    const x = k % 4096, y = Math.floor(k / 4096);
    const dd = Math.hypot(x - obj.x, y - obj.y);
    if (dd > radius) continue;
    const score = dd * 4 + d; // prefer close to the object, then short walks
    if (!best || score < best.score) best = { t: { x, y }, score };
  }
  return best ? best.t : null;
}

export const withinRadius = (p: Tile, o: { x: number; y: number; radius?: number }) => Math.hypot(p.x - o.x, p.y - o.y) <= (o.radius ?? 1.6) + 0.01;

export function visibleObjects(map: MapDef, flags: Flags): ObjDef[] {
  return map.objects.filter((o) => objectVisible(o, flags));
}

/** Nearest valid spawn for a form: the named spawn if usable, else the nearest passable tile. Never strands the player. */
export function safeSpawn(grid: NavGrid, wanted: Tile | undefined): Tile {
  const map = grid.map;
  const candidates = [wanted, ...Object.values(map.spawns)].filter(Boolean) as Tile[];
  for (const c of candidates) {
    const t = nearestPassable(grid, c, 4);
    if (t) return t;
  }
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (grid.passable(x, y)) return { x, y };
  return { x: 1, y: 1 };
}
