import type Phaser from 'phaser';
import type { Form, GameState, PuzzleDef, QuestFlag, SceneId } from '../types/game';
import type { ObjDef, Tile } from './types';
import type { Line } from '../content/dialogue';
import { SCRIPT } from '../content/dialogue';
import { puzzleById } from '../content/puzzleBank';
import { decorForSlot } from '../content/decorCatalog';
import { newProgress, countTap } from '../systems/puzzleEngine';
import { nextObjective } from '../systems/questEngine';
import { services } from '../systems/services';
import { OBJECTIVE_NARRATION } from './guide';
import type { PuzzleResult } from '../ui/puzzlePanel';

/** What the story needs from the running world and HUD. WorldScene implements it; tests can fake it. */
export interface StoryCtx {
  readonly state: GameState;
  readonly mapId: SceneId;
  readonly form: Form;
  readonly scene: Phaser.Scene;
  say(lines: readonly Line[]): Promise<void>;
  choicePuzzle(def: PuzzleDef): Promise<PuzzleResult>;
  sequencePuzzle(def: PuzzleDef, prefix?: string[]): Promise<PuzzleResult>;
  showCount(done: number, total: number): void;
  hideCount(): void;
  celebrate(picture: string, scale?: number): void;
  /** Sets the flag (idempotent), saves, refreshes HUD and the visuals that depend on flags. */
  complete(flag: QuestFlag): boolean;
  cast(): Promise<void>;
  face(obj: ObjDef): void;
  react(id: string): void;
  hop(id: string): void;
  setFrame(id: string, frame: number): void;
  moveObject(id: string, to: Tile): Promise<void>;
  requestForm(f: Form): void;
  addSticker(id: string): boolean;
  renderDecor(): void;
  sparkle(tile: Tile): void;
}

/** Progress that only matters during one play session (everything important is a quest flag). */
export const session = {
  counted: {} as Record<string, Set<string>>,
  pearlStep: 0,
  bloomed: new Set<string>(),
  nanaGreeted: false,
  introSpoken: false
};

export function resetSession() {
  session.counted = {};
  session.pearlStep = 0;
  session.bloomed = new Set();
  session.nanaGreeted = false;
  session.introSpoken = false;
}

const PEARL_LANE_X = [22, 24, 26, 28]; // 4 bubble pushes; the last one lands in the shell socket
const PEARL_Y = 20;

/** Speak the reminder for whatever the next main-path goal is. */
export async function remind(ctx: StoryCtx) {
  const step = nextObjective(ctx.state);
  const key = step && OBJECTIVE_NARRATION[step.flag];
  if (key) await ctx.say([{ speaker: 'narrator', key }]);
}

const progOf = (ctx: StoryCtx, id: string) => (ctx.state.puzzles[id] ??= newProgress());

/** Runs when the child arrives in a map (spoken once-per-visit beats). */
export async function onArrive(ctx: StoryCtx) {
  const f = ctx.state.flags;
  if (ctx.mapId === 'courtyard' && !f.INTRO_DONE && !session.introSpoken) {
    session.introSpoken = true;
    await ctx.say(SCRIPT.intro);
  }
  if (ctx.mapId === 'bedroom' && f.STAR_1_FOUND && !f.LAMP_PLACED && !session.nanaGreeted) {
    session.nanaGreeted = true;
    await ctx.say(SCRIPT.nanaReturn);
  }
  if (ctx.mapId === 'grotto' && !f.GROTTO_SEEN) ctx.complete('GROTTO_SEEN');
}

export async function interact(ctx: StoryCtx, obj: ObjDef): Promise<void> {
  const f = ctx.state.flags;
  const id = obj.id;
  ctx.face(obj);

  // ---------------------------------------------------------------- counting (carrots, starfish)
  const countKind = id.startsWith('carrot_') ? 'carrots' : id.startsWith('starfish_') ? 'starfish' : null;
  if (countKind) return countObject(ctx, obj, countKind);

  // ---------------------------------------------------------------- blooms (unicorn only)
  if (id.startsWith('bloom_')) return bloom(ctx, obj);

  // ---------------------------------------------------------------- slots in the bedroom
  if (obj.kind === 'slot') return decorate(ctx, id);

  // ---------------------------------------------------------------- chests
  if (obj.kind === 'chest') return chest(ctx, obj);

  switch (id) {
    case 'pip':
      ctx.react('pip');
      if (!f.INTRO_DONE) { await ctx.say(SCRIPT.pipIntro); ctx.complete('INTRO_DONE'); }
      else if (!f.PIP_CARROTS_DONE) await ctx.say(SCRIPT.pipCount);
      else await ctx.say(SCRIPT.carrotsDone);
      return;

    case 'tree': {
      ctx.react('tree');
      if (f.TREE_GATE_OPEN) { await ctx.say(SCRIPT.treeDone); return; }
      if (!f.PIP_CARROTS_DONE) { await remind(ctx); return; }
      await ctx.say(SCRIPT.treeAsk);
      const r = await ctx.choicePuzzle(puzzleById('tree_sound')!);
      if (!r.solved) return;
      ctx.complete('TREE_GATE_OPEN');
      await ctx.say(SCRIPT.treeDone);
      // Willa arrives through the opened gate and introduces the unicorn form.
      ctx.complete('WILLA_MET');
      await ctx.say(SCRIPT.willaIntro);
      return;
    }

    case 'willa':
      ctx.react('willa');
      if (!f.WILLA_MET) ctx.complete('WILLA_MET');
      await ctx.say(f.RAINBOW_BRIDGE_OPEN ? SCRIPT.bloomCheer : SCRIPT.willaIntro);
      return;

    case 'willa_shore':
      ctx.react('willa_shore');
      ctx.complete('SHORE_SEEN');
      await ctx.say(SCRIPT.shoreIntro);
      return;

    case 'bramble':
      ctx.react('bramble');
      await ctx.say(f.RAINBOW_BRIDGE_OPEN ? SCRIPT.bridgeDone : SCRIPT.bridgeAsk);
      return;

    case 'bridge_mark': {
      if (ctx.form !== 'unicorn') { await ctx.say(SCRIPT.needUnicorn); return; }
      if (f.RAINBOW_BRIDGE_OPEN) return;
      await ctx.say(SCRIPT.bridgeAsk);
      // Red, blue shown; the child continues the pattern with red, blue.
      const r = await ctx.sequencePuzzle(puzzleById('bridge_pattern')!, ['tile_red', 'tile_blue']);
      if (!r.solved) return;
      await ctx.cast();
      ctx.complete('RAINBOW_BRIDGE_OPEN');
      services.audio.sfx('bloom');
      ctx.celebrate('icon_rainbow');
      await ctx.say(SCRIPT.bridgeDone);
      return;
    }

    case 'wand_pedestal':
      if (f.WAND_LIT) { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
      if (ctx.form !== 'princess') { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
      await ctx.cast();
      ctx.complete('WAND_LIT');
      ctx.celebrate('icon_wand');
      await ctx.say(SCRIPT.wandLit);
      return;

    case 'garden_plot': {
      if (f.GARDEN_SEQUENCED) { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
      await ctx.say(SCRIPT.gardenAsk);
      const r = await ctx.sequencePuzzle(puzzleById('garden_grow')!, []);
      if (!r.solved) return;
      ctx.complete('GARDEN_SEQUENCED');
      ctx.celebrate('bloom1');
      await ctx.say(SCRIPT.gardenDone);
      return;
    }

    case 'shimmer':
      ctx.complete('SHORE_SEEN');
      if (ctx.form !== 'mermaid') ctx.requestForm('mermaid');
      return;

    case 'marina':
      ctx.react('marina');
      if (f.MARINA_HELPED) { await ctx.say([{ speaker: 'marina', key: 'success_starfish' }]); return; }
      await ctx.say(SCRIPT.marinaIntro);
      await ctx.say(SCRIPT.marinaCount);
      ctx.showCount(session.counted.starfish?.size ?? 0, 3);
      return;

    case 'coralie':
      ctx.react('coralie');
      await ctx.say(f.PEARL_PLACED ? SCRIPT.pearlPushed : SCRIPT.pearlHint);
      return;

    case 'shell_puzzle': {
      if (f.SHELLS_MATCHED) { await ctx.say(SCRIPT.shellDone); return; }
      await ctx.say(SCRIPT.shellAsk);
      const r = await ctx.choicePuzzle(puzzleById('shell_rhyme')!);
      if (!r.solved) return;
      ctx.complete('SHELLS_MATCHED');
      ctx.celebrate('shell');
      await ctx.say(SCRIPT.shellDone);
      return;
    }

    case 'pearl':
      return pushPearl(ctx, obj);

    case 'star_pedestal':
      if (f.STAR_1_FOUND) { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
      if (!f.PEARL_PLACED) { await ctx.say(SCRIPT.pearlHint); return; }
      await ctx.cast();
      ctx.complete('STAR_1_FOUND');
      ctx.celebrate('star', 6);
      await ctx.say(SCRIPT.starFound);
      return;

    case 'nana':
      ctx.react('nana');
      if (f.LAMP_PLACED) await ctx.say(SCRIPT.lampPlaced);
      else if (f.STAR_1_FOUND) await ctx.say(SCRIPT.nanaReturn);
      else await remind(ctx);
      return;

    default:
      return;
  }
}

// ---------------------------------------------------------------------------------------------------------
async function countObject(ctx: StoryCtx, obj: ObjDef, puzzleId: 'carrots' | 'starfish') {
  const def = puzzleById(puzzleId)!;
  const prog = progOf(ctx, puzzleId);
  const prereq = puzzleId === 'carrots' ? ctx.state.flags.INTRO_DONE : true;
  if (!prereq) { await remind(ctx); return; }
  const counted = (session.counted[puzzleId] ??= new Set());
  const r = countTap(def, prog, counted, obj.id);
  if (r.result === 'duplicate') { ctx.hop(obj.id); return; } // already counted: a happy hop, never an error
  ctx.hop(obj.id);
  ctx.setFrame(obj.id, puzzleId === 'carrots' ? 1 : 2);
  services.audio.sfx('pop');
  ctx.showCount(r.number, def.correctAnswer as number);
  const word = `word_${puzzleId === 'carrots' ? 'carrot' : 'starfish'}_${r.number}`;
  await services.audio.speak(word); // "one", "two", "three", spoken as each is counted
  if (r.result !== 'done') return;
  const flag: QuestFlag = puzzleId === 'carrots' ? 'PIP_CARROTS_DONE' : 'MARINA_HELPED';
  ctx.complete(flag);
  ctx.hideCount();
  if (puzzleId === 'carrots') {
    ctx.celebrate('carrot');
    await ctx.say(SCRIPT.carrotsDone);
  } else {
    ctx.celebrate('icon_marina');
    await ctx.say(SCRIPT.marinaDone);
  }
}

async function bloom(ctx: StoryCtx, obj: ObjDef) {
  if (ctx.form !== 'unicorn') return;
  if (session.bloomed.has(obj.id)) { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
  await ctx.cast();
  session.bloomed.add(obj.id);
  ctx.setFrame(obj.id, 26);
  ctx.hop(obj.id);
  services.audio.sfx('bloom');
  ctx.sparkle({ x: obj.x, y: obj.y });
  if (session.bloomed.size === 1) await ctx.say(SCRIPT.bloomCheer);
}

async function chest(ctx: StoryCtx, obj: ObjDef) {
  const reward = obj.reward!;
  const opened = ctx.state.stickers.includes(reward);
  ctx.setFrame(obj.id, 6);
  if (opened) { ctx.sparkle({ x: obj.x, y: obj.y }); return; }
  services.audio.sfx('chime');
  if (obj.id === 'chest_creek') ctx.complete('CREEK_CHEST');
  ctx.addSticker(reward);
  ctx.celebrate('chest_open');
  await ctx.say(SCRIPT.chestFound);
}

async function pushPearl(ctx: StoryCtx, obj: ObjDef) {
  if (!ctx.state.flags.MARINA_HELPED) { await ctx.say(SCRIPT.marinaIntro); return; }
  if (ctx.state.flags.PEARL_PLACED) return;
  if (session.pearlStep === 0) await ctx.say(SCRIPT.pearlHint);
  await ctx.cast(); // a bubble bounces the pearl two tiles along the glowing lane
  const x = PEARL_LANE_X[Math.min(session.pearlStep, PEARL_LANE_X.length - 1)];
  session.pearlStep++;
  services.audio.sfx('pop');
  await ctx.moveObject(obj.id, { x, y: PEARL_Y });
  if (session.pearlStep < PEARL_LANE_X.length) return;
  ctx.complete('PEARL_PLACED');
  services.audio.sfx('chime');
  ctx.celebrate('pearl');
  await ctx.say(SCRIPT.pearlPushed);
}

/** Tap a bedroom spot to cycle through what could go there: each unlocked item, then empty. */
async function decorate(ctx: StoryCtx, slot: string) {
  const s = ctx.state;
  const options = decorForSlot(slot, s.unlockedDecor).map((d) => d.id);
  if (!options.length) { await remind(ctx); return; }
  const cur = s.bedroom[slot];
  const i = cur ? options.indexOf(cur) : -1;
  const next = i + 1 < options.length ? options[i + 1] : undefined;
  if (next) {
    for (const k of Object.keys(s.bedroom)) if (s.bedroom[k] === next) delete s.bedroom[k]; // one lamp, one place
    s.bedroom[slot] = next;
  } else delete s.bedroom[slot];
  services.save.save();
  ctx.renderDecor();
  services.audio.sfx('pop');
  if (next === 'lamp' && ctx.complete('LAMP_PLACED')) {
    ctx.celebrate('icon_lamp');
    await ctx.say(SCRIPT.lampPlaced);
  }
}
