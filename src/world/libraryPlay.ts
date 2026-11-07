// v0.4d.5: plays one challenge from the activity library, adapts the tier, and runs "Pip's Games".
import type { StoryCtx } from './story';
import { FAMILIES, pickChallenge, recordResult, type Family } from '../content/puzzleLibrary';
import { newProgress } from '../systems/puzzleEngine';
import { services } from '../systems/services';

export const FAMILY_PIC: Record<Family, string> = { sound: 'icon_speaker', rhyme: 'cat', count: 'px_cnt_star3', shape: 'px_shape_star_yellow', pattern: 'icon_rainbow', story: 'px_chick', nature: 'flower' };

/** One replayable challenge. Resolves true when she solved it. Never awards or removes anything permanent. */
export async function playLibrary(ctx: StoryCtx, family: Family): Promise<boolean> {
  const kd = ctx.state.kingdom;
  const def = pickChallenge(family, kd.lib);
  ctx.state.puzzles[def.id] = newProgress();
  await ctx.say([{ speaker: 'pip', key: def.narrationKey }]);
  const r = def.type === 'sequence' || def.type === 'pattern' ? await ctx.sequencePuzzle(def, def.prefix ?? [], false) : await ctx.choicePuzzle(def, false);
  const prog = ctx.state.puzzles[def.id];
  delete ctx.state.puzzles[def.id]; // library progress is not kept per challenge: the save stays small
  if (!r.solved) { ctx.save(); return false; }
  recordResult(kd.lib, family, def, prog?.attempts ?? 0, !!prog?.assisted);
  ctx.save();
  const pic = typeof def.correctAnswer === 'string' ? (def.choices.find((c) => c.id === def.correctAnswer)?.picture ?? 'heart') : 'heart';
  ctx.celebrate(pic);
  services.audio.sfx('chime');
  await ctx.say([{ speaker: 'pip', key: `lib_win_${1 + (kd.lib.recent.length % 3)}` }]);
  return true;
}

/** Pip's Games: pick a kind of game by picture, play, pick again. The back button always leaves. */
export async function pipGames(ctx: StoryCtx): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const fam = await ctx.pickOne(FAMILIES.map((f) => ({ id: f, picture: FAMILY_PIC[f] })));
    if (!fam) return;
    await playLibrary(ctx, fam as Family);
  }
}

/** A friendly "play one more?" offered at spots whose first-time puzzle is already done. */
export async function offerOne(ctx: StoryCtx, family: Family): Promise<void> {
  const yes = await ctx.pickOne([{ id: 'y', picture: 'icon_play' }, { id: 'n', picture: FAMILY_PIC[family] === 'icon_play' ? 'icon_back' : 'icon_home' }]);
  if (yes === 'y') await playLibrary(ctx, family);
}
