// v0.4c: The Kingdom Beyond — pure data and rules for the garden and the river race records.
// Nothing here touches Phaser: every rule is unit tested and every saved value is sanitized on load.
import type { GameState } from '../types/game';

/** The four seed colours: the flower that grows always matches the seed that was planted. */
export const SEEDS = ['red', 'blue', 'yellow', 'pink'] as const;
export type Seed = (typeof SEEDS)[number];
export const SEED_HEX: Record<Seed, number> = { red: 0xff5a6e, blue: 0x3ea6ff, yellow: 0xffd93d, pink: 0xff7ec3 };

/** Garden beds she can plant in. Free gardening: planting, watering and replanting never cost or lose anything. */
export const PLOT_IDS = ['plot_1', 'plot_2', 'plot_3', 'plot_4', 'plot_5', 'plot_6'] as const;
export type PlotId = (typeof PLOT_IDS)[number];

export const FOUNTAIN_COLORS = [0x7be3ff, 0xff7ec3, 0xffd93d, 0xa06bff, 0x5be3b0] as const;

export interface RaceRecords {
  /** Times the friendly race was finished (replay is always welcome). */
  friendly: number;
  /** Best Star Challenge result: number of stars (0-3) and fastest time in ms (0 = none yet). */
  starBest: number;
  bestMs: number;
}

/** Replayable activities that were completed at least once (replaying never removes a record). */
export const ACTIVITY_IDS = ['sound_s', 'sound_c', 'sound_f', 'rhyme_cat', 'rhyme_bee', 'rhyme_frog', 'story_egg', 'story_day', 'garden_grow'] as const;

export interface Kingdom {
  garden: Partial<Record<PlotId, Seed>>;
  /** Activity ids finished at least once. */
  done: string[];
  fountain: number;
  race: RaceRecords;
}

export const defaultKingdom = (): Kingdom => ({ garden: {}, done: [], fountain: 0, race: { friendly: 0, starBest: 0, bestMs: 0 } });

const int = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Never throws; unknown plots, unknown seeds and unknown secrets are dropped, numbers are clamped. */
export function sanitizeKingdom(raw: unknown): Kingdom {
  const d = defaultKingdom();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Record<keyof Kingdom, unknown>>;
  if (r.garden && typeof r.garden === 'object') {
    for (const [k, v] of Object.entries(r.garden as Record<string, unknown>)) {
      if ((PLOT_IDS as readonly string[]).includes(k) && (SEEDS as readonly string[]).includes(v as string)) d.garden[k as PlotId] = v as Seed;
    }
  }
  if (Array.isArray(r.done)) for (const v of r.done) if (typeof v === 'string' && (ACTIVITY_IDS as readonly string[]).includes(v) && !d.done.includes(v)) d.done.push(v);
  d.fountain = int(r.fountain, FOUNTAIN_COLORS.length - 1);
  const rc = (r.race && typeof r.race === 'object' ? r.race : {}) as Partial<RaceRecords>;
  d.race = { friendly: int(rc.friendly, 100000), starBest: int(rc.starBest, 3), bestMs: int(rc.bestMs, 3_600_000) };
  return d;
}

// ------------------------------------------------------------------ growing magic (seed -> water -> sprout -> flower)
export type PlotStage = 'empty' | 'seed' | 'watered' | 'sprout' | 'flower';
export type PlotAction = 'plant' | 'water' | 'grow' | 'pick';

/** Pure plot state machine. Wrong or repeated actions are ignored (never an error). */
export function nextStage(stage: PlotStage, action: PlotAction): PlotStage {
  switch (stage) {
    case 'empty': return action === 'plant' ? 'seed' : stage;
    case 'seed': return action === 'water' ? 'watered' : stage;
    case 'watered': return action === 'grow' ? 'sprout' : stage;
    case 'sprout': return action === 'grow' ? 'flower' : stage;
    case 'flower': return action === 'pick' ? 'empty' : stage;
  }
}

/** The stage a plot shows after loading: only grown flowers are saved. */
export const stageOf = (k: Kingdom, id: PlotId): PlotStage => (k.garden[id] ? 'flower' : 'empty');
export const plantedCount = (k: Kingdom) => Object.keys(k.garden).length;
export const distinctColors = (k: Kingdom) => new Set(Object.values(k.garden)).size;

/** Counting game: how many flowers of this colour are in the garden. */
export const countColor = (k: Kingdom, c: Seed) => Object.values(k.garden).filter((s) => s === c).length;

/** Growing is the only way to make the fountain happy: enough different flowers restores it (always possible, never timed). */
export const FOUNTAIN_NEEDS = 3;
export const fountainReady = (k: Kingdom) => plantedCount(k) >= FOUNTAIN_NEEDS;

export const kingdomOf = (s: Pick<GameState, 'kingdom'>): Kingdom => s.kingdom;

export const markDone = (k: Kingdom, id: string): boolean => {
  if (!(ACTIVITY_IDS as readonly string[]).includes(id) || k.done.includes(id)) return false;
  k.done.push(id);
  return true;
};
export const allDone = (k: Kingdom, ids: readonly string[]) => ids.every((i) => k.done.includes(i));
