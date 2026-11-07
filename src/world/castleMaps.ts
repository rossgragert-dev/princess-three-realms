// v0.4d.2: the Royal Castle rooms and the King's Garden Labyrinth.
import type { MapDef, ObjDef, PropDef } from './types';
import { Grid, npc, tile } from './mapKit';

const walls = (g: Grid, W: number, H: number) => {
  g.rect(0, 0, W, 1, 'wall_top_int'); g.rect(0, 1, W, 2, 'wall_lavender'); g.rect(0, 3, W, 1, 'base_lavender');
  g.rect(0, 4, 1, H - 4, 'wall_lavender'); g.rect(W - 1, 4, 1, H - 4, 'wall_lavender'); g.rect(0, H - 1, W, 1, 'wall_lavender');
};
const checker = (g: Grid, W: number, H: number, a: 'floor_cream_tile0' | 'path0', b: 'floor_cream_tile1' | 'path1') => {
  for (let y = 4; y < H - 1; y++) for (let x = 1; x < W - 1; x++) g.set(x, y, (x + y) % 2 === 0 ? a : b);
};

// ---------------------------------------------------------------- Royal Kitchen (22x14)
export const KITCHEN_STATIONS = [
  { id: 'cook_cake', x: 4, dish: 'px_cake' }, { id: 'cook_cookies', x: 8, dish: 'px_cookie' },
  { id: 'cook_pizza', x: 13, dish: 'px_pizza' }, { id: 'cook_icecream', x: 17, dish: 'px_cone' }
] as const;

export function kitchen(): MapDef {
  const W = 22, H = 14, g = new Grid(W, H, 'floor_cream_tile0');
  checker(g, W, H, 'floor_cream_tile0', 'floor_cream_tile1'); walls(g, W, H);
  g.rect(W - 1, 9, 1, 2, 'floor_cream_tile1'); // the door back to the Throne Room
  const props: PropDef[] = [
    ...[3, 10, 16].map((x): PropDef => ({ key: 'px_stained', x, y: 2, depthBias: -2 })),
    ...KITCHEN_STATIONS.flatMap((s): PropDef[] => [{ key: 'px_counter', x: s.x, y: 4, ox: 0, blocks: [[0, 0]] }, { key: s.dish, x: s.x, y: 3, depthBias: 6 }]),
    { key: 'px_stove', x: 1, y: 7, blocks: [[0, 0]] }, { key: 'px_stove', x: 1, y: 9, blocks: [[0, 0]] },
    { key: 'round_table', x: 10, y: 9, blocks: [[0, 0]] }, { key: 'px_bench', x: 7, y: 11, ox: 0, blocks: [[0, 0], [1, 0]] },
    { key: 'sunflower_pot', x: 19, y: 6, blocks: [[0, 0]] }, { key: 'tulip_pot', x: 19, y: 12, blocks: [[0, 0]] }
  ];
  const objects: ObjDef[] = [
    ...KITCHEN_STATIONS.map((s): ObjDef => ({ id: s.id, kind: 'station', x: s.x, y: 4, radius: 2.0 })),
    { id: 'door_exit', kind: 'warp', x: W - 1, y: 9, tiles: [tile(W - 1, 9), tile(W - 1, 10)], to: { scene: 'throne', spawn: 'from_kitchen' }, sprite: { key: 'items', anim: 'sparkle' } }
  ];
  return { id: 'kitchen', w: W, h: H, medium: 'air', mermaidAllowed: false, bg: '#8a5a3d', ground: g.cells, props, objects, gates: [], spawns: { from_throne: tile(W - 3, 9) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- Royal Gallery (22x14)
export function gallery(): MapDef {
  const W = 22, H = 14, g = new Grid(W, H, 'floor_cream_tile0');
  checker(g, W, H, 'floor_cream_tile0', 'floor_cream_tile1'); walls(g, W, H);
  g.rect(0, 9, 1, 2, 'floor_cream_tile1'); // the door back to the Throne Room
  const props: PropDef[] = [
    ...[2, 5, 16, 19].map((x): PropDef => ({ key: 'px_stained', x, y: 2, depthBias: -2 })),
    { key: 'px_easel', x: 6, y: 8, blocks: [[0, 0]] },
    ...[[3, 6], [18, 6], [3, 12], [18, 12]].map(([x, y], i): PropDef => ({ key: ['tulip_pot', 'sunflower_pot'][i % 2], x, y, blocks: [[0, 0]] })),
    { key: 'px_statue', x: 13, y: 8, blocks: [[0, 0]] }, { key: 'px_bench', x: 10, y: 11, ox: 0, blocks: [[0, 0], [1, 0]] },
    { key: 'px_pillar', x: 8, y: 5, blocks: [[0, 0]] }, { key: 'px_pillar', x: 14, y: 5, blocks: [[0, 0]] }
  ];
  const objects: ObjDef[] = [
    { id: 'easel_paint', kind: 'station', x: 6, y: 8, radius: 2.0 },
    { id: 'art_frame', kind: 'station', x: 11, y: 4, radius: 2.4 },
    { id: 'door_exit', kind: 'warp', x: 0, y: 9, tiles: [tile(0, 9), tile(0, 10)], to: { scene: 'throne', spawn: 'from_gallery' }, sprite: { key: 'items', anim: 'sparkle' } }
  ];
  return { id: 'gallery', w: W, h: H, medium: 'air', mermaidAllowed: false, bg: '#5a3d8a', ground: g.cells, props, objects, gates: [], spawns: { from_throne: tile(2, 9) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- King's Garden Labyrinth (30x27)
export const LAB = { cw: 7, ch: 5, w: 30, h: 27, plazaY: 22 } as const;
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** Depth-first spanning tree over the 7x5 cell grid: every cell is reachable, winding, with dead ends. */
export function labyrinthLinks(seed = 11): { a: [number, number]; b: [number, number] }[] {
  const r = rng(seed), seen = new Set<string>(), links: { a: [number, number]; b: [number, number] }[] = [];
  const stack: [number, number][] = [[3, 4]]; seen.add('3,4');
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).map(([dx, dy]) => [x + dx, y + dy] as [number, number])
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < LAB.cw && ny < LAB.ch && !seen.has(`${nx},${ny}`));
    if (!nb.length) { stack.pop(); continue; }
    const n = nb[Math.floor(r() * nb.length)]; seen.add(`${n[0]},${n[1]}`); links.push({ a: [x, y], b: n }); stack.push(n);
  }
  return links;
}

export function labyrinth(): MapDef {
  const { w: W, h: H, plazaY } = LAB, g = new Grid(W, H, 'hedge');
  g.mix(0, plazaY, W, H - plazaY, ['grass0', 'grass1', 'grass2', 'grass3'], 71);
  g.scatter(0, plazaY, W, H - plazaY, ['grass_flower0', 'grass_flower1'], 0.14, 72, () => true);
  const cell = (i: number, j: number) => ({ x: 2 + 4 * i, y: 2 + 4 * j });
  for (let j = 0; j < LAB.ch; j++) for (let i = 0; i < LAB.cw; i++) g.rect(cell(i, j).x, cell(i, j).y, 2, 2, 'path0');
  const deg = new Map<string, number>();
  for (const { a, b } of labyrinthLinks()) {
    const A = cell(a[0], a[1]), B = cell(b[0], b[1]);
    g.rect(Math.min(A.x, B.x), Math.min(A.y, B.y), Math.abs(A.x - B.x) + 2, Math.abs(A.y - B.y) + 2, 'path0');
    for (const k of [a, b]) deg.set(`${k[0]},${k[1]}`, (deg.get(`${k[0]},${k[1]}`) ?? 0) + 1);
  }
  g.rect(12, 8, 6, 6, 'path0'); // the open garden room around the King
  g.rect(14, 20, 2, 2, 'path0'); // the entrance opening in the bottom hedge
  g.scatter(2, 2, 26, 20, ['path1'], 0.3, 73, (t) => t === 'path0');
  g.scatter(0, 0, W, plazaY, ['grass_flower0', 'grass_flower1'], 0.06, 74, (t) => t === 'hedge');
  const props: PropDef[] = [];
  const decor = ['px_bench', 'px_statue', 'px_fountain', 'px_flower_red', 'px_lamp', 'px_flower_blue', 'px_statue', 'px_flower_yellow'];
  let n = 0;
  for (let j = 0; j < LAB.ch; j++) for (let i = 0; i < LAB.cw; i++) {
    if (deg.get(`${i},${j}`) !== 1 || (i === 3 && (j === 2 || j === 4))) continue;
    const c = cell(i, j), key = decor[n++ % decor.length];
    props.push({ key, x: c.x, y: c.y + 1, blocks: [[0, 0]] });
  }
  props.push({ key: 'px_fountain', x: 16, y: 12, blocks: [[0, 0]] }, { key: 'px_bench', x: 12, y: 13, ox: 0, blocks: [[0, 0]] }, { key: 'px_bench', x: 17, y: 9, ox: 0, blocks: [[0, 0]] },
    { key: 'px_arch', x: 14, y: 21, ox: 8, depthBias: 4000 },
    { key: 'px_bench', x: 5, y: 24, ox: 0, blocks: [[0, 0]] }, { key: 'px_bench', x: 24, y: 24, ox: 0, blocks: [[0, 0]] },
    { key: 'px_fountain', x: 9, y: 25, blocks: [[0, 0]] }, { key: 'px_fountain', x: 20, y: 25, blocks: [[0, 0]] },
    { key: 'px_butterfly_pink', x: 13, y: 23 }, { key: 'px_butterfly_yellow', x: 17, y: 24 }, { key: 'px_butterfly_blue', x: 15, y: 10 },
    { key: 'px_flower_red', x: 2, y: 23 }, { key: 'px_flower_yellow', x: 27, y: 23 }, { key: 'bush', x: 6, y: 25 }, { key: 'bush', x: 23, y: 25 });
  const objects: ObjDef[] = [
    { id: 'king_maze', kind: 'npc', x: 14, y: 10, sprite: npc('king'), blocks: true, radius: 2.0 },
    { id: 'door_exit', kind: 'warp', x: 15, y: H - 1, tiles: [tile(13, H - 1), tile(14, H - 1), tile(15, H - 1), tile(16, H - 1)], to: { scene: 'festival', spawn: 'from_labyrinth' }, sprite: { key: 'items', anim: 'sparkle' } }
  ];
  return { id: 'labyrinth', w: W, h: H, medium: 'air', mermaidAllowed: false, bg: '#3b8f4f', ground: g.cells, props, objects, gates: [], spawns: { from_festival: tile(14, H - 4) }, music: 'sunlit' };
}
