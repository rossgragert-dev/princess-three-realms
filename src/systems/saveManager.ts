import type { GameState, SceneId } from '../types/game';
import { sanitizeDecor } from '../content/decorCatalog';
import { defaultAppearance, defaultWardrobe, sanitizeWardrobe } from '../content/appearance';

export const SAVE_KEY = 'ptr_save_v1';

export const SAFE_SPAWN: Record<SceneId, string> = {
  courtyard: 'start',
  woods: 'from_courtyard',
  shore: 'from_woods',
  grotto: 'from_shore',
  bedroom: 'from_courtyard'
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
    bedroom: {},
    appearance: defaultAppearance(),
    wardrobe: defaultWardrobe(),
    puzzles: {},
    settings: {
      musicVolume: 0.5,
      voiceVolume: 1,
      sfxVolume: 0.7,
      narration: false,
      captions: false,
      reducedEffects: false,
      dpad: false
    }
  };
}

const SCENES: SceneId[] = ['courtyard', 'woods', 'shore', 'grotto', 'bedroom'];

/** Merge arbitrary parsed JSON onto safe defaults; never throws, never strands the player. */
export function sanitize(raw: unknown): GameState {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<GameState>;
  const scene = SCENES.includes(r.scene as SceneId) ? (r.scene as SceneId) : d.scene;
  const form = r.form === 'unicorn' || r.form === 'mermaid' || r.form === 'princess' ? r.form : d.form;
  // Form must be valid for the scene: water-only scene needs mermaid, land scenes can't be mermaid.
  const safeForm = scene === 'grotto' ? 'mermaid' : form === 'mermaid' && scene !== 'shore' ? 'princess' : form;
  const decor = sanitizeDecor(r.unlockedDecor, r.bedroom);
  const flags = { ...(typeof r.flags === 'object' && r.flags ? r.flags : {}) };
  const look = sanitizeWardrobe(r.appearance, r.wardrobe, flags);
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
    bedroom: decor.bedroom,
    appearance: look.appearance,
    wardrobe: look.wardrobe,
    puzzles: typeof r.puzzles === 'object' && r.puzzles ? { ...r.puzzles } : {},
    settings: { ...d.settings, ...(typeof r.settings === 'object' && r.settings ? r.settings : {}) }
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
