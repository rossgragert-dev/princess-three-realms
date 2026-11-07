import { decorById, DECOR, LEGACY_DECOR, LEGACY_SLOTS, STARTERS, slotById } from './decorCatalog';
import { getMap } from '../world/maps';
import { EXTRA_DECOR } from './family';
import { makeGrid } from '../world/navigation';

/**
 * v0.4a.1 free-placement furniture. Pure data + pure functions (unit tested); Phaser only draws and handles touches.
 *
 * Model: the bedroom holds a list of PLACED INSTANCES (stable id, item, anchor tile, optional mirror), not slot -> item.
 * Rules (all enforced here, before anything is saved):
 *   - floor furniture ("big") blocks walking and needs free floor tiles; rugs lie flat and are walked over; small things
 *     (toys, flowers, lamps) are walked over and may also stand ON a table; wall items hang on the back wall; curtains hang on the two windows.
 *   - fixed fixtures (wardrobe, vanity, shelf, windows, easel, door, Nana) never move and keep an open apron in front of them.
 *   - after every placement the room is flood-filled from the doorway: every interaction must stay reachable and no region may be sealed off.
 */
export type FKind = 'big' | 'small' | 'rug' | 'wall' | 'window';
export type FGroup = 'beds' | 'tables' | 'seats' | 'rugs' | 'plants' | 'toys' | 'lights' | 'storage' | 'wall';
export const GROUPS: readonly FGroup[] = ['beds', 'tables', 'seats', 'rugs', 'plants', 'toys', 'lights', 'storage', 'wall'];

export interface FurnitureDef {
  id: string;
  /** Adult-facing only. */
  name: string;
  group: FGroup;
  kind: FKind;
  /** Footprint in 16px tiles. */
  w: number;
  h: number;
  /** Texture + frame drawn in the room and in the catalog. */
  key: string;
  frame?: number;
  /** How many copies may be in the room at once. */
  max: number;
  /** Tables: pixels from the table's bottom to its top surface, where small things sit. */
  surface?: number;
  /** Small things that may stand on a table. */
  canSit?: boolean;
  /** Pixel nudge of the drawn sprite. */
  ox?: number;
  dy?: number;
}

const F = (id: string, name: string, group: FGroup, kind: FKind, w: number, h: number, key: string, max: number, extra: Partial<FurnitureDef> = {}): FurnitureDef =>
  ({ id, name, group, kind, w, h, key, max, ...extra });

export const FURNITURE: Record<string, FurnitureDef> = Object.fromEntries([
  // beds
  F('cozy_bed', 'Cozy Bed', 'beds', 'big', 3, 2, 'px_bed_cozy', 1),
  F('sunny_bed', 'Sunny Bed', 'beds', 'big', 3, 2, 'px_bed_sunny', 1),
  F('canopy_bed', 'Canopy Bed', 'beds', 'big', 3, 2, 'px_bed_canopy', 1),
  // tables
  F('round_table', 'Round Table', 'tables', 'big', 2, 1, 'round_table', 3, { surface: 15 }),
  F('square_table', 'Square Table', 'tables', 'big', 2, 1, 'square_table', 3, { surface: 15 }),
  F('tea_table', 'Tea Table', 'tables', 'big', 1, 1, 'tea_table', 3, { surface: 11 }),
  F('desk', 'Little Desk', 'tables', 'big', 2, 1, 'desk', 2, { surface: 18 }),
  // seats
  F('pink_chair', 'Pink Chair', 'seats', 'big', 1, 1, 'pink_chair', 4),
  F('wooden_chair', 'Wooden Chair', 'seats', 'big', 1, 1, 'wooden_chair', 4),
  F('little_couch', 'Little Couch', 'seats', 'big', 2, 1, 'little_couch', 2),
  F('bean_bag', 'Bean Bag', 'seats', 'big', 1, 1, 'bean_bag', 3),
  F('star_stool', 'Star Stool', 'seats', 'big', 1, 1, 'star_stool', 4),
  // rugs
  F('plain_rug', 'Plain Rug', 'rugs', 'rug', 3, 2, 'plain_rug', 2),
  F('striped_rug', 'Striped Rug', 'rugs', 'rug', 3, 2, 'striped_rug', 2),
  F('rainbow_rug', 'Rainbow Rug', 'rugs', 'rug', 3, 2, 'rug', 1),
  F('heart_rug', 'Heart Rug', 'rugs', 'rug', 2, 2, 'heart_rug', 2),
  // plants and flowers
  F('plant_stand', 'Plant Stand', 'plants', 'big', 1, 1, 'plant_stand', 3),
  F('leafy_plant', 'Leafy Plant', 'plants', 'big', 1, 1, 'leafy_plant', 3),
  F('sunflower_pot', 'Sunflower', 'plants', 'big', 1, 1, 'sunflower_pot', 3),
  F('tulip_pot', 'Tulips', 'plants', 'small', 1, 1, 'tulip_pot', 6, { canSit: true }),
  F('daisy_pot', 'Daisies', 'plants', 'small', 1, 1, 'daisy_pot', 6, { canSit: true }),
  F('cactus_pot', 'Little Cactus', 'plants', 'small', 1, 1, 'cactus_pot', 4, { canSit: true }),
  F('flower_pot', 'Flower Pot', 'plants', 'small', 1, 1, 'vase', 1, { canSit: true }),
  // toys, dolls, balls, stuffed animals
  F('teddy_bear', 'Teddy Bear', 'toys', 'small', 1, 1, 'teddy_bear', 4, { canSit: true }),
  F('kitty_plush', 'Kitty', 'toys', 'small', 1, 1, 'kitty_plush', 4, { canSit: true }),
  F('duck_plush', 'Ducky', 'toys', 'small', 1, 1, 'duck_plush', 4, { canSit: true }),
  F('bunny_pillow', 'Bunny Pillow', 'toys', 'small', 1, 1, 'bunny_pillow', 1, { canSit: true }),
  F('unicorn_plush', 'Unicorn Plush', 'toys', 'small', 1, 1, 'unicorn_plush', 1, { canSit: true }),
  F('rag_doll', 'Rag Doll', 'toys', 'small', 1, 1, 'rag_doll', 4, { canSit: true }),
  F('ballerina_doll', 'Ballerina', 'toys', 'small', 1, 1, 'ballerina_doll', 3, { canSit: true }),
  F('beach_ball', 'Beach Ball', 'toys', 'small', 1, 1, 'beach_ball', 6, { canSit: true }),
  F('rainbow_ball', 'Rainbow Ball', 'toys', 'small', 1, 1, 'rainbow_ball', 6, { canSit: true }),
  F('toy_blocks', 'Toy Blocks', 'toys', 'small', 1, 1, 'toy_blocks', 4, { canSit: true }),
  F('floor_pillow', 'Floor Pillow', 'toys', 'small', 1, 1, 'floor_pillow', 4),
  F('reading_cushion', 'Reading Cushion', 'toys', 'small', 1, 1, 'reading_cushion', 4),
  F('toy_basket', 'Toy Basket', 'toys', 'big', 1, 1, 'toy_basket', 3),
  F('treasure_chest', 'Treasure Chest', 'toys', 'big', 1, 1, 'decor_chest', 1),
  // lights
  F('small_lamp', 'Small Lamp', 'lights', 'small', 1, 1, 'small_lamp', 4, { canSit: true }),
  F('night_light', 'Moon Night-light', 'lights', 'small', 1, 1, 'night_light', 3, { canSit: true }),
  F('floor_lamp', 'Floor Lamp', 'lights', 'big', 1, 1, 'floor_lamp', 3),
  F('star_lamp', 'Star Lamp', 'lights', 'big', 1, 1, 'lamp', 1, { frame: 1 }),
  // storage
  F('dresser', 'Dresser', 'storage', 'big', 2, 1, 'dresser', 2),
  F('bookshelf', 'Bookshelf', 'storage', 'big', 2, 1, 'bookshelf', 2),
  F('crystal_nightstand', 'Crystal Nightstand', 'storage', 'big', 1, 1, 'crystal_nightstand', 1),
  // wall
  F('wall_hanging', 'Wall Hanging', 'wall', 'wall', 1, 1, 'wall_hanging', 4),
  F('round_mirror', 'Round Mirror', 'wall', 'wall', 1, 1, 'round_mirror', 4),
  F('star_banner', 'Star Banner', 'wall', 'wall', 2, 1, 'star_banner', 3),
  F('flower_wreath', 'Flower Wreath', 'wall', 'wall', 1, 1, 'flower_wreath', 4),
  F('shell_mirror', 'Shell Mirror', 'wall', 'wall', 1, 1, 'shell_mirror', 1),
  F('mermaid_art', 'Mermaid Art', 'wall', 'wall', 2, 1, 'mermaid_art', 1),
  F('butterfly_painting', 'Butterfly Painting', 'wall', 'wall', 2, 1, 'butterfly_painting', 1),
  F('pink_curtain', 'Pink Curtain', 'wall', 'window', 1, 1, 'pink_curtain', 2),
  F('moon_curtain', 'Moon Curtain', 'wall', 'window', 1, 1, 'moon_curtain', 2),
  // v0.4b rewards: a garland from the King's fireworks, a flower cushion from Dapple's meadow
  F('festival_garland', 'Festival Garland', 'wall', 'wall', 2, 1, 'festival_garland', 1),
  F('meadow_cushion', 'Meadow Cushion', 'toys', 'small', 1, 1, 'meadow_cushion', 1),
  // v0.4c rewards from the Kingdom Beyond (drawn at runtime, see src/art/kingdomArt.ts)
  F('mushroom_lamp', 'Mushroom Lamp', 'lights', 'small', 1, 1, 'decor_mushroom_lamp', 1, { canSit: true }),
  F('woodland_plush', 'Woodland Plush', 'toys', 'small', 1, 1, 'decor_woodland_plush', 1, { canSit: true }),
  F('lantern_garland', 'Lantern Garland', 'wall', 'wall', 2, 1, 'decor_lantern_garland', 1),
  F('flower_cushion', 'Flower Cushion', 'toys', 'small', 1, 1, 'decor_flower_cushion', 1),
  F('river_fountain', 'River Fountain', 'plants', 'small', 1, 1, 'decor_river_fountain', 1, { canSit: true })
].map((d) => [d.id, d]));
export const FURNITURE_IDS = Object.keys(FURNITURE);
export const furnitureById = (id: string): FurnitureDef | undefined => FURNITURE[id];

/** Earned rewards (need an unlock); everything else is free from the first minute. */
export const EARNED_IDS: readonly string[] = [...Object.keys(DECOR), ...EXTRA_DECOR];
const EARNED = new Set<string>(EARNED_IDS);
export const isEarned = (id: string) => EARNED.has(id);
export const ownsFurniture = (id: string, unlocked: readonly string[]) => !!FURNITURE[id] && (!EARNED.has(id) || unlocked.includes(id));
/** Items the child can use right now, in catalog order. */
export const ownedIn = (group: FGroup, unlocked: readonly string[]) => FURNITURE_IDS.map((i) => FURNITURE[i]).filter((d) => d.group === group && ownsFurniture(d.id, unlocked));
/** Earned items in a group she does not own yet (shown as a silhouette with a padlock). */
export const lockedIn = (group: FGroup, unlocked: readonly string[]) => FURNITURE_IDS.map((i) => FURNITURE[i]).filter((d) => d.group === group && EARNED.has(d.id) && !unlocked.includes(d.id));

// ------------------------------------------------------------------ the room
export interface Tile { x: number; y: number }
export interface PlacedItem { id: string; item: string; x: number; y: number; flip?: boolean }

export const FLOOR = { x0: 1, y0: 4, x1: 22, y1: 16 } as const;
export const WALL_ROW = 2;
export const WALL_X = { x0: 1, x1: 22 } as const;
export const WINDOW_ANCHORS = [6, 15] as const;
/** Back-wall tiles taken by fixed things: two windows, the crown, the shelf. */
const FIXED_WALL = new Set<number>([6, 7, 15, 16, 11, 12, 20, 21]);
export const MAX_ITEMS = 40;
export const MAX_UNDO = 20;

const key = (x: number, y: number) => y * 64 + x;
const inFloor = (x: number, y: number) => x >= FLOOR.x0 && x <= FLOOR.x1 && y >= FLOOR.y0 && y <= FLOOR.y1;
export const tilesOf = (d: FurnitureDef, x: number, y: number): Tile[] => {
  const out: Tile[] = [];
  for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) out.push({ x: x + i, y: y + j });
  return out;
};
/** Anchor (top-left) for a footprint whose bottom-middle sits on the tapped tile. */
export const anchorFor = (d: FurnitureDef, tapX: number, tapY: number): Tile => {
  if (d.kind === 'wall') return { x: tapX - Math.floor((d.w - 1) / 2), y: WALL_ROW };
  if (d.kind === 'window') return { x: WINDOW_ANCHORS.reduce((b, a) => (Math.abs(a - tapX) < Math.abs(b - tapX) ? a : b), WINDOW_ANCHORS[0]), y: WALL_ROW };
  return { x: tapX - Math.floor((d.w - 1) / 2), y: tapY - (d.h - 1) };
};

interface Base { blocked: Set<number>; floor: Set<number>; reserved: Set<number>; need: { id: string; x: number; y: number; r: number }[]; door: Tile }
let baseCache: Base | null = null;
/** Everything about the bedroom that furniture can never change. */
export function bedroomBase(): Base {
  if (baseCache) return baseCache;
  const map = getMap('bedroom');
  const grid = makeGrid(map, {}, 'princess');
  const blocked = new Set<number>(), floor = new Set<number>();
  for (let y = FLOOR.y0; y <= FLOOR.y1; y++) for (let x = FLOOR.x0; x <= FLOOR.x1; x++) { if (grid.passable(x, y)) floor.add(key(x, y)); else blocked.add(key(x, y)); }
  // the open aprons that must stay clear: doorway + spawn, and a strip in front of each station
  const reserved = new Set<number>();
  const keep = (x0: number, y0: number, x1: number, y1: number) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) reserved.add(key(x, y)); };
  keep(10, 14, 13, 16); // door + where she arrives
  for (const o of map.objects) if (o.kind === 'station') keep(o.x - 1, o.y, o.x + 1, o.y);
  const need = map.objects.filter((o) => o.kind === 'station' || o.kind === 'npc').map((o) => ({ id: o.id, x: o.x, y: o.y, r: o.radius ?? 1.6 }));
  baseCache = { blocked, floor, reserved, need, door: { x: 11, y: 16 } };
  return baseCache;
}

export type Why = 'unknown' | 'locked' | 'limit' | 'copies' | 'bounds' | 'overlap' | 'fixed' | 'blocks_path' | 'wall_full' | 'no_table';
export interface Check { ok: boolean; why?: Why }

const bigBlocked = (layout: readonly PlacedItem[], skip?: string) => {
  const s = new Set<number>();
  for (const p of layout) {
    if (p.id === skip) continue;
    const d = FURNITURE[p.item];
    if (d?.kind === 'big') for (const t of tilesOf(d, p.x, p.y)) s.add(key(t.x, t.y));
  }
  return s;
};

/** Flood-fills from the doorway over free floor. */
export function reachableFrom(layout: readonly PlacedItem[], skip?: string, extra?: { item: string; x: number; y: number }): Set<number> {
  const b = bedroomBase();
  const block = bigBlocked(layout, skip);
  if (extra) { const d = FURNITURE[extra.item]; if (d?.kind === 'big') for (const t of tilesOf(d, extra.x, extra.y)) block.add(key(t.x, t.y)); }
  const seen = new Set<number>();
  const start = key(b.door.x, b.door.y);
  if (!b.floor.has(start) || block.has(start)) return seen;
  const q = [start]; seen.add(start);
  for (let i = 0; i < q.length; i++) {
    const k = q[i], x = k % 64, y = Math.floor(k / 64);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = key(x + dx, y + dy);
      if (seen.has(nk) || !b.floor.has(nk) || block.has(nk)) continue;
      seen.add(nk); q.push(nk);
    }
  }
  return seen;
}

/** Can this layout be walked? Every interaction reachable, doorway clear, and at most a couple of tiles sealed away. */
export function walkable(layout: readonly PlacedItem[], skip?: string, extra?: { item: string; x: number; y: number }): boolean {
  const b = bedroomBase();
  const block = bigBlocked(layout, skip);
  if (extra) { const d = FURNITURE[extra.item]; if (d?.kind === 'big') for (const t of tilesOf(d, extra.x, extra.y)) block.add(key(t.x, t.y)); }
  for (const r of b.reserved) if (block.has(r)) return false;
  const reach = reachableFrom(layout, skip, extra);
  for (const n of b.need) {
    let ok = false;
    for (const k of reach) if (Math.hypot((k % 64) - n.x, Math.floor(k / 64) - n.y) <= n.r) { ok = true; break; }
    if (!ok) return false;
  }
  let sealed = 0;
  for (const k of b.floor) if (!block.has(k) && !reach.has(k)) sealed++;
  return sealed <= 3;
}

/** Table tile under (x,y) that has nothing standing on it yet, if any. */
const freeTableAt = (layout: readonly PlacedItem[], x: number, y: number, skip?: string): PlacedItem | undefined => {
  for (const t of layout) {
    if (t.id === skip) continue;
    const td = FURNITURE[t.item];
    if (!td?.surface || !tilesOf(td, t.x, t.y).some((q) => q.x === x && q.y === y)) continue;
    if (!layout.some((s) => s.id !== skip && FURNITURE[s.item]?.kind === 'small' && s.x === x && s.y === y)) return t;
  }
  return undefined;
};

/** The table a small item stands on, if any. */
export const tableUnder = (layout: readonly PlacedItem[], p: PlacedItem): PlacedItem | undefined => {
  const d = FURNITURE[p.item];
  if (d?.kind !== 'small') return undefined;
  return layout.find((t) => { const td = FURNITURE[t.item]; return td?.surface && tilesOf(td, t.x, t.y).some((q) => q.x === p.x && q.y === p.y); });
};

/**
 * May `item` go with its anchor on (x,y)? `skip` is an instance being moved (it does not collide with itself).
 * Pure: never changes the layout.
 */
export function checkPlacement(layout: readonly PlacedItem[], unlocked: readonly string[], item: string, x: number, y: number, skip?: string): Check {
  const d = FURNITURE[item];
  if (!d) return { ok: false, why: 'unknown' };
  if (!ownsFurniture(item, unlocked)) return { ok: false, why: 'locked' };
  const others = layout.filter((p) => p.id !== skip);
  if (!skip && others.length >= MAX_ITEMS) return { ok: false, why: 'limit' };
  if (others.filter((p) => p.item === item).length >= d.max) return { ok: false, why: 'copies' };
  const b = bedroomBase();
  if (d.kind === 'window') {
    if (y !== WALL_ROW || !(WINDOW_ANCHORS as readonly number[]).includes(x)) return { ok: false, why: 'bounds' };
    return others.some((p) => FURNITURE[p.item]?.kind === 'window' && p.x === x) ? { ok: false, why: 'overlap' } : { ok: true };
  }
  if (d.kind === 'wall') {
    if (y !== WALL_ROW || x < WALL_X.x0 || x + d.w - 1 > WALL_X.x1) return { ok: false, why: 'bounds' };
    for (let i = 0; i < d.w; i++) {
      if (FIXED_WALL.has(x + i)) return { ok: false, why: 'fixed' };
      if (others.some((p) => { const o = FURNITURE[p.item]; return o?.kind === 'wall' && x + i >= p.x && x + i < p.x + o.w; })) return { ok: false, why: 'overlap' };
    }
    return { ok: true };
  }
  const tiles = tilesOf(d, x, y);
  for (const t of tiles) if (!inFloor(t.x, t.y)) return { ok: false, why: 'bounds' };
  if (d.kind === 'rug') {
    for (const t of tiles) if (!b.floor.has(key(t.x, t.y))) return { ok: false, why: 'fixed' };
    const mine = new Set(tiles.map((t) => key(t.x, t.y)));
    for (const p of others) { const o = FURNITURE[p.item]; if (o?.kind === 'rug' && tilesOf(o, p.x, p.y).some((t) => mine.has(key(t.x, t.y)))) return { ok: false, why: 'overlap' }; }
    return { ok: true };
  }
  if (d.kind === 'small') {
    const onTable = d.canSit && freeTableAt(layout, x, y, skip);
    if (onTable) return { ok: true };
    if (!b.floor.has(key(x, y))) return { ok: false, why: 'fixed' };
    const taken = others.some((p) => { const o = FURNITURE[p.item]; return (o?.kind === 'big' || o?.kind === 'small') && tilesOf(o, p.x, p.y).some((t) => t.x === x && t.y === y); });
    return taken ? { ok: false, why: 'overlap' } : { ok: true };
  }
  // big
  for (const t of tiles) {
    if (!b.floor.has(key(t.x, t.y))) return { ok: false, why: 'fixed' };
    if (b.reserved.has(key(t.x, t.y))) return { ok: false, why: 'blocks_path' };
  }
  const mine = new Set(tiles.map((t) => key(t.x, t.y)));
  for (const p of others) {
    const o = FURNITURE[p.item];
    if (o && (o.kind === 'big' || o.kind === 'small') && tilesOf(o, p.x, p.y).some((t) => mine.has(key(t.x, t.y)))) {
      // a table with something on it cannot be built over; a small thing on the floor cannot be hidden
      return { ok: false, why: 'overlap' };
    }
  }
  if (!walkable(others, undefined, { item, x, y })) return { ok: false, why: 'blocks_path' };
  return { ok: true };
}

/** The closest anchor where `item` would be accepted, or null. Used for the friendly "try here" marker; never applied silently. */
export function nearestValid(layout: readonly PlacedItem[], unlocked: readonly string[], item: string, x: number, y: number, skip?: string, maxR = 8): Tile | null {
  const d = FURNITURE[item];
  if (!d) return null;
  const a = anchorFor(d, x, y);
  if (checkPlacement(layout, unlocked, item, a.x, a.y, skip).ok) return a;
  let best: { t: Tile; dist: number } | null = null;
  for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) {
    const t = { x: a.x + dx, y: a.y + dy };
    const dist = Math.hypot(dx, dy);
    if (dist > maxR || (best && dist >= best.dist)) continue;
    if (checkPlacement(layout, unlocked, item, t.x, t.y, skip).ok) best = { t, dist };
  }
  return best ? best.t : null;
}

// ------------------------------------------------------------------ editing with undo
const newId = (layout: readonly PlacedItem[], item: string) => { for (let n = 1; ; n++) { const id = `${item}#${n}`; if (!layout.some((p) => p.id === id)) return id; } };
const clone = (l: readonly PlacedItem[]) => l.map((p) => ({ ...p }));

/** Holds the live layout and an undo history. Every mutation is validated first; a refused one changes nothing. */
export class LayoutEditor {
  layout: PlacedItem[];
  private history: PlacedItem[][] = [];
  constructor(layout: readonly PlacedItem[], private unlocked: () => readonly string[]) { this.layout = clone(layout); }
  private snap() { this.history.push(clone(this.layout)); if (this.history.length > MAX_UNDO) this.history.shift(); }
  get canUndo() { return this.history.length > 0; }
  check(item: string, x: number, y: number, skip?: string) { return checkPlacement(this.layout, this.unlocked(), item, x, y, skip); }

  place(item: string, x: number, y: number, flip = false): PlacedItem | Check {
    const c = this.check(item, x, y);
    if (!c.ok) return c;
    this.snap();
    const p: PlacedItem = { id: newId(this.layout, item), item, x, y, ...(flip ? { flip: true } : {}) };
    this.layout.push(p);
    return p;
  }

  /** Moves an instance (and anything standing on a table that moves with it). */
  move(id: string, x: number, y: number, flip?: boolean): Check {
    const p = this.layout.find((q) => q.id === id);
    if (!p) return { ok: false, why: 'unknown' };
    const d = FURNITURE[p.item]!;
    const carried = d.surface ? this.layout.filter((q) => q !== p && FURNITURE[q.item]?.kind === 'small' && tilesOf(d, p.x, p.y).some((t) => t.x === q.x && t.y === q.y)) : [];
    const skipLayout = this.layout.filter((q) => q !== p && !carried.includes(q));
    const c = checkPlacement(skipLayout, this.unlocked(), p.item, x, y);
    if (!c.ok) return c;
    const dx = x - p.x, dy = y - p.y;
    for (const q of carried) if (!inFloor(q.x + dx, q.y + dy)) return { ok: false, why: 'bounds' };
    this.snap();
    p.x = x; p.y = y;
    if (flip !== undefined) { if (flip) p.flip = true; else delete p.flip; }
    for (const q of carried) { q.x += dx; q.y += dy; }
    return { ok: true };
  }

  flip(id: string): Check {
    const p = this.layout.find((q) => q.id === id);
    if (!p || FURNITURE[p.item]?.kind === 'window') return { ok: false, why: 'unknown' };
    this.snap();
    if (p.flip) delete p.flip; else p.flip = true;
    return { ok: true };
  }

  /** Back into the toy box. Things standing on a table go with it. Ownership never changes. */
  putAway(id: string): boolean {
    const p = this.layout.find((q) => q.id === id);
    if (!p) return false;
    const d = FURNITURE[p.item]!;
    this.snap();
    this.layout = this.layout.filter((q) => q !== p && !(d.surface && FURNITURE[q.item]?.kind === 'small' && tilesOf(d, p.x, p.y).some((t) => t.x === q.x && t.y === q.y)));
    return true;
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.layout = prev;
    return true;
  }
}

// ------------------------------------------------------------------ saved data
const DEFAULT_BED_AT: Tile = { x: 6, y: 4 };

/** What a brand-new bedroom looks like (all of it valid, Star Lamp spot untouched). */
export function defaultLayout(): PlacedItem[] {
  return [
    { id: 'cozy_bed#1', item: 'cozy_bed', x: DEFAULT_BED_AT.x, y: DEFAULT_BED_AT.y },
    { id: 'plain_rug#1', item: 'plain_rug', x: 10, y: 11 },
    { id: 'pink_chair#1', item: 'pink_chair', x: 11, y: 4 },
    { id: 'dresser#1', item: 'dresser', x: 13, y: 4 },
    { id: 'floor_pillow#1', item: 'floor_pillow', x: 14, y: 12 },
    { id: 'wall_hanging#1', item: 'wall_hanging', x: 9, y: 2 },
    { id: 'pink_curtain#1', item: 'pink_curtain', x: 15, y: 2 }
  ];
}

const sizeOrder = (d: FurnitureDef) => (d.group === 'beds' ? 0 : d.kind === 'big' ? 1 : d.kind === 'rug' ? 2 : d.kind === 'window' ? 3 : d.kind === 'wall' ? 4 : 5);

/**
 * Turns a v0.1-v0.4a slot layout into free placement. Each piece goes to its old spot when that is still valid, otherwise to
 * the nearest valid one; if nothing fits it simply stays in the toy box (still owned). Nothing is ever lost.
 */
export function migrateLegacy(bedroom: Record<string, string>, unlocked: readonly string[]): PlacedItem[] {
  const layout: PlacedItem[] = [];
  const entries = Object.entries(bedroom)
    .map(([slot, item]) => ({ slot: LEGACY_SLOTS[slot] ?? slot, item: LEGACY_DECOR[item] ?? item }))
    .filter((e) => FURNITURE[e.item] && slotById(e.slot))
    .sort((a, b) => sizeOrder(FURNITURE[a.item]) - sizeOrder(FURNITURE[b.item]));
  const hasBed = entries.some((e) => FURNITURE[e.item].group === 'beds');
  const put = (item: string, x: number, y: number) => {
    const t = nearestValid(layout, unlocked, item, x, y, undefined, 10);
    if (t) layout.push({ id: newId(layout, item), item, x: t.x, y: t.y });
  };
  // the old room always had a bed standing in it; it keeps one unless a canopy bed replaced it
  if (!hasBed) layout.push({ id: 'cozy_bed#1', item: 'cozy_bed', x: DEFAULT_BED_AT.x, y: DEFAULT_BED_AT.y });
  for (const e of entries) {
    const sl = slotById(e.slot)!;
    const d = FURNITURE[e.item];
    if (d.group === 'beds') { put(e.item, DEFAULT_BED_AT.x + 1, DEFAULT_BED_AT.y + 1); continue; }
    if (d.kind === 'window') { put(e.item, e.slot === 'slot_window_b' ? 6 : 15, WALL_ROW); continue; }
    // the old hotspot was where the item's bottom-middle stood
    put(e.item, sl.x, sl.y);
  }
  return layout;
}

/** Cleans anything loaded from a save: unknown/locked items, bad positions, overlaps, over-limit. Returns only valid, placed items. */
export function sanitizeLayout(raw: unknown, unlocked: readonly string[]): PlacedItem[] {
  const out: PlacedItem[] = [];
  if (!Array.isArray(raw)) return out;
  const items = raw.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({ id: typeof r.id === 'string' ? r.id : '', item: typeof r.item === 'string' ? (LEGACY_DECOR[r.item] ?? r.item) : '', x: Number(r.x), y: Number(r.y), flip: r.flip === true }))
    .filter((r) => FURNITURE[r.item] && Number.isFinite(r.x) && Number.isFinite(r.y))
    .sort((a, b) => sizeOrder(FURNITURE[a.item]) - sizeOrder(FURNITURE[b.item]));
  for (const r of items) {
    const x = Math.round(r.x), y = Math.round(r.y);
    if (!checkPlacement(out, unlocked, r.item, x, y).ok) continue; // an invalid piece goes back to the toy box rather than into a wall
    const id = r.id && !out.some((p) => p.id === r.id) ? r.id : newId(out, r.item);
    out.push({ id, item: r.item, x, y, ...(r.flip ? { flip: true } : {}) });
  }
  return out;
}

/** Earned items that are not in the room right now. */
export const unplacedEarned = (unlocked: readonly string[], layout: readonly PlacedItem[]) => unlocked.filter((id) => EARNED.has(id) && !layout.some((p) => p.item === id));
export const hasItem = (layout: readonly PlacedItem[], item: string) => layout.some((p) => p.item === item);
export { decorById, STARTERS };

/** Tiles that walking is blocked on because of big furniture (tile keys, same keying as the nav grid). */
export function furnitureBlockedTiles(layout: readonly PlacedItem[]): Tile[] {
  const out: Tile[] = [];
  for (const p of layout) { const d = FURNITURE[p.item]; if (d?.kind === 'big') out.push(...tilesOf(d, p.x, p.y)); }
  return out;
}

/** Where a piece is drawn: bottom-middle of its sprite in room pixels, plus its draw order. `table` is what it stands on, if anything. */
export function spot(d: FurnitureDef, x: number, y: number, table?: FurnitureDef): { x: number; y: number; depth: number } {
  switch (d.kind) {
    case 'window': return { x: x * 16 + 16, y: 48, depth: 50 };
    case 'wall': return { x: x * 16 + d.w * 8, y: 45, depth: 50 };
    case 'rug': return { x: x * 16 + d.w * 8, y: (y + d.h) * 16 - 4, depth: 1 };
    case 'small': {
      if (table) { const by = (y + 1) * 16 - (table.surface ?? 14) + 2; return { x: x * 16 + 8, y: by, depth: (y + 1) * 16 + 1 }; }
      return { x: x * 16 + 8, y: (y + 1) * 16 - 1, depth: (y + 1) * 16 - 1 };
    }
    default: return { x: x * 16 + d.w * 8, y: (y + d.h) * 16, depth: (y + d.h) * 16 };
  }
}
