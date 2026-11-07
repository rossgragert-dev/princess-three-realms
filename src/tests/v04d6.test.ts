import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../world/missions';
import { getMap } from '../world/maps';
import { availableForms } from '../actors/transformations';

describe('v0.4d.6 stage 1', () => {
  it('every mission picture lands on a real spawn of a real map', () => {
    for (const [k, m] of Object.entries(MISSIONS)) assert.ok(getMap(m.scene).spawns[m.spawn], `${k} -> ${m.scene}/${m.spawn}`);
    assert.deepEqual(Object.keys(MISSIONS).sort(), ['garden', 'meadow', 'shore', 'woods']);
  });
  it('transformations are free from the beginning and never depend on flags', () => {
    assert.deepEqual(availableForms({}), ['princess', 'unicorn', 'mermaid']);
  });
});
