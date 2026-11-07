import type { Form, GameState, QuestFlag, SceneId } from '../types/game';
import { MAIN_PATH, nextObjective } from '../systems/questEngine';

/** Scene graph exits: from -> to: the object id of the warp that leads there. */
export const EXITS: Record<SceneId, Partial<Record<SceneId, string>>> = {
  courtyard: { woods: 'warp_woods', bedroom: 'door_bedroom', festival: 'warp_festival', conservatory: 'door_conservatory', garden: 'warp_garden', throne: 'gate_throne', moat: 'warp_moat' },
  woods: { courtyard: 'warp_courtyard', shore: 'warp_shore', meadow: 'warp_meadow', enchanted: 'warp_enchanted' },
  shore: { woods: 'warp_woods', grotto: 'dive', river: 'river_mouth' },
  grotto: { shore: 'surface' },
  bedroom: { courtyard: 'door_exit' },
  festival: { courtyard: 'warp_courtyard', labyrinth: 'warp_labyrinth' },
  conservatory: { courtyard: 'door_exit' },
  meadow: { woods: 'warp_woods' },
  enchanted: { woods: 'warp_woods' },
  garden: { courtyard: 'warp_courtyard', greenhouse: 'door_greenhouse' },
  river: { shore: 'exit_shore' },
  throne: { courtyard: 'door_exit', kitchen: 'door_kitchen', gallery: 'door_gallery' },
  kitchen: { throne: 'door_exit' },
  gallery: { throne: 'door_exit' },
  labyrinth: { festival: 'door_exit' },
  greenhouse: { garden: 'door_exit' },
  moat: { courtyard: 'warp_courtyard', moat_depths: 'moat_dive' },
  moat_depths: { moat: 'surface', coral_garden: 'warp_coral' },
  coral_garden: { moat_depths: 'warp_depths' }
};

/** Where each main-path step is completed. */
export const OBJECTIVE_TARGET: Record<string, { scene: SceneId; obj: string }> = {
  INTRO_DONE: { scene: 'courtyard', obj: 'pip' },
  PIP_CARROTS_DONE: { scene: 'courtyard', obj: 'carrot_1' },
  TREE_GATE_OPEN: { scene: 'woods', obj: 'tree' },
  RAINBOW_BRIDGE_OPEN: { scene: 'woods', obj: 'bridge_mark' },
  MARINA_HELPED: { scene: 'grotto', obj: 'marina' },
  PEARL_PLACED: { scene: 'grotto', obj: 'pearl' },
  STAR_1_FOUND: { scene: 'grotto', obj: 'star_pedestal' },
  LAMP_PLACED: { scene: 'bedroom', obj: 'nana' }
};

export const OBJECTIVE_NARRATION: Record<string, string> = {
  INTRO_DONE: 'obj_pip',
  PIP_CARROTS_DONE: 'pip_count_carrots',
  TREE_GATE_OPEN: 'obj_tree',
  RAINBOW_BRIDGE_OPEN: 'obj_bridge',
  MARINA_HELPED: 'obj_marina',
  PEARL_PLACED: 'pearl_prompt',
  STAR_1_FOUND: 'obj_star',
  LAMP_PLACED: 'obj_home'
};

/** Breadth-first scene route, e.g. courtyard -> woods -> shore. */
export function sceneRoute(from: SceneId, to: SceneId): SceneId[] | null {
  if (from === to) return [from];
  const prev = new Map<SceneId, SceneId>();
  const q: SceneId[] = [from];
  const seen = new Set<SceneId>([from]);
  while (q.length) {
    const c = q.shift()!;
    for (const n of Object.keys(EXITS[c]) as SceneId[]) {
      if (seen.has(n)) continue;
      seen.add(n); prev.set(n, c); q.push(n);
      if (n === to) {
        const path: SceneId[] = [to];
        for (let p = to; p !== from;) { p = prev.get(p)!; path.unshift(p); }
        return path;
      }
    }
  }
  return null;
}

export type GuideTarget =
  | { type: 'object'; obj: string; why: QuestFlag | 'transform' | 'dive' }
  | { type: 'home' }
  /** In the bedroom: point at the decorate button (the Star Lamp goes in the room). */
  | { type: 'decorate' }
  | { type: 'none' };

/**
 * What the sparkle trail should point at from the current scene.
 * Handles the mermaid detour (shore shimmer first, then the whirlpool) and the long walk home.
 */
export function guideTarget(state: GameState, scene: SceneId, form: Form): GuideTarget {
  const step = nextObjective(state);
  if (!step) return { type: 'none' };
  const target = OBJECTIVE_TARGET[step.flag];
  if (!target) return { type: 'none' };
  // Walking home after the star is found: the HUD house button is the shortcut.
  if (step.flag === 'LAMP_PLACED' && scene !== 'courtyard' && scene !== 'bedroom') return { type: 'home' };
  if (step.flag === 'LAMP_PLACED' && scene === 'bedroom') return { type: 'decorate' };
  if (scene === target.scene) {
    if (scene === 'grotto' || scene === 'woods' || scene === 'courtyard' || scene === 'bedroom') return { type: 'object', obj: target.obj, why: step.flag };
  }
  const route = sceneRoute(scene, target.scene);
  if (!route || route.length < 2) return { type: 'none' };
  const next = route[1];
  // Going into the grotto requires the mermaid whirlpool; becoming a mermaid comes first.
  if (scene === 'shore' && next === 'grotto' && form !== 'mermaid') return { type: 'object', obj: 'shimmer', why: 'transform' };
  return { type: 'object', obj: EXITS[scene][next]!, why: step.flag };
}

export const mainPathFlags = MAIN_PATH.map((s) => s.flag);
