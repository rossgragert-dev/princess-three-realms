// v0.4c: the reusable environmental-magic system. One common target shape, per-form capability rules and bounded
// temporary effects. Pure data and rules (no Phaser) so it is unit tested; WorldScene only draws the reactions.
import type { Form, QuestFlag } from '../types/game';
import type { MapDef } from './types';
import type { SpellTarget } from './spells';

export type EnvType =
  | 'sleepy_flower' | 'lantern' | 'music_mushroom' | 'vine' | 'butterfly'
  | 'water_wheel' | 'shell' | 'fountain' | 'ancient_tree' | 'treasure';

/** A magic-reactive thing placed in a map (tile units). Vines reveal secret passages via a flag-driven Gate. */
export interface EnvDef {
  id: string;
  type: EnvType;
  x: number;
  y: number;
  /** Musical things: which note of the scale (0-6). */
  note?: number;
  /** Secret passage (vines): the quest flag that records it is revealed; the map's Gate on that flag opens the way for good. */
  reveals?: QuestFlag;
  /** Treasure: sticker given once. */
  sticker?: string;
  /** Treasure: a quest flag completed the first time it is found. */
  flag?: QuestFlag;
  /** Trees: picture clue (an item/icon name) shown when they speak. */
  clue?: string;
}

export interface EnvRule {
  /** Which forms' magic wakes it. The wand, horn and bubbles each have a home. */
  forms: Form[];
  /** How long the visible response lasts (ms). Always bounded; shooting again just restarts it. */
  ms: number;
  /** Hit radius in tiles. */
  r: number;
}

export const ENV_RULES: Record<EnvType, EnvRule> = {
  sleepy_flower: { forms: ['princess', 'unicorn'], ms: 4000, r: 0.7 },
  lantern: { forms: ['princess', 'unicorn'], ms: 6000, r: 0.7 },
  music_mushroom: { forms: ['princess', 'unicorn', 'mermaid'], ms: 1500, r: 0.7 },
  vine: { forms: ['unicorn', 'princess', 'mermaid'], ms: 2500, r: 0.8 },
  butterfly: { forms: ['princess', 'unicorn'], ms: 7000, r: 0.8 },
  water_wheel: { forms: ['mermaid'], ms: 5000, r: 1.0 },
  shell: { forms: ['mermaid'], ms: 2500, r: 0.8 },
  fountain: { forms: ['princess', 'unicorn'], ms: 4500, r: 1.45 },
  ancient_tree: { forms: ['princess', 'unicorn'], ms: 3500, r: 1.1 },
  treasure: { forms: ['princess', 'unicorn', 'mermaid'], ms: 3000, r: 0.8 }
};

export const ENV_TYPES = Object.keys(ENV_RULES) as EnvType[];
export const envAccepts = (type: EnvType, form: Form): boolean => ENV_RULES[type].forms.includes(form);

/** Notes for the musical mushrooms / shell chimes (a pentatonic scale: always pleasant, any order). */
export const NOTE_HZ = [262, 294, 330, 392, 440, 523, 587] as const;

export const envId = (id: string) => `env:${id}`;
export const isEnvTarget = (t: SpellTarget) => t.id.startsWith('env:');
export const envKey = (t: SpellTarget) => t.id.slice(4);

/** Targets a given form's magic can wake on this map. Vines whose secret is already revealed no longer react. */
export function envTargets(map: MapDef, form: Form, flags: Partial<Record<QuestFlag, boolean>> = {}): SpellTarget[] {
  const out: SpellTarget[] = [];
  for (const e of map.env ?? []) {
    if (!envAccepts(e.type, form)) continue;
    if (e.type === 'vine' && e.reveals && flags[e.reveals]) continue;
    const rule = ENV_RULES[e.type];
    out.push({ id: envId(e.id), kind: 'env', env: e.type, x: e.x + 0.5, y: e.y + 0.5, r: rule.r });
  }
  return out;
}

/** Number of active temporary effects must stay bounded: the oldest simply expires. */
export const MAX_ACTIVE_ENV_FX = 24;
