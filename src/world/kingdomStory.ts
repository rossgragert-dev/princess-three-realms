// v0.4c: story beats and activity flow for the Kingdom Beyond. Gentle by design: replay is always welcome, a wrong
// answer only ever brings a hint, and every reward is granted once through completeFlag.
import { MISSIONS } from './missions';
import { SPECIES_CARE, afterPetChange } from './petCare';
import { FOODS, type FoodId, type Topping } from './foodDesign';
import type { PuzzleDef, QuestFlag } from '../types/game';
import type { ObjDef } from './types';
import type { StoryCtx } from './story';
import { SCRIPT, type Line } from '../content/dialogue';
import { puzzleById } from '../content/puzzleBank';
import { newProgress, countTap } from '../systems/puzzleEngine';
import { services } from '../systems/services';
import { GITEM } from '../content/gardenCatalog';
import { PET_TYPES, petKey, allDone, fountainReady, markDone, plantedCount, type PlotId, type PlotStage, type Seed } from '../content/kingdom';
import type { RaceMode } from './race';

/** What the running world offers the story for the Kingdom's interactive systems (implemented by KingdomLayer). */
export const COOKING: Record<string, import('../ui/creativePanels').BakeSpec> = FOODS;

export interface KingdomApi {
  held(): Seed | null;
  hold(s: Seed): void;
  plotStage(id: PlotId): PlotStage;
  plantedSeed(id: PlotId): Seed | null;
  plant(id: PlotId): void;
  water(id: PlotId): Promise<Seed>;
  replant(id: PlotId): void;
  petFlower(id: PlotId): void;
  lanternsActive(): boolean;
  startLanterns(onDone: () => void): void;
  lanternTap(i: number): void;
  followButterfly(c: Seed): boolean;
  refreshArt(): void;
  releaseButterfly(c: Seed): boolean;
  fountainFx(): void;
  cycleFountain(): void;
  startRace(mode: RaceMode): void;
  stopRace(): void;
  raceActive(): boolean;
}

export interface PickOption { id: string; picture: string }

/** Session-only progress (everything that matters for rewards is a quest flag). */
export const ksession = {
  said: new Set<string>(),
  chimed: new Set<string>(),
  counted: new Set<string>(),
  storyToggle: 0
};
export function resetKingdomSession() { ksession.said.clear(); ksession.chimed.clear(); ksession.counted.clear(); ksession.storyToggle = 0; }

const once = (key: string) => { if (ksession.said.has(key)) return false; ksession.said.add(key); return true; };
const L = (speaker: Line['speaker'], key: string): Line => ({ speaker, key });
const WORD_OF: Record<Seed, string> = { red: 'word_red', blue: 'word_blue', yellow: 'word_yellow', pink: 'word_pink' };

/** A replay starts from a clean slate (the saved record that it was done once is kept separately). */
function freshen(ctx: StoryCtx, id: string) {
  const p = (ctx.state.puzzles[id] ??= newProgress());
  p.solved = false; p.attempts = 0; p.hintLevel = 0; p.assisted = false;
}

/** Runs on entering a new area: silently notes that it has been visited (no mandatory speech). */
export async function onKingdomArrive(ctx: StoryCtx) {
  const seen: Partial<Record<string, QuestFlag>> = { enchanted: 'WOODS_SEEN', garden: 'GARDEN_SEEN', river: 'RIVER_SEEN' };
  const flag = seen[ctx.mapId];
  if (flag) ctx.complete(flag);
}

/** Returns true when it handled the object. */
export async function kingdomInteract(ctx: StoryCtx, obj: ObjDef): Promise<boolean> {
  const f = ctx.state.flags, id = obj.id, K = ctx.k, kd = ctx.state.kingdom;

  // ------------------------------------------------------------ the Throne Room: parents only ever *suggest*
  if (id === 'throne_king' || id === 'throne_queen') {
    ctx.react(id);
    await ctx.say(id === 'throne_king' ? SCRIPT.throneKing : SCRIPT.throneQueen);
    const pick = await ctx.pickOne([{ id: 'woods', picture: 'icon_tree' }, { id: 'meadow', picture: 'icon_unicorn' }, { id: 'shore', picture: 'icon_mermaid' }, { id: 'garden', picture: 'px_flower_red' }, { id: 'race', picture: 'px_startpost' }]);
    if (!pick || !MISSIONS[pick]) return true; // cancel / back: she stays in the throne room
    await ctx.say(pick === 'woods' ? SCRIPT.throneWoods : pick === 'meadow' ? SCRIPT.throneMeadow : pick === 'shore' ? SCRIPT.throneShore : pick === 'race' ? SCRIPT.throneRace : SCRIPT.throneGarden);
    ctx.travelTo(MISSIONS[pick].scene, MISSIONS[pick].spawn);
    return true;
  }

  // ------------------------------------------------------------ the Greenhouse of Seeds: choose a seed, plant or ornament to carry to the garden
  if (id === 'gh_seeds' || id === 'gh_pots' || id === 'gh_ornaments') {
    const list = id === 'gh_seeds' ? ['g_rose', 'g_tulip', 'g_bluebell', 'g_daisy', 'g_sunflower', 'g_lavender']
      : id === 'gh_pots' ? ['g_tree', 'g_blossom', 'g_bush', 'g_rosebush', 'g_hedge', 'g_topiary']
      : ['g_birdbath', 'g_gnome', 'g_pinwheel', 'g_crystal', 'g_mushrooms', 'g_pot'];
    if (!kd.gardenTaught && once('gh_lesson')) await ctx.say(SCRIPT.ghLesson);
    const pick = await ctx.pickOne(list.map((g) => ({ id: g, picture: GITEM[g].key })));
    if (pick === null) return true;
    kd.carry = pick; ctx.save();
    ctx.celebrate(GITEM[pick].key, 3);
    await ctx.say(SCRIPT.ghCarry);
    return true;
  }
  // ------------------------------------------------------------ the Pet Keeper: pick an animal, then how it looks, then confirm
  if (id === 'pet_keeper') {
    ctx.react(id);
    if (once('pet_hi')) await ctx.say(SCRIPT.petKeeperHi);
    const type = await ctx.pickOne(PET_TYPES.map((t, i) => ({ id: String(i), picture: kd.pet && kd.pet.type === i ? petKey(kd.pet) : `px_pet_${t}0` })));
    if (type === null) return true;
    const ti = Number(type);
    const look = await ctx.pickOne([0, 1, 2, 3].map((v) => ({ id: String(v), picture: petKey({ type: ti, look: v }) })));
    if (look === null) return true;
    const choice = { type: ti, look: Number(look) };
    const ok = await ctx.pickOne([{ id: 'yes', picture: petKey(choice) }, { id: 'no', picture: 'icon_cross' }]);
    if (ok !== 'yes') return true;
    kd.pet = choice; kd.petCare = afterPetChange(kd.petCare, choice.type); ctx.save();
    ctx.celebrate(petKey(choice), 4);
    await ctx.say(SCRIPT.petChosen);
    return true;
  }
  // ------------------------------------------------------------ the bedroom: her bed and her pet
  if (id === 'bed_sleep') { await ctx.sleepInBed(); return true; }
  if (id === 'bedroom_pet') {
    ctx.sparkle({ x: obj.x, y: obj.y }); ctx.petHappy();
    if (!kd.pet) return true;
    const care = SPECIES_CARE[PET_TYPES[kd.pet.type]];
    // a picture menu she can come back to as often as she likes: food bowl, water bowl, toy. Back leaves.
    for (let round = 0; round < 40; round++) {
      const c = await ctx.pickOne([{ id: 'feed', picture: 'px_bowl_food' }, { id: 'water', picture: 'px_bowl_water' }, { id: 'play', picture: care.toy }]);
      if (!c) break;
      if (c === 'feed') {
        const f = await ctx.pickOne(care.foods.map((k) => ({ id: k, picture: k })));
        if (!f) continue;
        await ctx.petDo('feed', f);
      } else if (c === 'water') await ctx.petDo('water');
      else await ctx.petDo('play');
    }
    return true;
  }

  // ------------------------------------------------------------ the Royal Kitchen: four decorate-it games, always replayable
  const cook = COOKING[id];
  if (cook) {
    ctx.react(id);
    if (once('kitchen_hi')) await ctx.say(SCRIPT.kitchenHi);
    const fid = id as FoodId, cur = kd.food[fid];
    let initial: readonly Topping[] = [];
    if (cur && !cur.eaten) {
      // something is on the stand: decorate it again (keeps her toppings) or eat it; Back leaves it exactly as it is
      const c = await ctx.pickOne([{ id: 'decorate', picture: 'icon_palette' }, { id: 'eat', picture: cook.base }]);
      if (!c) return true;
      if (c === 'eat') { await ctx.eatFood(fid); return true; }
      initial = cur.toppings;
    }
    const res = await ctx.bake(cook, initial);
    if (res) {
      kd.food[fid] = { toppings: res, eaten: false }; ctx.save(); ctx.refreshFoods();
      if (res.length > 0) { ctx.celebrate(cook.base, 3); for (const dx of [-2, 0, 2]) ctx.sparkle({ x: obj.x + dx, y: obj.y + 1 }); }
    }
    return true;
  }
  // ------------------------------------------------------------ the Royal Gallery: paint, and see it on the wall
  if (id === 'easel_paint' || id === 'art_frame') {
    if (once('gallery_hi')) await ctx.say(SCRIPT.galleryHi);
    const res = await ctx.paint(kd.art);
    if (res) { kd.art = res; ctx.save(); K.refreshArt(); if (res.length) ctx.celebrate('icon_brush', 3); }
    return true;
  }
  // ------------------------------------------------------------ the King's Garden Labyrinth
  if (id === 'king_maze') {
    ctx.react(id);
    if (once('maze_king')) await ctx.say(SCRIPT.mazeKing); else for (const dx of [-1, 1]) ctx.sparkle({ x: obj.x + dx, y: obj.y });
    return true;
  }

  // ------------------------------------------------------------ the secret clearing: a singing blossom you can visit any time
  if (id === 'clearing_blossom') {
    ctx.react(id);
    services.audio.sfx('bloom');
    ctx.celebrate('px_sflower', 3);
    for (const dx of [-2, 0, 2]) ctx.sparkle({ x: obj.x + dx, y: obj.y });
    if (once('blossom_hi')) await ctx.say(SCRIPT.blossomHi);
    return true;
  }

  // ------------------------------------------------------------ the Enchanted Woods
  if (id === 'willa_woods') {
    ctx.react(id);
    if (once('woods_intro')) { await ctx.say(SCRIPT.woodsIntro); return true; }
    if (!f.LANTERNS_LIT) await ctx.say(SCRIPT.lanternsAsk);
    else if (!f.TREES_HEARD || !f.RHYME_BRIDGE) await ctx.say(SCRIPT.woodsIntro);
    else await ctx.say(SCRIPT.woodsDone);
    return true;
  }

  const treeN = /^atree_(\d)$/.exec(id)?.[1];
  if (treeN) { await learn(ctx, ['sound_s', 'sound_c', 'sound_f'][Number(treeN) - 1], 'tree', ['sound_s', 'sound_c', 'sound_f'], 'TREES_HEARD', SCRIPT.treesDone); return true; }
  const plank = /^rhyme_(\d)$/.exec(id)?.[1];
  if (plank) { await learn(ctx, ['rhyme_cat', 'rhyme_bee', 'rhyme_frog'][Number(plank) - 1], 'shell', ['rhyme_cat', 'rhyme_bee', 'rhyme_frog'], 'RHYME_BRIDGE', SCRIPT.bridgeReady); return true; }

  if (id === 'storybook') {
    const order = ['story_egg', 'story_day'];
    const pick = order[(ksession.storyToggle++ + (kd.done.includes('story_egg') && !kd.done.includes('story_day') ? 1 : 0)) % 2];
    const def = puzzleById(pick)!;
    freshen(ctx, pick);
    await ctx.say([L('tree', def.narrationKey)]);
    const r = await ctx.sequencePuzzle(def, [], false);
    if (!r.solved) return true;
    markDone(kd, pick); ctx.save();
    ctx.celebrate(pick === 'story_egg' ? 'px_hen' : 'flower');
    await ctx.say([L('tree', `success_${pick}`)]);
    if (!f.STUMP_STORY) ctx.complete('STUMP_STORY');
    return true;
  }

  if (id === 'lantern_stone') {
    if (once('lantern_watch')) await ctx.say(SCRIPT.lanternsWatch);
    K.startLanterns(() => void lanternsWon(ctx));
    return true;
  }
  const lant = /^lantern_(\d)$/.exec(id)?.[1];
  if (lant) {
    if (K.lanternsActive()) K.lanternTap(Number(lant) - 1);
    else { ctx.sparkle({ x: obj.x, y: obj.y }); if (once('lantern_hint')) await ctx.say(SCRIPT.lanternsAsk); }
    return true;
  }

  // ------------------------------------------------------------ the Royal Magic Garden
  if (id === 'gardener') {
    ctx.react(id);
    if (once('garden_intro')) { await ctx.say(SCRIPT.gardenIntro); return true; }
    const n = plantedCount(kd);
    if (n === 0) await ctx.say(SCRIPT.gardenPlant);
    else if (!f.FOUNTAIN_RESTORED) await ctx.say(fountainReady(kd) ? SCRIPT.fountainReady : SCRIPT.gardenFountainHint);
    else if (!f.BUTTERFLIES_GUIDED) await ctx.say(SCRIPT.butterflyAsk);
    else await ctx.say(SCRIPT.gardenAllDone);
    return true;
  }
  const seed = /^seed_(red|blue|yellow|pink)$/.exec(id)?.[1] as Seed | undefined;
  if (seed) {
    K.hold(seed); ctx.hop(id);
    void services.audio.speak(WORD_OF[seed]);
    return true;
  }
  if (/^plot_[1-6]$/.test(id)) { await tendPlot(ctx, id as PlotId); return true; }

  if (id === 'seq_bed') {
    freshen(ctx, 'garden_grow');
    await ctx.say(SCRIPT.gardenAsk);
    const r = await ctx.sequencePuzzle(puzzleById('garden_grow')!, [], false);
    if (!r.solved) return true;
    markDone(kd, 'garden_grow'); ctx.save();
    ctx.complete('GARDEN_SEQUENCED');
    ctx.celebrate('flower');
    await ctx.say(SCRIPT.gardenDone);
    return true;
  }

  if (id === 'fountain_obj') {
    if (!f.FOUNTAIN_RESTORED) {
      if (fountainReady(kd)) {
        ctx.complete('FOUNTAIN_RESTORED');
        K.fountainFx();
        ctx.celebrate('water');
        await ctx.say(SCRIPT.fountainBack);
      } else await ctx.say(SCRIPT.fountainTired);
    } else { K.cycleFountain(); }
    return true;
  }

  const bug = /^ladybug_(\d)$/.exec(id)?.[1];
  if (bug) { await countLadybug(ctx, obj); return true; }

  const bf = /^bf_(red|blue|yellow)$/.exec(id)?.[1] as Seed | undefined;
  if (bf) {
    if (K.followButterfly(bf)) { ctx.sparkle({ x: obj.x, y: obj.y }); if (!f.BUTTERFLIES_GUIDED && once('butterfly_ask')) await ctx.say(SCRIPT.butterflyAsk); }
    else if (K.releaseButterfly(bf)) ctx.sparkle({ x: obj.x, y: obj.y }); // already settled: play again
    else ctx.hop(id);
    return true;
  }
  if (/^goal_(red|blue|yellow)$/.test(id)) { ctx.sparkle({ x: obj.x, y: obj.y }); ctx.hop(id); return true; }

  // ------------------------------------------------------------ the Shimmering River
  if (id === 'coralie_r') {
    ctx.react(id);
    if (once('river_intro')) { await ctx.say(SCRIPT.riverIntro); return true; }
    await ctx.say(!f.RIVER_FRIENDLY ? SCRIPT.riverHint : !f.RIVER_PEARLS ? SCRIPT.riverPearlsHint : SCRIPT.riverHint);
    return true;
  }
  if (id === 'race_start') {
    if (K.raceActive()) { K.stopRace(); return true; }
    if (once('race_pick')) await ctx.say(SCRIPT.racePick);
    const choice = await ctx.pickOne([{ id: 'free', picture: 'icon_mermaid' }, { id: 'friendly', picture: 'px_dolphin' }, { id: 'star', picture: 'icon_star' }]);
    if (!choice) return true;
    const r = await ctx.playRace(choice as RaceMode);
    if (r.finished && r.mode !== 'free') await onRaceFinish(ctx, r.mode, r.stars, r.ms);
    return true;
  }
  return false;
}

/** One early-learning activity (letter sound, rhyme): ask, let her try with hints, celebrate, count it, finish the set. */
async function learn(ctx: StoryCtx, pid: string, speaker: Line['speaker'], set: string[], flag: QuestFlag, done: readonly Line[]) {
  const def: PuzzleDef = puzzleById(pid)!;
  freshen(ctx, pid);
  await ctx.say([{ speaker, key: def.narrationKey }]);
  const r = await ctx.choicePuzzle(def, false);
  if (!r.solved) return;
  markDone(ctx.state.kingdom, pid); ctx.save();
  const celebrateWith = def.type === 'sound-picture' ? def.correctAnswer as string : (def.choices.find((c) => c.id === def.correctAnswer)?.picture ?? 'heart');
  ctx.celebrate(celebrateWith);
  await ctx.say([{ speaker, key: `success_${pid}` }]);
  if (allDone(ctx.state.kingdom, set) && !ctx.state.flags[flag]) {
    ctx.complete(flag);
    await ctx.say(done);
  }
}

async function lanternsWon(ctx: StoryCtx) {
  const fresh = ctx.complete('LANTERNS_LIT');
  ctx.celebrate('icon_lamp');
  // a trail of sparkles along the newly opened path (the map is mirrored: the clearing is at the south end)
  for (const y of [19, 21, 23]) ctx.sparkle({ x: 20, y });
  if (fresh) await ctx.say(SCRIPT.lanternsDone);
}

async function tendPlot(ctx: StoryCtx, id: PlotId) {
  const K = ctx.k, stage = K.plotStage(id);
  if (stage === 'empty') {
    if (!K.held()) { await ctx.say(SCRIPT.gardenPlant); return; }
    K.plant(id);
    if (once('garden_water')) await ctx.say(SCRIPT.gardenWater);
    return;
  }
  if (stage === 'seed') {
    const c = await K.water(id);
    void services.audio.speak(WORD_OF[c]);
    const fresh = ctx.complete('GARDEN_GROWN');
    if (fresh) ctx.celebrate('flower');
    if (plantedCount(ctx.state.kingdom) >= 3 && !ctx.state.flags.FOUNTAIN_RESTORED && once('fountain_ready')) await ctx.say(SCRIPT.fountainReady);
    return;
  }
  if (stage === 'flower') {
    const held = K.held(), cur = K.plantedSeed(id);
    if (held && held !== cur) K.replant(id); else K.petFlower(id);
  }
}

async function countLadybug(ctx: StoryCtx, obj: ObjDef) {
  const def = puzzleById('ladybugs')!;
  const prog = (ctx.state.puzzles.ladybugs ??= newProgress());
  if (prog.solved) freshen(ctx, 'ladybugs'); // replay: start a new count
  const r = countTap(def, prog, ksession.counted, obj.id);
  ctx.hop(obj.id);
  if (r.result === 'duplicate') return; // already counted: a happy hop, never an error
  ctx.setFrame(obj.id, 1);
  services.audio.sfx('pop');
  ctx.showCount(r.number, 3);
  await services.audio.speak(`word_ladybug_${r.number}`);
  if (r.result !== 'done') return;
  ctx.hideCount();
  ctx.celebrate('px_ladybug');
  ctx.complete('GARDEN_COUNTED');
  ksession.counted.clear();
  await ctx.say([L('nana', 'success_ladybugs')]);
  for (const n of [1, 2, 3]) ctx.setFrame(`ladybug_${n}`, 0);
}

// ---------------------------------------------------------------- callbacks from the world layer
export async function onSecretRevealed(ctx: StoryCtx, flag: QuestFlag) {
  if (ctx.state.flags[flag]) return;
  ctx.complete(flag);
  services.audio.sfx('chime');
}

export async function onButterfliesDone(ctx: StoryCtx) {
  const fresh = ctx.complete('BUTTERFLIES_GUIDED');
  ctx.celebrate('px_butterfly_blue');
  if (fresh) await ctx.say(SCRIPT.butterfliesDone);
}

export async function onShellChime(ctx: StoryCtx, id: string) {
  ksession.chimed.add(id);
  if (ksession.chimed.size >= 4 && !ctx.state.flags.RIVER_PEARLS) {
    ctx.complete('RIVER_PEARLS');
    ctx.celebrate('pearl');
    await ctx.say(SCRIPT.riverPearlsDone);
  }
}

export async function onRaceFinish(ctx: StoryCtx, mode: RaceMode, stars: number, ms: number) {
  const r = ctx.state.kingdom.race;
  if (mode === 'friendly') {
    r.friendly += 1;
    ctx.complete('RIVER_FRIENDLY');
    ctx.celebrate('icon_mermaid');
    await ctx.say(SCRIPT.raceDone);
  } else if (mode === 'star') {
    if (stars > r.starBest) r.starBest = stars;
    if (stars > 0 && (r.bestMs === 0 || ms < r.bestMs)) r.bestMs = Math.floor(ms);
    if (stars > 0) ctx.complete('RIVER_STAR');
    ctx.celebrate('icon_star', 5);
    await ctx.say(SCRIPT.raceStars);
  }
  ctx.save();
}
