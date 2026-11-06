import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMaps, getMap } from '../world/maps';
import { TILE } from '../content/frameIndex';
import { makeGrid, flood, findPath, approachTile, nearestPassable, safeSpawn, tileKey, visibleObjects, type Flags } from '../world/navigation';
import { planFormChange, availableForms } from '../actors/transformations';
import { EXITS, OBJECTIVE_TARGET, guideTarget, sceneRoute } from '../world/guide';
import { MAIN_PATH, completeFlag } from '../systems/questEngine';
import { defaultState } from '../systems/saveManager';
import type { Form, SceneId, QuestFlag } from '../types/game';

const maps = getMaps();
const ALL: Flags = Object.fromEntries(
  ['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'PEARL_PLACED', 'STAR_1_FOUND', 'RHYME_BRIDGE', 'LANTERNS_LIT', 'WOODS_SECRET', 'GARDEN_SECRET', 'RIVER_SECRET'].map((f) => [f, true])
) as Flags;
const formFor = (scene: SceneId, spawn: string): Form => (scene === 'grotto' || scene === 'river' || (scene === 'shore' && (spawn === 'from_grotto' || spawn === 'from_river')) ? 'mermaid' : 'princess');

describe('map data integrity', () => {
  for (const [id, m] of Object.entries(maps)) {
    it(`${id}: ground matches declared size and uses real tiles`, () => {
      assert.equal(m.ground.length, m.h);
      for (const row of m.ground) {
        assert.equal(row.length, m.w);
        for (const t of row) assert.ok(t in TILE, `unknown tile ${t}`);
      }
    });
    it(`${id}: object ids unique; everything inside the map`, () => {
      const ids = m.objects.map((o) => o.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const o of m.objects) assert.ok(o.x >= 0 && o.y >= 0 && o.x < m.w && o.y < m.h, o.id);
      for (const p of m.props) assert.ok(p.x >= 0 && p.y >= 0 && p.x < m.w && p.y < m.h, p.key);
    });
  }
});

describe('spawn and reachability (T03)', () => {
  for (const [id, m] of Object.entries(maps)) {
    for (const [sp, t] of Object.entries(m.spawns)) {
      it(`${id}/${sp} is a valid tile for its form`, () => {
        const f = formFor(m.id, sp);
        assert.ok(makeGrid(m, ALL, f).passable(t.x, t.y), `${id}/${sp} ${t.x},${t.y}`);
      });
    }
  }
  const flip = (id: SceneId, o: { id: string }): Form =>
    id === 'grotto' || id === 'river' || o.id === 'river_mouth' ? 'mermaid' : o.id.startsWith('bloom') || o.id === 'chest_creek' ? 'unicorn' : 'princess';
  for (const [id, m] of Object.entries(maps)) {
    it(`${id}: every object can be reached once the story has opened every gate`, () => {
      const first = Object.values(m.spawns)[0];
      for (const o of visibleObjects(m, ALL)) {
        const form = o.id === 'dive' ? 'mermaid' : flip(m.id, o);
        const swimStart = o.id === 'river_mouth' ? m.spawns.from_river : undefined;
        let grid = makeGrid(m, ALL, form);
        let start = nearestPassable(grid, swimStart ?? first, 3)!;
        if (o.id === 'dive') { grid = makeGrid(m, ALL, 'mermaid'); start = m.spawns.from_grotto; }
        assert.ok(start, `${id}: no start for ${o.id}`);
        if (o.kind === 'warp') {
          const dist = flood(grid, start);
          assert.ok((o.tiles ?? []).some((t) => dist.has(tileKey(t))), `${id}: warp ${o.id} unreachable`);
        } else {
          assert.ok(approachTile(grid, start, o), `${id}: ${o.id} has no approach tile`);
        }
      }
    });
  }
  it('the whirlpool is only for mermaids and lies in the water', () => {
    const shore = maps.shore;
    assert.ok(!makeGrid(shore, ALL, 'princess').passable(28, 13));
    assert.ok(makeGrid(shore, ALL, 'mermaid').passable(28, 13));
  });
  it('closed gates block the story out of order', () => {
    const w = maps.woods;
    const none: Flags = {};
    const west = makeGrid(w, none, 'princess');
    const d = flood(west, w.spawns.from_courtyard);
    assert.ok(approachTile(west, w.spawns.from_courtyard, w.objects.find((o) => o.id === 'tree')!), 'tree reachable');
    assert.ok(!d.has(tileKey({ x: 28, y: 15 })), 'meadow closed before the tree is solved');
    const open = makeGrid(w, { TREE_GATE_OPEN: true }, 'princess');
    const d2 = flood(open, w.spawns.from_courtyard);
    assert.ok(d2.has(tileKey({ x: 40, y: 15 })));
    assert.ok(!d2.has(tileKey({ x: 45, y: 15 })), 'east bank closed until the rainbow bridge is fixed');
    const bridged = makeGrid(w, { TREE_GATE_OPEN: true, RAINBOW_BRIDGE_OPEN: true }, 'princess');
    assert.ok(flood(bridged, w.spawns.from_courtyard).has(tileKey({ x: 47, y: 15 })));
  });
  it('the hidden grove needs a unicorn (T04)', () => {
    const w = maps.woods;
    const chest = w.objects.find((o) => o.id === 'chest_creek')!;
    const f: Flags = { TREE_GATE_OPEN: true };
    assert.equal(approachTile(makeGrid(w, f, 'princess'), w.spawns.from_courtyard, chest), null);
    assert.ok(approachTile(makeGrid(w, f, 'unicorn'), w.spawns.from_courtyard, chest));
  });
});

describe('pathfinding', () => {
  const m = maps.courtyard;
  const grid = makeGrid(m, {}, 'princess');
  it('finds contiguous 4-neighbour paths that avoid obstacles', () => {
    const p = findPath(grid, m.spawns.start, { x: 30, y: 24 })!;
    assert.ok(p && p.length > 5);
    for (let i = 1; i < p.length; i++) assert.equal(Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y), 1);
    for (const t of p) assert.ok(grid.passable(t.x, t.y));
  });
  it('routes around the fountain', () => {
    const p = findPath(grid, { x: 17, y: 13 }, { x: 22, y: 13 })!;
    assert.ok(p.length > 6);
  });
  it('tapping a wall snaps to the nearest walkable tile or is ignored', () => {
    assert.ok(nearestPassable(grid, { x: 20, y: 1 }, 6));
    assert.equal(nearestPassable(grid, { x: 0, y: 0 }, 1), null);
  });
  it('safeSpawn repairs an invalid saved tile (T13)', () => {
    const t = safeSpawn(grid, { x: 0, y: 0 });
    assert.ok(grid.passable(t.x, t.y));
  });
});

describe('forms never strand the player (T05)', () => {
  const shore = maps.shore;
  it('forms unlock with the story', () => {
    assert.deepEqual(availableForms({}), ['princess']);
    assert.deepEqual(availableForms({ WILLA_MET: true }), ['princess', 'unicorn']);
    assert.deepEqual(availableForms(ALL), ['princess', 'unicorn', 'mermaid']);
  });
  it('locked forms are refused politely', () => {
    assert.deepEqual(planFormChange(maps.woods, {}, { x: 5, y: 15 }, 'princess', 'unicorn'), { mode: 'unavailable', reason: 'locked' });
  });
  it('princess <-> unicorn swap in place on land', () => {
    assert.deepEqual(planFormChange(maps.woods, ALL, { x: 5, y: 15 }, 'princess', 'unicorn'), { mode: 'now' });
  });
  it('mermaid needs water: not in the woods or courtyard', () => {
    assert.deepEqual(planFormChange(maps.woods, ALL, { x: 5, y: 15 }, 'princess', 'mermaid'), { mode: 'unavailable', reason: 'no_water' });
    assert.deepEqual(planFormChange(maps.courtyard, ALL, { x: 12, y: 10 }, 'princess', 'mermaid'), { mode: 'unavailable', reason: 'no_water' });
  });
  it('on the shore, becoming a mermaid walks to the water edge and steps in', () => {
    const plan = planFormChange(shore, ALL, { x: 3, y: 13 }, 'princess', 'mermaid');
    assert.equal(plan.mode, 'walk');
    if (plan.mode === 'walk') {
      assert.ok(makeGrid(shore, ALL, 'princess').passable(plan.to.x, plan.to.y));
      assert.ok(plan.step && makeGrid(shore, ALL, 'mermaid').passable(plan.step.x, plan.step.y));
      assert.ok(findPath(makeGrid(shore, ALL, 'princess'), { x: 3, y: 13 }, plan.to));
    }
  });
  it('leaving the water steps onto dry land and is always possible', () => {
    for (const from of [{ x: 28, y: 13 }, { x: 20, y: 9 }, { x: 36, y: 17 }]) {
      for (const target of ['princess', 'unicorn'] as Form[]) {
        const plan = planFormChange(shore, ALL, from, 'mermaid', target);
        assert.equal(plan.mode, 'walk');
        if (plan.mode === 'walk') {
          assert.ok(makeGrid(shore, ALL, 'mermaid').passable(plan.to.x, plan.to.y));
          assert.ok(makeGrid(shore, ALL, target).passable(plan.step!.x, plan.step!.y));
        }
      }
    }
  });
  it('underwater there is only the mermaid form', () => {
    assert.deepEqual(planFormChange(maps.grotto, ALL, { x: 5, y: 7 }, 'mermaid', 'princess'), { mode: 'unavailable', reason: 'underwater' });
  });
  it('a unicorn on a creek tile can always return to princess', () => {
    const w = maps.woods;
    const plan = planFormChange(w, ALL, { x: 32, y: 5 }, 'unicorn', 'princess');
    assert.equal(plan.mode, 'walk');
    if (plan.mode === 'walk') assert.ok(makeGrid(w, ALL, 'princess').passable(plan.to.x, plan.to.y));
  });
});

describe('objective guide', () => {
  it('every main-path step resolves to a real object in the right scene', () => {
    for (const s of MAIN_PATH) {
      const t = OBJECTIVE_TARGET[s.flag];
      assert.ok(t, s.flag);
      assert.ok(getMap(t.scene).objects.some((o) => o.id === t.obj), `${s.flag} -> ${t.scene}/${t.obj}`);
    }
  });
  it('every exit id exists in its map and leads to an existing spawn', () => {
    for (const [from, exits] of Object.entries(EXITS) as [SceneId, Record<string, string>][])
      for (const [to, objId] of Object.entries(exits)) {
        const o = getMap(from).objects.find((x) => x.id === objId);
        assert.ok(o && o.kind === 'warp', `${from}->${to} (${objId})`);
        assert.equal(o!.to!.scene, to);
        assert.ok(o!.to!.spawn in getMap(to as SceneId).spawns, `${objId} spawn`);
      }
  });
  it('the whole chapter is routable from every scene at every step, ending home', () => {
    const scenes = Object.keys(maps) as SceneId[];
    const s = defaultState();
    for (const step of MAIN_PATH) {
      for (const scene of scenes) {
        assert.ok(sceneRoute(scene, OBJECTIVE_TARGET[step.flag].scene), `${scene} -> ${step.flag}`);
        for (const form of ['princess', 'unicorn', 'mermaid'] as Form[]) {
          const g = guideTarget(s, scene, form);
          assert.notEqual(g.type, 'none', `${scene}/${step.flag}`);
          if (g.type === 'object') assert.ok(getMap(scene).objects.some((o) => o.id === g.obj), `${scene}: ${g.obj}`);
        }
      }
      assert.ok(completeFlag(s, step.flag as QuestFlag));
    }
  });
  it('after the star the guide points the HUD home button', () => {
    const s = defaultState();
    for (const st of MAIN_PATH.slice(0, -1)) completeFlag(s, st.flag);
    assert.deepEqual(guideTarget(s, 'grotto', 'mermaid'), { type: 'home' });
    assert.deepEqual(guideTarget(s, 'courtyard', 'princess'), { type: 'object', obj: 'door_bedroom', why: 'LAMP_PLACED' });
  });
  it('on the shore it sends non-mermaids to the shimmer first', () => {
    const s = defaultState();
    for (const st of MAIN_PATH.slice(0, 4)) completeFlag(s, st.flag);
    assert.deepEqual(guideTarget(s, 'shore', 'princess'), { type: 'object', obj: 'shimmer', why: 'transform' });
    assert.deepEqual(guideTarget(s, 'shore', 'mermaid'), { type: 'object', obj: 'dive', why: 'MARINA_HELPED' });
  });
});
