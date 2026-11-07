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

import { FOODS, FOOD_IDS, MAX_SCOOPS, MAX_TOPPINGS, defaultFoods, onFood, place, sanitizeFoods, spotFromOffset, toppingOffset, undoLast } from '../world/foodDesign';
import { defaultKingdom, sanitizeKingdom } from '../content/kingdom';

describe('v0.4d.6 kitchen designs', () => {
  const cake = FOODS.cook_cake;
  it('placing is exact: the stored spot round-trips to the tapped offset', () => {
    const r = 52;
    const sp = spotFromOffset(cake, -r * 0.95, 0)!; // the left edge
    assert.ok(sp && sp.u < -0.9);
    const list = place(cake, [], 'px_t_cherry', sp.u, sp.v)!;
    const o = toppingOffset(cake, list[0], 0);
    assert.ok(Math.abs(o.dx - -r * 0.95) < 0.5 && Math.abs(o.dy) < 0.5);
  });
  it('two different taps give two different spots (never random)', () => {
    let l = place(cake, [], 'px_t_cherry', -0.5, 0.2)!; l = place(cake, l, 'px_t_star', 0.6, -0.3)!;
    assert.deepEqual(l.map((t) => [t.u, t.v]), [[-0.5, 0.2], [0.6, -0.3]]);
  });
  it('off the food, unknown keys and a full dish place nothing', () => {
    assert.equal(spotFromOffset(cake, 200, 0), null);
    assert.equal(place(cake, [], 'px_t_cherry', 2, 0), null);
    assert.equal(place(cake, [], 'px_t_olive', 0, 0), null);
    let l: ReturnType<typeof place> = [];
    for (let i = 0; i < MAX_TOPPINGS; i++) l = place(cake, l!, 'px_t_star', 0, 0);
    assert.equal(place(cake, l!, 'px_t_star', 0, 0), null);
  });
  it('undo removes only the last topping', () => {
    const l = place(cake, place(cake, [], 'px_t_star', 0, 0)!, 'px_t_cherry', 0.1, 0.1)!;
    assert.deepEqual(undoLast(l).map((t) => t.key), ['px_t_star']);
  });
  it('ice cream stacks scoops up to five at predictable heights', () => {
    const ic = FOODS.cook_icecream;
    let l: ReturnType<typeof place> = [];
    for (let i = 0; i < MAX_SCOOPS; i++) l = place(ic, l!, 'px_t_pink', 0, 0);
    assert.equal(place(ic, l!, 'px_t_pink', 0, 0), null);
    assert.ok(toppingOffset(ic, l![1], 1).dy < toppingOffset(ic, l![0], 0).dy);
  });
  it('sanitize: bad keys, off-dish spots, huge lists, junk are dropped; stands are independent', () => {
    const raw = { cook_cake: { toppings: [{ key: 'px_t_cherry', u: 0.2, v: 0.1 }, { key: 'bogus', u: 0, v: 0 }, { key: 'px_t_star', u: 9, v: 9 }, null, 5], eaten: false },
      cook_cookies: { toppings: Array.from({ length: 200 }, () => ({ key: 'px_t_choc', u: 0, v: 0 })), eaten: false }, cook_pizza: 'x', cook_icecream: { eaten: true, toppings: [{ key: 'px_t_pink', u: 0, v: 0 }] } };
    const f = sanitizeFoods(raw);
    assert.equal(f.cook_cake!.toppings.length, 1);
    assert.equal(f.cook_cookies!.toppings.length, MAX_TOPPINGS);
    assert.equal(f.cook_pizza, null);
    assert.deepEqual(f.cook_icecream, { toppings: [], eaten: true });
    assert.deepEqual(sanitizeFoods(null), defaultFoods());
    assert.deepEqual(Object.keys(f).sort(), [...FOOD_IDS].sort());
  });
  it('old kingdom saves without food load with plain dishes; new ones round-trip', () => {
    const k = sanitizeKingdom({ garden: {} });
    assert.deepEqual(k.food, defaultFoods());
    const k2 = defaultKingdom(); k2.food.cook_cake = { toppings: [{ key: 'px_t_star', u: 0.3, v: -0.2 }], eaten: false };
    assert.deepEqual(sanitizeKingdom(JSON.parse(JSON.stringify(k2))).food.cook_cake, k2.food.cook_cake);
    assert.ok(onFood(0, 0.99) && !onFood(0.8, 0.8));
  });
});

import { DRESSES } from '../content/appearance';
import { ATLAS, OW_PJS, OW_STYLES } from '../content/wardrobeIndex';
import { readFileSync } from 'node:fs';

describe('v0.4d.6 pajamas', () => {
  const pj = ['pj_hearts', 'pj_stars', 'pj_moon', 'pj_rainbow'];
  it('four free pajamas exist with real atlas layers in both wardrobe atlases', () => {
    for (const id of pj) {
      const d = DRESSES.find((x) => x.id === id);
      assert.ok(d && !d.flag, id);
      for (const k of ['wd_full', 'wd_port'] as const) assert.ok(`dress:${id}` in ATLAS[k].cells, `${k} ${id}`);
    }
  });
  it('every pajama has an overworld sheet for every hairstyle', () => {
    const manifest = JSON.parse(readFileSync('public/assets/manifest.json', 'utf8')) as { sheets: { key: string }[] };
    const keys = new Set(manifest.sheets.map((s) => s.key));
    assert.deepEqual([...OW_PJS], pj);
    for (const id of OW_PJS) for (const st of OW_STYLES) assert.ok(keys.has(`ow_${id}_${st}`), `${id} ${st}`);
  });
});
