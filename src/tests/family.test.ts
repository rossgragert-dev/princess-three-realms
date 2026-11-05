import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_REWARD, ALL_OPTIONS, DEFAULT_WAND, EXTRA_DECOR, FW_COLORS, FW_MAX_PARTICLES, FW_MODES, FW_SHAPES, START_OPTIONS, WAND_COLORS, WAND_HEADS, WAND_TRAILS,
  burstPoints, defaultActivities, grantDecor, sanitizeActivities, sanitizeUnlockedWand, sanitizeWand, syncWandUnlocks
} from '../content/family';
import { defaultState, sanitize } from '../systems/saveManager';
import { SAFE_SPAWN } from '../systems/saveManager';
import { getMap } from '../world/maps';
import { makeGrid, flood, tileKey, nearestPassable } from '../world/navigation';
import { EXITS } from '../world/guide';

describe('fireworks designs', () => {
  it('offers 6 colours, 5 shapes and 3 launch modes', () => { assert.equal(FW_COLORS.length, 6); assert.equal(FW_SHAPES.length, 5); assert.deepEqual([...FW_MODES], [1, 2, 3]); });
  it('every shape has exactly the asked number of points, bounded, finite and inside the unit box', () => {
    for (const s of FW_SHAPES) for (const n of [8, 30, 40, 72, 96, 500]) {
      const pts = burstPoints(s, n); const want = Math.max(8, Math.min(FW_MAX_PARTICLES, n));
      assert.equal(pts.length, want, `${s}/${n}`);
      for (const p of pts) { assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); assert.ok(Math.abs(p.x) <= 1.05 && Math.abs(p.y) <= 1.4, `${s} ${p.x},${p.y}`); }
    }
  });
  it('the five shapes are visibly different from each other', () => {
    const sig = (s: (typeof FW_SHAPES)[number]) => burstPoints(s, 72).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
    assert.equal(new Set(FW_SHAPES.map(sig)).size, 5);
  });
});

describe('wand customisation data', () => {
  it('has 6 heads, 8 colours and 4 trails; the start set gives >= 3 heads, 6 colours and 2 trails', () => {
    assert.equal(WAND_HEADS.length, 6); assert.equal(WAND_COLORS.length, 8); assert.equal(WAND_TRAILS.length, 4);
    assert.ok(START_OPTIONS.filter((o) => o.startsWith('head:')).length >= 3);
    assert.ok(START_OPTIONS.filter((o) => o.startsWith('color:')).length >= 6);
    assert.ok(START_OPTIONS.filter((o) => o.startsWith('trail:')).length >= 2);
    assert.equal(ALL_OPTIONS.length, 18);
  });
  it('an old save (no wand fields) gets the default wand, the start options and empty activities', () => {
    const s = sanitize({ version: 1, scene: 'courtyard', flags: { INTRO_DONE: true } });
    assert.deepEqual(s.equippedWand, DEFAULT_WAND);
    for (const o of START_OPTIONS) assert.ok(s.unlockedWand.includes(o));
    assert.deepEqual(s.activities, defaultActivities());
  });
  it('an equipped wand must be owned: junk and locked choices fall back to the default part', () => {
    const owned = sanitizeUnlockedWand(['head:moon', 'bogus', 42]);
    assert.ok(owned.includes('head:moon') && !owned.includes('bogus'));
    assert.deepEqual(sanitizeWand({ headId: 'crystal', colorId: 'gold', trailId: 'bubble' }, owned), { headId: 'star', colorId: 'gold', trailId: 'star' });
    assert.deepEqual(sanitizeWand({ headId: 'moon', colorId: 'nope' }, owned), { headId: 'moon', colorId: 'pink', trailId: 'star' });
    assert.deepEqual(sanitizeWand(null, owned), DEFAULT_WAND);
  });
  it('earned options appear once the matching exploring is done, idempotently, and never disappear', () => {
    const s = defaultState(); syncWandUnlocks(s);
    assert.ok(!s.unlockedWand.includes('head:moon'));
    s.activities.fireworks.sessions = 1; s.flags.RAINBOW_BRIDGE_OPEN = true;
    const gained = syncWandUnlocks(s); assert.deepEqual(gained.sort(), ['color:rainbow', 'head:moon']);
    assert.deepEqual(syncWandUnlocks(s), []);
    s.activities.fireworks.sessions = 0; syncWandUnlocks(s); assert.ok(s.unlockedWand.includes('head:moon'));
  });
  it('equipped and unlocked are saved separately and round-trip through sanitize', () => {
    const s = defaultState(); s.unlockedWand.push('head:moon'); s.equippedWand = { headId: 'moon', colorId: 'blue', trailId: 'petal' };
    const r = sanitize(JSON.parse(JSON.stringify(s)));
    assert.deepEqual(r.equippedWand, s.equippedWand); assert.ok(r.unlockedWand.includes('head:moon'));
  });
  it('activity counters survive and are clamped', () => {
    const a = sanitizeActivities({ fireworks: { sessions: 2, launched: -5, designs: ['star:pink', 7, 'Bad Id'] }, tag: { sessions: 1e12, tags: 'x' } });
    assert.equal(a.fireworks.sessions, 2); assert.equal(a.fireworks.launched, 0); assert.deepEqual(a.fireworks.designs, ['star:pink']);
    assert.ok(a.tag.sessions <= 1_000_000 && a.tag.tags === 0);
  });
});

describe('activity rewards', () => {
  it('rewards are granted exactly once and only for real extra decorations', () => {
    const s = { unlockedDecor: [] as string[] };
    assert.equal(grantDecor(s, ACTIVITY_REWARD.fireworks), true); assert.equal(grantDecor(s, ACTIVITY_REWARD.fireworks), false);
    assert.equal(grantDecor(s, ACTIVITY_REWARD.tag), true); assert.equal(grantDecor(s, 'not_a_reward'), false);
    assert.deepEqual([...s.unlockedDecor].sort(), [...EXTRA_DECOR].sort());
  });
  it('earned rewards survive sanitize and cannot be forged by a bad value', () => {
    const r = sanitize({ version: 1, unlockedDecor: ['festival_garland', 'meadow_cushion', 'junk'] });
    assert.ok(r.unlockedDecor.includes('festival_garland') && r.unlockedDecor.includes('meadow_cushion') && !r.unlockedDecor.includes('junk'));
  });
});

describe('new maps are connected and safe', () => {
  const ALL = Object.fromEntries(['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN'].map((f) => [f, true]));
  it('every new scene has a safe spawn on a walkable tile and a way back', () => {
    for (const id of ['festival', 'conservatory', 'meadow'] as const) {
      const m = getMap(id); const form = id === 'meadow' ? 'unicorn' : 'princess';
      const sp = m.spawns[SAFE_SPAWN[id]]; assert.ok(sp, `${id} safe spawn`);
      const g = makeGrid(m, ALL, form); assert.ok(g.passable(sp.x, sp.y), `${id} spawn walkable`);
      assert.ok(EXITS[id], `${id} has an exit rule`);
      const reach = flood(g, nearestPassable(g, sp, 2)!);
      for (const o of m.objects) {
        const tiles = o.tiles ?? [{ x: o.x, y: o.y }];
        if (o.kind === 'warp') assert.ok(tiles.some((t) => reach.has(tileKey(t))), `${id}: ${o.id} unreachable`);
        else assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1], [0, 2], [0, -2], [2, 0], [-2, 0]].some(([dx, dy]) => reach.has(tileKey({ x: o.x + dx, y: o.y + dy }))), `${id}: ${o.id} not approachable`);
      }
    }
  });
  it('the old chapter-1 maps are unchanged in their warps and stations', () => {
    const c = getMap('courtyard'); for (const id of ['warp_woods', 'warp_festival', 'door_conservatory']) assert.ok(c.objects.some((o) => o.id === id), id);
    assert.ok(getMap('woods').objects.some((o) => o.id === 'warp_meadow' && o.showWhen === 'WILLA_MET'));
  });
});
