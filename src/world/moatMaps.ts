// v0.4d.6: the Castle Moat (surface) and the underwater realm beneath it: the Moat Depths (a sunken part of the castle)
// and the Coral Gardens. Ground uses the existing tileset; the pictures come from src/art/kingdomArt.ts.
import type { TileName } from '../content/frameIndex';
import type { Gate, MapDef, ObjDef, PropDef, Tile } from './types';
import type { EnvDef } from './envMagic';
import { Grid, col, npc, tile, trees } from './mapKit';

const SAND: TileName[] = ['uw_sand0', 'uw_sand1', 'uw_sand0'];
const ROCK: TileName[] = ['uw_rock0', 'uw_rock1'];
const sparkle = { key: 'items', anim: 'sparkle' };
const whirl = { key: 'whirlpool', anim: 'whirlpool_spin' };
const weed = (pts: [number, number][]): PropDef[] => pts.map(([x, y]) => ({ key: 'seaweed', anim: 'seaweed_sway', x, y }));
const fish = (pts: [number, number][]): PropDef[] => pts.map(([x, y]) => ({ key: 'px_fish_orange', x, y }));
/** The four sides of a rectangle outline, as a list of tiles. */
export function outline(x0: number, y0: number, x1: number, y1: number): Tile[] {
  const out: Tile[] = [];
  for (let x = x0; x <= x1; x++) { out.push(tile(x, y0), tile(x, y1)); }
  for (let y = y0 + 1; y < y1; y++) { out.push(tile(x0, y), tile(x1, y)); }
  return out;
}

// ---------------------------------------------------------------- Castle Moat (40x26, surface)
export function moat(): MapDef {
  const W = 40, H = 26, g = new Grid(W, H, 'grass0');
  g.mix(0, 0, W, H, ['grass0', 'grass1', 'grass2', 'grass3'], 71);
  g.scatter(0, 14, W, 10, ['grass_flower0', 'grass_flower1'], 0.08, 72, (t) => t.startsWith('grass'));
  // the castle's front wall and its stone terrace on the far bank
  g.rect(0, 0, W, 4, 'wall_brick'); g.rect(0, 0, W, 1, 'wall_crenel');
  for (const x of [6, 12, 26, 32]) g.set(x, 2, 'wall_window');
  g.mix(0, 4, W, 2, ['cobble0', 'cobble1'], 73);
  // the moat itself: shallow edges, deeper middle, a stone island with a stone bridge
  g.rect(2, 6, 36, 8, 'water0');
  g.rect(2, 6, 36, 1, 'water_edge0'); g.rect(2, 13, 36, 1, 'water_edge0');
  g.rect(24, 8, 10, 4, 'deep_water'); g.rect(5, 8, 6, 4, 'deep_water');
  g.mix(15, 8, 10, 4, ['cobble0', 'cobble1'], 74);
  g.rect(19, 12, 2, 2, 'bridge_plank'); // the bridge to the island
  g.rect(8, 12, 2, 2, 'bridge_plank'); // a little pier
  // the banks
  g.mix(0, 4, 2, 22, ['tree_wall0', 'tree_wall1'], 75); g.mix(38, 4, 2, 22, ['tree_wall0', 'tree_wall1'], 76); g.mix(0, 24, W, 2, ['tree_wall0', 'tree_wall1'], 77);
  g.mix(19, 14, 2, 6, ['path0', 'path1'], 78); g.mix(16, 19, 8, 3, ['cobble0', 'cobble1'], 79);
  g.rect(0, 19, 2, 3, 'path0'); g.mix(2, 19, 6, 3, ['path0', 'path1'], 80); // the way back to the courtyard
  const props: PropDef[] = [
    { key: 'px_moat_tower', x: 4, y: 3, ox: 8, depthBias: -1 }, { key: 'px_moat_tower', x: 35, y: 3, ox: 8, depthBias: -1 },
    { key: 'castle_gate', x: 19, y: 5, depthBias: -1 },
    { key: 'px_moat_flagpost', x: 14, y: 5 }, { key: 'px_moat_flagpost', x: 25, y: 5 },
    ...[[6, 7], [12, 9], [27, 7], [31, 12], [36, 9], [22, 7], [10, 11], [33, 7], [16, 13]].map(([x, y]): PropDef => ({ key: 'px_lily', x, y })),
    ...[[4, 14], [12, 14], [27, 14], [35, 14], [3, 6]].map(([x, y]): PropDef => ({ key: 'px_reed', x, y })),
    ...trees([[4, 17, 'a'], [35, 17, 'b'], [6, 23, 'b'], [33, 23, 'a'], [11, 21, 'a'], [28, 22, 'b']]),
    { key: 'px_bench', x: 28, y: 19, ox: 0, blocks: [[0, 0], [1, 0]] }, { key: 'px_lamp', x: 17, y: 16 }, { key: 'px_lamp', x: 23, y: 16 },
    { key: 'bush', x: 12, y: 18 }, { key: 'bush', x: 31, y: 16 },
  ];
  const objects: ObjDef[] = [
    { id: 'coralie_m', kind: 'npc', x: 21, y: 9, sprite: npc('coralie'), blocks: true, radius: 1.8 },
    { id: 'duck_1', kind: 'npc', x: 12, y: 8, sprite: { key: 'px_duck' }, radius: 1.5 },
    { id: 'duck_2', kind: 'npc', x: 30, y: 7, sprite: { key: 'px_duck' }, radius: 1.5 },
    { id: 'duck_3', kind: 'npc', x: 16, y: 16, sprite: { key: 'px_duck' }, radius: 1.5 },
    { id: 'moat_dive', kind: 'warp', x: 29, y: 9, tiles: [tile(29, 9)], to: { scene: 'moat_depths', spawn: 'from_moat' }, sprite: whirl, forms: ['mermaid'], radius: 1.5 },
    { id: 'moat_dive_w', kind: 'warp', x: 7, y: 9, tiles: [tile(7, 9)], to: { scene: 'moat_depths', spawn: 'from_moat' }, sprite: whirl, forms: ['mermaid'], radius: 1.5 },
    { id: 'warp_courtyard', kind: 'warp', x: 0, y: 20, tiles: col(0, 19, 21), to: { scene: 'courtyard', spawn: 'from_moat' }, sprite: sparkle }
  ];
  return {
    id: 'moat', w: W, h: H, medium: 'air', mermaidAllowed: true, bg: '#6fc0f0', ground: g.cells, props, objects, gates: [],
    spawns: { from_courtyard: tile(3, 20), from_depths: tile(27, 10) }, music: 'seas'
  };
}

// ---------------------------------------------------------------- Moat Depths (40x26, underwater)
export function moatDepths(): MapDef {
  const W = 40, H = 26, g = new Grid(W, H, 'uw_sand0');
  g.mix(0, 0, W, H, SAND, 81);
  g.mix(0, 0, W, 2, ROCK, 82); g.mix(0, 24, W, 2, ROCK, 83); g.mix(0, 2, 2, 22, ROCK, 84); g.mix(38, 2, 2, 22, ROCK, 85);
  // the sunken part of the castle: a ruined hall with a doorway to the south and one to the east
  g.rect(9, 5, 13, 1, 'wall_brick'); g.rect(9, 15, 13, 1, 'wall_brick'); g.rect(9, 5, 1, 11, 'wall_brick'); g.rect(21, 5, 1, 11, 'wall_brick');
  g.mix(10, 6, 11, 9, ['cobble0', 'cobble1'], 86);
  g.rect(14, 15, 3, 1, 'cobble0'); g.rect(21, 9, 1, 3, 'cobble1');
  g.rect(22, 10, 16, 1, 'glow_lane'); // the glowing path to the Coral Gardens
  g.rect(38, 9, 2, 3, 'uw_sand0');
  // the secret room: a ring of coral with a gate in the south wall
  const ring = outline(26, 3, 33, 8);
  for (const t of ring) g.set(t.x, t.y, 'coral_pink');
  g.rect(27, 4, 6, 4, 'uw_sand0');
  const props: PropDef[] = [
    ...[[11, 7], [19, 7], [11, 13], [19, 13]].map(([x, y]): PropDef => ({ key: 'px_sunk_column', x, y, blocks: [[0, 0]] })),
    { key: 'px_sunk_arch', x: 15, y: 15, ox: 0, depthBias: 2 }, { key: 'px_sunk_arch', x: 21, y: 10, ox: 0, depthBias: 2 },
    { key: 'px_anchor', x: 6, y: 18 }, { key: 'px_anchor', x: 32, y: 20 },
    ...weed([[4, 9], [5, 13], [7, 20], [24, 14], [26, 18], [30, 14], [35, 6], [36, 16], [12, 20], [17, 20], [3, 15], [24, 4], [8, 3]]),
    ...fish([[7, 11], [24, 7], [33, 13], [26, 21], [13, 3], [5, 21]]),
    { key: 'px_fan_pink', x: 28, y: 4 }, { key: 'px_fan_blue', x: 32, y: 6 }, { key: 'px_fan_pink', x: 30, y: 7 },
    { key: 'px_fan_blue', x: 8, y: 22 }, { key: 'px_fan_pink', x: 27, y: 22 },
    { key: 'items', frame: 7, x: 6, y: 14 }, { key: 'items', frame: 7, x: 34, y: 18 }, { key: 'items', frame: 18, x: 8, y: 6 }, { key: 'items', frame: 18, x: 23, y: 17 }
  ];
  const env: EnvDef[] = [
    { id: 'depths_kelp', type: 'vine', x: 28, y: 9, reveals: 'MOAT_SECRET' },
    { id: 'dshell_1', type: 'shell', x: 5, y: 16, note: 1 }, { id: 'dshell_2', type: 'shell', x: 35, y: 15, note: 4 }, { id: 'dshell_3', type: 'shell', x: 15, y: 20, note: 2 },
    { id: 'tr_moat', type: 'treasure', x: 29, y: 5 }
  ];
  const objects: ObjDef[] = [
    { id: 'pebble', kind: 'npc', x: 15, y: 10, sprite: { key: 'px_crab' }, blocks: true, radius: 1.9 },
    { id: 'treasure_moat', kind: 'find', hideWhen: 'MOAT_TREASURE', x: 29, y: 5, sprite: sparkle, radius: 1.6 },
    { id: 'surface', kind: 'warp', x: 4, y: 4, tiles: [tile(4, 4)], to: { scene: 'moat', spawn: 'from_depths' }, sprite: whirl, forms: ['mermaid'], radius: 1.5 },
    { id: 'warp_coral', kind: 'warp', x: 39, y: 10, tiles: col(39, 9, 11), to: { scene: 'coral_garden', spawn: 'from_depths' }, sprite: sparkle }
  ];
  const gates: Gate[] = [{ id: 'moat_secret', flag: 'MOAT_SECRET', tiles: [tile(29, 8), tile(30, 8)], closedTile: 'coral_pink', openTile: 'uw_sand0' }];
  // the gate tiles are part of the ring until the kelp is moved aside
  g.set(29, 8, 'coral_pink'); g.set(30, 8, 'coral_pink');
  return { id: 'moat_depths', w: W, h: H, medium: 'water', mermaidAllowed: true, bg: '#1a3f9a', ground: g.cells, props, objects, gates, env, spawns: { from_moat: tile(5, 7), from_coral: tile(36, 10) }, music: 'seas' };
}

// ---------------------------------------------------------------- Coral Gardens (44x28, underwater)
export function coralGarden(): MapDef {
  const W = 44, H = 28, g = new Grid(W, H, 'uw_sand0');
  g.mix(0, 0, W, H, SAND, 91);
  g.mix(0, 0, W, 2, ROCK, 92); g.mix(0, 26, W, 2, ROCK, 93); g.mix(0, 2, 2, 24, ROCK, 94); g.mix(42, 2, 2, 24, ROCK, 95);
  g.rect(0, 12, 2, 3, 'uw_sand0');
  g.rect(2, 13, 40, 1, 'glow_lane');
  // little reefs of coral to swim around (never closing anything in)
  const reef: [number, number, number, number][] = [[6, 5, 3, 2], [13, 9, 2, 3], [9, 17, 3, 2], [17, 4, 2, 2], [16, 19, 3, 3], [24, 6, 3, 2], [27, 17, 2, 3], [31, 21, 3, 2], [34, 11, 2, 2], [22, 22, 2, 2], [12, 23, 2, 2], [6, 22, 2, 2], [28, 3, 2, 2]];
  const kinds: TileName[] = ['coral_pink', 'coral_blue', 'coral_orange'];
  reef.forEach(([x, y, w, h], i) => g.rect(x, y, w, h, kinds[i % 3]));
  // the pearl vault in the north-east corner, behind a curtain of kelp
  for (const t of outline(34, 3, 41, 8)) g.set(t.x, t.y, 'coral_blue');
  g.rect(35, 4, 6, 4, 'uw_sand0');
  g.set(37, 8, 'coral_blue'); g.set(38, 8, 'coral_blue');
  const props: PropDef[] = [
    ...weed([[4, 8], [5, 18], [11, 6], [20, 8], [20, 16], [25, 11], [30, 8], [37, 15], [39, 20], [26, 22], [14, 14], [8, 12], [33, 16], [3, 22], [40, 12]]),
    ...fish([[8, 14], [19, 11], [30, 14], [36, 18], [24, 24], [12, 3], [40, 23]]),
    { key: 'px_fan_pink', x: 5, y: 10 }, { key: 'px_fan_blue', x: 10, y: 10 }, { key: 'px_fan_pink', x: 19, y: 15 }, { key: 'px_fan_blue', x: 25, y: 14 }, { key: 'px_fan_pink', x: 38, y: 10 },
    { key: 'px_fan_blue', x: 36, y: 5 }, { key: 'px_fan_pink', x: 40, y: 5 }, { key: 'px_fan_blue', x: 22, y: 3 },
    { key: 'px_anchor', x: 14, y: 21 }, { key: 'px_sunk_column', x: 31, y: 5, blocks: [[0, 0]] },
    { key: 'items', frame: 7, x: 7, y: 24 }, { key: 'items', frame: 7, x: 40, y: 18 }, { key: 'items', frame: 18, x: 11, y: 12 }, { key: 'items', frame: 18, x: 29, y: 15 }
  ];
  const env: EnvDef[] = [
    { id: 'cshell_1', type: 'shell', x: 9, y: 15, note: 0 }, { id: 'cshell_2', type: 'shell', x: 17, y: 7, note: 2 }, { id: 'cshell_3', type: 'shell', x: 26, y: 20, note: 3 },
    { id: 'cshell_4', type: 'shell', x: 33, y: 14, note: 5 }, { id: 'cshell_5', type: 'shell', x: 38, y: 24, note: 6 },
    { id: 'coral_kelp', type: 'vine', x: 37, y: 10, reveals: 'CORAL_SECRET' },
    { id: 'tr_coral', type: 'treasure', x: 38, y: 5 }
  ];
  const objects: ObjDef[] = [
    { id: 'inky', kind: 'npc', x: 22, y: 12, sprite: { key: 'px_octopus' }, blocks: true, radius: 1.9 },
    { id: 'seahorse_1', kind: 'npc', x: 12, y: 11, sprite: { key: 'px_seahorse' }, radius: 1.6 },
    { id: 'seahorse_2', kind: 'npc', x: 29, y: 19, sprite: { key: 'px_seahorse' }, radius: 1.6 },
    { id: 'seahorse_3', kind: 'npc', x: 19, y: 22, sprite: { key: 'px_seahorse' }, radius: 1.6 },
    { id: 'treasure_coral', kind: 'find', hideWhen: 'CORAL_TREASURE', x: 38, y: 5, sprite: sparkle, radius: 1.6 },
    { id: 'warp_depths', kind: 'warp', x: 0, y: 13, tiles: col(0, 12, 14), to: { scene: 'moat_depths', spawn: 'from_coral' }, sprite: sparkle }
  ];
  const gates: Gate[] = [{ id: 'coral_secret', flag: 'CORAL_SECRET', tiles: [tile(37, 8), tile(38, 8)], closedTile: 'coral_blue', openTile: 'uw_sand0' }];
  return { id: 'coral_garden', w: W, h: H, medium: 'water', mermaidAllowed: true, bg: '#1d5fc0', ground: g.cells, props, objects, gates, env, spawns: { from_depths: tile(3, 13) }, music: 'seas' };
}
