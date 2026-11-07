// v0.4d.4: map-aware garden rules: pieces never block anything essential (every object stays reachable from the entrances).
import { GITEM, checkBasic, newGardenId, tilesOf, GARDEN_UNDO, type GPlaced } from '../content/gardenCatalog';
import { getMap } from './maps';
import { blockKey, flood, makeGrid, tileKey, type Flags } from './navigation';

const tk = (t: { x: number; y: number }) => tileKey(t);
export const blockedByGarden = (layout: readonly GPlaced[]) => {
  const s = new Set<string>();
  for (const p of layout) { const it = GITEM[p.item]; if (it?.blocks) for (const t of tilesOf(it, p.x, p.y)) s.add(`${t.x},${t.y}`); }
  return s;
};

let baseReach: { spawns: { x: number; y: number }[]; needs: { x: number; y: number }[] } | null = null;
function reachNeeds(layout: readonly GPlaced[]) {
  const map = getMap('garden');
  const blocked = new Set<number>(); for (const k of blockedByGarden(layout)) { const [x, y] = k.split(',').map(Number); blocked.add(blockKey(x, y)); }
  const grid = makeGrid(map, {} as Flags, 'princess', blocked);
  const spawns = [map.spawns.from_courtyard, map.spawns.from_greenhouse];
  const reach = new Set<number>(); for (const s of spawns) for (const k of flood(grid, s).keys()) reach.add(k);
  return { map, reach };
}

/** Every interactive thing (and both entrances) that can be reached with an empty garden. */
function baseline() {
  if (baseReach) return baseReach;
  const { map, reach } = reachNeeds([]);
  const needs = map.objects.filter((o) => o.kind !== 'npc').map((o) => ({ x: o.x, y: o.y }))
    .filter((o) => [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => reach.has(tk({ x: o.x + dx, y: o.y + dy }))));
  baseReach = { spawns: [], needs };
  return baseReach;
}

export function checkGarden(layout: readonly GPlaced[], item: string, x: number, y: number, skip?: string): { ok: boolean; why?: string } {
  const b = checkBasic(layout, item, x, y, skip);
  if (!b.ok) return b;
  const it = GITEM[item];
  const map = getMap('garden');
  for (const t of tilesOf(it, x, y)) {
    if (map.objects.some((o) => o.x === t.x && o.y === t.y)) return { ok: false, why: 'bounds' };
  }
  if (it.blocks) {
    const next = [...layout.filter((p) => p.id !== skip), { id: '_new', item, x, y }];
    const { reach } = reachNeeds(next);
    const ok = baseline().needs.every((o) => [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => reach.has(tk({ x: o.x + dx, y: o.y + dy }))));
    if (!ok) return { ok: false, why: 'blocks_path' };
  }
  return { ok: true };
}

/** Same shape as the bedroom's editor: place, move, put away and undo, all validated. */
export class GardenEditor {
  layout: GPlaced[];
  private history: GPlaced[][] = [];
  constructor(layout: readonly GPlaced[]) { this.layout = layout.map((p) => ({ ...p })); }
  private snap() { this.history.push(this.layout.map((p) => ({ ...p }))); if (this.history.length > GARDEN_UNDO) this.history.shift(); }
  get canUndo() { return this.history.length > 0; }
  check(item: string, x: number, y: number, skip?: string) { return checkGarden(this.layout, item, x, y, skip); }
  place(item: string, x: number, y: number): GPlaced | { ok: false; why?: string } {
    const c = this.check(item, x, y); if (!c.ok) return { ok: false, why: c.why };
    this.snap(); const p = { id: newGardenId(this.layout, item), item, x, y }; this.layout.push(p); return p;
  }
  move(id: string, x: number, y: number) {
    const p = this.layout.find((q) => q.id === id); if (!p) return { ok: false, why: 'unknown' };
    const c = this.check(p.item, x, y, id); if (!c.ok) return c;
    this.snap(); p.x = x; p.y = y; return { ok: true };
  }
  putAway(id: string) { if (!this.layout.some((p) => p.id === id)) return false; this.snap(); this.layout = this.layout.filter((p) => p.id !== id); return true; }
  undo() { const prev = this.history.pop(); if (!prev) return false; this.layout = prev; return true; }
}
