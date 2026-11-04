import type { SceneId } from '../types/game';
import { ITEM, TILE, type TileName } from '../content/frameIndex';
import type { Gate, MapDef, ObjDef, PropDef, Tile } from './types';

// ---------------------------------------------------------------- tiny deterministic builder
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Grid {
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

const isGrass = (t: TileName) => t.startsWith('grass');
const isSand = (t: TileName) => t.startsWith('sand');
const item = (name: keyof typeof ITEM) => ({ key: 'items', frame: ITEM[name] });
const npc = (name: string) => ({ key: `npc_${name}`, anim: `${name}_idle` });
const tile = (x: number, y: number): Tile => ({ x, y });
const col = (x: number, y0: number, y1: number): Tile[] => Array.from({ length: y1 - y0 + 1 }, (_, i) => tile(x, y0 + i));

const TREE_BLOCK: [number, number][] = [[0, 0]];

function trees(list: [number, number, 'a' | 'b'][]): PropDef[] {
  return list.map(([x, y, k]) => ({ key: k === 'a' ? 'tree_a' : 'tree_b', x, y, blocks: TREE_BLOCK }));
}

// ---------------------------------------------------------------- 1. Starfall Courtyard (40x30)
function courtyard(): MapDef {
  const g = new Grid(40, 30, 'grass0');
  g.mix(0, 0, 40, 30, ['grass0', 'grass1', 'grass2', 'grass3'], 11);
  g.scatter(0, 6, 40, 24, ['grass_flower0', 'grass_flower1'], 0.07, 12, isGrass);
  // castle front
  g.rect(0, 0, 40, 1, 'wall_crenel');
  g.rect(0, 1, 40, 5, 'wall_brick');
  for (const x of [6, 11, 28, 33]) g.set(x, 3, 'wall_window');
  for (const x0 of [0, 36]) {
    g.rect(x0, 0, 4, 2, 'roof_blue');
    g.rect(x0, 2, 4, 1, 'roof_gold');
    g.set(x0 + 1, 4, 'wall_window');
    g.set(x0 + 2, 4, 'wall_window');
  }
  // plaza
  g.mix(2, 6, 36, 15, ['cobble0', 'cobble1'], 13);
  g.set(8, 5, 'cobble0'); // bedroom doorway
  // welcoming golden path from the gate to the garden stairs, and from the door to the plaza
  g.mix(18, 6, 4, 15, ['path0', 'path1'], 19);
  g.mix(8, 6, 1, 3, ['path0', 'path1'], 20);
  // raised flower beds
  for (const [bx, by] of [[4, 8], [31, 8], [4, 16], [31, 16], [12, 17], [26, 17]] as const) {
    g.rect(bx, by, 4, 2, 'hedge');
    g.mix(bx, by + 1, 4, 1, ['flower_red', 'flower_blue', 'flower_pink', 'flower_yellow'], bx * 7 + by);
    g.mix(bx, by, 4, 1, ['flower_pink', 'flower_yellow', 'flower_red', 'flower_blue'], bx * 3 + by);
  }
  // side borders and bottom
  g.mix(0, 6, 2, 24, ['tree_wall0', 'tree_wall1'], 14);
  g.mix(38, 6, 2, 24, ['tree_wall0', 'tree_wall1'], 15);
  g.mix(0, 28, 40, 2, ['tree_wall0', 'tree_wall1'], 16);
  g.rect(36, 14, 4, 3, 'path0'); // east exit path
  g.scatter(36, 14, 4, 3, ['path1'], 0.4, 17, () => true);
  // hedge between plaza and garden, with a stair gap
  g.rect(2, 21, 36, 1, 'hedge');
  g.rect(18, 21, 4, 1, 'path0');
  g.mix(18, 22, 4, 1, ['path0', 'path1'], 18);
  // carrot patch (fenced)
  g.rect(24, 23, 11, 1, 'fence_h'); g.rect(24, 27, 11, 1, 'fence_h');
  g.rect(24, 24, 1, 3, 'fence_v'); g.rect(34, 24, 1, 3, 'fence_v');
  g.rect(25, 24, 9, 3, 'path1');
  g.set(29, 23, 'path0'); // gate into the patch
  // flower beds
  for (const [x, y, c] of [[6, 24, 'pink'], [7, 24, 'yellow'], [14, 26, 'blue'], [15, 26, 'red'], [16, 24, 'pink']] as const)
    g.set(x, y, `flower_${c}` as TileName);

  const props: PropDef[] = [
    { key: 'castle_gate', x: 19, y: 5, depthBias: -1 },
    { key: 'door_small', x: 8, y: 5, depthBias: -1 },
    { key: 'ribbon', frame: 0, x: 20, y: 2, flagFrame: { flag: 'STAR_1_FOUND', frame: 1 }, depthBias: -2 },
    { key: 'fountain', anim: 'fountain_flow', x: 19, y: 13, blocks: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0]] },
    { key: 'plot', frame: 0, x: 10, y: 24, ox: 8, blocks: [[0, 0], [1, 0]] },
    ...trees([[3, 23, 'a'], [5, 26, 'b'], [36, 22, 'b'], [36, 26, 'a'], [3, 18, 'b'], [37, 10, 'a'], [3, 8, 'a'], [21, 26, 'b'], [13, 24, 'a'], [17, 25, 'b']]),
  ];
  const objects: ObjDef[] = [
    { id: 'pip', kind: 'npc', x: 16, y: 9, sprite: npc('pip'), blocks: true, radius: 1.8 },
    { id: 'carrot_1', kind: 'puzzle', hideWhen: 'PIP_CARROTS_DONE', x: 27, y: 25, sprite: item('carrot_top'), radius: 1.6 },
    { id: 'carrot_2', kind: 'puzzle', hideWhen: 'PIP_CARROTS_DONE', x: 30, y: 26, sprite: item('carrot_top'), radius: 1.6 },
    { id: 'carrot_3', kind: 'puzzle', hideWhen: 'PIP_CARROTS_DONE', x: 32, y: 25, sprite: item('carrot_top'), radius: 1.6 },
    { id: 'garden_plot', kind: 'puzzle', x: 10, y: 24, radius: 2 },
    { id: 'wand_pedestal', kind: 'ability', x: 6, y: 12, sprite: { key: 'pedestal', frame: 0 }, blocks: true, radius: 1.8 },
    { id: 'door_bedroom', kind: 'warp', x: 8, y: 5, tiles: [tile(8, 5)], to: { scene: 'bedroom', spawn: 'from_courtyard' }, radius: 1.5 },
    { id: 'warp_woods', kind: 'warp', x: 39, y: 15, tiles: col(39, 14, 16), to: { scene: 'woods', spawn: 'from_courtyard' }, sprite: { key: 'items', anim: 'sparkle' } },
  ];
  return {
    id: 'courtyard', w: 40, h: 30, medium: 'air', mermaidAllowed: false, bg: '#8fd3ff', ground: g.cells, props, objects, gates: [],
    spawns: { start: tile(12, 10), from_woods: tile(37, 15), from_bedroom: tile(8, 7) }, music: 'sunlit'
  };
}

// ---------------------------------------------------------------- 2. Whispering Woods (48x30)
function woods(): MapDef {
  const g = new Grid(48, 30, 'grass0');
  g.mix(0, 0, 48, 30, ['grass0', 'grass1', 'grass2', 'grass3'], 21);
  g.scatter(0, 0, 48, 30, ['grass_flower0', 'grass_flower1'], 0.09, 22, isGrass);
  g.mix(0, 0, 48, 3, ['tree_wall0', 'tree_wall1'], 23);
  g.mix(0, 27, 48, 3, ['tree_wall0', 'tree_wall1'], 24);
  g.mix(0, 3, 2, 24, ['tree_wall0', 'tree_wall1'], 25);
  g.mix(47, 3, 1, 24, ['tree_wall0', 'tree_wall1'], 26);
  // west trail
  g.mix(0, 14, 21, 3, ['path0', 'path1'], 27);
  g.mix(4, 11, 3, 3, ['path0', 'path1'], 28);
  g.mix(11, 17, 3, 3, ['path0', 'path1'], 29);
  // dense wall around the talking tree's corridor (rows 14..16 stay open)
  g.mix(20, 3, 7, 11, ['tree_wall0', 'tree_wall1'], 30);
  g.mix(20, 17, 7, 10, ['tree_wall0', 'tree_wall1'], 31);
  g.mix(20, 14, 7, 3, ['path0', 'path1'], 32);
  // east meadow trail to the bridge
  g.mix(27, 14, 14, 3, ['path0', 'path1'], 33);
  // the river
  g.rect(41, 3, 1, 24, 'water_edge0'); g.rect(42, 3, 1, 24, 'water0'); g.rect(43, 3, 1, 24, 'water_edge0');
  g.rect(41, 14, 3, 3, 'bridge_ghost');
  g.rect(44, 14, 3, 3, 'path0');
  g.rect(47, 14, 1, 3, 'path1');
  // hidden grove, reachable only by a unicorn leap over the creek
  g.mix(31, 3, 8, 7, ['tree_wall0', 'tree_wall1'], 34);
  g.rect(33, 4, 4, 4, 'grass_flower0');
  g.rect(31, 5, 2, 2, 'grass0');
  g.rect(32, 5, 1, 2, 'stream0');
  g.rect(33, 8, 1, 1, 'grass1'); // tiny opening for light, still walled below
  g.set(33, 8, 'tree_wall0');
  g.set(36, 6, 'flower_pink'); g.set(34, 7, 'flower_yellow');

  const blooms: [number, number][] = [[30, 10], [33, 12], [35, 19], [37, 11], [38, 20], [31, 21]];
  const props: PropDef[] = [
    { key: 'npc_tree', anim: 'tree_idle', x: 23, y: 16, blocks: [], depthBias: 0 },
    ...trees([[4, 6, 'a'], [8, 8, 'b'], [12, 5, 'a'], [16, 8, 'b'], [6, 21, 'a'], [10, 24, 'b'], [15, 22, 'a'], [18, 24, 'b'], [3, 25, 'a'], [9, 12, 'a'],
      [29, 7, 'b'], [27, 21, 'a'], [34, 23, 'b'], [39, 8, 'a'], [38, 24, 'a'], [29, 24, 'b'], [45, 8, 'b'], [45, 22, 'a'], [44, 12, 'a'], [44, 19, 'b']]),
    { key: 'bush', x: 17, y: 12 }, { key: 'bush', x: 13, y: 13 }, { key: 'bush', x: 36, y: 15 + 4 },
    { key: 'items', frame: ITEM.mushroom, x: 7, y: 17 }, { key: 'items', frame: ITEM.mushroom, x: 25, y: 12 }, { key: 'items', frame: ITEM.mushroom, x: 31, y: 24 },
  ];
  const objects: ObjDef[] = [
    { id: 'tree', kind: 'npc', x: 23, y: 16, radius: 2.2 },
    { id: 'willa', kind: 'npc', x: 28, y: 12, sprite: npc('willa'), blocks: true, radius: 1.8, showWhen: 'TREE_GATE_OPEN' },
    { id: 'bramble', kind: 'npc', x: 39, y: 12, sprite: npc('bramble'), blocks: true, radius: 1.8, showWhen: 'TREE_GATE_OPEN' },
    { id: 'bridge_mark', kind: 'ability', x: 40, y: 15, sprite: { key: 'items', anim: 'sparkle' }, radius: 1.6, hideWhen: 'RAINBOW_BRIDGE_OPEN' },
    ...blooms.map(([x, y], i): ObjDef => ({ id: `bloom_${i + 1}`, kind: 'ability', x, y, sprite: item('bloom0'), radius: 1.5, forms: ['unicorn'] })),
    { id: 'chest_creek', kind: 'chest', x: 35, y: 5, sprite: item('chest'), radius: 1.5, reward: 'sticker_chest' },
    { id: 'warp_courtyard', kind: 'warp', x: 0, y: 15, tiles: col(0, 14, 16), to: { scene: 'courtyard', spawn: 'from_woods' }, sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'warp_shore', kind: 'warp', x: 47, y: 15, tiles: col(47, 14, 16), to: { scene: 'shore', spawn: 'from_woods' }, sprite: { key: 'items', anim: 'sparkle' } },
  ];
  const gates: Gate[] = [
    { id: 'tree_gate', flag: 'TREE_GATE_OPEN', tiles: [22, 23, 24].flatMap((x) => col(x, 14, 16)) },
    { id: 'rainbow_bridge', flag: 'RAINBOW_BRIDGE_OPEN', tiles: [41, 42, 43].flatMap((x) => col(x, 14, 16)), closedTile: 'bridge_ghost', openTile: 'bridge_rainbow0' },
  ];
  return {
    id: 'woods', w: 48, h: 30, medium: 'air', mermaidAllowed: false, bg: '#2f7a4a', ground: g.cells, props, objects, gates,
    spawns: { from_courtyard: tile(2, 15), from_shore: tile(45, 15) }, music: 'wilds'
  };
}

// ---------------------------------------------------------------- 3. Moonpool Shore (40x26)
function shore(): MapDef {
  const g = new Grid(40, 26, 'sand0');
  g.mix(0, 0, 40, 26, ['sand0', 'sand1', 'sand0', 'sand1'], 41);
  g.scatter(0, 0, 40, 26, ['sand_shell'], 0.03, 42, isSand);
  g.mix(0, 0, 11, 26, ['grass0', 'grass1', 'grass2', 'grass3'], 43);
  g.scatter(0, 0, 11, 26, ['grass_flower0', 'grass_flower1'], 0.1, 44, isGrass);
  g.mix(10, 0, 1, 26, ['sand0', 'grass0'], 45);
  g.mix(0, 0, 40, 2, ['tree_wall0', 'tree_wall1'], 46);
  g.mix(0, 24, 40, 2, ['tree_wall0', 'tree_wall1'], 47);
  g.mix(38, 2, 2, 22, ['tree_wall0', 'tree_wall1'], 48);
  g.mix(0, 2, 1, 22, ['tree_wall0', 'tree_wall1'], 49);
  g.rect(0, 12, 1, 3, 'path0');
  g.mix(1, 12, 10, 3, ['path0', 'path1'], 50);
  // the lake
  g.ellipse(28, 13, 12.5, 9, (d) => (d > 0.8 ? 'water_edge0' : d > 0.35 ? 'water0' : 'deep_water'));
  // beach decoration and a hidden treasure behind boulders
  for (const [x, y] of [[5, 3], [7, 3], [5, 5], [7, 5]] as const) g.set(x, y, 'boulder');
  for (const [x, y] of [[14, 4], [15, 21], [13, 7], [16, 19], [22, 3], [24, 22]] as const) g.set(x, y, 'boulder_sand');
  const props: PropDef[] = [
    ...trees([[3, 8, 'b'], [8, 19, 'a'], [4, 21, 'b'], [9, 4, 'a'], [2, 4, 'a'], [8, 10, 'b'], [13, 2, 'a'], [20, 22, 'b'], [35, 21, 'a'], [34, 3, 'b']]),
    { key: 'bush', x: 6, y: 17 }, { key: 'bush', x: 12, y: 16 },
    { key: 'items', frame: ITEM.mushroom, x: 4, y: 15 }, { key: 'items', frame: ITEM.shell, x: 14, y: 11 }, { key: 'items', frame: ITEM.shell, x: 13, y: 15 },
  ];
  const objects: ObjDef[] = [
    { id: 'willa_shore', kind: 'npc', x: 12, y: 11, sprite: npc('willa'), blocks: true, radius: 1.8 },
    { id: 'shimmer', kind: 'portal', x: 16, y: 13, sprite: { key: 'shimmer', anim: 'shimmer_glow' }, radius: 2.2 },
    { id: 'dive', kind: 'warp', x: 28, y: 13, tiles: [tile(28, 13)], to: { scene: 'grotto', spawn: 'from_shore' }, sprite: { key: 'whirlpool', anim: 'whirlpool_spin' }, forms: ['mermaid'], radius: 1.5 },
    { id: 'chest_shore', kind: 'chest', x: 6, y: 4, sprite: item('chest'), radius: 1.6, reward: 'sticker_shell' },
    { id: 'warp_woods', kind: 'warp', x: 0, y: 13, tiles: col(0, 12, 14), to: { scene: 'woods', spawn: 'from_shore' }, sprite: { key: 'items', anim: 'sparkle' } },
  ];
  return {
    id: 'shore', w: 40, h: 26, medium: 'air', mermaidAllowed: true, bg: '#3aa0e8', ground: g.cells, props, objects, gates: [],
    spawns: { from_woods: tile(2, 13), from_grotto: tile(27, 13) }, music: 'seas'
  };
}

// ---------------------------------------------------------------- 4. Underwater Grotto (36x26)
function grotto(): MapDef {
  const g = new Grid(36, 26, 'uw_sand0');
  g.mix(0, 0, 36, 26, ['uw_sand0', 'uw_sand1', 'uw_sand0'], 61);
  g.mix(0, 0, 36, 2, ['uw_rock0', 'uw_rock1'], 62);
  g.mix(0, 24, 36, 2, ['uw_rock0', 'uw_rock1'], 63);
  g.mix(0, 2, 2, 22, ['uw_rock0', 'uw_rock1'], 64);
  g.mix(34, 2, 2, 22, ['uw_rock0', 'uw_rock1'], 65);
  // glowing pearl lane and coral reef clusters
  g.rect(20, 20, 8, 1, 'glow_lane');
  const corals: [number, number, 'pink' | 'blue' | 'orange'][] = [
    [8, 4, 'pink'], [9, 4, 'blue'], [14, 9, 'orange'], [15, 9, 'pink'], [15, 10, 'blue'], [26, 6, 'orange'], [27, 6, 'pink'], [27, 7, 'blue'],
    [10, 17, 'blue'], [11, 17, 'orange'], [18, 14, 'pink'], [30, 11, 'orange'], [31, 11, 'pink'], [31, 12, 'blue'], [6, 20, 'pink'], [7, 20, 'orange'],
    [32, 4, 'blue'], [33, 4, 'pink'], [32, 5, 'orange'], [33, 5, 'blue'], [32, 6, 'pink'], [33, 6, 'orange'], [31, 4, 'pink'], [31, 5, 'blue'], [31, 6, 'orange'], [32, 7, 'orange'], [33, 7, 'pink'], [31, 7, 'blue'],
    [22, 4, 'blue'], [4, 14, 'orange']
  ];
  for (const [x, y, c] of corals) g.set(x, y, `coral_${c}` as TileName);
  const props: PropDef[] = [
    ...[[5, 8], [12, 21], [24, 11], [30, 22], [17, 5], [3, 17], [21, 17], [29, 8], [9, 14], [16, 22], [25, 4], [33, 15], [3, 22], [13, 11], [19, 9]].map(([x, y]): PropDef => ({ key: 'seaweed', anim: 'seaweed_sway', x, y })),
    { key: 'shell_socket', frame: 0, x: 28, y: 20, flagFrame: { flag: 'PEARL_PLACED', frame: 1 } },
    { key: 'items', frame: ITEM.bubble, x: 14, y: 14 }, { key: 'items', frame: ITEM.bubble, x: 25, y: 16 }, { key: 'items', frame: ITEM.bubble, x: 8, y: 10 }, { key: 'items', frame: ITEM.bubble, x: 19, y: 5 }, { key: 'items', frame: ITEM.shell, x: 16, y: 13 }, { key: 'items', frame: ITEM.shell, x: 26, y: 22 }, { key: 'items', frame: ITEM.shell, x: 4, y: 19 },
  ];
  const objects: ObjDef[] = [
    { id: 'marina', kind: 'npc', x: 6, y: 12, sprite: npc('marina'), blocks: true, radius: 1.8 },
    { id: 'coralie', kind: 'npc', x: 23, y: 17, sprite: npc('coralie'), blocks: true, radius: 1.8, showWhen: 'MARINA_HELPED' },
    { id: 'starfish_1', kind: 'puzzle', hideWhen: 'MARINA_HELPED', x: 12, y: 19, sprite: item('starfish'), radius: 1.6 },
    { id: 'starfish_2', kind: 'puzzle', hideWhen: 'MARINA_HELPED', x: 22, y: 7, sprite: item('starfish'), radius: 1.6 },
    { id: 'starfish_3', kind: 'puzzle', hideWhen: 'MARINA_HELPED', x: 29, y: 15, sprite: item('starfish'), radius: 1.6 },
    { id: 'shell_puzzle', kind: 'puzzle', x: 11, y: 6, sprite: { key: 'items', frame: ITEM.shell, scale: 2 }, radius: 2 },
    { id: 'pearl', kind: 'ability', hideWhen: 'PEARL_PLACED', x: 20, y: 20, sprite: item('pearl'), radius: 1.8 },
    { id: 'star_pedestal', kind: 'collect', x: 28, y: 17, sprite: { key: 'pedestal', frame: 0 }, blocks: true, radius: 1.8 },
    { id: 'chest_grotto', kind: 'chest', x: 32, y: 8, sprite: item('chest'), radius: 1.6, reward: 'sticker_pearl' },
    { id: 'surface', kind: 'warp', x: 3, y: 4, tiles: [tile(3, 4)], to: { scene: 'shore', spawn: 'from_grotto' }, sprite: { key: 'whirlpool', anim: 'whirlpool_spin' }, forms: ['mermaid'], radius: 1.5 },
  ];
  return {
    id: 'grotto', w: 36, h: 26, medium: 'water', mermaidAllowed: true, bg: '#1d4fb0', ground: g.cells, props, objects, gates: [],
    spawns: { from_shore: tile(4, 7) }, music: 'seas'
  };
}

// ---------------------------------------------------------------- 5. Princess's Bedroom (24x18)
function bedroom(): MapDef {
  const g = new Grid(24, 18, 'wood_floor0');
  for (let y = 4; y < 17; y++) for (let x = 1; x < 23; x++) g.set(x, y, (x + y) % 2 === 0 ? 'wood_floor0' : 'wood_floor1');
  g.rect(0, 0, 24, 1, 'wall_top_int');
  g.rect(0, 1, 24, 2, 'wall_paper');
  g.rect(0, 3, 24, 1, 'baseboard');
  g.rect(0, 4, 1, 14, 'wall_paper'); g.rect(23, 4, 1, 14, 'wall_paper');
  g.rect(0, 17, 24, 1, 'wall_paper');
  g.rect(11, 17, 2, 1, 'wood_floor1');
  const props: PropDef[] = [
    { key: 'window_night', x: 6, y: 2, ox: 8, depthBias: -2 }, { key: 'window_night', x: 15, y: 2, ox: 8, depthBias: -2 },
    { key: 'bed', x: 4, y: 7, blocks: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0]] },
    { key: 'door_small', x: 11, y: 17, ox: 8, depthBias: -2 },
    { key: 'crown_hud', x: 11, y: 2, ox: 8, depthBias: -2 },
    { key: 'items', frame: ITEM.star, x: 11, y: 1, ox: 8, showWhen: 'STAR_1_FOUND', depthBias: -2 },
  ];
  const objects: ObjDef[] = [
    { id: 'nana', kind: 'npc', x: 10, y: 9, sprite: npc('nana'), blocks: true, radius: 1.8 },
    { id: 'slot_table', kind: 'slot', x: 17, y: 8, radius: 3.5 },
    { id: 'slot_shelf', kind: 'slot', x: 20, y: 11, radius: 3.5 },
    { id: 'slot_floor', kind: 'slot', x: 12, y: 13, radius: 3.5 },
    { id: 'slot_ceiling', kind: 'slot', x: 14, y: 5, radius: 3.5 },
    { id: 'door_exit', kind: 'warp', x: 11, y: 17, tiles: [tile(11, 17), tile(12, 17)], to: { scene: 'courtyard', spawn: 'from_bedroom' }, radius: 1.5 },
  ];
  return {
    id: 'bedroom', w: 24, h: 18, medium: 'air', mermaidAllowed: false, bg: '#5a3d8a', ground: g.cells, props, objects, gates: [],
    spawns: { from_courtyard: tile(11, 15) }, music: 'sunlit'
  };
}

let cache: Record<SceneId, MapDef> | null = null;
export function getMaps(): Record<SceneId, MapDef> {
  if (!cache) cache = { courtyard: courtyard(), woods: woods(), shore: shore(), grotto: grotto(), bedroom: bedroom() };
  return cache;
}
export const getMap = (id: SceneId) => getMaps()[id];

export { TILE };
