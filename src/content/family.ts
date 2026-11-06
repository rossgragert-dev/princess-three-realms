// v0.4b: Family Magic — pure data and rules for the wand workshop, the fireworks festival and the activity progress.
import type { GameState, QuestFlag } from '../types/game';

export type WandHead = 'star' | 'moon' | 'flower' | 'heart' | 'crystal' | 'seashell';
export type WandColor = 'pink' | 'gold' | 'blue' | 'mint' | 'lavender' | 'red' | 'pearl' | 'rainbow';
export type WandTrail = 'star' | 'butterfly' | 'petal' | 'bubble';
export interface EquippedWand { headId: WandHead; colorId: WandColor; trailId: WandTrail }

export const WAND_HEADS: readonly WandHead[] = ['star', 'moon', 'flower', 'heart', 'crystal', 'seashell'];
export const WAND_COLORS: readonly WandColor[] = ['pink', 'gold', 'blue', 'mint', 'lavender', 'red', 'pearl', 'rainbow'];
export const WAND_TRAILS: readonly WandTrail[] = ['star', 'butterfly', 'petal', 'bubble'];
/** The tint used for the straight projectile and its star-sparkle trail. Rainbow cycles through all of them. */
export const WAND_TINT: Record<WandColor, number[]> = {
  pink: [0xff7ec3], gold: [0xffd93d], blue: [0x3ea6ff], mint: [0x5be3b0], lavender: [0xa06bff], red: [0xff5a6e], pearl: [0xf4eefc],
  rainbow: [0xff5a6e, 0xff9a3c, 0xffe14d, 0x5ccf59, 0x3ea6ff, 0xa06bff]
};
export const DEFAULT_WAND: EquippedWand = { headId: 'star', colorId: 'pink', trailId: 'star' };

export interface Activities {
  fireworks: { sessions: number; launched: number; designs: string[] };
  workshop: { visits: number; made: number };
  tag: { sessions: number; tags: number };
}
export const defaultActivities = (): Activities => ({ fireworks: { sessions: 0, launched: 0, designs: [] }, workshop: { visits: 0, made: 0 }, tag: { sessions: 0, tags: 0 } });

/** Option ids are stable strings: 'head:moon', 'color:gold', 'trail:petal'. */
export type WandOptionId = `head:${WandHead}` | `color:${WandColor}` | `trail:${WandTrail}`;
export const START_OPTIONS: readonly WandOptionId[] = ['head:star', 'head:heart', 'head:flower', 'color:pink', 'color:gold', 'color:blue', 'color:lavender', 'color:mint', 'color:red', 'trail:star', 'trail:petal'];

/** How the other options are earned, by gentle exploring (picture hint = a texture key shown on the padlock). */
export const OPTION_EARN: Record<string, { hint: string; test: (s: Pick<GameState, 'flags' | 'activities'>) => boolean }> = {
  'head:moon': { hint: 'fw_shape_star', test: (s) => s.activities.fireworks.sessions >= 1 },
  'head:crystal': { hint: 'icon_unicorn', test: (s) => s.activities.tag.sessions >= 1 },
  'head:seashell': { hint: 'icon_mermaid', test: (s) => !!s.flags.SHORE_SEEN },
  'color:pearl': { hint: 'icon_star', test: (s) => !!s.flags.STAR_1_FOUND },
  'color:rainbow': { hint: 'icon_rainbow', test: (s) => !!s.flags.RAINBOW_BRIDGE_OPEN },
  'trail:butterfly': { hint: 'trail_butterfly', test: (s) => !!s.flags.BUTTERFLY_FOUND },
  'trail:bubble': { hint: 'icon_marina', test: (s) => !!s.flags.MARINA_HELPED }
};
export const ALL_OPTIONS: readonly WandOptionId[] = [...WAND_HEADS.map((h) => `head:${h}` as const), ...WAND_COLORS.map((c) => `color:${c}` as const), ...WAND_TRAILS.map((t) => `trail:${t}` as const)];
const OPTION_SET = new Set<string>(ALL_OPTIONS);

/** Add every option whose condition is met. Idempotent; never removes anything. Returns the ones newly gained. */
export function syncWandUnlocks(s: Pick<GameState, 'flags' | 'activities' | 'unlockedWand'>): string[] {
  const gained: string[] = [];
  for (const id of START_OPTIONS) if (!s.unlockedWand.includes(id)) { s.unlockedWand.push(id); }
  for (const [id, r] of Object.entries(OPTION_EARN)) if (!s.unlockedWand.includes(id) && r.test(s)) { s.unlockedWand.push(id); gained.push(id); }
  return gained;
}
export const hasOption = (unlocked: readonly string[], id: string) => unlocked.includes(id);

export function sanitizeUnlockedWand(raw: unknown): string[] {
  const out: string[] = [...START_OPTIONS];
  for (const r of Array.isArray(raw) ? raw : []) if (typeof r === 'string' && OPTION_SET.has(r) && !out.includes(r)) out.push(r);
  return out;
}
/** An equipped wand must use options she owns; anything else falls back to the default choice for that part. */
export function sanitizeWand(raw: unknown, unlocked: readonly string[]): EquippedWand {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pick = <T extends string>(kind: string, v: unknown, list: readonly T[], dflt: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) && unlocked.includes(`${kind}:${v}`) ? (v as T) : dflt);
  return { headId: pick('head', r.headId, WAND_HEADS, DEFAULT_WAND.headId), colorId: pick('color', r.colorId, WAND_COLORS, DEFAULT_WAND.colorId), trailId: pick('trail', r.trailId, WAND_TRAILS, DEFAULT_WAND.trailId) };
}
const int = (v: unknown, max = 1_000_000) => (Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v as number))) : 0);
export function sanitizeActivities(raw: unknown): Activities {
  const d = defaultActivities();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Activities>;
  return {
    fireworks: { sessions: int(r.fireworks?.sessions), launched: int(r.fireworks?.launched), designs: Array.isArray(r.fireworks?.designs) ? [...new Set(r.fireworks!.designs.filter((x): x is string => typeof x === 'string' && /^[a-z]+:[a-z]+$/.test(x)))].slice(0, 60) : [] },
    workshop: { visits: int(r.workshop?.visits), made: int(r.workshop?.made) },
    tag: { sessions: int(r.tag?.sessions), tags: int(r.tag?.tags) }
  };
}

/** Rewards for activities: bedroom decorations that are earned once (idempotent, via unlockedDecor). */
export const EXTRA_DECOR: readonly string[] = ['festival_garland', 'meadow_cushion', 'mushroom_lamp', 'woodland_plush', 'lantern_garland', 'flower_cushion', 'river_fountain'];
export const ACTIVITY_REWARD = { fireworks: 'festival_garland', tag: 'meadow_cushion' } as const;
/** A fireworks visit counts as a completed session after this many launches. */
export const FIREWORKS_SESSION_LAUNCHES = 3;
export const TAG_SESSION_STARS = 3;

/** Picks up a reward exactly once. Returns true the first time only. */
export function grantDecor(s: Pick<GameState, 'unlockedDecor'>, id: string): boolean {
  if (!EXTRA_DECOR.includes(id) || s.unlockedDecor.includes(id)) return false;
  s.unlockedDecor.push(id); return true;
}
export const questFlagList: QuestFlag[] = [];

// ------------------------------------------------------------------ fireworks
export type FwColor = 'pink' | 'gold' | 'blue' | 'green' | 'violet' | 'rainbow';
export type FwShape = 'star' | 'heart' | 'flower' | 'spiral' | 'rainbow';
export type FwMode = 1 | 2 | 3;
export const FW_COLORS: readonly FwColor[] = ['pink', 'gold', 'blue', 'green', 'violet', 'rainbow'];
export const FW_SHAPES: readonly FwShape[] = ['star', 'heart', 'flower', 'spiral', 'rainbow'];
export const FW_MODES: readonly FwMode[] = [1, 2, 3];
export const FW_HEX: Record<FwColor, number[]> = {
  pink: [0xff7ec3, 0xffb8e2], gold: [0xffd93d, 0xfff3a0], blue: [0x3ea6ff, 0x8fd8ff], green: [0x5ccf59, 0xb8f5a0], violet: [0xa06bff, 0xd7c0ff],
  rainbow: [0xff5a6e, 0xff9a3c, 0xffe14d, 0x5ccf59, 0x3ea6ff, 0xa06bff]
};
export const FW_MAX_PARTICLES = 96;
export const FW_MAX_PARTICLES_REDUCED = 40;
export const FW_MAX_ACTIVE_BURSTS = 3;

export interface BurstPoint { x: number; y: number; band: number }
/** The outline of a firework in unit space (|x|,|y| <= 1; y grows downward). Exactly `n` points, so reduced-effects can ask for fewer. */
export function burstPoints(shape: FwShape, n: number): BurstPoint[] {
  const pts: BurstPoint[] = [];
  const count = Math.max(8, Math.min(FW_MAX_PARTICLES, Math.floor(n)));
  for (let i = 0; i < count; i++) {
    const u = i / count, a = u * Math.PI * 2;
    switch (shape) {
      case 'star': { // five-pointed outline
        const seg = u * 5, k = Math.floor(seg), f = seg - k;
        const p0 = (j: number) => { const t = -Math.PI / 2 + (j * 2 * Math.PI) / 5; return { x: Math.cos(t), y: Math.sin(t) }; };
        const m0 = (j: number) => { const t = -Math.PI / 2 + ((j + 0.5) * 2 * Math.PI) / 5; return { x: 0.42 * Math.cos(t), y: 0.42 * Math.sin(t) }; };
        const A = f < 0.5 ? p0(k) : m0(k), B = f < 0.5 ? m0(k) : p0(k + 1), g = f < 0.5 ? f * 2 : (f - 0.5) * 2;
        pts.push({ x: A.x + (B.x - A.x) * g, y: A.y + (B.y - A.y) * g, band: 0 }); break;
      }
      case 'heart': { // classic parametric heart, scaled into the unit box
        const x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        pts.push({ x: x / 17, y: (y + 2) / 17, band: 0 }); break;
      }
      case 'flower': { // six rounded petals
        const r = 0.25 + 0.75 * Math.abs(Math.cos(3 * a));
        pts.push({ x: r * Math.cos(a), y: r * Math.sin(a), band: 0 }); break;
      }
      case 'spiral': { // two arms winding out
        const arm = i % 2, t = Math.floor(i / 2) / Math.max(1, count / 2 - 1), ang = t * Math.PI * 3.2 + arm * Math.PI, r = 0.12 + 0.88 * t;
        pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang), band: 0 }); break;
      }
      default: { // rainbow: six nested arcs
        const band = i % 6, t = Math.floor(i / 6) / Math.max(1, Math.ceil(count / 6) - 1), ang = Math.PI * (1 + t), r = 1 - band * 0.13;
        pts.push({ x: r * Math.cos(ang), y: 0.35 + r * Math.sin(ang) * 0.9, band });
      }
    }
  }
  return pts;
}
/** Colour for a particle: single colours alternate the two shades; rainbow follows the band (rainbow shape) or the index. */
export function fwTint(color: FwColor, index: number, band = 0): number {
  const list = FW_HEX[color];
  return color === 'rainbow' ? list[(band + index) % list.length] : list[index % list.length];
}
/** The picture id of a design for the "designs tried" record. */
export const designId = (shape: FwShape, color: FwColor) => `${shape}:${color}`;
