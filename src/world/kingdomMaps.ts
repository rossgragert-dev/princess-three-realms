// v0.4c: The Kingdom Beyond — the Enchanted Woods, the Royal Magic Garden and the Shimmering River.
// All art is drawn at runtime (src/art/kingdomArt.ts) so these maps only name texture keys.
import { ITEM, type TileName } from '../content/frameIndex';
import type { Gate, MapDef, ObjDef, PropDef, Tile } from './types';
import type { EnvDef } from './envMagic';
import { Grid, col, isGrass, npc, tile, trees } from './mapKit';
import { RIVER_COURSE } from './riverCourse';

const TW: TileName[] = ['tree_wall0', 'tree_wall1'];
const PATH: TileName[] = ['path0', 'path1'];
const GRASS: TileName[] = ['grass0', 'grass1', 'grass2', 'grass3'];
const sparkle = { key: 'items', anim: 'sparkle' };
const row = (x0: number, x1: number, y: number): Tile[] => Array.from({ length: x1 - x0 + 1 }, (_, i) => tile(x0 + i, y));
const block = (x0: number, x1: number, y0: number, y1: number): Tile[] => { const out: Tile[] = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push(tile(x, y)); return out; };

// ---------------------------------------------------------------- 9. Enchanted Woods (40x30)
export function enchanted(): MapDef {
  const g = new Grid(40, 30, 'grass0');
  g.mix(0, 0, 40, 30, GRASS, 101);
  g.scatter(0, 3, 40, 24, ['grass_flower0', 'grass_flower1'], 0.1, 102, isGrass);
  g.mix(0, 0, 40, 3, TW, 103); g.mix(0, 27, 40, 3, TW, 104); g.mix(0, 3, 2, 24, TW, 105); g.mix(38, 3, 2, 24, TW, 106);
  g.mix(19, 22, 3, 8, PATH, 107);                       // the way in from the Whispering Woods
  g.mix(19, 17, 3, 5, PATH, 108);
  g.mix(8, 16, 30, 2, PATH, 109);                       // the winding trail west to east
  g.mix(9, 8, 3, 8, PATH, 110);                         // north to the lantern clearing
  // the hidden flowering clearing behind a wall of trees (opens when the lanterns are lit)
  g.mix(12, 2, 17, 10, TW, 111);
  g.rect(14, 4, 13, 5, 'grass_flower0');
  g.scatter(14, 4, 13, 5, ['flower_red', 'flower_blue', 'flower_pink', 'flower_yellow'], 0.4, 112, (t) => t === 'grass_flower0');
  g.mix(19, 12, 3, 5, PATH, 113);
  g.rect(19, 9, 3, 3, 'tree_wall0');                    // closed until LANTERNS_LIT
  // the rhyme stream with its bridge
  g.rect(30, 3, 1, 24, 'stream0'); g.rect(31, 3, 1, 24, 'stream1');
  g.rect(30, 16, 2, 2, 'bridge_ghost');
  g.mix(32, 16, 5, 2, PATH, 114);
  // the secret nook (a curtain of vines hides the way in)
  g.mix(33, 19, 6, 5, TW, 115);
  g.rect(35, 20, 3, 3, 'grass_flower1');

  const props: PropDef[] = [
    ...trees([[4, 5, 'a'], [6, 24, 'b'], [3, 19, 'a'], [24, 6, 'a'], [34, 5, 'a'], [35, 26, 'b'], [4, 25, 'a'], [14, 25, 'b'], [27, 25, 'a'], [33, 14, 'b'], [36, 13, 'a'], [7, 3, 'b'], [16, 5, 'b']]),
    { key: 'px_ancient', x: 12, y: 19, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'px_ancient', x: 26, y: 19, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'px_ancient', x: 16, y: 24, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'px_ancient', x: 20, y: 6, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'px_stump', x: 34, y: 11, blocks: [[0, 0]] }, { key: 'px_stump', x: 36, y: 11, blocks: [[0, 0]] },
    { key: 'px_fox', x: 23, y: 12 }, { key: 'px_owl', x: 10, y: 7 }, { key: 'px_squirrel', x: 6, y: 20 }, { key: 'px_deer', x: 35, y: 8 }, { key: 'px_fox', x: 15, y: 7 }, { key: 'px_owl', x: 25, y: 5 },
    { key: 'px_mush', x: 6, y: 22 }, { key: 'px_mush', x: 15, y: 22 }, { key: 'px_mush', x: 24, y: 23 }, { key: 'px_mush', x: 5, y: 14 }, { key: 'px_mush', x: 33, y: 9 }, { key: 'px_mush', x: 34, y: 26 },
    { key: 'px_mush', x: 16, y: 6 }, { key: 'px_mush', x: 23, y: 7 }, { key: 'px_mush', x: 18, y: 8 },
    ...[[4, 19], [8, 24], [23, 25], [29, 22], [34, 25], [36, 15], [15, 5], [18, 7], [22, 5], [25, 7]].map(([x, y]): PropDef => ({ key: 'px_sflower', x, y })),
    ...[[18, 23], [22, 23], [9, 18], [33, 17], [14, 9], [26, 9]].map(([x, y]): PropDef => ({ key: 'px_lamp', x, y })),
    { key: 'items', frame: ITEM.mushroom, x: 29, y: 8 }
  ];
  const env: EnvDef[] = [
    { id: 'at_1', type: 'ancient_tree', x: 12.5, y: 18, clue: '#S' }, { id: 'at_2', type: 'ancient_tree', x: 26.5, y: 18, clue: '#C' }, { id: 'at_3', type: 'ancient_tree', x: 16.5, y: 23, clue: '#F' },
    { id: 'at_4', type: 'ancient_tree', x: 20.5, y: 5, clue: 'icon_star' },
    ...[[6, 22], [15, 22], [24, 23], [5, 14], [33, 9], [34, 26], [16, 6], [23, 7], [18, 8]].map(([x, y], i): EnvDef => ({ id: `mush_${i}`, type: 'music_mushroom', x, y, note: i % 7 })),
    ...[[4, 19], [8, 24], [23, 25], [29, 22], [34, 25], [36, 15], [15, 5], [18, 7], [22, 5], [25, 7]].map(([x, y], i): EnvDef => ({ id: `sf_${i}`, type: 'sleepy_flower', x, y })),
    ...[[18, 23], [22, 23], [9, 18], [33, 17], [14, 9], [26, 9]].map(([x, y], i): EnvDef => ({ id: `lamp_${i}`, type: 'lantern', x, y })),
    { id: 'woods_vine', type: 'vine', x: 33, y: 21, reveals: 'WOODS_SECRET' },
    { id: 'tr_woods', type: 'treasure', x: 36, y: 21 }
  ];
  const lanternPos: [number, number][] = [[4, 10], [10, 10], [10, 14], [4, 14]];
  const objects: ObjDef[] = [
    { id: 'willa_woods', kind: 'npc', x: 23, y: 25, sprite: npc('willa'), blocks: true, radius: 1.8 },
    { id: 'atree_1', kind: 'puzzle', x: 12, y: 20, radius: 1.9 }, { id: 'atree_2', kind: 'puzzle', x: 26, y: 20, radius: 1.9 }, { id: 'atree_3', kind: 'puzzle', x: 16, y: 25, radius: 1.9 },
    { id: 'lantern_stone', kind: 'puzzle', x: 7, y: 12, sprite: { key: 'px_rune' }, blocks: true, radius: 1.8 },
    ...lanternPos.map(([x, y], i): ObjDef => ({ id: `lantern_${i + 1}`, kind: 'puzzle', x, y, sprite: { key: `px_lantern_${['red', 'blue', 'yellow', 'pink'][i]}` }, blocks: true, radius: 1.6 })),
    { id: 'rhyme_1', kind: 'puzzle', x: 28, y: 14, sprite: { key: 'items', frame: ITEM.cat, scale: 1.5 }, blocks: true, radius: 1.7 },
    { id: 'rhyme_2', kind: 'puzzle', x: 28, y: 19, sprite: { key: 'px_bee', scale: 1.5 }, blocks: true, radius: 1.7 },
    { id: 'rhyme_3', kind: 'puzzle', x: 26, y: 22, sprite: { key: 'px_frog', scale: 1.5 }, blocks: true, radius: 1.7 },
    { id: 'storybook', kind: 'puzzle', x: 35, y: 11, sprite: { key: 'px_storybook' }, blocks: true, radius: 1.8 },
    { id: 'treasure_woods', kind: 'find', hideWhen: 'WOODS_TREASURE', x: 36, y: 21, sprite: sparkle, radius: 1.6 },
    { id: 'warp_woods', kind: 'warp', x: 20, y: 29, tiles: row(19, 21, 29), to: { scene: 'woods', spawn: 'from_enchanted' }, sprite: sparkle }
  ];
  const gates: Gate[] = [
    { id: 'clearing_gate', flag: 'LANTERNS_LIT', tiles: block(19, 21, 9, 11), closedTile: 'tree_wall0', openTile: 'path0' },
    { id: 'rhyme_bridge', flag: 'RHYME_BRIDGE', tiles: block(30, 31, 16, 17), closedTile: 'bridge_ghost', openTile: 'bridge_plank' },
    { id: 'woods_secret', flag: 'WOODS_SECRET', tiles: [tile(33, 21), tile(34, 21)], closedTile: 'tree_wall1', openTile: 'grass_flower1' }
  ];
  return { id: 'enchanted', w: 40, h: 30, medium: 'air', mermaidAllowed: false, bg: '#1f4d3a', ground: g.cells, props, objects, gates, env, spawns: { from_woods: tile(20, 26) }, music: 'wilds' };
}

// ---------------------------------------------------------------- 10. Royal Magic Garden (36x28)
/** The butterfly maze (x 20..34, y 19..25). `#` hedge, `.` open; the only opening is the west door at row 3. */
export const MAZE = [
  '###############',
  '#.....#.......#',
  '#.###.#.#####.#',
  '..#.....#...#.#',
  '#.#.###.#.#.#.#',
  '#...#...#.#...#',
  '###############'
];
export const MAZE_ORIGIN = { x: 20, y: 19 };
export const PLOT_TILES: Record<string, Tile> = {
  plot_1: tile(12, 9), plot_2: tile(16, 9), plot_3: tile(20, 9), plot_4: tile(12, 16), plot_5: tile(16, 16), plot_6: tile(20, 16)
};
export const GOALS = { red: tile(33, 20), blue: tile(29, 24), yellow: tile(33, 24) } as const;

export function garden(): MapDef {
  const g = new Grid(36, 28, 'grass0');
  g.mix(0, 0, 36, 28, GRASS, 121);
  g.scatter(0, 2, 36, 24, ['grass_flower0', 'grass_flower1'], 0.12, 122, isGrass);
  g.mix(0, 0, 36, 2, TW, 123); g.mix(0, 26, 36, 2, TW, 124); g.mix(0, 2, 1, 24, TW, 125); g.mix(35, 2, 1, 24, TW, 126);
  g.mix(1, 9, 9, 10, ['cobble0', 'cobble1'], 127);      // the plaza inside the gate
  g.mix(1, 12, 30, 3, PATH, 128);                       // the spine path
  g.rect(0, 12, 1, 3, 'path0');
  // butterfly garden (north-east): dense flowers
  g.scatter(10, 2, 25, 6, ['flower_red', 'flower_blue', 'flower_pink', 'flower_yellow'], 0.45, 129, isGrass);
  // ponds (scenery: only mermaids swim, and there are none here)
  g.ellipse(7, 22, 5, 3, (d) => (d > 0.6 ? 'water_edge0' : 'water0'));
  g.ellipse(26, 6.5, 2.4, 1.4, (d) => (d > 0.6 ? 'water_edge0' : 'water0'));
  // hedge borders around the flower beds, and the secret nook
  g.rect(11, 7, 11, 1, 'hedge'); g.set(16, 7, 'path0'); g.set(17, 7, 'path0');
  g.rect(31, 10, 4, 4, 'hedge'); g.rect(33, 11, 2, 2, 'grass_flower0');
  // the butterfly maze
  MAZE.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') g.set(MAZE_ORIGIN.x + i, MAZE_ORIGIN.y + j, 'hedge'); else g.set(MAZE_ORIGIN.x + i, MAZE_ORIGIN.y + j, isGrass(g.get(MAZE_ORIGIN.x + i, MAZE_ORIGIN.y + j)) ? g.get(MAZE_ORIGIN.x + i, MAZE_ORIGIN.y + j) : 'grass0'); }));
  g.mix(14, 21, 6, 2, PATH, 130);                       // path to the maze door

  const flowerEdge: PropDef[] = Object.values(PLOT_TILES).map((t): PropDef => ({ key: 'px_plot', x: t.x, y: t.y, blocks: [[0, 0]] }));
  const props: PropDef[] = [
    { key: 'px_greenhouse', x: 5, y: 7, blocks: [[-1, 0], [1, 0]] },
    { key: 'px_fountain', x: 27, y: 13, ox: 8, blocks: [[0, 0], [1, 0]], flagFrame: { flag: 'FOUNTAIN_RESTORED', frame: 1 } },
    ...flowerEdge,
    { key: 'px_bench', x: 2, y: 17, ox: 8, blocks: [[0, 0], [1, 0]] }, { key: 'px_bench', x: 24, y: 10, ox: 8, blocks: [[0, 0], [1, 0]] }, { key: 'px_bench', x: 15, y: 25, ox: 8, blocks: [[0, 0], [1, 0]] },
    { key: 'px_arch', x: 16, y: 7, ox: 8, depthBias: 4000 }, { key: 'px_arch', x: 2, y: 13, depthBias: 4000 },
    { key: 'px_lily', x: 5, y: 21 }, { key: 'px_lily', x: 9, y: 23 }, { key: 'px_lily', x: 7, y: 22 }, { key: 'px_lily', x: 26, y: 6 },
    { key: 'px_butterfly_pink', x: 22, y: 3 }, { key: 'px_butterfly_pink', x: 26, y: 5 }, { key: 'px_butterfly_pink', x: 30, y: 3 }, { key: 'px_butterfly_pink', x: 33, y: 6 },
    ...[[3, 11], [3, 16], [14, 4], [18, 5], [29, 9], [11, 20], [22, 17]].map(([x, y]): PropDef => ({ key: 'px_sflower', x, y })),
    ...[[8, 10], [13, 12], [24, 13], [6, 18]].map(([x, y]): PropDef => ({ key: 'px_lamp', x, y })),
    { key: 'px_fox', x: 30, y: 18 }, { key: 'px_squirrel', x: 3, y: 24 }, { key: 'px_squirrel', x: 12, y: 3 },
    ...trees([[2, 4, 'a'], [33, 3, 'b'], [2, 23, 'b'], [34, 17, 'a']]),
    { key: 'bush', x: 10, y: 11 }, { key: 'bush', x: 18, y: 11 }
  ];
  const env: EnvDef[] = [
    { id: 'fountain_g', type: 'fountain', x: 27.5, y: 12.2 },
    ...[[3, 11], [3, 16], [14, 4], [18, 5], [29, 9], [11, 20], [22, 17]].map(([x, y], i): EnvDef => ({ id: `sf_${i}`, type: 'sleepy_flower', x, y })),
    ...[[8, 10], [13, 12], [24, 13], [6, 18]].map(([x, y], i): EnvDef => ({ id: `lamp_${i}`, type: 'lantern', x, y })),
    ...[[22, 3], [26, 5], [30, 3], [33, 6]].map(([x, y], i): EnvDef => ({ id: `bfl_${i}`, type: 'butterfly', x, y })),
    { id: 'garden_vine', type: 'vine', x: 31, y: 11, reveals: 'GARDEN_SECRET' },
    { id: 'tr_garden', type: 'treasure', x: 34, y: 12 }
  ];
  const ladybugs = [[9, 16], [14, 22], [24, 17]];
  const objects: ObjDef[] = [
    { id: 'gardener', kind: 'npc', x: 8, y: 10, sprite: npc('nana'), blocks: true, radius: 1.8 },
    ...Object.entries(PLOT_TILES).map(([id, t]): ObjDef => ({ id, kind: 'puzzle', x: t.x, y: t.y, radius: 1.5 })),
    ...(['red', 'blue', 'yellow', 'pink'] as const).map((c, i): ObjDef => ({ id: `seed_${c}`, kind: 'puzzle', x: 13 + i * 2, y: 19, sprite: { key: `px_pkt_${c}` }, radius: 1.5 })),
    { id: 'seq_bed', kind: 'puzzle', x: 24, y: 8, sprite: { key: 'items', frame: ITEM.seed, scale: 2 }, radius: 1.7 },
    { id: 'fountain_obj', kind: 'puzzle', x: 27, y: 14, radius: 2.0 },
    ...ladybugs.map(([x, y], i): ObjDef => ({ id: `ladybug_${i + 1}`, kind: 'puzzle', x, y, sprite: { key: 'px_ladybug' }, radius: 1.5 })),
    { id: 'bf_red', kind: 'ability', x: 24, y: 4, sprite: { key: 'px_butterfly_red' }, radius: 1.7 },
    { id: 'bf_blue', kind: 'ability', x: 28, y: 5, sprite: { key: 'px_butterfly_blue' }, radius: 1.7 },
    { id: 'bf_yellow', kind: 'ability', x: 32, y: 4, sprite: { key: 'px_butterfly_yellow' }, radius: 1.7 },
    { id: 'goal_red', kind: 'puzzle', x: GOALS.red.x, y: GOALS.red.y, sprite: { key: 'px_flower_red' }, radius: 1.6 },
    { id: 'goal_blue', kind: 'puzzle', x: GOALS.blue.x, y: GOALS.blue.y, sprite: { key: 'px_flower_blue' }, radius: 1.6 },
    { id: 'goal_yellow', kind: 'puzzle', x: GOALS.yellow.x, y: GOALS.yellow.y, sprite: { key: 'px_flower_yellow' }, radius: 1.6 },
    { id: 'treasure_garden', kind: 'find', hideWhen: 'GARDEN_TREASURE', x: 34, y: 12, sprite: sparkle, radius: 1.6 },
    { id: 'door_conservatory', kind: 'warp', x: 5, y: 7, tiles: [tile(5, 7)], to: { scene: 'conservatory', spawn: 'from_garden' }, sprite: sparkle, radius: 1.5 },
    { id: 'warp_courtyard', kind: 'warp', x: 0, y: 13, tiles: col(0, 12, 14), to: { scene: 'courtyard', spawn: 'from_garden' }, sprite: sparkle }
  ];
  const gates: Gate[] = [
    { id: 'garden_secret', flag: 'GARDEN_SECRET', tiles: [tile(31, 11), tile(32, 11)], closedTile: 'hedge', openTile: 'grass_flower0' }
  ];
  return { id: 'garden', w: 36, h: 28, medium: 'air', mermaidAllowed: false, bg: '#3b8f4f', ground: g.cells, props, objects, gates, env, spawns: { from_courtyard: tile(2, 13), from_conservatory: tile(5, 9) }, music: 'sunlit' };
}

// ---------------------------------------------------------------- 11. Shimmering River (48x26), mermaid only
export function river(): MapDef {
  const g = new Grid(48, 26, 'uw_rock0');
  g.mix(0, 0, 48, 26, ['uw_rock0', 'uw_rock1'], 141);
  const line = RIVER_COURSE.centre;
  const dist = (x: number, y: number) => {
    let best = 99;
    for (let i = 0; i + 1 < line.length; i++) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1];
      const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
    }
    return best;
  };
  for (let y = 0; y < 26; y++) for (let x = 0; x < 48; x++) {
    const d = dist(x + 0.5, y + 0.5);
    if (d <= 3.2) g.set(x, y, d > 2.4 ? 'water_edge0' : d > 1.0 ? 'water0' : 'deep_water');
    else if (d <= 4.2) g.set(x, y, (x + y) % 2 ? 'uw_sand0' : 'uw_sand1');
  }
  // sandy shallows are solid river banks: rim them with boulders and coral
  for (let y = 0; y < 26; y++) for (let x = 0; x < 48; x++) {
    const d = dist(x + 0.5, y + 0.5);
    if (d > 3.2 && d <= 4.2 && (x * 7 + y * 3) % 5 === 0) g.set(x, y, (['coral_pink', 'coral_blue', 'coral_orange'] as const)[(x + y) % 3]);
  }
  // hidden alcove (north bank) behind a curtain of kelp
  g.rect(20, 1, 6, 3, 'water0');
  g.rect(21, 1, 4, 2, 'deep_water');
  g.rect(20, 4, 6, 1, 'uw_rock0');
  g.set(22, 4, 'coral_pink'); g.set(23, 4, 'coral_pink');
  const props: PropDef[] = [
    ...[[8, 10], [10, 16], [18, 12], [26, 13], [30, 16], [36, 15], [41, 13], [14, 7], [24, 6]].map(([x, y]): PropDef => ({ key: 'px_lily', x, y })),
    ...[[6, 8], [9, 18], [20, 5], [29, 9], [34, 20], [40, 10], [43, 18]].map(([x, y]): PropDef => ({ key: 'px_reed', x, y })),
    { key: 'px_falls', x: 16, y: 4 }, { key: 'px_falls', x: 33, y: 22 },
    { key: 'px_bridge_over', x: 24, y: 13, depthBias: 6000 }, { key: 'px_bridge_over', x: 40, y: 20, depthBias: 6000 },
    { key: 'px_wheel', x: 19, y: 4, blocks: [[0, 0]] }, { key: 'px_wheel', x: 34, y: 21, blocks: [[0, 0]] },
    ...[[9, 15], [15, 11], [22, 10], [27, 11], [31, 15], [37, 17]].map(([x, y]): PropDef => ({ key: 'px_fish_orange', x, y })),
    { key: 'seaweed', anim: 'seaweed_sway', x: 5, y: 15 }, { key: 'seaweed', anim: 'seaweed_sway', x: 12, y: 9 }, { key: 'seaweed', anim: 'seaweed_sway', x: 28, y: 17 }, { key: 'seaweed', anim: 'seaweed_sway', x: 39, y: 15 }
  ];
  const shells: [number, number][] = [[11, 12], [17, 10], [23, 9], [29, 14], [35, 18], [42, 14]];
  const env: EnvDef[] = [
    { id: 'wheel_1', type: 'water_wheel', x: 19, y: 4 }, { id: 'wheel_2', type: 'water_wheel', x: 34, y: 21 },
    ...shells.map(([x, y], i): EnvDef => ({ id: `shell_${i}`, type: 'shell', x, y, note: i })),
    { id: 'river_kelp', type: 'vine', x: 22, y: 5, reveals: 'RIVER_SECRET' },
    { id: 'tr_river', type: 'treasure', x: 23, y: 2 }
  ];
  const objects: ObjDef[] = [
    { id: 'coralie_r', kind: 'npc', x: 6, y: 11, sprite: npc('coralie'), blocks: true, radius: 1.9 },
    { id: 'race_start', kind: 'puzzle', x: 8, y: 15, sprite: { key: 'px_startpost' }, blocks: true, radius: 2.0 },
    { id: 'treasure_river', kind: 'find', hideWhen: 'RIVER_TREASURE', x: 23, y: 2, sprite: sparkle, radius: 1.6 },
    { id: 'exit_shore', kind: 'warp', x: 3, y: 13, tiles: col(3, 12, 14), to: { scene: 'shore', spawn: 'from_river' }, sprite: { key: 'whirlpool', anim: 'whirlpool_spin' }, forms: ['mermaid'], radius: 1.5 }
  ];
  const gates: Gate[] = [
    { id: 'river_secret', flag: 'RIVER_SECRET', tiles: [tile(22, 4), tile(23, 4)], closedTile: 'coral_pink', openTile: 'water0' }
  ];
  return { id: 'river', w: 48, h: 26, medium: 'water', mermaidAllowed: true, bg: '#1d6fc0', ground: g.cells, props, objects, gates, env, spawns: { from_shore: tile(6, 13) }, music: 'seas' };
}

