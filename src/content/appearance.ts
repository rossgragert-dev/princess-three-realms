import type { QuestFlag } from '../types/game';

/**
 * v0.3 Royal Wardrobe & Enchanted Vanity: the pure data + logic behind what the princess looks like.
 * No Phaser here (unit tested). Ownership (`wardrobe.unlocked`) is deliberately separate from the equipped look (`appearance`).
 */
export type AppearanceSlot =
  | 'dress' | 'dressColor' | 'shoes' | 'accessory'
  | 'hairstyle' | 'hairColor' | 'tiara' | 'earrings' | 'necklace' | 'faceAccent' | 'skinTone';

export interface PrincessAppearance {
  dressId: string;
  dressColorId: string;
  shoesId: string;
  accessoryId: string;
  hairstyleId: string;
  hairColorId: string;
  tiaraId: string;
  earringsId: string;
  necklaceId: string;
  faceAccentId: string;
  skinToneId: string;
}

/** hi, base, shadow, deep shadow (also used for outlines). */
export type Ramp = readonly [string, string, string, string];

export interface OptionDef {
  id: string;
  /** Adult-facing only. The child never reads. */
  name: string;
  /** Quest flag that earns it. Undefined = owned from the start. */
  flag?: QuestFlag;
  /** Picture shown on the locked silhouette: where it comes from. */
  hintIcon?: string;
}

export interface ColorDef extends OptionDef { ramp: Ramp }

const o = (id: string, name: string, flag?: QuestFlag, hintIcon?: string): OptionDef => ({ id, name, flag, hintIcon });

export const DRESSES: OptionDef[] = [
  o('royal_ball', 'Royal Ball Gown'),
  o('garden', 'Garden Dress'),
  o('rose_petal', 'Rose-Petal Dress'),
  o('festival', 'Festival Dress'),
  o('starry_night', 'Starry Night Dress', 'GROTTO_CHEST', 'chest'),
  o('rainbow_gown', 'Rainbow Princess Gown', 'RAINBOW_BRIDGE_OPEN', 'icon_rainbow'),
  o('sea_glass', 'Sea-Glass Dress', 'SHORE_CHEST', 'chest'),
  o('fairy_sparkle', 'Fairy-Sparkle Gown', 'FAIRY_DUST_FOUND', 'sparkle0')
];

const c = (id: string, name: string, ramp: Ramp): ColorDef => ({ id, name, ramp });

export const DRESS_COLORS: ColorDef[] = [
  c('pink', 'Pink', ['#ffb8e2', '#ff7ec3', '#cf4f9f', '#9b3a86']),
  c('lavender', 'Lavender', ['#ece0ff', '#c9a8ff', '#9a78e0', '#6a4ca8']),
  c('purple', 'Purple', ['#c9a8ff', '#a06bff', '#6f43c9', '#47298f']),
  c('blue', 'Blue', ['#8fd8ff', '#3ea6ff', '#2169dc', '#1747a6']),
  c('teal', 'Teal', ['#8ff3e6', '#31d6c8', '#1a9aa8', '#126a78']),
  c('mint', 'Mint', ['#d6ffdc', '#8be8a8', '#4cb878', '#2f8454']),
  c('red', 'Red', ['#ffa3ae', '#ff5a6e', '#c93a58', '#8f2442']),
  c('gold', 'Gold', ['#fff3a0', '#ffd93d', '#e59a1a', '#a8650f']),
  c('peach', 'Peach', ['#ffe0cc', '#ffb894', '#e8855e', '#b05a3a']),
  c('silver', 'White & Silver', ['#ffffff', '#ebe8f7', '#b8b2d6', '#7f77a8'])
];

export const HAIR_COLORS: ColorDef[] = [
  c('blonde', 'Blonde', ['#ffe27a', '#ffbf3f', '#d98a1f', '#9c5a12']),
  c('strawberry', 'Strawberry Blonde', ['#ffd0a8', '#f4a373', '#c97a4e', '#8f4f30']),
  c('light_brown', 'Light Brown', ['#c99a6a', '#a8743f', '#7a4e26', '#4f3017']),
  c('dark_brown', 'Dark Brown', ['#8a5a3a', '#5e3a22', '#3d2314', '#24130a']),
  c('black', 'Black', ['#6a5a8a', '#3a2d52', '#251c38', '#150f22']),
  c('auburn', 'Auburn', ['#d9694a', '#a8402a', '#7a2a1c', '#4a180f']),
  c('copper', 'Copper', ['#ffa860', '#e07a30', '#b05218', '#703010']),
  c('platinum', 'Platinum', ['#ffffff', '#f1eef8', '#cfc8e0', '#9a90b8']),
  c('pastel_pink', 'Pastel Pink', ['#ffd6ee', '#ffa8d8', '#e07eb8', '#a8508a']),
  c('lilac', 'Lilac', ['#ecdcff', '#c9a8ff', '#9a78e0', '#6a4ca8'])
];

export const SKIN_TONES: ColorDef[] = [
  c('porcelain', 'Porcelain', ['#fff0e0', '#ffdcc0', '#f3aa8c', '#c97a6a']),
  c('rose', 'Rose', ['#ffe0e0', '#ffc8c0', '#eb9a90', '#b86a64']),
  c('honey', 'Honey', ['#f7d3a8', '#e8b784', '#c48a5c', '#8f5e3a']),
  c('tan', 'Tan', ['#f0c090', '#d9a070', '#b07848', '#7e4f2e']),
  c('brown', 'Brown', ['#b8805a', '#935f3c', '#6e4026', '#47281a']),
  c('deep', 'Deep', ['#8a5a3c', '#6a4028', '#4a2a1a', '#2f1810'])
];

export const SHOES: OptionDef[] = [
  o('slippers', 'Satin Slippers'),
  o('mary_janes', 'Mary Janes'),
  o('boots', 'Adventure Boots'),
  o('jeweled', 'Jeweled Shoes'),
  o('sandals', 'Flower Sandals'),
  o('pearl_shoes', 'Pearl Shoes', 'PEARL_PLACED', 'pearl')
];

/** Capes, gloves and shoulder pieces. */
export const ACCESSORIES: OptionDef[] = [
  o('none', 'None'),
  o('royal_cape', 'Royal Cape'),
  o('lace_gloves', 'Lace Gloves'),
  o('flower_shawl', 'Flower Shawl'),
  o('butterfly_wings', 'Butterfly Wings', 'WAND_LIT', 'icon_wand'),
  o('moon_cape', 'Moonlight Cape', 'MOONSTONE_FOUND', 'sparkle0')
];

export const HAIRSTYLES: OptionDef[] = [
  o('long', 'Long and Flowing'),
  o('bob', 'Short Bob'),
  o('ponytail', 'High Ponytail'),
  o('braids', 'Two Braids'),
  o('bun', 'Top Bun'),
  o('curls', 'Loose Curls')
];

export const TIARAS: OptionDef[] = [
  o('none', 'None'),
  o('gold_tiara', 'Golden Tiara'),
  o('pearl_crown', 'Pearl Crown'),
  o('star_tiara', 'Star Tiara', 'STAR_1_FOUND', 'icon_star'),
  o('flower_crown', 'Flower Crown', 'GARDEN_SEQUENCED', 'flower'),
  o('bunny_ribbon', 'Bunny Hair Ribbon', 'PIP_CARROTS_DONE', 'icon_pip'),
  o('butterfly_clip', 'Butterfly Hair Clip', 'BUTTERFLY_FOUND', 'sparkle0')
];

export const EARRINGS: OptionDef[] = [
  o('none', 'None'),
  o('pearl_studs', 'Pearl Studs'),
  o('star_drops', 'Star Drops'),
  o('flower_dangles', 'Flower Dangles')
];

export const NECKLACES: OptionDef[] = [
  o('none', 'None'),
  o('heart_pendant', 'Heart Pendant'),
  o('star_pendant', 'Star Pendant'),
  o('gem_choker', 'Gem Choker'),
  o('pearl_strand', 'Pearl Necklace', 'MARINA_HELPED', 'icon_marina'),
  o('shell_necklace', 'Shell Necklace', 'CREEK_CHEST', 'chest')
];

export const FACE_ACCENTS: OptionDef[] = [
  o('none', 'None'),
  o('rosy_cheeks', 'Rosy Cheeks'),
  o('star_freckles', 'Star Freckles'),
  o('glitter_cheeks', 'Glitter Cheeks'),
  o('butterfly_accent', 'Butterfly Sparkle')
];

export const CATALOG: Record<AppearanceSlot, OptionDef[]> = {
  dress: DRESSES, dressColor: DRESS_COLORS, shoes: SHOES, accessory: ACCESSORIES,
  hairstyle: HAIRSTYLES, hairColor: HAIR_COLORS, tiara: TIARAS, earrings: EARRINGS, necklace: NECKLACES,
  faceAccent: FACE_ACCENTS, skinTone: SKIN_TONES
};

/** AppearanceSlot -> PrincessAppearance field */
export const FIELD: Record<AppearanceSlot, keyof PrincessAppearance> = {
  dress: 'dressId', dressColor: 'dressColorId', shoes: 'shoesId', accessory: 'accessoryId',
  hairstyle: 'hairstyleId', hairColor: 'hairColorId', tiara: 'tiaraId', earrings: 'earringsId', necklace: 'necklaceId',
  faceAccent: 'faceAccentId', skinTone: 'skinToneId'
};

export const SLOTS_ALL = Object.keys(CATALOG) as AppearanceSlot[];

export function defaultAppearance(): PrincessAppearance {
  return {
    dressId: 'royal_ball', dressColorId: 'pink', shoesId: 'slippers', accessoryId: 'none',
    hairstyleId: 'long', hairColorId: 'blonde', tiaraId: 'gold_tiara', earringsId: 'none',
    necklaceId: 'none', faceAccentId: 'none', skinToneId: 'porcelain'
  };
}

export interface WardrobeState {
  /** Earned wearable ids (only options that have a quest flag). */
  unlocked: string[];
  /** Earned but not yet shown in a "new thing!" reveal (e.g. granted by migrating an older save). */
  pending: string[];
}

export const defaultWardrobe = (): WardrobeState => ({ unlocked: [], pending: [] });

export const optionOf = (slot: AppearanceSlot, id: string): OptionDef | undefined => CATALOG[slot].find((x) => x.id === id);

/** Which slot an earned wearable id belongs to. */
export function slotOfWearable(id: string): AppearanceSlot | undefined {
  return SLOTS_ALL.find((s) => CATALOG[s].some((x) => x.id === id && x.flag));
}

export const ALL_WEARABLES: OptionDef[] = SLOTS_ALL.flatMap((s) => CATALOG[s].filter((x) => x.flag));
export const wearableForFlag = (flag: QuestFlag): string | undefined => ALL_WEARABLES.find((w) => w.flag === flag)?.id;

export function isOwned(slot: AppearanceSlot, id: string, unlocked: readonly string[]): boolean {
  const opt = optionOf(slot, id);
  if (!opt) return false;
  return !opt.flag || unlocked.includes(id);
}

/** Pure: grant (idempotently) the wearable a flag earns. Returns its id the first time only. */
export function grantForFlag(w: WardrobeState, flag: QuestFlag): string | undefined {
  const id = wearableForFlag(flag);
  if (!id || w.unlocked.includes(id)) return undefined;
  w.unlocked.push(id);
  return id;
}

/**
 * Select an option. Locked/unknown choices are refused (returns false) and nothing changes.
 * Selecting is free and unlimited: no cost, no timer.
 */
export function selectOption(app: PrincessAppearance, w: WardrobeState, slot: AppearanceSlot, id: string): boolean {
  if (!isOwned(slot, id, w.unlocked)) return false;
  app[FIELD[slot]] = id;
  return true;
}

/** Robust sanitation of whatever the save file held. Never throws; locked or malformed selections fall back to defaults. */
export function sanitizeWardrobe(rawApp: unknown, rawWardrobe: unknown, flags: Partial<Record<QuestFlag, boolean>>): { appearance: PrincessAppearance; wardrobe: WardrobeState } {
  const rw = (rawWardrobe && typeof rawWardrobe === 'object' ? rawWardrobe : {}) as Partial<WardrobeState>;
  const savedUnlocked = Array.isArray(rw.unlocked) ? rw.unlocked.filter((x): x is string => typeof x === 'string') : [];
  const savedPending = Array.isArray(rw.pending) ? rw.pending.filter((x): x is string => typeof x === 'string') : [];
  const unlocked: string[] = [];
  const pending: string[] = [];
  for (const wd of ALL_WEARABLES) {
    const had = savedUnlocked.includes(wd.id);
    const earnedByFlag = !!(wd.flag && flags[wd.flag]);
    if (had || earnedByFlag) {
      unlocked.push(wd.id);
      // Newly granted because an older save already completed the quest: show the reveal once, at a calm moment.
      if (!had || savedPending.includes(wd.id)) pending.push(wd.id);
    }
  }
  const ra = (rawApp && typeof rawApp === 'object' ? rawApp : {}) as Record<string, unknown>;
  const d = defaultAppearance();
  const app = { ...d };
  for (const slot of SLOTS_ALL) {
    const f = FIELD[slot];
    const v = ra[f];
    if (typeof v === 'string' && isOwned(slot, v, unlocked)) app[f] = v;
  }
  return { appearance: app, wardrobe: { unlocked, pending } };
}

export const dressColor = (id: string): ColorDef => DRESS_COLORS.find((x) => x.id === id) ?? DRESS_COLORS[0];
export const hairColor = (id: string): ColorDef => HAIR_COLORS.find((x) => x.id === id) ?? HAIR_COLORS[0];
export const skinTone = (id: string): ColorDef => SKIN_TONES.find((x) => x.id === id) ?? SKIN_TONES[0];

export function randomizeCandidates(slot: AppearanceSlot, unlocked: readonly string[]): string[] {
  return CATALOG[slot].filter((x) => !x.flag || unlocked.includes(x.id)).map((x) => x.id);
}

/** Which slots a given screen shows, in tab order. */
export const WARDROBE_TABS: AppearanceSlot[] = ['dress', 'dressColor', 'shoes', 'accessory'];
export const VANITY_TABS: AppearanceSlot[] = ['hairstyle', 'hairColor', 'tiara', 'earrings', 'necklace', 'faceAccent', 'skinTone'];

export function unseenCount(w: WardrobeState): number { return w.pending.length; }
