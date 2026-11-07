// v0.4d.3: bedroom bed art, pet save data, Pet Keeper placement.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMaps } from '../world/maps';
import { flood, makeGrid, type Flags } from '../world/navigation';
import { sanitizeKingdom, defaultKingdom, petKey, PET_TYPES } from '../content/kingdom';
import { FURNITURE } from '../content/furniture';

const maps = getMaps();
const key = (t: { x: number; y: number }) => t.y * 4096 + t.x;

describe('pet save data', () => {
  it('defaults to no pet', () => assert.equal(defaultKingdom().pet, null));
  it('round-trips a valid pet and clamps nonsense', () => {
    assert.deepEqual(sanitizeKingdom({ ...defaultKingdom(), pet: { type: 2, look: 3 } }).pet, { type: 2, look: 3 });
    const p = sanitizeKingdom({ ...defaultKingdom(), pet: { type: 99, look: -4 } }).pet!;
    assert.ok(p.type >= 0 && p.type < PET_TYPES.length && p.look >= 0 && p.look <= 3);
    assert.equal(sanitizeKingdom({ ...defaultKingdom(), pet: 'dog' as never }).pet, null);
  });
  it('has four pets with four looks each', () => {
    assert.equal(PET_TYPES.length, 4);
    for (let t = 0; t < 4; t++) for (let v = 0; v < 4; v++) assert.match(petKey({ type: t, look: v }), /^px_pet_(cat|dog|pony|bird)[0-3]$/);
  });
});

describe('Pet Keeper and beds', () => {
  it('the Pet Keeper stands in the courtyard and the princess can reach her', () => {
    const m = maps.courtyard, g = makeGrid(m, {} as Flags, 'princess');
    const k = m.objects.find((o) => o.id === 'pet_keeper')!;
    assert.ok(k, 'keeper exists');
    const reach = flood(g, m.spawns.start);
    assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reach.has(key({ x: k.x + dx, y: k.y + dy }))), 'keeper reachable');
  });
  it('all three beds use the new art', () => {
    for (const id of ['cozy_bed', 'sunny_bed', 'canopy_bed']) assert.ok(FURNITURE[id].key.startsWith('px_bed_'), id);
  });
});
