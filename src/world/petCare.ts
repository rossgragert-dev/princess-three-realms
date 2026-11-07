// v0.4d.6: gentle pet care. Feed, water and play are always available, repeatable and never required; there is no hunger,
// thirst or neglect. The memory only remembers how much love the pet has had so it can look a little happier.
import type { PET_TYPES } from '../content/kingdom';

export type Species = (typeof PET_TYPES)[number];
export type CareKind = 'feed' | 'water' | 'play';

export interface SpeciesCare {
  /** Treat pictures she can choose from (texture keys). */
  foods: readonly string[];
  /** The toy she plays with. */
  toy: string;
  /** How fast this animal moves (ms per tile). */
  msPerTile: number;
  eat: 'munch' | 'nuzzle' | 'peck';
  play: 'fetch' | 'chase' | 'trot' | 'flutter';
  /** The sound that goes with a happy pet (names from the audio manager). */
  happy: 'pop' | 'chime' | 'sparkle';
}

export const SPECIES_CARE: Record<Species, SpeciesCare> = {
  cat: { foods: ['px_fish_orange', 'px_food_kibble'], toy: 'px_toy_yarn', msPerTile: 150, eat: 'munch', play: 'chase', happy: 'sparkle' },
  dog: { foods: ['px_food_bone', 'px_food_kibble'], toy: 'px_toy_ball', msPerTile: 110, eat: 'munch', play: 'fetch', happy: 'pop' },
  pony: { foods: ['px_food_carrot', 'px_food_apple'], toy: 'px_toy_ribbon', msPerTile: 130, eat: 'nuzzle', play: 'trot', happy: 'chime' },
  bird: { foods: ['px_food_seeds', 'px_food_berry'], toy: 'px_toy_feather', msPerTile: 90, eat: 'peck', play: 'flutter', happy: 'chime' }
};
export const FOOD_PICS = ['px_fish_orange', 'px_food_kibble', 'px_food_bone', 'px_food_carrot', 'px_food_apple', 'px_food_seeds', 'px_food_berry'] as const;
export const CARE_PICS = ['px_bowl_food', 'px_bowl_water', 'px_toy_yarn', 'px_toy_ball', 'px_toy_ribbon', 'px_toy_feather'] as const;

export interface PetCare { type: number; fed: number; watered: number; played: number }
export const defaultPetCare = (type = 0): PetCare => ({ type, fed: 0, watered: 0, played: 0 });
const cap = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(9999, Math.floor(n))) : 0);

/** Care history belongs to one pet type: any other (or damaged) record starts fresh. */
export function sanitizePetCare(raw: unknown, petType: number | null): PetCare {
  const d = defaultPetCare(petType ?? 0);
  if (petType === null || !raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  if (r.type !== petType) return d;
  return { type: petType, fed: cap(r.fed), watered: cap(r.watered), played: cap(r.played) };
}
export const careTotal = (c: PetCare) => c.fed + c.watered + c.played;
/** After a few cuddles the pet hops with joy every now and then on its own. */
export const isCheerful = (c: PetCare) => careTotal(c) >= 3;

export function record(c: PetCare, kind: CareKind): PetCare {
  return { ...c, fed: c.fed + (kind === 'feed' ? 1 : 0), watered: c.watered + (kind === 'water' ? 1 : 0), played: c.played + (kind === 'play' ? 1 : 0) };
}
/** Switching animals with the Pet Keeper starts a new care record for the new animal (same animal, new look: keeps it). */
export function afterPetChange(c: PetCare, newType: number): PetCare {
  return c.type === newType ? c : defaultPetCare(newType);
}
