// v0.4d.6: Royal Kitchen designs. Pure editing model: a dish has a list of toppings at normalised spots (u,v in -1..1 across the dish).
// Tapping a topping picture selects it; tapping a spot on the food places exactly there; nothing is ever placed at random.

export type FoodId = 'cook_cake' | 'cook_cookies' | 'cook_pizza' | 'cook_icecream';
export interface Topping { key: string; u: number; v: number }
/** What a kitchen stand shows once she has made something: the saved toppings, or an eaten (empty) stand. */
export interface FoodDesign { toppings: Topping[]; eaten: boolean }
export interface FoodSpec { base: string; baseScale: number; toppings: readonly string[]; stack?: boolean }

export const FOODS: Record<FoodId, FoodSpec> = {
  cook_cake: { base: 'px_cake', baseScale: 3.4, toppings: ['px_t_cherry', 'px_t_sprinkle', 'px_t_strawb', 'px_t_choc', 'px_t_star', 'px_t_candy'] },
  cook_cookies: { base: 'px_cookie', baseScale: 4, toppings: ['px_t_choc', 'px_t_sprinkle', 'px_t_candy', 'px_t_star', 'px_t_strawb'] },
  cook_pizza: { base: 'px_pizza', baseScale: 3.4, toppings: ['px_t_cheese', 'px_t_pep', 'px_t_olive', 'px_t_mush'] },
  cook_icecream: { base: 'px_cone', baseScale: 2.2, toppings: ['px_t_pink', 'px_t_blue', 'px_t_yellow', 'px_t_cherry'], stack: true }
};
export const FOOD_IDS = Object.keys(FOODS) as FoodId[];
export const MAX_TOPPINGS = 40;
export const MAX_SCOOPS = 5;
export const TOPPING_SCALE = 2.2;
// The cone image has its rim at the image centre (the top half is empty), so the first scoop is centred just above the rim and sinks into the cone.
export const SCOOP_REST = 5;
export const SCOOP_STEP = 20;
const SQUASH = 0.8; // the dish is seen from a slight angle

export const capFor = (spec: FoodSpec) => (spec.stack ? MAX_SCOOPS : MAX_TOPPINGS);

/** Radius (editor px, before the world scale factor) of the decoratable top of a flat dish. */
export const radiusOf = (spec: FoodSpec) => 52 * (spec.baseScale / 3.4);

/** Is the normalised spot on the food? */
export const onFood = (u: number, v: number) => Number.isFinite(u) && Number.isFinite(v) && u * u + v * v <= 1;

/** Offset of a topping from the base image centre, in editor px (multiply by the world factor when drawn smaller). */
export function toppingOffset(spec: FoodSpec, t: Topping, index: number): { dx: number; dy: number } {
  if (spec.stack) return { dx: 0, dy: -(SCOOP_REST * spec.baseScale + index * SCOOP_STEP) };
  const r = radiusOf(spec);
  return { dx: t.u * r, dy: t.v * r * SQUASH };
}

/** Convert a tap (offset from the base centre, editor px) into a normalised spot; null when it is off the food. */
export function spotFromOffset(spec: FoodSpec, dx: number, dy: number): { u: number; v: number } | null {
  if (spec.stack) {
    // the cone and the scoops above it form one tall target
    const top = -(SCOOP_REST * spec.baseScale + MAX_SCOOPS * SCOOP_STEP), bottom = spec.baseScale * 20;
    return Math.abs(dx) <= 46 && dy >= top && dy <= bottom ? { u: 0, v: 0 } : null;
  }
  const r = radiusOf(spec);
  const u = dx / r, v = dy / (r * SQUASH);
  return onFood(u, v) ? { u, v } : null;
}

/** Add one topping. Returns the new list, or null if the key is not allowed, the spot is off the food or the dish is full. */
export function place(spec: FoodSpec, list: readonly Topping[], key: string, u: number, v: number): Topping[] | null {
  if (!spec.toppings.includes(key) || list.length >= capFor(spec)) return null;
  if (!spec.stack && !onFood(u, v)) return null;
  return [...list, { key, u: spec.stack ? 0 : round(u), v: spec.stack ? 0 : round(v) }];
}
export const undoLast = (list: readonly Topping[]): Topping[] => list.slice(0, -1);
const round = (n: number) => Math.round(n * 1000) / 1000;

export function sanitizeToppings(spec: FoodSpec, raw: unknown): Topping[] {
  if (!Array.isArray(raw)) return [];
  const out: Topping[] = [];
  for (const r of raw) {
    if (out.length >= capFor(spec)) break;
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if (typeof o.key !== 'string' || !spec.toppings.includes(o.key)) continue;
    const u = typeof o.u === 'number' ? o.u : NaN, v = typeof o.v === 'number' ? o.v : NaN;
    if (spec.stack) out.push({ key: o.key, u: 0, v: 0 });
    else if (onFood(u, v)) out.push({ key: o.key, u: round(u), v: round(v) });
  }
  return out;
}

export type FoodDisplays = Record<FoodId, FoodDesign | null>;
export const defaultFoods = (): FoodDisplays => ({ cook_cake: null, cook_cookies: null, cook_pizza: null, cook_icecream: null });
export function sanitizeFoods(raw: unknown): FoodDisplays {
  const out = defaultFoods();
  if (!raw || typeof raw !== 'object') return out;
  for (const id of FOOD_IDS) {
    const r = (raw as Record<string, unknown>)[id];
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    out[id] = { toppings: sanitizeToppings(FOODS[id], o.toppings), eaten: o.eaten === true };
    if (out[id]!.eaten) out[id]!.toppings = [];
  }
  return out;
}
