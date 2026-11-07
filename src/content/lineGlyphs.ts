import { ITEM, UI } from './frameIndex';

/**
 * Picture-first dialogue: every spoken line also has a short row of pictures (max 4) so the child can follow the
 * story with no reading and no sound. A glyph is a UI icon (`icon_*`), an item frame name, or `#X` for a big letter/symbol.
 */
export const LINE_GLYPHS: Record<string, string[]> = {
  intro_welcome: ['icon_princess', 'heart', 'icon_home'],
  pip_intro: ['icon_pip', 'heart'],
  pip_count_carrots: ['carrot_top', 'carrot_top', 'carrot_top'],
  success_carrots: ['carrot', 'sparkle0', 'heart'],
  tree_sound_b: ['icon_tree', '#B', 'icon_sound'],
  success_tree_sound: ['icon_tree', 'sparkle0', 'heart'],
  king_hello: ['star', 'sparkle0', 'heart'],
  king_again: ['sparkle1', 'heart'],
  queen_hello: ['icon_wand', 'icon_star'],
  queen_again: ['icon_wand', 'heart'],
  dapple_hello: ['icon_unicorn', 'heart'],
  dapple_again: ['icon_unicorn', 'icon_star'],
  dapple_form: ['icon_wand', 'icon_unicorn'],
  willa_meadow: ['icon_unicorn', 'icon_up'],
  willa_intro: ['icon_unicorn', 'heart'],
  need_unicorn: ['icon_wand', 'icon_unicorn'],
  transform_unicorn: ['icon_unicorn', 'sparkle0'],
  transform_mermaid: ['icon_mermaid', 'sparkle0'],
  transform_princess: ['icon_princess', 'sparkle0'],
  form_wrong_terrain: ['icon_wand', 'icon_lock'],
  bramble_pattern: ['tile_red', 'tile_blue', 'tile_red', '#?'],
  success_bridge_pattern: ['icon_rainbow', 'sparkle0', 'heart'],
  bridge_bloom_prompt: ['icon_unicorn', 'bloom0', 'sparkle0'],
  shore_intro: ['icon_mermaid', 'water'],
  marina_intro: ['icon_marina', 'heart'],
  marina_find_starfish: ['starfish', 'starfish', 'starfish'],
  success_starfish: ['starfish', 'sparkle0', 'heart'],
  pearl_prompt: ['pearl', 'icon_wand'],
  pearl_pushed: ['pearl', 'sparkle0', 'heart'],
  star_found: ['star', 'sparkle0', 'heart'],
  nana_return: ['icon_home', 'heart'],
  decor_tutorial: ['icon_home', 'sparkle0', 'icon_hint'],
  lamp_placed: ['icon_lamp', 'sparkle0', 'heart'],
  chapter_done: ['star', 'icon_home', 'heart'],
  shell_rhyme_cat: ['cat', 'icon_music', 'hat'],
  success_shell_rhyme: ['hat', 'cat', 'heart'],
  garden_sequence: ['seed', 'water', 'flower'],
  success_garden_grow: ['flower', 'sparkle0', 'heart'],
  obj_pip: ['icon_pip', 'heart'],
  obj_tree: ['icon_tree', 'icon_sound'],
  obj_bridge: ['icon_rainbow', 'icon_unicorn'],
  obj_lake: ['water', 'icon_mermaid'],
  obj_marina: ['icon_marina', 'icon_down'],
  obj_star: ['star', 'sparkle0'],
  obj_home: ['icon_home', 'sparkle0'],
  wand_lit: ['icon_wand', 'sparkle0', 'heart'],
  chest_found: ['chest_open', 'sparkle0', 'heart'],
  bloom_cheer: ['bloom2', 'sparkle0', 'heart'],
  retry_gentle: ['heart', 'icon_hint'],
  hint_together: ['icon_hint', 'heart'],
  controls_tap: ['icon_princess', 'icon_hint'],
  quest_replay: ['icon_hint'],
  // v0.4c: the Kingdom Beyond
  king_fading: ['star', 'sparkle0', 'icon_wand'],
  queen_fading: ['icon_tree', 'flower', 'icon_mermaid'],
  obj_kingdom: ['icon_tree', 'flower', 'icon_mermaid'],
  woods_intro: ['icon_tree', 'px_mush', 'sparkle0'],
  obj_lanterns: ['px_lantern_red', 'px_lantern_blue', 'icon_hint'],
  lanterns_watch: ['px_lantern_red', 'px_lantern_blue', 'icon_next'],
  lanterns_again: ['px_lantern_yellow', 'icon_hint'],
  lanterns_done: ['px_lantern_pink', 'sparkle0', 'heart'],
  woods_done: ['icon_tree', 'sparkle0', 'heart'],
  atree_sound_s: ['icon_tree', '#S', 'icon_sound'],
  atree_sound_c: ['icon_tree', '#C', 'icon_sound'],
  atree_sound_f: ['icon_tree', '#F', 'icon_sound'],
  hint_atree_s_1: ['sun', 'icon_hint'], hint_atree_s_2: ['sun', 'icon_hint'],
  hint_atree_c_1: ['cat', 'icon_hint'], hint_atree_c_2: ['cat', 'icon_hint'],
  hint_atree_f_1: ['fish', 'icon_hint'], hint_atree_f_2: ['fish', 'icon_hint'],
  success_sound_s: ['sun', 'sparkle0', 'heart'], success_sound_c: ['cat', 'sparkle0', 'heart'], success_sound_f: ['fish', 'sparkle0', 'heart'],
  trees_done: ['icon_tree', 'sparkle0', 'heart'],
  bridge_rhyme_bee: ['px_bee', 'icon_music', 'px_treepic'],
  bridge_rhyme_frog: ['px_frog', 'icon_music', 'px_log'],
  hint_bee_1: ['px_bee', 'px_treepic'], hint_bee_2: ['px_treepic', 'icon_hint'],
  hint_frog_1: ['px_frog', 'px_log'], hint_frog_2: ['px_log', 'icon_hint'],
  success_rhyme_cat: ['cat', 'hat', 'heart'], success_rhyme_bee: ['px_bee', 'px_treepic', 'heart'], success_rhyme_frog: ['px_frog', 'px_log', 'heart'],
  bridge_done: ['icon_bridge', 'sparkle0', 'heart'],
  story_egg: ['px_egg', 'px_chick', 'px_hen'],
  story_day: ['star', 'sun', 'flower'],
  hint_story_1: ['px_egg', 'px_chick'], hint_story_2: ['px_egg', 'px_chick', 'px_hen'],
  hint_day_1: ['star', 'sun'], hint_day_2: ['star', 'sun', 'flower'],
  success_story_egg: ['px_hen', 'sparkle0', 'heart'], success_story_day: ['flower', 'sparkle0', 'heart'],
  word_egg: ['px_egg'], word_chick: ['px_chick'], word_hen: ['px_hen'], word_tree: ['px_treepic'], word_log: ['px_log'], word_star: ['star'],
  garden_intro: ['px_pkt_red', 'px_plot', 'water'],
  garden_plant: ['px_pkt_blue', 'icon_next', 'px_plot'],
  garden_water: ['water', 'px_seedmound', 'icon_next'],
  garden_fountain_hint: ['px_flower_red', 'px_flower_blue', 'px_flower_yellow'],
  garden_done: ['px_flower_pink', 'sparkle0', 'heart'],
  fountain_ready: ['flower', 'px_fountain', 'sparkle0'],
  fountain_back: ['water', 'sparkle0', 'heart'],
  fountain_tired: ['px_flower_red', 'px_flower_blue', 'px_flower_yellow'],
  butterfly_ask: ['px_butterfly_red', 'icon_next', 'px_flower_red'],
  butterflies_done: ['px_butterfly_blue', 'sparkle0', 'heart'],
  ladybug_count: ['px_ladybug', 'px_ladybug', 'px_ladybug'],
  word_ladybug_1: ['px_ladybug'], word_ladybug_2: ['px_ladybug'], word_ladybug_3: ['px_ladybug'],
  hint_ladybug_1: ['px_ladybug', 'icon_hint'], hint_ladybug_2: ['px_ladybug', 'sparkle0'],
  success_ladybugs: ['px_ladybug', 'sparkle0', 'heart'],
  word_red: ['px_flower_red'], word_blue: ['px_flower_blue'], word_yellow: ['px_flower_yellow'], word_pink: ['px_flower_pink'],
  river_intro: ['icon_mermaid', 'px_ring', 'water'],
  pet_keeper_hi: ['px_pet_cat0', 'px_pet_dog0', 'px_pet_bird0'], pet_chosen: ['heart', 'icon_home', 'sparkle0'],
  gh_lesson: ['px_pkt_red', 'px_gd_tulip', 'px_drop'], gh_carry: ['px_gd_rose', 'icon_home', 'sparkle0'],
  kitchen_hi: ['px_cake', 'icon_star', 'sparkle0'], gallery_hi: ['icon_brush', 'icon_palette', 'icon_star'], maze_king_hi: ['icon_star', 'heart', 'sparkle0'],
  blossom_hi: ['px_sflower', 'icon_music', 'sparkle0'],
  throne_king_hi: ['icon_star', 'sparkle0', 'heart'], throne_queen_hi: ['heart', 'icon_star', 'sparkle0'],
  throne_woods: ['icon_tree', 'icon_right'], throne_meadow: ['icon_unicorn', 'icon_right'], throne_shore: ['icon_mermaid', 'water'], throne_garden: ['px_flower_red', 'icon_up'], throne_race: ['px_startpost', 'water'],
  river_hint: ['px_startpost', 'px_shell'],
  river_pearls_hint: ['px_shell', 'bubble', 'icon_music'],
  river_pearls_done: ['px_shell', 'icon_music', 'heart'],
  race_pick: ['icon_mermaid', 'fish', 'icon_star'],
  race_go: ['px_ring', 'icon_right'],
  race_done: ['px_ring', 'sparkle0', 'heart'],
  race_stars: ['icon_star', 'icon_star', 'icon_star']
};

const BY_PREFIX: [RegExp, string[]][] = [
  [/^hint_carrots/, ['carrot_top', 'icon_hint']],
  [/^hint_tree/, ['ball', 'icon_hint']],
  [/^hint_pattern/, ['tile_red', 'tile_blue', 'tile_red']],
  [/^hint_starfish/, ['starfish', 'icon_hint']],
  [/^hint_rhyme/, ['hat', 'icon_hint']],
  [/^hint_sequence/, ['seed', 'water', 'flower']],
  [/^sticker_/, ['star', 'sparkle0']]
];

export const isGlyph = (g: string) => g.startsWith('#') || g.startsWith('px_') || g in ITEM || g in UI;

/** Pictures for a narration key. Never empty: unknown keys get a friendly heart. */
export function glyphsFor(key: string): string[] {
  if (LINE_GLYPHS[key]) return LINE_GLYPHS[key];
  for (const [re, g] of BY_PREFIX) if (re.test(key)) return g;
  const w = key.match(/^word_(.+)$/)?.[1];
  if (w) {
    const base = w.replace(/_\d+$/, ''); // word_carrot_2 -> carrot, word_starfish_3 -> starfish
    if (w in ITEM) return [w];
    if (base in ITEM) return [base];
    if (`${base}_top` in ITEM) return [`${base}_top`];
  }
  return ['heart'];
}
