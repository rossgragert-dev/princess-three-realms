// v0.4d.5: the large replayable activity library. Seven families, 170+ authored challenges in three gentle tiers.
// Tier 1: very pictorial, two answers. Tier 2: more answers / longer patterns. Tier 3: more steps and near-miss answers.
// Everything is pictures plus a spoken prompt; every key is generated into the narration manifest (see narrationManifest.ts).
import type { PuzzleDef, QuestFlag } from '../types/game';

export type Family = 'sound' | 'rhyme' | 'count' | 'shape' | 'pattern' | 'story' | 'nature';
export const FAMILIES: readonly Family[] = ['sound', 'rhyme', 'count', 'shape', 'pattern', 'story', 'nature'];
export type Tier = 1 | 2 | 3;
export interface LibPuzzle extends PuzzleDef { family: Family }

/** Words that have a real picture. id -> picture key + the word as spoken. */
export const WORDS: Record<string, { pic: string; say: string }> = {
  ball: { pic: 'ball', say: 'Ball' }, cat: { pic: 'cat', say: 'Cat' }, sun: { pic: 'sun', say: 'Sun' }, fish: { pic: 'fish', say: 'Fish' }, hat: { pic: 'hat', say: 'Hat' },
  tree: { pic: 'px_treepic', say: 'Tree' }, log: { pic: 'px_log', say: 'Log' }, egg: { pic: 'px_egg', say: 'Egg' }, deer: { pic: 'px_deer', say: 'Deer' },
  mushroom: { pic: 'mushroom', say: 'Mushroom' }, pizza: { pic: 'px_pizza', say: 'Pizza' }, owl: { pic: 'px_owl', say: 'Owl' }, bee: { pic: 'px_bee', say: 'Bee' },
  frog: { pic: 'px_frog', say: 'Frog' }, hen: { pic: 'px_hen', say: 'Hen' }, chick: { pic: 'px_chick', say: 'Chick' }, star: { pic: 'star', say: 'Star' },
  flower: { pic: 'flower', say: 'Flower' }, carrot: { pic: 'carrot', say: 'Carrot' }, seed: { pic: 'seed', say: 'Seed' }, water: { pic: 'water', say: 'Water' },
  dog: { pic: 'px_pet_dog0', say: 'Dog' }, fox: { pic: 'px_fox', say: 'Fox' }, squirrel: { pic: 'px_squirrel', say: 'Squirrel' }, ladybug: { pic: 'px_ladybug', say: 'Ladybug' },
  heart: { pic: 'heart', say: 'Heart' }, cake: { pic: 'px_cake', say: 'Cake' }, shell: { pic: 'shell', say: 'Shell' }, sprout: { pic: 'px_sprout', say: 'Sprout' },
  mound: { pic: 'px_seedmound', say: 'Soil' }, packet: { pic: 'px_pkt_red', say: 'Seed packet' }, tile_red: { pic: 'tile_red', say: 'Red' }, tile_blue: { pic: 'tile_blue', say: 'Blue' }
};
export const COLORS = ['red', 'blue', 'yellow', 'pink'] as const;
export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'] as const;
export const CNT_SHAPES = ['star', 'heart', 'flower', 'ball'] as const;
export const shapeKey = (s: string, c: string) => `px_shape_${s}_${c}`;
export const cntKey = (s: string, n: number) => `px_cnt_${s}${n}`;
const NUM_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

const out: LibPuzzle[] = [];
const ch = (id: string) => ({ id, picture: WORDS[id].pic, narrationKey: `word_${id}` });
const base = (id: string, family: Family, o: Partial<LibPuzzle> & Pick<LibPuzzle, 'type' | 'narrationKey' | 'promptVisual' | 'choices' | 'correctAnswer' | 'hintKeys' | 'difficultyTier'>) =>
  out.push({ id, family, realm: 'wilds', mandatory: false, successEvent: 'PUZZLE_LIBRARY' as QuestFlag, replayAllowed: true, reward: null, ...o });
/** Deterministic pick of n items from a pool (skipping `not`), rotating by a seed so tiers differ. */
const take = (pool: string[], n: number, not: (s: string) => boolean, seed: number) => {
  const ok = pool.filter((p) => !not(p)); const res: string[] = [];
  for (let i = 0; res.length < n && i < ok.length * 2; i++) { const p = ok[(seed + i * 3) % ok.length]; if (!res.includes(p)) res.push(p); }
  return res;
};

// ---------------------------------------------------------------- 1. first sounds (12 letters x 3 tiers = 36)
export const SOUNDS: { letter: string; ph: string; word: string }[] = [
  { letter: 'B', ph: 'buh', word: 'ball' }, { letter: 'C', ph: 'kuh', word: 'cat' }, { letter: 'S', ph: 'sss', word: 'sun' }, { letter: 'F', ph: 'fff', word: 'fish' },
  { letter: 'H', ph: 'huh', word: 'hat' }, { letter: 'T', ph: 'tuh', word: 'tree' }, { letter: 'L', ph: 'lll', word: 'log' }, { letter: 'E', ph: 'eh', word: 'egg' },
  { letter: 'D', ph: 'duh', word: 'deer' }, { letter: 'M', ph: 'mmm', word: 'mushroom' }, { letter: 'P', ph: 'puh', word: 'pizza' }, { letter: 'O', ph: 'oh', word: 'owl' }
];
const SOUND_POOL = Object.keys(WORDS).filter((w) => !['tile_red', 'tile_blue', 'packet', 'mound', 'sprout'].includes(w));
SOUNDS.forEach((s, i) => {
  for (const tier of [1, 2, 3] as Tier[]) {
    const distract = take(SOUND_POOL, tier + 1, (w) => WORDS[w].say[0].toUpperCase() === s.letter || w === s.word, i * 2 + tier);
    base(`snd_${s.letter}_${tier}`, 'sound', {
      type: 'sound-picture', narrationKey: `lib_snd_${s.letter}`, promptVisual: 'icon_speaker', letter: s.letter, difficultyTier: tier,
      choices: [s.word, ...distract].map(ch), correctAnswer: s.word, hintKeys: [`lib_snd_${s.letter}_h1`, `lib_snd_${s.letter}_h2`, 'hint_together']
    });
  }
});

// ---------------------------------------------------------------- 2. rhymes (10 pairs x 3 tiers = 30)
export const RHYMES: [string, string][] = [['cat', 'hat'], ['hat', 'cat'], ['bee', 'tree'], ['tree', 'bee'], ['frog', 'log'], ['log', 'frog'], ['dog', 'log'], ['log', 'dog'], ['frog', 'dog'], ['dog', 'frog']];
const rhymeGroup = (w: string) => (['cat', 'hat'].includes(w) ? 'at' : ['bee', 'tree'].includes(w) ? 'ee' : ['frog', 'log', 'dog'].includes(w) ? 'og' : w);
RHYMES.forEach(([a, b], i) => {
  for (const tier of [1, 2, 3] as Tier[]) {
    const distract = take(SOUND_POOL, tier, (w) => rhymeGroup(w) === rhymeGroup(a) || w === a || w === b, i + tier * 5);
    base(`rhy_${a}_${b}_${tier}`, 'rhyme', {
      type: 'matching', narrationKey: `lib_rhy_${a}`, promptVisual: WORDS[a].pic, difficultyTier: tier, choices: [b, ...distract].map(ch), correctAnswer: b,
      hintKeys: [`lib_rhy_${a}_h1`, `lib_rhy_${a}_${b}_h2`, 'hint_together']
    });
  }
});

// ---------------------------------------------------------------- 3. counting groups (match the same number; 20)
const CNT_PLAN: { n: number; tier: Tier }[] = [{ n: 1, tier: 1 }, { n: 2, tier: 1 }, { n: 3, tier: 1 }, { n: 2, tier: 2 }, { n: 3, tier: 2 }, { n: 4, tier: 2 }, { n: 5, tier: 2 }, { n: 4, tier: 3 }, { n: 5, tier: 3 }, { n: 6, tier: 3 }];
const CNT_PAIRS: [string, string][] = [['star', 'heart'], ['flower', 'ball']];
CNT_PAIRS.forEach(([ps, cs], pi) => CNT_PLAN.forEach(({ n, tier }) => {
  const others = [1, 2, 3, 4, 5, 6].filter((k) => k !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b).slice(0, tier + 1);
  const nums = [n, ...others].sort((a, b) => ((a * 7 + pi) % 5) - ((b * 7 + pi) % 5) || a - b);
  base(`cnt_${ps}_${n}_${tier}`, 'count', {
    type: 'matching', narrationKey: 'lib_cnt_ask', promptVisual: cntKey(ps, n), difficultyTier: tier,
    choices: nums.map((k) => ({ id: `n${k}`, picture: cntKey(cs, k), narrationKey: `word_n${k}` })), correctAnswer: `n${n}`, hintKeys: ['lib_cnt_h1', 'lib_cnt_h2', 'hint_together']
  });
}));

// ---------------------------------------------------------------- 4. shapes and colours (12 prompts x 3 tiers = 36)
const SHAPE_PROMPTS: [string, string][] = [['circle', 'red'], ['square', 'blue'], ['triangle', 'yellow'], ['star', 'pink'], ['heart', 'red'], ['diamond', 'blue'], ['circle', 'yellow'], ['square', 'pink'], ['triangle', 'red'], ['star', 'blue'], ['heart', 'yellow'], ['diamond', 'pink']];
SHAPE_PROMPTS.forEach(([s, c], i) => {
  const s2 = SHAPES[(SHAPES.indexOf(s as never) + 1 + (i % 3)) % 6], s3 = SHAPES[(SHAPES.indexOf(s as never) + 3) % 6];
  const c2 = COLORS[(COLORS.indexOf(c as never) + 1 + (i % 3)) % 4];
  const sets: Record<Tier, [string, string][]> = {
    1: [[s, c], [s2, c]],
    2: [[s, c], [s, c2], [s2, c]],
    3: [[s, c], [s, c2], [s2, c], [s3, c2]]
  };
  for (const tier of [1, 2, 3] as Tier[]) {
    const list = sets[tier].map(([a, b]) => ({ id: `${a}_${b}`, picture: shapeKey(a, b), narrationKey: `word_shape_${a}` }));
    const rot = list.slice(i % list.length).concat(list.slice(0, i % list.length));
    base(`shp_${s}_${c}_${tier}`, 'shape', {
      type: 'matching', narrationKey: tier === 1 ? 'lib_shp_ask1' : 'lib_shp_ask', promptVisual: shapeKey(s, c), difficultyTier: tier, choices: rot, correctAnswer: `${s}_${c}`,
      hintKeys: ['lib_shp_h1', 'lib_shp_h2', 'hint_together']
    });
  }
});

// ---------------------------------------------------------------- 5. patterns (12)
const PATTERNS: { p: string; hide: number; tier: Tier; items: string[] }[] = [
  { p: 'ABABAB', hide: 2, tier: 1, items: ['star', 'heart'] }, { p: 'ABABAB', hide: 2, tier: 1, items: ['flower', 'ball'] }, { p: 'ABABAB', hide: 2, tier: 1, items: ['sun', 'fish'] },
  { p: 'AABAAB', hide: 2, tier: 2, items: ['sun', 'star'] }, { p: 'AABBAABB', hide: 2, tier: 2, items: ['fish', 'heart'] }, { p: 'ABCABC', hide: 3, tier: 2, items: ['star', 'heart', 'flower'] },
  { p: 'ABCABC', hide: 3, tier: 2, items: ['sun', 'fish', 'ball'] }, { p: 'ABBABB', hide: 3, tier: 2, items: ['hat', 'cat'] }, { p: 'ABCABCAB', hide: 3, tier: 3, items: ['tile_red', 'star', 'heart'] },
  { p: 'ABACABAC', hide: 3, tier: 3, items: ['flower', 'ball', 'sun'] }, { p: 'ABCCABCC', hide: 3, tier: 3, items: ['star', 'heart', 'ball'] }, { p: 'ABABABAB', hide: 4, tier: 3, items: ['sun', 'fish'] }
];
const PIC_WORDS: Record<string, string> = { star: 'star', heart: 'heart', flower: 'flower', ball: 'ball', sun: 'sun', fish: 'fish', hat: 'hat', cat: 'cat', tile_red: 'tile_red' };
PATTERNS.forEach((pt, i) => {
  const seq = [...pt.p].map((c) => pt.items[c.charCodeAt(0) - 65]);
  const shown = seq.slice(0, seq.length - pt.hide), answer = seq.slice(seq.length - pt.hide);
  base(`pat_${i + 1}`, 'pattern', {
    type: 'pattern', narrationKey: 'lib_pat_ask', promptVisual: 'icon_rainbow', difficultyTier: pt.tier, prefix: shown,
    choices: pt.items.map((k) => ({ id: k, picture: WORDS[PIC_WORDS[k]].pic, narrationKey: `word_${PIC_WORDS[k]}` })), correctAnswer: answer, hintKeys: ['lib_pat_h1', 'lib_pat_h2', 'hint_together']
  });
});

// ---------------------------------------------------------------- 6. story order (10)
const STORIES: { id: string; steps: string[]; tier: Tier; ask: string }[] = [
  { id: 'grow', steps: ['seed', 'water', 'flower'], tier: 1, ask: 'How does a flower grow? Put the pictures in order!' },
  { id: 'chick', steps: ['egg', 'chick', 'hen'], tier: 1, ask: 'Put the pictures in order. What happens first?' },
  { id: 'sprout', steps: ['seed', 'sprout', 'flower'], tier: 1, ask: 'A tiny seed grows up. Put the pictures in order!' },
  { id: 'dig', steps: ['packet', 'mound', 'sprout'], tier: 2, ask: 'Planting day! Put the pictures in order.' },
  { id: 'rain', steps: ['mound', 'water', 'sprout'], tier: 2, ask: 'What helps the soil grow a sprout? Put them in order!' },
  { id: 'cycleh', steps: ['hen', 'egg', 'chick'], tier: 2, ask: 'The hen starts the story. What comes next?' },
  { id: 'cyclec', steps: ['chick', 'hen', 'egg'], tier: 2, ask: 'The chick starts the story. What comes next?' },
  { id: 'cyclef', steps: ['flower', 'seed', 'sprout'], tier: 2, ask: 'The flower starts the story. What comes next?' },
  { id: 'plant4', steps: ['packet', 'mound', 'sprout', 'flower'], tier: 3, ask: 'From seed packet to flower! Put all four in order.' },
  { id: 'plant4b', steps: ['seed', 'mound', 'sprout', 'flower'], tier: 3, ask: 'A seed goes into the soil. Put all four in order!' }
];
STORIES.forEach((s) => {
  const uniq = [...new Set(s.steps)];
  base(`sty_${s.id}`, 'story', {
    type: 'sequence', narrationKey: `lib_sty_${s.id}`, promptVisual: WORDS[s.steps[0]].pic, difficultyTier: s.tier, choices: uniq.map(ch), correctAnswer: s.steps,
    hintKeys: [`lib_sty_h1`, `lib_sty_${s.id}_h2`, 'hint_together']
  });
});

// ---------------------------------------------------------------- 7. nature and garden (10 questions x 3 tiers = 30)
export const NATURE: { id: string; ask: string; prompt: string; ok: string; wrong: string[]; hint: string }[] = [
  { id: 'need', ask: 'What does a flower need to grow?', prompt: 'flower', ok: 'water', wrong: ['hat', 'ball', 'cat'], hint: 'Flowers get thirsty. They need a drink!' },
  { id: 'light', ask: 'What gives a flower warm light?', prompt: 'flower', ok: 'sun', wrong: ['fish', 'hat', 'owl'], hint: 'Look up in the sky. It is bright and warm!' },
  { id: 'treehome', ask: 'Who lives up in the tree?', prompt: 'tree', ok: 'owl', wrong: ['fish', 'dog', 'frog'], hint: 'Whoo whoo! This one says hoot.' },
  { id: 'swim', ask: 'Who swims in the water?', prompt: 'water', ok: 'fish', wrong: ['squirrel', 'owl', 'hen'], hint: 'It has fins and a tail.' },
  { id: 'visit', ask: 'Who buzzes from flower to flower?', prompt: 'flower', ok: 'bee', wrong: ['fish', 'hat', 'frog'], hint: 'Bzzz bzzz! It makes honey.' },
  { id: 'seed', ask: 'What grows from a little seed?', prompt: 'seed', ok: 'flower', wrong: ['ball', 'hat', 'cat'], hint: 'Plant it, water it, and it blooms!' },
  { id: 'hatch', ask: 'What hatches out of an egg?', prompt: 'egg', ok: 'chick', wrong: ['cat', 'ball', 'squirrel'], hint: 'Peep peep! It is small and fluffy.' },
  { id: 'pond', ask: 'Who hops on the lily pad?', prompt: 'water', ok: 'frog', wrong: ['squirrel', 'owl', 'cat'], hint: 'Ribbit! It is green and it jumps.' },
  { id: 'nuts', ask: 'Who collects nuts in the forest?', prompt: 'tree', ok: 'squirrel', wrong: ['fish', 'bee', 'hen'], hint: 'It has a big bushy tail.' },
  { id: 'spots', ask: 'Who has red wings with little black spots?', prompt: 'flower', ok: 'ladybug', wrong: ['fish', 'hen', 'dog'], hint: 'It is a tiny bug with spots.' }
];
NATURE.forEach((q, i) => {
  for (const tier of [1, 2, 3] as Tier[]) {
    base(`nat_${q.id}_${tier}`, 'nature', {
      type: 'matching', narrationKey: `lib_nat_${q.id}`, promptVisual: WORDS[q.prompt].pic, difficultyTier: tier,
      choices: [q.ok, ...q.wrong.slice(0, tier)].map(ch), correctAnswer: q.ok,
      hintKeys: [`lib_nat_${q.id}_h1`, `lib_nat_${q.id}_h2`, 'hint_together']
    });
  }
  void i;
});

export const LIBRARY: readonly LibPuzzle[] = out;
export const challengesOf = (f: Family) => LIBRARY.filter((p) => p.family === f);
export const libById = (id: string) => LIBRARY.find((p) => p.id === id);

// ---------------------------------------------------------------- narration text (generated into the manifest)
export interface LibClip { key: string; speaker: 'pip' | 'narrator'; text: string }
export function libraryClips(): LibClip[] {
  const c: LibClip[] = [];
  const P = (key: string, text: string) => c.push({ key, speaker: 'pip', text });
  for (const s of SOUNDS) {
    P(`lib_snd_${s.letter}`, `Which one starts with the sound ${s.ph}? Like the letter ${s.letter}!`);
    P(`lib_snd_${s.letter}_h1`, `Listen! ${s.ph}, ${s.ph}, ${s.ph}!`);
    P(`lib_snd_${s.letter}_h2`, `${WORDS[s.word].say} starts with ${s.ph}!`);
  }
  for (const [a, b] of RHYMES) {
    P(`lib_rhy_${a}`, `Which one sounds like ${WORDS[a].say}?`);
    P(`lib_rhy_${a}_h1`, `Say it out loud: ${WORDS[a].say}!`);
    P(`lib_rhy_${a}_${b}_h2`, `${WORDS[a].say} and ${WORDS[b].say} sound the same at the end!`);
  }
  P('lib_cnt_ask', 'Count them! Find the group with the same number.');
  P('lib_cnt_h1', 'Touch and count them one by one!');
  P('lib_cnt_h2', 'Count the first group. Now count each one that you can pick!');
  P('lib_shp_ask1', 'Which one is the same shape?');
  P('lib_shp_ask', 'Which one looks exactly the same?');
  P('lib_shp_h1', 'Look at the shape. How many corners does it have?');
  P('lib_shp_h2', 'Look at the colour too!');
  P('lib_pat_ask', 'What comes next? Finish the pattern!');
  P('lib_pat_h1', 'Say the pattern out loud. It goes round and round!');
  P('lib_pat_h2', 'Look at what came before. It repeats!');
  for (const s of STORIES) { P(`lib_sty_${s.id}`, s.ask); P(`lib_sty_${s.id}_h2`, `First comes ${WORDS[s.steps[0]].say}!`); }
  P('lib_sty_h1', 'What happens first? Then what happens next?');
  for (const q of NATURE) { P(`lib_nat_${q.id}`, q.ask); P(`lib_nat_${q.id}_h1`, q.hint); P(`lib_nat_${q.id}_h2`, `Think about it. The answer is the ${WORDS[q.ok].say}!`); }
  for (let n = 1; n <= 6; n++) c.push({ key: `word_n${n}`, speaker: 'narrator', text: `${NUM_WORDS[n]}!` });
  for (const s of SHAPES) c.push({ key: `word_shape_${s}`, speaker: 'narrator', text: `${s[0].toUpperCase()}${s.slice(1)}.` });
  [['lib_win_1', 'You did it!'], ['lib_win_2', 'Hooray, great job!'], ['lib_win_3', 'Wow, you are so clever!']].forEach(([k, t]) => P(k, t));
  for (const [id, w] of Object.entries(WORDS)) c.push({ key: `word_${id}`, speaker: 'narrator', text: `${w.say}.` });
  return c;
}

// ---------------------------------------------------------------- choosing and adapting
export interface LibMemory { recent: string[]; level: Record<Family, Tier>; streak: Record<Family, number> }
export const defaultLibMemory = (): LibMemory => ({ recent: [], level: Object.fromEntries(FAMILIES.map((f) => [f, 1])) as Record<Family, Tier>, streak: Object.fromEntries(FAMILIES.map((f) => [f, 0])) as Record<Family, number> });
export function sanitizeLibMemory(raw: unknown): LibMemory {
  const d = defaultLibMemory();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<LibMemory>;
  if (Array.isArray(r.recent)) d.recent = r.recent.filter((x): x is string => typeof x === 'string' && !!libById(x)).slice(-12);
  for (const f of FAMILIES) {
    const l = Number(r.level?.[f]); if (l === 1 || l === 2 || l === 3) d.level[f] = l;
    const s = Number(r.streak?.[f]); if (Number.isFinite(s)) d.streak[f] = Math.max(0, Math.min(5, Math.floor(s)));
  }
  return d;
}
export const RECENT_SPAN = 8;

/** Picks the next challenge for a family: at her current tier, never one of the last few played, never the same twice running. */
export function pickChallenge(family: Family, mem: LibMemory, rnd: () => number = Math.random): LibPuzzle {
  const all = challengesOf(family), lvl = mem.level[family];
  const fresh = (p: LibPuzzle) => !mem.recent.slice(-RECENT_SPAN).includes(p.id);
  // a challenge's "face" (e.g. the letter B) should not come back at once even at another tier
  const faceOf = (p: LibPuzzle) => p.id.replace(/_[123]$/, '');
  const recentFaces = new Set(mem.recent.slice(-4).map((id) => id.replace(/_[123]$/, '')));
  let pool = all.filter((p) => p.difficultyTier === lvl && fresh(p) && !recentFaces.has(faceOf(p)));
  if (!pool.length) pool = all.filter((p) => p.difficultyTier <= lvl && fresh(p));
  if (!pool.length) pool = all.filter((p) => p.id !== mem.recent[mem.recent.length - 1]);
  return pool[Math.floor(rnd() * pool.length) % pool.length];
}

/** Gentle adaptation: two clean wins in a row step up; struggling steps back down. Nothing is ever locked or lost. */
export function recordResult(mem: LibMemory, family: Family, def: LibPuzzle, attempts: number, assisted: boolean) {
  mem.recent.push(def.id); if (mem.recent.length > 12) mem.recent.shift();
  if (assisted || attempts >= 3) { mem.streak[family] = 0; mem.level[family] = Math.max(1, mem.level[family] - 1) as Tier; return; }
  if (attempts <= 1) { mem.streak[family] += 1; if (mem.streak[family] >= 2 && mem.level[family] < 3) { mem.level[family] = (mem.level[family] + 1) as Tier; mem.streak[family] = 0; } }
  else mem.streak[family] = 0;
}
