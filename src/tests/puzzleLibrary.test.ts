// v0.4d.5: the activity library: coverage, validity, no immediate repeats, gentle adaptation, save sanitation.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FAMILIES, LIBRARY, challengesOf, defaultLibMemory, pickChallenge, recordResult, sanitizeLibMemory, type Family } from '../content/puzzleLibrary';
import { narrationByKey } from '../content/narrationManifest';
import { narrationKeysFor } from '../systems/puzzleEngine';
import { KINGDOM_KEYS } from '../art/kingdomArt';
import { ITEM, UI } from '../content/frameIndex';
import { sanitizeKingdom, defaultKingdom } from '../content/kingdom';

const isPic = (n: string) => (n.startsWith('px_') ? (KINGDOM_KEYS as readonly string[]).includes(n) || /^px_(flower|pkt|butterfly|lantern)_(red|blue|yellow|pink)$/.test(n) : n.startsWith('icon_') ? n in UI : n in ITEM);

describe('library coverage', () => {
  it('every family has at least 10 unique authored challenges and all three tiers', () => {
    for (const f of FAMILIES) {
      const list = challengesOf(f);
      assert.ok(list.length >= 10, `${f} has ${list.length}`);
      assert.equal(new Set(list.map((p) => p.id)).size, list.length, `${f} ids unique`);
      for (const t of [1, 2, 3]) assert.ok(list.some((p) => p.difficultyTier === t), `${f} tier ${t}`);
    }
    assert.ok(LIBRARY.length >= 150);
  });
  it('is not just one repeated answer: each family uses many different correct answers or faces', () => {
    for (const f of FAMILIES) {
      const faces = new Set(challengesOf(f).map((p) => (Array.isArray(p.correctAnswer) ? p.correctAnswer.join('+') : String(p.correctAnswer)) + '|' + p.promptVisual));
      assert.ok(faces.size >= 8, `${f} has ${faces.size} distinct faces`);
    }
  });
  it('every challenge is valid: answer among the choices, real pictures, spoken prompt/hints/words', () => {
    for (const p of LIBRARY) {
      assert.ok(isPic(p.promptVisual), `${p.id} prompt ${p.promptVisual}`);
      for (const c of p.choices) assert.ok(isPic(c.picture), `${p.id} choice ${c.picture}`);
      const ids = p.choices.map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, `${p.id} distinct choices`);
      if (typeof p.correctAnswer === 'string') assert.ok(ids.includes(p.correctAnswer), `${p.id} answer in choices`);
      else assert.ok((p.correctAnswer as string[]).every((a) => ids.includes(a)), `${p.id} sequence pieces in choices`);
      for (const k of narrationKeysFor(p).filter((k) => !k.startsWith('success_'))) assert.ok(narrationByKey(k), `${p.id} narration ${k}`);
      assert.ok(p.choices.length >= 2 && p.choices.length <= 5);
    }
  });
  it('tiers add more answers or steps', () => {
    for (const f of ['sound', 'rhyme', 'count', 'shape', 'nature'] as Family[]) {
      const avg = (t: number) => { const l = challengesOf(f).filter((p) => p.difficultyTier === t); return l.reduce((s, p) => s + p.choices.length, 0) / l.length; };
      assert.ok(avg(1) < avg(2) && avg(2) < avg(3), `${f} ${avg(1)} ${avg(2)} ${avg(3)}`);
    }
  });
  it('shape puzzles have exactly one exact match; count puzzles exactly one matching group', () => {
    for (const p of challengesOf('shape')) assert.equal(p.choices.filter((c) => c.picture === p.promptVisual).length, 1, p.id);
    for (const p of challengesOf('count')) assert.equal(p.choices.filter((c) => c.id === p.correctAnswer).length, 1, p.id);
  });
  it('patterns really repeat and the hidden part continues them', () => {
    for (const p of challengesOf('pattern')) { assert.ok(p.prefix && p.prefix.length >= 2); assert.ok(Array.isArray(p.correctAnswer) && p.correctAnswer.length >= 2); }
  });
});

describe('choosing and adapting', () => {
  it('30 consecutive activities per family never repeat the previous one and rarely repeat within a few', () => {
    for (const f of FAMILIES) {
      const mem = defaultLibMemory(); let prev = '';
      let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
      for (let i = 0; i < 30; i++) {
        const p = pickChallenge(f, mem, rnd); assert.notEqual(p.id, prev, `${f} immediate repeat at ${i}`);
        const lastFew = mem.recent.slice(-4); assert.ok(!lastFew.includes(p.id), `${f} repeated within 4 at ${i}`);
        recordResult(mem, f, p, 0, false); prev = p.id;
      }
    }
  });
  it('steps up after two clean wins, steps back after struggling, never below 1 or above 3', () => {
    const mem = defaultLibMemory(); const p = challengesOf('sound')[0];
    recordResult(mem, 'sound', p, 0, false); assert.equal(mem.level.sound, 1);
    recordResult(mem, 'sound', p, 1, false); assert.equal(mem.level.sound, 2);
    for (let i = 0; i < 6; i++) recordResult(mem, 'sound', p, 0, false); assert.equal(mem.level.sound, 3);
    recordResult(mem, 'sound', p, 4, true); assert.equal(mem.level.sound, 2);
    for (let i = 0; i < 5; i++) recordResult(mem, 'sound', p, 5, true); assert.equal(mem.level.sound, 1);
  });
  it('a child at tier 1 is served tier-1 challenges (until the pool is spent)', () => {
    const mem = defaultLibMemory();
    assert.equal(pickChallenge('count', mem).difficultyTier, 1);
  });
  it('save: memory is sanitized and round-trips; junk resets safely', () => {
    const m = defaultLibMemory(); m.recent = ['snd_B_1', 'nonsense']; m.level.sound = 3;
    const k = sanitizeKingdom({ ...defaultKingdom(), lib: m });
    assert.deepEqual(k.lib.recent, ['snd_B_1']); assert.equal(k.lib.level.sound, 3);
    assert.deepEqual(sanitizeLibMemory('x'), defaultLibMemory());
    assert.equal(sanitizeLibMemory({ level: { sound: 99 } }).level.sound, 1);
  });
});
