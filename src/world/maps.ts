import type { SceneId } from '../types/game';
import { ITEM, TILE, type TileName } from '../content/frameIndex';
import type { Gate, MapDef, ObjDef, PropDef } from './types';
import { Grid, col, isGrass, isSand, item, npc, tile, trees } from './mapKit';
import { enchanted, garden, river } from './kingdomMaps';

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
  g.rect(0, 11, 2, 3, 'path0'); // v0.4b: west path to the Festival Garden
  g.rect(38, 11, 2, 3, 'path0'); // v0.4c: east path to the Royal Magic Garden
  g.set(31, 5, 'cobble0'); // v0.4b: the Queen's conservatory door
  g.rect(36, 11, 4, 6, 'path0'); // east exit path: the Whispering Woods only (v0.4d)
  g.scatter(36, 11, 4, 6, ['path1'], 0.4, 17, () => true);
  for (const x of [18, 19, 20]) g.set(x, 5, 'cobble0'); // v0.4d: the great castle gate is a real door to the Throne Room
  g.set(25, 5, 'cobble0'); // v0.4d: the Royal Garden archway
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
    { key: 'door_small', x: 31, y: 5, depthBias: -1 },
    { key: 'px_arch', x: 25, y: 5, ox: 0, depthBias: -1 },
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
    { id: 'butterfly_spot', kind: 'find', hideWhen: 'BUTTERFLY_FOUND', x: 3, y: 27, sprite: { key: 'items', anim: 'sparkle' }, radius: 1.6 },
    { id: 'wand_pedestal', kind: 'ability', x: 6, y: 12, sprite: { key: 'pedestal', frame: 0 }, blocks: true, radius: 1.8 },
    { id: 'door_bedroom', kind: 'warp', x: 8, y: 5, tiles: [tile(8, 5)], to: { scene: 'bedroom', spawn: 'from_courtyard' }, radius: 1.5 },
    { id: 'warp_woods', kind: 'warp', x: 39, y: 13, tiles: col(39, 11, 16), to: { scene: 'woods', spawn: 'from_courtyard' }, sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'warp_garden', kind: 'warp', x: 25, y: 5, tiles: [tile(25, 5)], to: { scene: 'garden', spawn: 'from_courtyard' }, radius: 1.5 },
    { id: 'gate_throne', kind: 'warp', x: 19, y: 5, tiles: [tile(18, 5), tile(19, 5), tile(20, 5)], to: { scene: 'throne', spawn: 'from_courtyard' }, radius: 1.5 },
    { id: 'warp_festival', kind: 'warp', x: 0, y: 12, tiles: col(0, 11, 13), to: { scene: 'festival', spawn: 'from_courtyard' }, sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'door_conservatory', kind: 'warp', x: 31, y: 5, tiles: [tile(31, 5)], to: { scene: 'conservatory', spawn: 'from_courtyard' }, radius: 1.5 },
  ];
  return {
    id: 'courtyard', w: 40, h: 30, medium: 'air', mermaidAllowed: false, bg: '#8fd3ff', ground: g.cells, props, objects, gates: [],
    spawns: { start: tile(12, 10), from_woods: tile(37, 15), from_bedroom: tile(8, 7), from_festival: tile(3, 12), from_conservatory: tile(31, 7), from_garden: tile(25, 7), from_throne: tile(19, 7) }, music: 'sunlit'
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
  // v0.4b: the north trail to Unicorn Meadow (cuts through the north tree wall)
  g.mix(13, 0, 3, 14, ['path0', 'path1'], 35);
  // v0.4c: the south trail to the Enchanted Woods (cuts through the south tree wall)
  g.mix(30, 24, 3, 6, ['path0', 'path1'], 36);
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
    { id: 'warp_meadow', kind: 'warp', x: 14, y: 0, tiles: [13, 14, 15].map((x) => tile(x, 0)), to: { scene: 'meadow', spawn: 'from_woods' }, showWhen: 'WILLA_MET', sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'warp_enchanted', kind: 'warp', x: 31, y: 29, tiles: [30, 31, 32].map((x) => tile(x, 29)), to: { scene: 'enchanted', spawn: 'from_woods' }, showWhen: 'WILLA_MET', sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'fairy_dust_spot', kind: 'find', hideWhen: 'FAIRY_DUST_FOUND', x: 3, y: 4, sprite: { key: 'items', anim: 'sparkle' }, radius: 1.6 },
  ];
  const gates: Gate[] = [
    { id: 'tree_gate', flag: 'TREE_GATE_OPEN', tiles: [22, 23, 24].flatMap((x) => col(x, 14, 16)) },
    { id: 'rainbow_bridge', flag: 'RAINBOW_BRIDGE_OPEN', tiles: [41, 42, 43].flatMap((x) => col(x, 14, 16)), closedTile: 'bridge_ghost', openTile: 'bridge_rainbow0' },
  ];
  return {
    id: 'woods', w: 48, h: 30, medium: 'air', mermaidAllowed: false, bg: '#2f7a4a', ground: g.cells, props, objects, gates,
    spawns: { from_courtyard: tile(2, 15), from_shore: tile(45, 15), from_meadow: tile(14, 3), from_enchanted: tile(31, 26) }, music: 'wilds'
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
    { id: 'river_mouth', kind: 'warp', x: 36, y: 13, tiles: [tile(36, 13)], to: { scene: 'river', spawn: 'from_shore' }, sprite: { key: 'whirlpool', anim: 'whirlpool_spin' }, forms: ['mermaid'], radius: 1.5, showWhen: 'MARINA_HELPED' },
    { id: 'chest_shore', kind: 'chest', x: 6, y: 4, sprite: item('chest'), radius: 1.6, reward: 'sticker_shell' },
    { id: 'warp_woods', kind: 'warp', x: 0, y: 13, tiles: col(0, 12, 14), to: { scene: 'woods', spawn: 'from_shore' }, sprite: { key: 'items', anim: 'sparkle' } },
    { id: 'moonstone_spot', kind: 'find', hideWhen: 'MOONSTONE_FOUND', x: 30, y: 2, sprite: { key: 'items', anim: 'sparkle' }, radius: 1.6 },
  ];
  return {
    id: 'shore', w: 40, h: 26, medium: 'air', mermaidAllowed: true, bg: '#3aa0e8', ground: g.cells, props, objects, gates: [],
    spawns: { from_woods: tile(2, 13), from_grotto: tile(27, 13), from_river: tile(35, 13) }, music: 'seas'
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
    { id: 'pearl', kind: 'ability', x: 20, y: 20, sprite: item('pearl'), radius: 1.8 },
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
    { key: 'door_small', x: 11, y: 17, ox: 8, depthBias: -2 },
    { key: 'crown_hud', x: 11, y: 2, ox: 8, depthBias: -2 },
    { key: 'shelf', x: 20, y: 2, ox: 8, depthBias: -1 },
    { key: 'items', frame: ITEM.star, x: 11, y: 1, ox: 8, showWhen: 'STAR_1_FOUND', depthBias: -2 },
    // v0.3: the two customization stations. Tall ornate armoire on the west wall, lit vanity on the east wall.
    // v0.4a.1: both stations are fixed in the back corners (wardrobe back-left, vanity back-right) with open floor in front
    { key: 'wardrobe_prop', anim: 'wardrobe_glow', x: 2, y: 5, ox: 8, blocks: [[-1, -1], [0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0], [2, 0]] },
    { key: 'vanity_prop', anim: 'vanity_glow', x: 20, y: 5, ox: 8, blocks: [[-1, -1], [0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0], [2, 0]] },
    // v0.4a: the paintbrush easel opens the room designer (wallpaper + floor)
    { key: 'paint_prop', anim: 'paint_glow', x: 6, y: 15, blocks: [[0, 0]] },
  ];
  const objects: ObjDef[] = [
    { id: 'nana', kind: 'npc', x: 10, y: 9, sprite: npc('nana'), blocks: true, radius: 1.8 },
    // stations sit mid-furniture (so taps anywhere on the tall prop find them); the player walks up to the free floor in front
    { id: 'wardrobe_station', kind: 'station', x: 2, y: 6, radius: 2.2 },
    { id: 'vanity_station', kind: 'station', x: 21, y: 6, radius: 2.2 },
    { id: 'paint_station', kind: 'station', x: 6, y: 16, radius: 2.2 },
    { id: 'door_exit', kind: 'warp', x: 11, y: 17, tiles: [tile(11, 17), tile(12, 17)], to: { scene: 'courtyard', spawn: 'from_bedroom' }, radius: 1.5 },
  ];
  return {
    id: 'bedroom', w: 24, h: 18, medium: 'air', mermaidAllowed: false, bg: '#5a3d8a', ground: g.cells, props, objects, gates: [],
    spawns: { from_courtyard: tile(11, 15) }, music: 'sunlit'
  };
}

// ---------------------------------------------------------------- 6. Starlight Festival Garden (30x20): the King's fireworks
function festival(): MapDef {
  const g = new Grid(30, 20, 'grass0');
  g.mix(0, 0, 30, 20, ['grass0', 'grass1', 'grass2', 'grass3'], 61);
  g.scatter(0, 4, 30, 14, ['grass_flower0', 'grass_flower1'], 0.08, 62, isGrass);
  g.mix(0, 0, 30, 4, ['tree_wall0', 'tree_wall1'], 63);
  g.mix(0, 17, 30, 3, ['tree_wall0', 'tree_wall1'], 64);
  g.mix(0, 4, 2, 13, ['tree_wall0', 'tree_wall1'], 65);
  g.mix(28, 4, 2, 13, ['tree_wall0', 'tree_wall1'], 66);
  g.mix(5, 6, 20, 10, ['cobble0', 'cobble1'], 67);       // the festival plaza
  g.mix(24, 9, 6, 3, ['path0', 'path1'], 68);            // the path back to the courtyard
  const props: PropDef[] = [
    { key: 'fw_castle', x: 15, y: 4, ox: 0, depthBias: -3 },
    { key: 'fw_dais', x: 14, y: 12, blocks: [[-1, 0], [0, 0], [1, 0]] },
    ...trees([[3, 7, 'a'], [3, 14, 'b'], [26, 6, 'b'], [26, 15, 'a'], [8, 5, 'b'], [21, 5, 'a']]),
    { key: 'bush', x: 6, y: 16 }, { key: 'bush', x: 23, y: 16 }, { key: 'bush', x: 4, y: 10 }
  ];
  const objects: ObjDef[] = [
    { id: 'king', kind: 'npc', x: 14, y: 9, sprite: npc('king'), blocks: true, radius: 1.9 },
    { id: 'dais', kind: 'station', x: 14, y: 13, radius: 1.9 },
    { id: 'warp_courtyard', kind: 'warp', x: 29, y: 10, tiles: col(29, 9, 11), to: { scene: 'courtyard', spawn: 'from_festival' }, sprite: { key: 'items', anim: 'sparkle' } },
  ];
  return { id: 'festival', w: 30, h: 20, medium: 'air', mermaidAllowed: false, bg: '#1b1550', ground: g.cells, props, objects, gates: [], spawns: { from_courtyard: tile(26, 10) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- 7. The Queen's Conservatory (18x13): wand workshop
function conservatory(): MapDef {
  const g = new Grid(18, 13, 'floor_cream_tile0');
  for (let y = 4; y < 12; y++) for (let x = 1; x < 17; x++) g.set(x, y, (x + y) % 2 === 0 ? 'floor_cream_tile0' : 'floor_cream_tile1');
  g.rect(0, 0, 18, 1, 'wall_top_int'); g.rect(0, 1, 18, 2, 'wall_lavender'); g.rect(0, 3, 18, 1, 'base_lavender');
  g.rect(0, 4, 1, 9, 'wall_lavender'); g.rect(17, 4, 1, 9, 'wall_lavender'); g.rect(0, 12, 18, 1, 'wall_lavender');
  g.rect(8, 12, 2, 1, 'floor_cream_tile1');
  const props: PropDef[] = [
    { key: 'window_night', x: 4, y: 2, ox: 8, depthBias: -2 }, { key: 'window_night', x: 13, y: 2, ox: 8, depthBias: -2 },
    { key: 'door_small', x: 8, y: 12, ox: 8, depthBias: -2 },
    { key: 'wand_bench', x: 10, y: 6, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'leafy_plant', x: 2, y: 5, blocks: [[0, 0]] }, { key: 'sunflower_pot', x: 15, y: 5, blocks: [[0, 0]] },
    { key: 'round_table', x: 3, y: 9, blocks: [[0, 0]] }, { key: 'tulip_pot', x: 3, y: 9 },
    { key: 'bookshelf', x: 14, y: 9, ox: 8, blocks: [[0, 0], [1, 0]] }
  ];
  const objects: ObjDef[] = [
    { id: 'queen', kind: 'npc', x: 7, y: 6, sprite: npc('queen'), blocks: true, radius: 1.9 },
    { id: 'wand_station', kind: 'station', x: 10, y: 7, radius: 2.0 },
    { id: 'door_exit', kind: 'warp', x: 8, y: 12, tiles: [tile(8, 12), tile(9, 12)], to: { scene: 'courtyard', spawn: 'from_conservatory' }, radius: 1.5 },
  ];
  return { id: 'conservatory', w: 18, h: 13, medium: 'air', mermaidAllowed: false, bg: '#5a3d8a', ground: g.cells, props, objects, gates: [], spawns: { from_courtyard: tile(8, 10) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- 8. Unicorn Meadow (36x26): tag with Dapple
function meadow(): MapDef {
  const g = new Grid(36, 26, 'grass0');
  g.mix(0, 0, 36, 26, ['grass0', 'grass1', 'grass2', 'grass3'], 71);
  g.scatter(0, 3, 36, 20, ['grass_flower0', 'grass_flower1'], 0.16, 72, isGrass);
  g.mix(0, 0, 36, 3, ['tree_wall0', 'tree_wall1'], 73);
  g.mix(0, 23, 36, 3, ['tree_wall0', 'tree_wall1'], 74);
  g.mix(0, 3, 2, 20, ['tree_wall0', 'tree_wall1'], 75);
  g.mix(34, 3, 2, 20, ['tree_wall0', 'tree_wall1'], 76);
  g.mix(16, 23, 4, 3, ['path0', 'path1'], 77);           // the trail back to the woods
  g.mix(17, 19, 2, 4, ['path0', 'path1'], 78);
  // the rainbow brook: a gentle stream across the meadow with a wide rainbow bridge
  g.rect(2, 11, 32, 1, 'stream0'); g.rect(2, 12, 32, 1, 'stream1');
  g.rect(16, 11, 4, 2, 'bridge_rainbow0');
  for (const [x, y, c] of [[6, 7, 'pink'], [7, 7, 'yellow'], [26, 6, 'blue'], [27, 6, 'red'], [10, 18, 'yellow'], [11, 18, 'pink'], [25, 17, 'blue'], [26, 17, 'pink'], [20, 5, 'red'], [14, 20, 'blue']] as const)
    g.set(x, y, `flower_${c}` as TileName);
  const props: PropDef[] = [
    ...trees([[4, 5, 'a'], [30, 5, 'b'], [4, 20, 'b'], [31, 20, 'a'], [9, 4, 'b'], [24, 4, 'a'], [13, 15, 'a'], [28, 14, 'b'], [8, 14, 'b']]),
    { key: 'bush', x: 20, y: 8 }, { key: 'bush', x: 15, y: 17 }, { key: 'bush', x: 29, y: 19 },
    { key: 'items', frame: ITEM.mushroom, x: 12, y: 8 }, { key: 'items', frame: ITEM.mushroom, x: 22, y: 16 }
  ];
  const objects: ObjDef[] = [
    { id: 'dapple', kind: 'npc', x: 18, y: 15, sprite: { key: 'dapple', anim: 'dapple_idle_down' }, radius: 2.4 },
    { id: 'warp_woods', kind: 'warp', x: 17, y: 25, tiles: [16, 17, 18, 19].map((x) => tile(x, 25)), to: { scene: 'woods', spawn: 'from_meadow' }, sprite: { key: 'items', anim: 'sparkle' } },
  ];
  return { id: 'meadow', w: 36, h: 26, medium: 'air', mermaidAllowed: false, bg: '#4fae5a', ground: g.cells, props, objects, gates: [], spawns: { from_woods: tile(17, 21) }, music: 'wilds' };
}


// ---------------------------------------------------------------- 12. Throne Room (26x18) — v0.4d
function throne(): MapDef {
  const W = 26, H = 18;
  const g = new Grid(W, H, 'floor_cream_tile0');
  for (let y = 4; y < H - 1; y++) for (let x = 1; x < W - 1; x++) g.set(x, y, (x + y) % 2 === 0 ? 'floor_cream_tile0' : 'floor_cream_tile1');
  g.rect(0, 0, W, 1, 'wall_top_int'); g.rect(0, 1, W, 2, 'wall_lavender'); g.rect(0, 3, W, 1, 'base_lavender');
  g.rect(0, 4, 1, H - 4, 'wall_lavender'); g.rect(W - 1, 4, 1, H - 4, 'wall_lavender'); g.rect(0, H - 1, W, 1, 'wall_lavender');
  g.rect(12, H - 1, 2, 1, 'floor_cream_tile1'); // the great doors
  const carpet = (y: number, bias: number): PropDef[] => [
    { key: 'px_carpet', frame: 0, x: 12, y, depthBias: bias - (y + 1) * 16 }, { key: 'px_carpet', frame: 1, x: 13, y, depthBias: bias - (y + 1) * 16 }
  ];
  const props: PropDef[] = [
    ...Array.from({ length: H - 5 }, (_, i) => carpet(7 + i, 2)).flat().filter((p) => p.y <= H - 2),
    ...[3, 7, 18, 22].map((x): PropDef => ({ key: 'px_stained', x, y: 2, depthBias: -2 })),
    ...[10, 15].map((x): PropDef => ({ key: 'px_banner', x, y: 2, depthBias: -2 })),
    ...[[4, 6], [4, 11], [21, 6], [21, 11]].map(([x, y]): PropDef => ({ key: 'px_pillar', x, y, blocks: [[0, 0]] })),
    { key: 'px_throne', x: 10, y: 6, depthBias: -6, blocks: [[0, 0]] }, { key: 'px_throne', x: 15, y: 6, depthBias: -6, blocks: [[0, 0]] },
    ...[6, 19].map((x): PropDef => ({ key: 'px_sconce', x, y: 3, depthBias: -2 })),
    { key: 'door_small', x: 12, y: H - 1, ox: 8, depthBias: -2 }
  ];
  const objects: ObjDef[] = [
    { id: 'throne_king', kind: 'npc', x: 10, y: 6, sprite: npc('king'), blocks: true, radius: 2.0 },
    { id: 'throne_queen', kind: 'npc', x: 15, y: 6, sprite: npc('queen'), blocks: true, radius: 2.0 },
    { id: 'door_exit', kind: 'warp', x: 12, y: H - 1, tiles: [tile(12, H - 1), tile(13, H - 1)], to: { scene: 'courtyard', spawn: 'from_throne' }, radius: 1.5 }
  ];
  return { id: 'throne', w: W, h: H, medium: 'air', mermaidAllowed: false, bg: '#5a3d8a', ground: g.cells, props, objects, gates: [], spawns: { from_courtyard: tile(12, H - 3) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- 13. Royal Greenhouse (20x14) — v0.4d (its own room; no longer the Queen's workshop)
function greenhouse(): MapDef {
  const W = 20, H = 14;
  const g = new Grid(W, H, 'floor_cream_tile0');
  for (let y = 4; y < H - 1; y++) for (let x = 1; x < W - 1; x++) g.set(x, y, (x + y) % 2 === 0 ? 'path0' : 'path1');
  g.rect(0, 0, W, 1, 'wall_top_int'); g.rect(0, 1, W, 2, 'wall_lavender'); g.rect(0, 3, W, 1, 'base_lavender');
  g.rect(0, 4, 1, H - 4, 'wall_lavender'); g.rect(W - 1, 4, 1, H - 4, 'wall_lavender'); g.rect(0, H - 1, W, 1, 'wall_lavender');
  g.rect(9, H - 1, 2, 1, 'path0');
  const props: PropDef[] = [
    ...[3, 8, 12, 16].map((x): PropDef => ({ key: 'px_stained', x, y: 2, depthBias: -2 })),
    ...[[2, 5], [17, 5], [2, 10], [17, 10], [6, 8], [13, 8]].map(([x, y], i): PropDef => ({ key: ['leafy_plant', 'sunflower_pot', 'tulip_pot'][i % 3], x, y, blocks: [[0, 0]] })),
    { key: 'px_bench', x: 9, y: 5, ox: 0, blocks: [[0, 0], [1, 0]] },
    { key: 'door_small', x: 9, y: H - 1, ox: 8, depthBias: -2 }
  ];
  const objects: ObjDef[] = [
    { id: 'door_exit', kind: 'warp', x: 9, y: H - 1, tiles: [tile(9, H - 1), tile(10, H - 1)], to: { scene: 'garden', spawn: 'from_greenhouse' }, radius: 1.5 }
  ];
  return { id: 'greenhouse', w: W, h: H, medium: 'air', mermaidAllowed: false, bg: '#3b8f4f', ground: g.cells, props, objects, gates: [], spawns: { from_garden: tile(9, H - 3) }, music: 'sunlit' };
}

let cache: Record<SceneId, MapDef> | null = null;
export function getMaps(): Record<SceneId, MapDef> {
  if (!cache) cache = { courtyard: courtyard(), woods: woods(), shore: shore(), grotto: grotto(), bedroom: bedroom(), festival: festival(), conservatory: conservatory(), meadow: meadow(), enchanted: enchanted(), garden: garden(), river: river(), throne: throne(), greenhouse: greenhouse() };
  return cache;
}
export const getMap = (id: SceneId) => getMaps()[id];

export { TILE };
