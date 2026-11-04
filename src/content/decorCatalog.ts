import type { QuestFlag } from '../types/game';

/**
 * Princess bedroom: slots (hotspots), the 12 unlockable items, and the rules that tie them together.
 * Pure data + pure functions (unit tested). Rendering lives in WorldScene, the picker in UIScene.
 */
export type DecorCategory = 'bed' | 'rug' | 'lamp' | 'wall' | 'plush' | 'shelf' | 'window' | 'accent';
export type UnlockSource = 'quest' | 'puzzle' | 'gift' | 'hidden' | 'chest';
export type DecorLayer = 'floor' | 'stand' | 'wall';

export interface SlotDef {
  id: string;
  category: DecorCategory;
  /** Tile the hotspot sits on. Floor items stand on this tile; wall items hang with their bottom on it. */
  x: number;
  y: number;
}

export interface DecorDef {
  id: string;
  /** Adult-facing only (never shown to the child). */
  name: string;
  category: DecorCategory;
  source: UnlockSource;
  /** The quest flag whose completion unlocks this item (the single unlock mechanism). */
  flag: QuestFlag;
  /** Picture of the place/friend that gives it: shown on the locked silhouette so no reading is needed. */
  hintIcon: string;
  /** Texture drawn in the room and in the picker. */
  sprite: { key: string; frame?: number };
  layer: DecorLayer;
  /** Pixel nudges from the slot tile (ox: from tile centre; dy: from tile bottom). */
  ox?: number;
  dy?: number;
}

export const SLOTS: SlotDef[] = [
  { id: 'slot_bed', category: 'bed', x: 4, y: 7 },
  { id: 'slot_plush_a', category: 'plush', x: 7, y: 8 },
  { id: 'slot_plush_b', category: 'plush', x: 8, y: 12 },
  { id: 'slot_rug', category: 'rug', x: 12, y: 13 },
  { id: 'slot_lamp', category: 'lamp', x: 17, y: 8 },
  { id: 'slot_wall_a', category: 'wall', x: 3, y: 2 },
  { id: 'slot_wall_b', category: 'wall', x: 9, y: 2 },
  { id: 'slot_wall_c', category: 'wall', x: 18, y: 2 },
  { id: 'slot_window', category: 'window', x: 15, y: 2 },
  { id: 'slot_shelf', category: 'shelf', x: 20, y: 2 },
  { id: 'slot_accent', category: 'accent', x: 20, y: 9 },
  { id: 'slot_accent_b', category: 'accent', x: 9, y: 15 }
];

export const DECOR: Record<string, DecorDef> = {
  star_lamp: { id: 'star_lamp', name: 'Star Lamp', category: 'lamp', source: 'quest', flag: 'STAR_1_FOUND', hintIcon: 'icon_star', sprite: { key: 'lamp', frame: 1 }, layer: 'stand' },
  bunny_pillow: { id: 'bunny_pillow', name: 'Bunny Pillow', category: 'plush', source: 'gift', flag: 'PIP_CARROTS_DONE', hintIcon: 'icon_pip', sprite: { key: 'bunny_pillow' }, layer: 'stand' },
  unicorn_plush: { id: 'unicorn_plush', name: 'Unicorn Plush', category: 'plush', source: 'gift', flag: 'RAINBOW_BRIDGE_OPEN', hintIcon: 'icon_unicorn', sprite: { key: 'unicorn_plush' }, layer: 'stand' },
  rainbow_rug: { id: 'rainbow_rug', name: 'Rainbow Rug', category: 'rug', source: 'puzzle', flag: 'SHELLS_MATCHED', hintIcon: 'shell', sprite: { key: 'rug' }, layer: 'floor' },
  shell_mirror: { id: 'shell_mirror', name: 'Shell Mirror', category: 'wall', source: 'gift', flag: 'MARINA_HELPED', hintIcon: 'icon_marina', sprite: { key: 'shell_mirror' }, layer: 'wall', dy: -3 },
  mermaid_art: { id: 'mermaid_art', name: 'Mermaid Wall Art', category: 'wall', source: 'puzzle', flag: 'PEARL_PLACED', hintIcon: 'pearl', sprite: { key: 'mermaid_art' }, layer: 'wall', dy: -3 },
  butterfly_painting: { id: 'butterfly_painting', name: 'Butterfly Painting', category: 'wall', source: 'hidden', flag: 'BUTTERFLY_FOUND', hintIcon: 'sparkle0', sprite: { key: 'butterfly_painting' }, layer: 'wall', dy: -3 },
  flower_pot: { id: 'flower_pot', name: 'Flower Pot', category: 'shelf', source: 'puzzle', flag: 'GARDEN_SEQUENCED', hintIcon: 'flower', sprite: { key: 'vase' }, layer: 'stand', ox: 8, dy: -10 },
  canopy_bed: { id: 'canopy_bed', name: 'Canopy Bed', category: 'bed', source: 'gift', flag: 'LAMP_PLACED', hintIcon: 'icon_home', sprite: { key: 'canopy_bed' }, layer: 'stand' },
  moon_curtain: { id: 'moon_curtain', name: 'Moon Curtain', category: 'window', source: 'chest', flag: 'SHORE_CHEST', hintIcon: 'chest', sprite: { key: 'moon_curtain' }, layer: 'wall', ox: 8 },
  crystal_nightstand: { id: 'crystal_nightstand', name: 'Crystal Nightstand', category: 'accent', source: 'chest', flag: 'GROTTO_CHEST', hintIcon: 'chest', sprite: { key: 'crystal_nightstand' }, layer: 'stand' },
  treasure_chest: { id: 'treasure_chest', name: 'Treasure Chest', category: 'accent', source: 'chest', flag: 'CREEK_CHEST', hintIcon: 'chest', sprite: { key: 'decor_chest' }, layer: 'stand' }
};

export const DECOR_IDS = Object.keys(DECOR);
export const slotById = (id: string) => SLOTS.find((s) => s.id === id);

/** Old save ids -> current ids (v0.1 saves used these). */
export const LEGACY_DECOR: Record<string, string> = { lamp: 'star_lamp', vase: 'flower_pot', rug: 'rainbow_rug', shell_mobile: 'shell_mirror' };
export const LEGACY_SLOTS: Record<string, string> = { slot_table: 'slot_lamp', slot_shelf: 'slot_shelf', slot_floor: 'slot_rug', slot_ceiling: 'slot_window' };

/** The item a quest flag unlocks, if any. */
export const decorForFlag = (flag: QuestFlag): string | undefined => DECOR_IDS.find((id) => DECOR[id].flag === flag);

/** Every item a given slot can ever hold (its category), unlocked or not. */
export const optionsForSlot = (slot: string): DecorDef[] => {
  const s = slotById(slot);
  return s ? Object.values(DECOR).filter((d) => d.category === s.category) : [];
};

/** Items the child can place in this slot right now. */
export const decorForSlot = (slot: string, unlocked: readonly string[]): DecorDef[] => optionsForSlot(slot).filter((d) => unlocked.includes(d.id));

/** True if something unlocked fits the slot and nothing is placed there yet (drives the sparkle marker). */
export const slotHasNewOption = (slot: string, unlocked: readonly string[], placed: Record<string, string>) =>
  !placed[slot] && decorForSlot(slot, unlocked).length > 0;

/** Count of unlocked items not placed anywhere (drives the glowing Home button outside the bedroom). */
export const unplacedCount = (unlocked: readonly string[], placed: Record<string, string>) => {
  const used = new Set(Object.values(placed));
  return unlocked.filter((id) => DECOR[id] && !used.has(id)).length;
};

/**
 * Put `item` in `slot` (or empty the slot when item is null). An item lives in one place at a time, so it is lifted
 * from wherever it was. Returns false (and changes nothing) if the item is locked or does not fit the slot.
 */
export function placeDecor(state: { unlockedDecor: string[]; bedroom: Record<string, string> }, slot: string, item: string | null): boolean {
  const sd = slotById(slot);
  if (!sd) return false;
  if (item === null) { delete state.bedroom[slot]; return true; }
  const d = DECOR[item];
  if (!d || d.category !== sd.category || !state.unlockedDecor.includes(item)) return false;
  for (const k of Object.keys(state.bedroom)) if (state.bedroom[k] === item) delete state.bedroom[k];
  state.bedroom[slot] = item;
  return true;
}

/** Makes saved decor safe: migrates old ids, drops unknown/locked/misfit/duplicate placements. */
export function sanitizeDecor(unlocked: unknown, bedroom: unknown): { unlockedDecor: string[]; bedroom: Record<string, string> } {
  const ids: string[] = [];
  for (const raw of Array.isArray(unlocked) ? unlocked : []) {
    if (typeof raw !== 'string') continue;
    const id = LEGACY_DECOR[raw] ?? raw;
    if (DECOR[id] && !ids.includes(id)) ids.push(id);
  }
  const out: Record<string, string> = {};
  const used = new Set<string>();
  if (bedroom && typeof bedroom === 'object') {
    for (const [rawSlot, rawItem] of Object.entries(bedroom as Record<string, unknown>)) {
      if (typeof rawItem !== 'string') continue;
      const slot = LEGACY_SLOTS[rawSlot] ?? rawSlot;
      const item = LEGACY_DECOR[rawItem] ?? rawItem;
      const sd = slotById(slot), d = DECOR[item];
      if (!sd || !d || d.category !== sd.category || used.has(item) || out[slot]) continue;
      if (!ids.includes(item)) ids.push(item); // placed implies owned
      out[slot] = item; used.add(item);
    }
  }
  return { unlockedDecor: ids, bedroom: out };
}
