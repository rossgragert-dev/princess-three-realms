// v0.4c: The Kingdom Beyond: Enchanted Woods, Royal Magic Garden, Shimmering River.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMap, getMaps } from '../world/maps';
import { MAZE, MAZE_ORIGIN, GOALS, PLOT_TILES } from '../world/kingdomMaps';
import { RIVER_COURSE } from '../world/riverCourse';
import { ENV_RULES, ENV_TYPES, envAccepts, envTargets, MAX_ACTIVE_ENV_FX } from '../world/envMagic';
import { makeGrid, flood, tileKey, findPath, approachTile, nearestPassable, visibleObjects, type Flags } from '../world/navigation';
import { FRIENDLY_RINGS, RING_RADIUS, STAR_PAR_MS, guideDir, inRing, progress, startRace, starsFor, stepRace } from '../world/race';
import {
  ACTIVITY_IDS, FOUNTAIN_NEEDS, PLOT_IDS, SEEDS, defaultKingdom, fountainReady, markDone, nextStage, plantedCount, sanitizeKingdom
} from '../content/kingdom';
import { KINGDOM_REWARDS, grantKingdomReward } from '../content/kingdomRewards';
import { STICKERS } from '../content/stickers';
import { FURNITURE } from '../content/furniture';
import { EXTRA_DECOR } from '../content/family';
import { PUZZLES, puzzleById } from '../content/puzzleBank';
import { narrationByKey } from '../content/narrationManifest';
import { completeFlag } from '../systems/questEngine';
import { defaultState, sanitize, SAFE_SPAWN } from '../systems/saveManager';
import { EXITS } from '../world/guide';
import { NOTE_HZ } from '../world/envMagic';
import type { QuestFlag } from '../types/game';

const OPEN: Flags = Object.fromEntries(['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'RHYME_BRIDGE', 'LANTERNS_LIT', 'WOODS_SECRET', 'GARDEN_SECRET', 'RIVER_SECRET'].map((f) => [f, true])) as Flags;
const NEW = ['enchanted', 'garden', 'river'] as const;

describe('the three new areas are registered everywhere', () => {
  it('maps exist with valid sizes, spawns and safe spawns', () => {
    for (const id of NEW) {
      const m = getMap(id);
      assert.equal(m.id, id); assert.equal(m.ground.length, m.h);
      for (const r of m.ground) assert.equal(r.length, m.w);
      assert.ok(m.spawns[SAFE_SPAWN[id]], `${id} safe spawn`);
    }
  });
  it('are connected both ways to the existing world', () => {
    const maps = getMaps();
    const link = (from: string, to: string) => maps[from as 'woods'].objects.some((o) => o.kind === 'warp' && o.to?.scene === to && !!maps[to as 'woods'].spawns[o.to.spawn]);
    for (const [a, b] of [['woods', 'enchanted'], ['enchanted', 'woods'], ['courtyard', 'garden'], ['garden', 'courtyard'], ['conservatory', 'garden'], ['garden', 'conservatory'], ['shore', 'river'], ['river', 'shore']]) assert.ok(link(a, b), `${a} -> ${b}`);
  });
  it('the guide knows how to leave each new area', () => {
    for (const id of NEW) assert.ok(EXITS[id], `${id} has an exit entry`);
  });
  it('river is mermaid-only and never traps: the way out is always walkable', () => {
    const m = getMap('river'), g = makeGrid(m, OPEN, 'mermaid');
    const start = m.spawns.from_shore, d = flood(g, start);
    const exit = m.objects.find((o) => o.id === 'exit_shore')!;
    assert.ok(exit.tiles!.some((t) => d.has(tileKey(t))));
    assert.ok(!makeGrid(m, OPEN, 'princess').passable(start.x, start.y), 'a princess cannot be dropped into the river');
  });
});

describe('story objects can all be reached once secrets are open, and secrets stay closed until revealed', () => {
  const form = (id: string) => (id === 'river' ? 'mermaid' : 'princess');
  for (const id of NEW) {
    it(`${id}: every object is reachable`, () => {
      const m = getMap(id), g = makeGrid(m, OPEN, form(id));
      const start = nearestPassable(g, Object.values(m.spawns)[0], 3)!;
      for (const o of visibleObjects(m, OPEN)) {
        if (o.kind === 'warp') assert.ok((o.tiles ?? []).some((t) => flood(g, start).has(tileKey(t))), `${o.id} warp`);
        else assert.ok(approachTile(g, start, o), `${o.id} approach`);
      }
    });
  }
  it('secret nooks are closed without their flag', () => {
    const closed = { ...OPEN, WOODS_SECRET: false, GARDEN_SECRET: false, RIVER_SECRET: false, LANTERNS_LIT: false, RHYME_BRIDGE: false } as Flags;
    for (const [id, treasure] of [['enchanted', 'treasure_woods'], ['garden', 'treasure_garden'], ['river', 'treasure_river']] as const) {
      const m = getMap(id), g = makeGrid(m, closed, form(id)), d = flood(g, nearestPassable(g, Object.values(m.spawns)[0], 3)!);
      const o = m.objects.find((q) => q.id === treasure)!;
      assert.ok(![...d.keys()].some((k) => Math.hypot((k % 4096) - o.x, Math.floor(k / 4096) - o.y) <= 1.6), `${treasure} hidden until revealed`);
    }
  });
  it('the lantern clearing and the rhyme bridge only open with their flags', () => {
    const m = getMap('enchanted');
    const base = { ...OPEN, LANTERNS_LIT: false, RHYME_BRIDGE: false } as Flags;
    const g0 = makeGrid(m, base, 'princess'), d0 = flood(g0, m.spawns.from_woods);
    assert.ok(!d0.has(tileKey({ x: 20, y: 5 })), 'clearing closed');
    assert.ok(!d0.has(tileKey({ x: 34, y: 16 })), 'east bank closed');
    const g1 = makeGrid(m, OPEN, 'princess'), d1 = flood(g1, m.spawns.from_woods);
    assert.ok(d1.has(tileKey({ x: 20, y: 5 })) && d1.has(tileKey({ x: 34, y: 16 })));
  });
});

describe('environmental interaction system', () => {
  it('every environment type has a bounded rule and at least one form', () => {
    for (const t of ENV_TYPES) { const r = ENV_RULES[t]; assert.ok(r.ms > 0 && r.ms <= 8000 && r.r > 0 && r.forms.length >= 1, t); }
    assert.ok(MAX_ACTIVE_ENV_FX >= 8 && MAX_ACTIVE_ENV_FX <= 40);
  });
  it('form rules: wheels and shells are for mermaids, lanterns and trees for the land forms', () => {
    assert.ok(envAccepts('water_wheel', 'mermaid') && !envAccepts('water_wheel', 'princess'));
    assert.ok(envAccepts('shell', 'mermaid') && !envAccepts('shell', 'unicorn'));
    assert.ok(envAccepts('lantern', 'princess') && envAccepts('lantern', 'unicorn') && !envAccepts('lantern', 'mermaid'));
    assert.ok(envAccepts('ancient_tree', 'unicorn') && !envAccepts('ancient_tree', 'mermaid'));
  });
  it('targets are filtered by form, and a revealed vine stops reacting', () => {
    const r = getMap('river');
    assert.ok(envTargets(r, 'mermaid', {}).some((t) => t.env === 'water_wheel'));
    assert.equal(envTargets(r, 'princess', {}).filter((t) => t.env === 'water_wheel').length, 0);
    assert.ok(envTargets(r, 'mermaid', {}).some((t) => t.env === 'vine'));
    assert.ok(!envTargets(r, 'mermaid', { RIVER_SECRET: true }).some((t) => t.env === 'vine'));
  });
  it('env ids are unique per map, every env sits inside the map, and each kind appears somewhere', () => {
    const seen = new Set<string>();
    for (const id of NEW) {
      const m = getMap(id), ids = (m.env ?? []).map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, `${id} unique env ids`);
      for (const e of m.env ?? []) { assert.ok(e.x >= 0 && e.y >= 0 && e.x < m.w && e.y < m.h, e.id); seen.add(e.type); }
    }
    for (const t of ENV_TYPES) assert.ok(seen.has(t), `${t} used`);
  });
  it('every vine reveals a flag that a gate on the same map opens', () => {
    for (const id of NEW) {
      const m = getMap(id);
      for (const e of (m.env ?? []).filter((q) => q.type === 'vine')) assert.ok(m.gates.some((g) => g.flag === e.reveals), `${id}/${e.id}`);
    }
  });
  it('notes are a pleasant scale', () => { assert.ok(NOTE_HZ.length >= 5 && NOTE_HZ.every((n, i) => i === 0 || n > NOTE_HZ[i - 1])); });
});

describe('growing magic', () => {
  it('plot states advance only in order and ignore wrong actions', () => {
    assert.equal(nextStage('empty', 'water'), 'empty');
    let s = nextStage('empty', 'plant'); assert.equal(s, 'seed');
    s = nextStage(s, 'plant'); assert.equal(s, 'seed');
    s = nextStage(s, 'water'); assert.equal(s, 'watered');
    s = nextStage(s, 'grow'); s = nextStage(s, 'grow'); assert.equal(s, 'flower');
  });
  it('six plots on walkable land; four seed colours; the garden counts and the fountain wakes after three flowers', () => {
    const m = getMap('garden'), g = makeGrid(m, OPEN, 'princess');
    assert.equal(PLOT_IDS.length, 6); assert.equal(SEEDS.length, 4);
    for (const id of PLOT_IDS) {
      const t = PLOT_TILES[id], reach = flood(g, m.spawns.from_courtyard);
      assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has(tileKey({ x: t.x + dx, y: t.y + dy }))), `${id} is reachable from a neighbour`);
    }
    const k = defaultKingdom();
    assert.ok(!fountainReady(k));
    PLOT_IDS.slice(0, FOUNTAIN_NEEDS).forEach((p, i) => { k.garden[p] = SEEDS[i]; });
    assert.equal(plantedCount(k), FOUNTAIN_NEEDS); assert.ok(fountainReady(k));
  });
  it('saved kingdom data is sanitized: unknown plots, seeds, activities are dropped; numbers clamped; garbage ignored', () => {
    const k = sanitizeKingdom({ garden: { plot_1: 'red', plot_9: 'red', plot_2: 'purple' }, done: ['sound_s', 'nope', 'sound_s'], fountain: 99, race: { friendly: -5, starBest: 9, bestMs: 'x' } });
    assert.deepEqual(k.garden, { plot_1: 'red' }); assert.deepEqual(k.done, ['sound_s']);
    assert.equal(k.fountain, 4); assert.deepEqual(k.race, { friendly: 0, starBest: 3, bestMs: 0 });
    assert.deepEqual(sanitizeKingdom(null), defaultKingdom()); assert.deepEqual(sanitizeKingdom('x'), defaultKingdom());
  });
  it('markDone is idempotent and only accepts known activities', () => {
    const k = defaultKingdom();
    assert.ok(markDone(k, 'rhyme_cat')); assert.ok(!markDone(k, 'rhyme_cat')); assert.ok(!markDone(k, 'bogus'));
    assert.ok(ACTIVITY_IDS.every((a) => puzzleById(a) !== undefined || a === 'garden_grow'));
  });
  it('the butterfly maze is fully connected from its door and reaches every flower goal', () => {
    const rows = MAZE.length, cols = MAZE[0].length, seen = new Set<string>(), q: [number, number][] = [[0, 3]];
    assert.equal(MAZE[3][0], '.');
    while (q.length) {
      const [x, y] = q.pop()!; const k = `${x},${y}`;
      if (seen.has(k) || x < 0 || y < 0 || x >= cols || y >= rows || MAZE[y][x] === '#') continue;
      seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    const open = MAZE.join('').split('').filter((c) => c === '.').length;
    assert.equal(seen.size, open, 'no sealed pockets');
    const g = makeGrid(getMap('garden'), OPEN, 'princess'), d = flood(g, getMap('garden').spawns.from_courtyard);
    for (const c of ['red', 'blue', 'yellow'] as const) {
      const t = GOALS[c];
      assert.ok([[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => d.has(tileKey({ x: t.x + dx, y: t.y + dy }))), `${c} goal reachable`);
      assert.ok(t.x >= MAZE_ORIGIN.x && t.y >= MAZE_ORIGIN.y);
    }
  });
});

describe('Mermaid River Race', () => {
  const rings = RIVER_COURSE.rings;
  it('the course is open water, in order, with generous rings', () => {
    const m = getMap('river'), g = makeGrid(m, OPEN, 'mermaid');
    assert.ok(rings.length >= FRIENDLY_RINGS && FRIENDLY_RINGS >= 5 && FRIENDLY_RINGS <= 6);
    for (const r of rings) assert.ok(g.passable(Math.floor(r.x), Math.floor(r.y)), `ring ${r.x},${r.y} is swimmable`);
    const d = flood(g, m.spawns.from_shore);
    for (const r of rings) assert.ok(d.has(tileKey({ x: Math.floor(r.x), y: Math.floor(r.y) })), `ring ${r.x},${r.y} reachable`);
    for (let i = 1; i < rings.length; i++) assert.ok(Math.hypot(rings[i].x - rings[i - 1].x, rings[i].y - rings[i - 1].y) < 9, 'rings are never far apart');
    assert.ok(RING_RADIUS >= 1);
    const start = m.spawns.from_shore;
    assert.ok(findPath(g, start, { x: Math.floor(rings[rings.length - 1].x), y: Math.floor(rings[rings.length - 1].y) }));
  });
  it('only the next ring counts; missing or circling never costs anything; the clock starts at the first ring', () => {
    const s = startRace('star', rings);
    assert.equal(stepRace(s, { x: 0, y: 0 }, 1000), 'none'); assert.equal(s.startedAt, null);
    assert.equal(stepRace(s, rings[3], 2000), 'none', 'a later ring does not count yet');
    assert.equal(s.passed, 0);
    assert.equal(stepRace(s, rings[0], 3000), 'ring'); assert.equal(s.startedAt, 3000);
    assert.equal(stepRace(s, rings[0], 3500), 'none', 'cannot count the same ring twice');
    for (let i = 1; i < rings.length - 1; i++) assert.equal(stepRace(s, rings[i], 4000 + i), 'ring');
    assert.equal(stepRace(s, rings[rings.length - 1], 9000), 'finish'); assert.ok(s.done);
    assert.deepEqual(progress(s), { done: rings.length, total: rings.length });
    assert.equal(stepRace(s, rings[0], 9500), 'none', 'finished races stay finished');
  });
  it('modes: free swim has no rings or clock; friendly has 5-6 rings; star runs the whole course', () => {
    assert.equal(startRace('free', rings).rings.length, 0);
    assert.equal(startRace('friendly', rings).rings.length, FRIENDLY_RINGS);
    assert.equal(startRace('star', rings).rings.length, rings.length);
    assert.equal(stepRace(startRace('free', rings), rings[0], 1), 'none');
  });
  it('stars are generous and zero stars still means finishing counts', () => {
    assert.equal(starsFor(STAR_PAR_MS[0]), 3); assert.equal(starsFor(STAR_PAR_MS[1]), 2); assert.equal(starsFor(STAR_PAR_MS[2]), 1); assert.equal(starsFor(9e9), 0);
    assert.ok(STAR_PAR_MS[0] >= 30_000, 'par times are not frantic');
  });
  it('the guide arrow always points at the next ring', () => {
    const s = startRace('friendly', rings);
    const g = guideDir(s, { x: rings[0].x - 5, y: rings[0].y })!;
    assert.ok(g.x > 0.99 && Math.abs(g.y) < 0.01 && Math.abs(g.dist - 5) < 1e-6);
    s.done = true; assert.equal(guideDir(s, { x: 0, y: 0 }), null);
    assert.ok(inRing(rings[2], rings[2]));
  });
});

describe('rewards, puzzles and saves', () => {
  it('every reward names a real sticker and (if any) a real furniture decoration, and is granted exactly once', () => {
    const ids = new Set(STICKERS.map((s) => s.id));
    for (const [flag, r] of Object.entries(KINGDOM_REWARDS)) {
      if (r.sticker) assert.ok(ids.has(r.sticker), `${flag}: sticker ${r.sticker}`);
      if (r.decor) { assert.ok(FURNITURE[r.decor], `${flag}: furniture ${r.decor}`); assert.ok(EXTRA_DECOR.includes(r.decor)); }
    }
    const s = { stickers: [] as string[], unlockedDecor: [] as string[] };
    assert.ok(grantKingdomReward(s, 'GARDEN_GROWN')); assert.ok(!grantKingdomReward(s, 'GARDEN_GROWN'));
    assert.deepEqual(s.stickers, ['sticker_garden']); assert.deepEqual(s.unlockedDecor, ['flower_cushion']);
  });
  it('completing a flag through the quest engine grants the reward once and survives sanitize', () => {
    const st = defaultState();
    assert.ok(completeFlag(st, 'LANTERNS_LIT')); assert.ok(!completeFlag(st, 'LANTERNS_LIT'));
    assert.equal(st.stickers.filter((x) => x === 'sticker_lanterns').length, 1);
    assert.ok(st.unlockedDecor.includes('mushroom_lamp'));
    const back = sanitize(JSON.parse(JSON.stringify(st)));
    assert.ok(back.flags.LANTERNS_LIT && back.stickers.includes('sticker_lanterns') && back.unlockedDecor.includes('mushroom_lamp'));
  });
  it('old saves load with a default kingdom and unchanged progress; bad kingdom data cannot break a save', () => {
    const old = sanitize({ version: 1, flags: { INTRO_DONE: true }, stickers: ['sticker_star'] });
    assert.deepEqual(old.kingdom, defaultKingdom()); assert.ok(old.flags.INTRO_DONE && old.stickers.includes('sticker_star'));
    const bad = sanitize({ version: 1, kingdom: 7, scene: 'river', form: 'princess' });
    assert.equal(bad.form, 'mermaid', 'the river is always a mermaid place');
    assert.deepEqual(bad.kingdom, defaultKingdom());
    const garden = sanitize({ version: 1, kingdom: { garden: { plot_3: 'pink' } } });
    assert.equal(garden.kingdom.garden.plot_3, 'pink');
  });
  it('the nine new learning activities are replayable optional picture-first puzzles with narration', () => {
    for (const id of ['sound_s', 'sound_c', 'sound_f', 'rhyme_cat', 'rhyme_bee', 'rhyme_frog', 'story_egg', 'story_day', 'ladybugs']) {
      const p = puzzleById(id)!; assert.ok(p, id); assert.ok(!p.mandatory, `${id} is optional`);
      assert.ok(narrationByKey(p.narrationKey), `${id} narration`);
      assert.ok(p.choices.length >= 2 && p.choices.length <= 4, `${id} has few large choices`);
    }
    assert.ok(PUZZLES.filter((p) => p.mandatory).length === 4, 'the main path is unchanged');
  });
  it('every new narration clip is optional (narration is never required to play)', () => {
    const keys: QuestFlag[] = [];
    void keys;
    for (const k of ['king_fading', 'woods_intro', 'lanterns_watch', 'garden_intro', 'river_intro', 'race_go', 'fountain_ready']) assert.equal(narrationByKey(k)?.required, false, k);
  });
});
