import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, puzzleById } from '../content/puzzleBank';
import { NARRATION, narrationByKey } from '../content/narrationManifest';
import {
  answerChoice, answerSequence, countTap, newProgress, narrationKeysFor,
  displayOrder, visibleChoices, assistedSolution, ASSIST_AFTER
} from '../systems/puzzleEngine';
import { completeFlag, nextObjective, canComplete, MAIN_PATH, chapterComplete } from '../systems/questEngine';
import { SaveManager, defaultState, sanitize, SAVE_KEY, type KV } from '../systems/saveManager';

const memStore = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('puzzle bank', () => {
  it('has 4 mandatory and 11 optional puzzles', () => {
    assert.equal(PUZZLES.filter((p) => p.mandatory).length, 4);
    assert.equal(PUZZLES.filter((p) => !p.mandatory).length, 11); // 2 earlier + 9 Kingdom Beyond activities
  });
  it('every narration key a puzzle needs exists in the manifest (T06)', () => {
    for (const p of PUZZLES) for (const k of narrationKeysFor(p)) assert.ok(narrationByKey(k), `missing narration: ${k} (${p.id})`);
  });
  it('narration keys are unique', () => {
    const keys = NARRATION.map((n) => n.key);
    assert.equal(new Set(keys).size, keys.length);
  });
  it('choice answers refer to real choices', () => {
    for (const p of PUZZLES) {
      const ids = p.choices.map((c) => c.id);
      if (typeof p.correctAnswer === 'string') assert.ok(ids.includes(p.correctAnswer));
      if (Array.isArray(p.correctAnswer)) p.correctAnswer.forEach((a) => assert.ok(ids.includes(a)));
    }
  });
});

describe('initial sound puzzle (T07)', () => {
  const p = puzzleById('tree_sound')!;
  it('ball is correct regardless of display order', () => {
    for (let seed = 1; seed < 30; seed++) {
      const order = displayOrder(p, seed);
      assert.equal(order.length, 3);
      assert.ok(order.includes('ball'));
      const prog = newProgress();
      assert.equal(answerChoice(p, prog, order[order.indexOf('ball')]).kind, 'correct');
    }
  });
});

describe('wrong answers (T10)', () => {
  it('give friendly retry with escalating hints, never block, simplify then assist', () => {
    const p = puzzleById('tree_sound')!;
    const prog = newProgress();
    const r1 = answerChoice(p, prog, 'cat');
    assert.equal(r1.kind, 'retry');
    assert.equal(visibleChoices(p, prog).length, 3);
    answerChoice(p, prog, 'sun');
    assert.deepEqual(visibleChoices(p, prog), ['ball']); // distractors removed after 2 misses
    assert.equal(assistedSolution(p, prog), null);
    answerChoice(p, prog, 'cat'); answerChoice(p, prog, 'sun');
    assert.equal(prog.attempts, ASSIST_AFTER);
    assert.equal(assistedSolution(p, prog), 'ball');
    const ok = answerChoice(p, prog, 'ball');
    assert.deepEqual(ok, { kind: 'correct', assisted: true }); // solving with help is still success
  });
  it('ignores unknown ids and repeated input after solve', () => {
    const p = puzzleById('shell_rhyme')!;
    const prog = newProgress();
    assert.equal(answerChoice(p, prog, 'nope').kind, 'ignored');
    answerChoice(p, prog, 'hat');
    assert.equal(answerChoice(p, prog, 'fish').kind, 'ignored');
  });
});

describe('pattern bridge (T08)', () => {
  const p = puzzleById('bridge_pattern')!;
  it('accepts red,blue and rejects blue,red', () => {
    assert.equal(answerSequence(p, newProgress(), ['tile_blue', 'tile_red']).kind, 'retry');
    assert.equal(answerSequence(p, newProgress(), ['tile_red', 'tile_blue']).kind, 'correct');
  });
  it('does not penalise a half-filled pattern', () => {
    const prog = newProgress();
    assert.equal(answerSequence(p, prog, ['tile_red']).kind, 'ignored');
    assert.equal(prog.attempts, 0);
  });
});

describe('counting (T09)', () => {
  it('counts each object once; duplicate taps never advance the count', () => {
    const p = puzzleById('carrots')!;
    const prog = newProgress(); const seen = new Set<string>();
    assert.deepEqual(countTap(p, prog, seen, 'c1'), { result: 'counted', number: 1 });
    assert.deepEqual(countTap(p, prog, seen, 'c1'), { result: 'duplicate', number: 1 });
    assert.deepEqual(countTap(p, prog, seen, 'c2'), { result: 'counted', number: 2 });
    assert.deepEqual(countTap(p, prog, seen, 'c3'), { result: 'done', number: 3 });
    assert.ok(prog.solved);
  });
});

describe('sequence puzzle', () => {
  it('seed, water, flower', () => {
    const p = puzzleById('garden_grow')!;
    assert.equal(answerSequence(p, newProgress(), ['seed', 'flower', 'water']).kind, 'retry');
    assert.equal(answerSequence(p, newProgress(), ['seed', 'water', 'flower']).kind, 'correct');
  });
});

describe('quest engine', () => {
  it('main path cannot be skipped and flags are idempotent (no reward farming)', () => {
    const s = defaultState();
    assert.equal(canComplete(s, 'STAR_1_FOUND'), false);
    assert.equal(completeFlag(s, 'STAR_1_FOUND'), false);
    assert.equal(s.stars, 0);
    for (const step of MAIN_PATH) assert.equal(completeFlag(s, step.flag), true, step.flag);
    assert.equal(completeFlag(s, 'STAR_1_FOUND'), false);
    assert.equal(s.stars, 1);
    assert.deepEqual(s.stickers.filter((x) => x === 'sticker_star').length, 1);
    assert.ok(s.unlockedDecor.includes('star_lamp'));
    assert.equal(nextObjective(s), null);
    assert.ok(chapterComplete(s));
  });
  it('optional puzzles are never gated and unlock decor (T11)', () => {
    const s = defaultState();
    assert.equal(completeFlag(s, 'SHELLS_MATCHED'), true);
    assert.ok(s.unlockedDecor.includes('rainbow_rug'));
  });
  it('next objective follows the path', () => {
    const s = defaultState();
    assert.equal(nextObjective(s)!.flag, 'INTRO_DONE');
    completeFlag(s, 'INTRO_DONE');
    assert.equal(nextObjective(s)!.flag, 'PIP_CARROTS_DONE');
  });
});

describe('save / resume (T13)', () => {
  it('round-trips state', () => {
    const st = memStore(); const a = new SaveManager(st);
    completeFlag(a.state, 'INTRO_DONE'); a.state.unlockedDecor = ['star_lamp']; a.state.bedroomLayout = [{ id: 'star_lamp#1', item: 'star_lamp', x: 17, y: 8 }]; a.state.scene = 'woods'; a.state.form = 'unicorn';
    a.save();
    const b = new SaveManager(st);
    assert.equal(b.state.flags.INTRO_DONE, true);
    assert.ok(b.state.bedroomLayout.some((p) => p.item === 'star_lamp'));
    assert.equal(b.state.form, 'unicorn');
  });
  it('corrupt or hostile data falls back safely', () => {
    const st = memStore(); st.setItem(SAVE_KEY, '{not json');
    assert.deepEqual(new SaveManager(st).state, defaultState());
    const s = sanitize({ scene: 'nowhere', form: 'dragon', stars: 99, stickers: [1, 'a'] });
    assert.equal(s.scene, 'courtyard'); assert.equal(s.form, 'princess'); assert.equal(s.stars, 6); assert.deepEqual(s.stickers, ['a']);
  });
  it('never restores an invalid form for the scene (T05)', () => {
    assert.equal(sanitize({ scene: 'grotto', form: 'princess' }).form, 'mermaid');
    assert.equal(sanitize({ scene: 'woods', form: 'mermaid' }).form, 'princess');
    assert.equal(sanitize({ scene: 'shore', form: 'mermaid' }).form, 'mermaid');
  });
  it('reset clears storage', () => {
    const st = memStore(); const a = new SaveManager(st); a.save(); a.reset();
    assert.equal(st.getItem(SAVE_KEY), null);
  });
  it('save never throws when storage is unavailable', () => {
    const bad: KV = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    const m = new SaveManager(bad); m.save(); m.reset();
  });
});
