// v0.4d.4: the Royal Magic Garden's free design catalog and save data. Pure data; no Phaser, no map imports.
// Placement that depends on the map (what is already in the way, keeping paths open) lives in world/gardenRules.ts.
export type GGroup = 'flowers' | 'trees' | 'structures' | 'ornaments';
export const GGROUPS: readonly GGroup[] = ['flowers', 'trees', 'structures', 'ornaments'];

export interface GItem { id: string; name: string; group: GGroup; key: string; w: number; blocks: boolean; max: number }
const G = (id: string, name: string, group: GGroup, key: string, blocks: boolean, max: number, w = 1): GItem => ({ id, name, group, key, w, blocks, max });

export const GARDEN_ITEMS: readonly GItem[] = [
  // flowers: walk-through
  G('g_rose', 'Red Rose', 'flowers', 'px_gd_rose', false, 40),
  G('g_tulip', 'Pink Tulip', 'flowers', 'px_gd_tulip', false, 40),
  G('g_bluebell', 'Bluebell', 'flowers', 'px_gd_bluebell', false, 40),
  G('g_daisy', 'Daisy', 'flowers', 'px_gd_daisy', false, 40),
  G('g_sunflower', 'Sunflower', 'flowers', 'px_gd_sunflower', false, 40),
  G('g_lavender', 'Lavender', 'flowers', 'px_gd_lavender', false, 40),
  // trees and bushes: solid
  G('g_tree', 'Little Tree', 'trees', 'px_gd_tree', true, 12),
  G('g_blossom', 'Blossom Tree', 'trees', 'px_gd_blossom', true, 12),
  G('g_bush', 'Round Bush', 'trees', 'px_gd_bush', true, 16),
  G('g_rosebush', 'Rose Bush', 'trees', 'px_gd_rosebush', true, 16),
  G('g_hedge', 'Hedge', 'trees', 'px_gd_hedge', true, 24),
  G('g_topiary', 'Star Topiary', 'trees', 'px_gd_topiary', true, 8),
  // structures
  G('g_bench', 'Bench', 'structures', 'px_bench', true, 6, 2),
  G('g_arch', 'Flower Arch', 'structures', 'px_arch', false, 6, 2),
  G('g_birdbath', 'Birdbath', 'structures', 'px_gd_birdbath', true, 6),
  G('g_fountain', 'Tiny Fountain', 'structures', 'px_gd_fountain', true, 4),
  G('g_stones', 'Stepping Stones', 'structures', 'px_gd_stones', false, 40),
  G('g_lamp', 'Garden Lamp', 'structures', 'px_lamp', true, 10),
  // ornaments
  G('g_statue', 'Statue', 'ornaments', 'px_statue', true, 4),
  G('g_gnome', 'Garden Gnome', 'ornaments', 'px_gd_gnome', true, 8),
  G('g_pinwheel', 'Pinwheel', 'ornaments', 'px_gd_pinwheel', false, 12),
  G('g_pot', 'Flower Pot', 'ornaments', 'px_gd_pot', true, 12),
  G('g_crystal', 'Crystal Ball', 'ornaments', 'px_gd_crystal', true, 4),
  G('g_mushrooms', 'Mushroom Ring', 'ornaments', 'px_gd_mushrooms', false, 8)
];
export const GITEM: Readonly<Record<string, GItem>> = Object.fromEntries(GARDEN_ITEMS.map((i) => [i.id, i]));

export interface GPlaced { id: string; item: string; x: number; y: number }
export const GARDEN_MAX = 60;
export const GARDEN_UNDO = 20;

/** The open lawns she may design on (tile rectangles, inclusive). Everything outside stays as the King's gardeners left it. */
export const LAWNS = [
  { x0: 21, y0: 15, x1: 33, y1: 18 },
  { x0: 26, y0: 8, x1: 30, y1: 11 },
  { x0: 3, y0: 3, x1: 9, y1: 4 }
] as const;
/** Lawn tiles that hold something (the ladybug) and so cannot take a piece. */
export const LAWN_EXCLUDE: readonly { x: number; y: number }[] = [{ x: 24, y: 17 }];

export const tilesOf = (it: GItem, x: number, y: number) => Array.from({ length: it.w }, (_, i) => ({ x: x + i, y }));
export const lawnIndexAt = (x: number, y: number) => LAWNS.findIndex((l) => x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1);
export const tileOpen = (x: number, y: number) => lawnIndexAt(x, y) >= 0 && !LAWN_EXCLUDE.some((e) => e.x === x && e.y === y);
const tk = (x: number, y: number) => y * 64 + x;

/** Pure checks that need no map: known item, every tile on a lawn (one lawn), nothing overlapping, count limits. */
export function checkBasic(layout: readonly GPlaced[], item: string, x: number, y: number, skip?: string): { ok: boolean; why?: 'unknown' | 'bounds' | 'overlap' | 'limit' | 'copies' } {
  const it = GITEM[item];
  if (!it) return { ok: false, why: 'unknown' };
  const others = layout.filter((p) => p.id !== skip);
  if (others.length >= GARDEN_MAX) return { ok: false, why: 'limit' };
  if (others.filter((p) => p.item === item).length >= it.max) return { ok: false, why: 'copies' };
  const ts = tilesOf(it, x, y);
  const lawn = lawnIndexAt(x, y);
  if (lawn < 0 || ts.some((t) => lawnIndexAt(t.x, t.y) !== lawn || !tileOpen(t.x, t.y))) return { ok: false, why: 'bounds' };
  const used = new Set<number>();
  for (const p of others) for (const t of tilesOf(GITEM[p.item], p.x, p.y)) used.add(tk(t.x, t.y));
  if (ts.some((t) => used.has(tk(t.x, t.y)))) return { ok: false, why: 'overlap' };
  return { ok: true };
}

/** Load-time cleanup: unknown items, off-lawn, overlapping or surplus pieces are dropped; ids made unique. */
export function sanitizeGarden(raw: unknown): GPlaced[] {
  if (!Array.isArray(raw)) return [];
  const out: GPlaced[] = [], ids = new Set<string>();
  for (const r of raw.slice(0, GARDEN_MAX * 2)) {
    if (!r || typeof r !== 'object') continue;
    const p = r as Partial<GPlaced>;
    if (typeof p.item !== 'string' || typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const x = Math.floor(p.x), y = Math.floor(p.y);
    if (!checkBasic(out, p.item, x, y).ok) continue;
    let id = typeof p.id === 'string' && p.id.length <= 24 ? p.id : `${p.item}#${out.length + 1}`;
    for (let n = 1; ids.has(id); n++) id = `${p.item}#${out.length + 1 + n}`;
    ids.add(id); out.push({ id, item: p.item, x, y });
  }
  return out;
}

export const newGardenId = (layout: readonly GPlaced[], item: string) => { let n = 1; while (layout.some((p) => p.id === `${item}#${n}`)) n++; return `${item}#${n}`; };
