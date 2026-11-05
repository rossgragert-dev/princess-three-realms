import { ATLAS, MARKERS } from '../content/wardrobeIndex';
import { dressColor, hairColor, skinTone, type PrincessAppearance } from '../content/appearance';

/**
 * Pure (no Phaser, no DOM) layer compositor for the large princess previews and the overworld sprite recolour.
 * Art is stored once in marker colours; the equipped dress / hair / skin ramp is applied while stacking layers.
 */
export type AtlasKey = 'wd_full' | 'wd_port';
export type Rgb = readonly [number, number, number];

export interface AtlasPixels {
  key: AtlasKey;
  /** Whole atlas image, RGBA. */
  data: Uint8ClampedArray | Uint8Array;
  width: number;
}

const rgb24 = (c: Rgb) => (c[0] << 16) | (c[1] << 8) | c[2];

export function hexToRgb(h: string): Rgb {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** marker colour -> target colour for the current look. Unique marker RGBs mean other art is never touched. */
export function buildRemap(app: Pick<PrincessAppearance, 'dressColorId' | 'hairColorId' | 'skinToneId'>, groups: ('dress' | 'hair' | 'skin')[] = ['dress', 'hair', 'skin']): Map<number, Rgb> {
  const m = new Map<number, Rgb>();
  const ramps = { dress: dressColor(app.dressColorId).ramp, hair: hairColor(app.hairColorId).ramp, skin: skinTone(app.skinToneId).ramp };
  for (const g of groups) MARKERS[g].forEach((mk, i) => m.set(rgb24(mk as Rgb), hexToRgb(ramps[g][i])));
  return m;
}

/** Layer names bottom to top, only those that actually exist in the atlas. */
export function layerStack(app: PrincessAppearance, kind: 'full' | 'port'): string[] {
  const cells = ATLAS[kind === 'full' ? 'wd_full' : 'wd_port'].cells as Record<string, number>;
  const want = [
    `accback:${app.accessoryId}`, `hairback:${app.hairstyleId}`, 'body',
    ...(kind === 'full' ? [`shoes:${app.shoesId}`] : []),
    `dress:${app.dressId}`, `necklace:${app.necklaceId}`, `accfront:${app.accessoryId}`,
    `face:${app.faceAccentId}`, `hairfront:${app.hairstyleId}`, `earrings:${app.earringsId}`, `tiara:${app.tiaraId}`
  ];
  return want.filter((n) => n in cells);
}

/** Alpha-over `layer` (a w*h RGBA window of the atlas, remapped) onto `out`. */
export function blitCell(out: Uint8ClampedArray, atlas: AtlasPixels, cellIndex: number, remap: Map<number, Rgb>) {
  const meta = ATLAS[atlas.key];
  const { w, h, cols } = meta;
  const cx = (cellIndex % cols) * w, cy = Math.floor(cellIndex / cols) * h;
  for (let y = 0; y < h; y++) {
    let s = ((cy + y) * atlas.width + cx) * 4;
    let d = y * w * 4;
    for (let x = 0; x < w; x++, s += 4, d += 4) {
      const a = atlas.data[s + 3];
      if (a === 0) continue;
      let r = atlas.data[s], g = atlas.data[s + 1], b = atlas.data[s + 2];
      if (a === 255) {
        const t = remap.get((r << 16) | (g << 8) | b);
        if (t) { r = t[0]; g = t[1]; b = t[2]; }
      }
      const da = out[d + 3];
      if (a === 255 || da === 0) {
        out[d] = r; out[d + 1] = g; out[d + 2] = b; out[d + 3] = a;
      } else {
        const fa = a / 255, oa = fa + (da / 255) * (1 - fa);
        out[d] = (r * fa + out[d] * (da / 255) * (1 - fa)) / oa;
        out[d + 1] = (g * fa + out[d + 1] * (da / 255) * (1 - fa)) / oa;
        out[d + 2] = (b * fa + out[d + 2] * (da / 255) * (1 - fa)) / oa;
        out[d + 3] = oa * 255;
      }
    }
  }
}

/** Compose the whole princess into a fresh RGBA buffer (w*h*4). */
export function composePrincess(atlas: AtlasPixels, app: PrincessAppearance, kind: 'full' | 'port', only?: (name: string) => boolean): Uint8ClampedArray {
  const meta = ATLAS[atlas.key];
  const out = new Uint8ClampedArray(meta.w * meta.h * 4);
  const remap = buildRemap(app);
  const cells = meta.cells as Record<string, number>;
  for (const name of layerStack(app, kind)) {
    if (only && !only(name)) continue;
    blitCell(out, atlas, cells[name], remap);
  }
  return out;
}

/** Remap marker colours in a whole sprite sheet (overworld princess / mermaid) into a new buffer, optionally over a base. */
export function remapSheet(out: Uint8ClampedArray, src: Uint8ClampedArray | Uint8Array, remap: Map<number, Rgb>) {
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];
    if (a === 0) continue;
    let r = src[i], g = src[i + 1], b = src[i + 2];
    if (a === 255) {
      const t = remap.get((r << 16) | (g << 8) | b);
      if (t) { r = t[0]; g = t[1]; b = t[2]; }
    }
    if (a === 255 || out[i + 3] === 0) { out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a; continue; }
    const fa = a / 255, da = out[i + 3] / 255, oa = fa + da * (1 - fa);
    out[i] = (r * fa + out[i] * da * (1 - fa)) / oa;
    out[i + 1] = (g * fa + out[i + 1] * da * (1 - fa)) / oa;
    out[i + 2] = (b * fa + out[i + 2] * da * (1 - fa)) / oa;
    out[i + 3] = oa * 255;
  }
}

/** Which tiara overlay sheet (if any) the overworld sprite wears. Every tiara has one now. */
export const owCrownSheet = (tiaraId: string): string | undefined => (tiaraId === 'none' ? undefined : `ow_crown_${tiaraId}`);
export const owHairSheet = (hairstyleId: string) => `ow_hair_${hairstyleId}`;

/** Thumbnail crops (x, y, w, h, integer scale) taken from the full-length composite for each customization slot. */
export const THUMB_CROP: Record<string, { kind: 'full' | 'port'; x: number; y: number; w: number; h: number; k: number }> = {
  dress: { kind: 'full', x: 8, y: 58, w: 80, h: 76, k: 1 },
  accessory: { kind: 'full', x: 8, y: 56, w: 80, h: 78, k: 1 },
  shoes: { kind: 'full', x: 28, y: 126, w: 40, h: 18, k: 2 },
  hairstyle: { kind: 'full', x: 14, y: 12, w: 68, h: 80, k: 1 },
  tiara: { kind: 'full', x: 27, y: 6, w: 42, h: 36, k: 2 },
  earrings: { kind: 'full', x: 28, y: 30, w: 40, h: 40, k: 2 },
  necklace: { kind: 'full', x: 28, y: 46, w: 40, h: 40, k: 2 },
  faceAccent: { kind: 'full', x: 28, y: 30, w: 40, h: 40, k: 2 }
};
