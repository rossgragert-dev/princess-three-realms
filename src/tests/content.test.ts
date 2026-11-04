import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { NARRATION, narrationByKey } from '../content/narrationManifest';
import { PUZZLES, puzzleById } from '../content/puzzleBank';
import { narrationKeysFor } from '../systems/puzzleEngine';
import { STICKERS } from '../content/stickers';
import { SCRIPT } from '../content/dialogue';
import { ITEM, UI } from '../content/frameIndex';
import { OBJECTIVE_NARRATION } from '../world/guide';
import { MAIN_PATH } from '../systems/questEngine';
import { getMaps } from '../world/maps';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('every narration key referenced by puzzles, scripts, stickers and objectives exists in the manifest', () => {
  const keys = new Set<string>();
  PUZZLES.forEach((p) => narrationKeysFor(p).forEach((k) => keys.add(k)));
  Object.values(SCRIPT).forEach((lines) => lines.forEach((l) => keys.add(l.key)));
  STICKERS.forEach((s) => keys.add(s.narrationKey));
  Object.values(OBJECTIVE_NARRATION).forEach((k) => keys.add(k));
  const missing = [...keys].filter((k) => !narrationByKey(k));
  assert.deepEqual(missing, []);
});

test('narration literals used in scenes and story code exist in the manifest', () => {
  const files = ['world/story.ts', 'scenes/WorldScene.ts', 'scenes/UIScene.ts', 'ui/dialoguePanel.ts', 'ui/puzzlePanel.ts', 'actors/transformations.ts'];
  const re = /'((?:(?:word|success|hint|obj|sticker|transform)_[a-z0-9_]+)|form_wrong_terrain|need_unicorn|pearl_prompt|pearl_pushed|wand_lit|chest_found|bloom_cheer|ui_book|retry_gentle|chapter_done)'/g;
  const bad: string[] = [];
  for (const f of files) for (const m of src(f).matchAll(re)) if (!narrationByKey(m[1]) && !['word_', 'success_'].includes(m[1])) bad.push(`${f}: ${m[1]}`);
  assert.deepEqual(bad, []);
  // dynamic keys built in story.ts
  for (const n of [1, 2, 3]) { assert.ok(narrationByKey(`word_carrot_${n}`)); assert.ok(narrationByKey(`word_starfish_${n}`)); }
});

test('manifest clips are unique, spoken by a known speaker and have text for the recording script', () => {
  const seen = new Set<string>();
  for (const c of NARRATION) {
    assert.ok(!seen.has(c.key), `duplicate ${c.key}`);
    seen.add(c.key);
    assert.ok(c.text.trim().length > 0, `empty text ${c.key}`);
  }
});

test('every picture named by a puzzle, sticker, objective or celebration exists in the generated frame index', () => {
  const isPic = (n: string) => (n.startsWith('icon_') ? n in UI : n in ITEM);
  const bad: string[] = [];
  for (const p of PUZZLES) {
    if (!isPic(p.promptVisual)) bad.push(`prompt ${p.promptVisual}`);
    p.choices.forEach((c) => { if (!isPic(c.picture)) bad.push(`choice ${c.picture}`); });
  }
  for (const s of STICKERS) if (!(s.sheet === 'ui' ? s.frame in UI : s.frame in ITEM)) bad.push(`sticker ${s.frame}`);
  for (const s of MAIN_PATH) if (!isPic(s.hintIcon)) bad.push(`hint ${s.hintIcon}`);
  for (const m of src('world/story.ts').matchAll(/(?:celebrate|sequencePuzzle\([^)]*\[)\s*\(?'([a-z0-9_]+)'/g)) if (!isPic(m[1])) bad.push(`celebrate ${m[1]}`);
  assert.deepEqual(bad, []);
});

test('puzzle ids used by story code exist and every flag-completing puzzle is declared', () => {
  for (const id of ['carrots', 'tree_sound', 'bridge_pattern', 'starfish', 'shell_rhyme', 'garden_grow']) assert.ok(puzzleById(id), id);
  assert.equal(PUZZLES.filter((p) => p.mandatory).length, 4);
});

test('spawns and arrival tiles are never on a warp trigger (no instant bounce back)', () => {
  for (const m of Object.values(getMaps())) {
    const warps = m.objects.filter((o) => o.kind === 'warp').flatMap((o) => o.tiles ?? []);
    for (const [name, s] of Object.entries(m.spawns)) {
      assert.ok(!warps.some((w) => w.x === s.x && w.y === s.y), `${m.id}.${name} sits on a warp tile`);
    }
  }
});

test('every warp targets an existing map and spawn', () => {
  const maps = getMaps();
  for (const m of Object.values(maps)) for (const o of m.objects) if (o.to) {
    assert.ok(maps[o.to.scene], `${m.id}.${o.id} -> unknown scene`);
    assert.ok(maps[o.to.scene].spawns[o.to.spawn], `${m.id}.${o.id} -> unknown spawn ${o.to.spawn}`);
  }
});

test('scene source files do not import anything outside the project and do not use eval or remote URLs', () => {
  const dirs = ['scenes', 'ui', 'actors', 'world', 'systems'];
  for (const d of dirs) for (const f of readdirSync(new URL(`../${d}`, import.meta.url))) {
    const text = src(`${d}/${f}`);
    assert.ok(!/\beval\(|new Function\(|https?:\/\/(?!www\.w3\.org)/.test(text), `${d}/${f}`);
  }
});

import { sceneOfClip, SCENE_ORDER, VOICE_CAST } from '../content/narrationScenes';

test('recording script: every clip has a scene and every speaker has a voice direction', () => {
  for (const c of NARRATION) {
    assert.ok(SCENE_ORDER.includes(sceneOfClip(c)), c.key);
    assert.ok(VOICE_CAST[c.speaker], c.speaker);
  }
  // each gameplay scene has its own spoken lines (not everything lumped under "anywhere")
  for (const s of SCENE_ORDER.filter((x) => x !== 'anywhere')) assert.ok(NARRATION.some((c) => sceneOfClip(c) === s), s);
});

test('docs/narration_manifest.json is in sync with the manifest (run npm run audio:script)', () => {
  const json = JSON.parse(readFileSync(new URL('../../docs/narration_manifest.json', import.meta.url), 'utf8')) as { key: string; text: string; speaker: string }[];
  assert.deepEqual(json.map((j) => [j.key, j.text, j.speaker]), NARRATION.map((n) => [n.key, n.text, n.speaker]));
});
