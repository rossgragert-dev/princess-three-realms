// v0.4d.1: navigation audit — transforms never strand her, doorways are single-destination and reciprocal.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMaps } from '../world/maps';
import { flood, makeGrid, type Flags } from '../world/navigation';
import { planFormChange } from '../actors/transformations';
import { SAFE_SPAWN } from '../systems/saveManager';

const ALL: Flags = { MARINA_HELPED: true, TREE_GATE_OPEN: true, WILLA_MET: true, RAINBOW_BRIDGE_OPEN: true, INTRO_DONE: true, PIP_CARROTS_DONE: true } as Flags;
const maps = getMaps();
const swimMaps = Object.values(maps).filter((m) => m.mermaidAllowed && m.medium !== 'water');

describe('mermaid transforms never strand her (every shore, both directions)', () => {
  for (const m of swimMaps) {
    it(`${m.id}: land to mermaid lands on swimmable water, mermaid to land lands on walkable land`, () => {
      const land = makeGrid(m, ALL, 'princess'), sea = makeGrid(m, ALL, 'mermaid');
      let checked = 0;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (land.passable(x, y)) {
          const p = planFormChange(m, ALL, { x, y }, 'princess', 'mermaid');
          if (p.mode === 'walk') {
            assert.ok(p.step && sea.passable(p.step.x, p.step.y), `${m.id} (${x},${y}) -> step not swimmable`);
            assert.ok(land.passable(p.to.x, p.to.y), `${m.id} (${x},${y}) -> shore tile not walkable`);
            checked++;
          }
        }
        if (sea.passable(x, y)) {
          const p = planFormChange(m, ALL, { x, y }, 'mermaid', 'princess');
          if (p.mode === 'walk') {
            assert.ok(p.step && land.passable(p.step.x, p.step.y), `${m.id} (${x},${y}) -> mermaid return step not walkable`);
            assert.ok(sea.passable(p.to.x, p.to.y), `${m.id} (${x},${y}) -> mermaid shore tile not swimmable`);
            checked++;
          }
        }
      }
      assert.ok(checked > 0, 'no transform plans were exercised');
    });
  }
});

describe('spawns are standable and every warp names a real spawn', () => {
  it('each spawn tile is passable in the usual form, and SAFE_SPAWN names a real spawn', () => {
    for (const m of Object.values(maps)) {
      const land = makeGrid(m, ALL, 'princess'), sea = makeGrid(m, ALL, 'mermaid');
      // a spawn may be a swimmer's arrival (surfacing), so either form standing there is enough
      for (const [name, t] of Object.entries(m.spawns)) assert.ok(land.passable(t.x, t.y) || sea.passable(t.x, t.y), `${m.id}.${name} (${t.x},${t.y}) is blocked`);
      assert.ok(m.spawns[SAFE_SPAWN[m.id]], `${m.id} SAFE_SPAWN '${SAFE_SPAWN[m.id]}' missing`);
    }
  });
  it('every warp.to.spawn exists in its destination', () => {
    for (const m of Object.values(maps)) for (const o of m.objects) {
      if (o.kind === 'warp' && o.to) assert.ok(maps[o.to.scene].spawns[o.to.spawn], `${m.id}/${o.id} -> ${o.to.scene}.${o.to.spawn} missing`);
    }
  });
});

describe('doorways: one destination per edge, every exit has a way back', () => {
  const warps = Object.values(maps).flatMap((m) => m.objects.filter((o) => o.kind === 'warp' && o.to).map((o) => ({ m, o })));
  it('every warp targets an existing scene with a matching reciprocal warp', () => {
    for (const { m, o } of warps) {
      const dest = maps[o.to!.scene];
      assert.ok(dest, `${m.id}/${o.id} -> unknown scene ${o.to!.scene}`);
      const back = dest.objects.some((q) => q.kind === 'warp' && q.to?.scene === m.id);
      assert.ok(back, `${m.id}/${o.id} -> ${dest.id} has no way back`);
    }
  });
  it('no two auto-warps with different destinations touch each other', () => {
    for (const m of Object.values(maps)) {
      const ws = m.objects.filter((o) => o.kind === 'warp' && o.tiles?.length);
      for (const a of ws) for (const b of ws) {
        if (a.id >= b.id || a.to?.scene === b.to?.scene) continue;
        const touch = a.tiles!.some((t) => b.tiles!.some((u) => Math.abs(t.x - u.x) <= 1 && Math.abs(t.y - u.y) <= 1));
        assert.ok(!touch, `${m.id}: warps ${a.id} (${a.to?.scene}) and ${b.id} (${b.to?.scene}) overlap or touch`);
      }
    }
  });
});

describe('v0.4d courtyard / castle / woods topology', () => {
  const c = maps.courtyard;
  it('the east border leads only to the Whispering Woods', () => {
    const east = c.objects.filter((o) => o.kind === 'warp' && (o.tiles ?? []).some((t) => t.x >= c.w - 2));
    assert.ok(east.length >= 1);
    for (const o of east) assert.equal(o.to!.scene, 'woods', o.id);
  });
  it('the west border leads to one place, the garden has its own archway, the castle gate is a real door', () => {
    assert.equal(c.objects.filter((o) => o.kind === 'warp' && (o.tiles ?? []).some((t) => t.x <= 1)).map((o) => o.to!.scene).join(), 'festival');
    const gate = c.objects.find((o) => o.id === 'gate_throne')!;
    assert.equal(gate.to!.scene, 'throne');
    const arch = c.objects.find((o) => o.id === 'warp_garden')!;
    assert.equal(arch.to!.scene, 'garden');
    assert.ok(arch.tiles!.every((t) => t.x < c.w - 4), 'garden arch is not on the woods border');
  });
  it('every courtyard warp is reachable on foot from the start, in the princess form', () => {
    const g = makeGrid(c, ALL, 'princess'), reach = flood(g, c.spawns.start);
    for (const o of c.objects.filter((q) => q.kind === 'warp')) assert.ok(o.tiles!.some((t) => reach.has(t.y * 4096 + t.x)), `${o.id} unreachable`);
  });
  it('the Throne Room and Greenhouse are reachable from their spawns and their exit works', () => {
    for (const id of ['throne', 'greenhouse'] as const) {
      const m = maps[id], g = makeGrid(m, ALL, 'princess'), reach = flood(g, Object.values(m.spawns)[0]);
      const exit = m.objects.find((o) => o.id === 'door_exit')!;
      assert.ok(exit.tiles!.some((t) => reach.has(t.y * 4096 + t.x)), `${id} exit unreachable`);
      assert.notEqual(exit.to!.scene, 'conservatory');
    }
    assert.equal(maps.greenhouse.objects.find((o) => o.id === 'door_exit')!.to!.scene, 'garden');
    assert.equal(maps.garden.objects.find((o) => o.id === 'door_greenhouse')!.to!.scene, 'greenhouse');
  });
  it('the Queen\'s workshop is no longer entered from the garden', () => {
    assert.ok(!maps.garden.objects.some((o) => o.to?.scene === 'conservatory'));
    assert.ok(!maps.conservatory.objects.some((o) => o.to?.scene === 'garden'));
  });
  it('Enchanted Woods: arriving from the south-going trail puts her at the NORTH edge, with the exit also north', () => {
    const e = maps.enchanted, sp = e.spawns.from_woods, exit = e.objects.find((o) => o.id === 'warp_woods')!;
    assert.ok(sp.y <= 5, `spawn y=${sp.y}`);
    assert.ok(exit.tiles!.every((t) => t.y <= 1), 'exit on the north edge');
    assert.ok(sp.y > exit.tiles![0].y, 'she arrives south of the exit, facing deeper');
    const w = maps.woods.objects.find((o) => o.id === 'warp_enchanted')!;
    assert.ok(w.tiles!.every((t) => t.y >= maps.woods.h - 2), 'the trail leaves the Whispering Woods heading south');
  });
});
