import { defaultLayout, migrateLegacy, sanitizeLayout, type PlacedItem } from '../content/furniture';
import type { GameState, SceneId } from '../types/game';
import { DEFAULT_WAND, defaultActivities, sanitizeActivities, sanitizeUnlockedWand, sanitizeWand, START_OPTIONS, syncWandUnlocks } from '../content/family';
import { sanitizeDecor } from '../content/decorCatalog';
import { defaultRoomTheme, sanitizeRoomTheme } from '../content/roomThemes';
import { defaultKingdom, sanitizeKingdom } from '../content/kingdom';
import { defaultAppearance, defaultWardrobe, sanitizeWardrobe } from '../content/appearance';

export const SAVE_KEY = 'ptr_save_v1';

export const SAFE_SPAWN: Record<SceneId, string> = {
  courtyard: 'start',
  woods: 'from_courtyard',
  shore: 'from_woods',
  grotto: 'from_shore',
  bedroom: 'from_courtyard',
  festival: 'from_courtyard',
  conservatory: 'from_courtyard',
  meadow: 'from_woods',
  enchanted: 'from_woods',
  garden: 'from_courtyard',
  river: 'from_shore',
  throne: 'from_courtyard',
  greenhouse: 'from_garden',
  kitchen: 'from_throne',
  gallery: 'from_throne',
  labyrinth: 'from_festival',
  moat: 'from_courtyard',
  moat_depths: 'from_moat',
  coral_garden: 'from_depths'
};

export function defaultState(): GameState {
  return {
    version: 1,
    scene: 'courtyard',
    spawn: 'start',
    form: 'princess',
    flags: {},
    stars: 0,
    stickers: [],
    unlockedDecor: [],
    equippedWand: { ...DEFAULT_WAND },
    unlockedWand: [...START_OPTIONS],
    activities: defaultActivities(),
    bedroom: {},
    bedroomLayout: defaultLayout(),
    roomTheme: defaultRoomTheme(),
    appearance: defaultAppearance(),
    wardrobe: defaultWardrobe(),
    kingdom: defaultKingdom(),
    puzzles: {},
    settings: {
      musicVolume: 0.5,
      voiceVolume: 1,
      sfxVolume: 0.7,
      narration: false,
      captions: false,
      reducedEffects: false,
      dpad: true
    }
  };
}

const SCENES: SceneId[] = ['courtyard', 'woods', 'shore', 'grotto', 'bedroom', 'festival', 'conservatory', 'meadow', 'enchanted', 'garden', 'river', 'throne', 'greenhouse', 'kitchen', 'gallery', 'labyrinth', 'moat', 'moat_depths', 'coral_garden'];

/** Merge arbitrary parsed JSON onto safe defaults; never throws, never strands the player. */
export function sanitize(raw: unknown): GameState {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<GameState>;
  const scene = SCENES.includes(r.scene as SceneId) ? (r.scene as SceneId) : d.scene;
  const form = r.form === 'unicorn' || r.form === 'mermaid' || r.form === 'princess' ? r.form : d.form;
  // Form must be valid for the scene: water-only scene needs mermaid, land scenes can't be mermaid.
  const safeForm = scene === 'grotto' || scene === 'river' ? 'mermaid' : form === 'mermaid' && scene !== 'shore' ? 'princess' : form;
  const decor = sanitizeDecor(r.unlockedDecor, r.bedroom);
  // v0.4a.1: furniture is free-placed. A layout in the save is validated; an older slot layout is migrated to the nearest valid spots
  // (nothing is lost: what does not fit simply waits in the toy box); a pre-v0.4a empty room gets the starter furniture.
  let bedroomLayout: PlacedItem[];
  if (Array.isArray((r as { bedroomLayout?: unknown }).bedroomLayout)) bedroomLayout = sanitizeLayout((r as { bedroomLayout?: unknown }).bedroomLayout, decor.unlockedDecor);
  else if (r.roomTheme === undefined && Object.keys(decor.bedroom).length === 0) bedroomLayout = defaultLayout();
  else bedroomLayout = migrateLegacy(decor.bedroom, decor.unlockedDecor);
  const flags = { ...(typeof r.flags === 'object' && r.flags ? r.flags : {}) };
  const look = sanitizeWardrobe(r.appearance, r.wardrobe, flags);
  const activities = sanitizeActivities((r as { activities?: unknown }).activities);
  const unlockedWand = sanitizeUnlockedWand((r as { unlockedWand?: unknown }).unlockedWand);
  syncWandUnlocks({ flags, activities, unlockedWand });
  const wand = sanitizeWand((r as { equippedWand?: unknown }).equippedWand, unlockedWand);
  return {
    version: 1,
    scene,
    spawn: typeof r.spawn === 'string' ? r.spawn : SAFE_SPAWN[scene],
    form: safeForm,
    tile: r.tile && Number.isFinite(r.tile.x) && Number.isFinite(r.tile.y) ? { x: r.tile.x | 0, y: r.tile.y | 0 } : undefined,
    flags,
    stars: Number.isFinite(r.stars) ? Math.max(0, Math.min(6, r.stars as number)) : 0,
    stickers: Array.isArray(r.stickers) ? r.stickers.filter((s) => typeof s === 'string') : [],
    unlockedDecor: decor.unlockedDecor,
    bedroom: {},
    bedroomLayout,
    roomTheme: sanitizeRoomTheme(r.roomTheme),
    appearance: look.appearance,
    wardrobe: look.wardrobe,
    equippedWand: wand,
    unlockedWand,
    activities,
    kingdom: sanitizeKingdom((r as { kingdom?: unknown }).kingdom),
    puzzles: typeof r.puzzles === 'object' && r.puzzles ? { ...r.puzzles } : {},
    // the on-screen arrows are permanent since v0.4a, whatever an older save said
    settings: { ...d.settings, ...(typeof r.settings === 'object' && r.settings ? r.settings : {}), dpad: true }
  };
}

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export class SaveManager {
  state: GameState;
  constructor(private store: KV) {
    this.state = this.load();
  }

  load(): GameState {
    try {
      const txt = this.store.getItem(SAVE_KEY);
      return txt ? sanitize(JSON.parse(txt)) : defaultState();
    } catch {
      return defaultState();
    }
  }

  save(): void {
    try {
      this.store.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      /* private mode / quota: play continues unsaved */
    }
  }

  /** Parent-gated reset. */
  reset(): void {
    this.state = defaultState();
    try {
      this.store.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
}
