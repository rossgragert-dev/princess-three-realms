// v0.4d.2: the Royal Gallery painting. Pure stroke data + one drawing routine shared by the paint panel and the gallery wall.
export const PAINT_W = 360;
export const PAINT_H = 230;
export const PAINT_BG = 0xfffaf0;
export const PAINT_COLORS = [0xff5a6e, 0xff9a3d, 0xffd93d, 0x7bd86a, 0x3ea6ff, 0xa06bff, 0xff7ec3, 0x5a3d2a] as const;
export const BRUSH_SIZES = [3, 6, 11] as const;
/** kind: 0 brush, 1 eraser, 2 star stamp, 3 heart stamp, 4 flower stamp */
export interface ArtStroke { c: number; s: number; k: number; p: number[] }
export const MAX_STROKES = 300;
export const MAX_POINTS = 4000;

/** Clamp anything loaded from a save into a drawable, bounded list of strokes. */
export function sanitizeArt(raw: unknown): ArtStroke[] {
  if (!Array.isArray(raw)) return [];
  const out: ArtStroke[] = []; let pts = 0;
  for (const r of raw) {
    if (out.length >= MAX_STROKES || !r || typeof r !== 'object') continue;
    const { c, s, k, p } = r as Partial<ArtStroke>;
    if (!Array.isArray(p) || p.length < 2) continue;
    const clean: number[] = [];
    for (let i = 0; i + 1 < p.length && pts < MAX_POINTS; i += 2) {
      const x = p[i], y = p[i + 1];
      if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) continue;
      clean.push(Math.max(0, Math.min(PAINT_W, Math.round(x))), Math.max(0, Math.min(PAINT_H, Math.round(y)))); pts++;
    }
    if (clean.length < 2) continue;
    const kk = typeof k === 'number' && k >= 0 && k <= 4 ? Math.floor(k) : 0;
    out.push({ c: typeof c === 'number' && c >= 0 && c < PAINT_COLORS.length ? Math.floor(c) : 0, s: typeof s === 'number' && s >= 0 && s < BRUSH_SIZES.length ? Math.floor(s) : 1, k: kk, p: kk >= 2 ? clean.slice(0, 2) : clean });
  }
  return out;
}

type Gfx = { fillStyle(c: number, a?: number): unknown; fillCircle(x: number, y: number, r: number): unknown; fillTriangle(a: number, b: number, c: number, d: number, e: number, f: number): unknown; fillRect(x: number, y: number, w: number, h: number): unknown };

export function drawStamp(g: Gfx, kind: number, x: number, y: number, r: number, color: number) {
  g.fillStyle(color, 1);
  if (kind === 2) { // star: two overlapping triangles
    g.fillTriangle(x, y - r, x - r * 0.87, y + r * 0.5, x + r * 0.87, y + r * 0.5);
    g.fillTriangle(x, y + r, x - r * 0.87, y - r * 0.5, x + r * 0.87, y - r * 0.5);
  } else if (kind === 3) { // heart
    g.fillCircle(x - r * 0.5, y - r * 0.2, r * 0.58); g.fillCircle(x + r * 0.5, y - r * 0.2, r * 0.58);
    g.fillTriangle(x - r * 1.04, y, x + r * 1.04, y, x, y + r * 1.05);
  } else if (kind === 4) { // flower
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.fillCircle(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.45); }
    g.fillStyle(0xffd93d, 1); g.fillCircle(x, y, r * 0.35);
  }
}

/** Draw all strokes with the picture's top-left corner at (ox, oy) and a uniform scale. Caller clears first. */
export function drawStrokes(g: Gfx, strokes: readonly ArtStroke[], ox: number, oy: number, scale: number) {
  for (const st of strokes) {
    const col = st.k === 1 ? PAINT_BG : PAINT_COLORS[st.c], r = (st.k === 1 ? BRUSH_SIZES[st.s] * 1.6 : BRUSH_SIZES[st.s]) * scale;
    if (st.k >= 2) { drawStamp(g, st.k, ox + st.p[0] * scale, oy + st.p[1] * scale, (10 + BRUSH_SIZES[st.s] * 2) * scale, PAINT_COLORS[st.c]); continue; }
    g.fillStyle(col, 1);
    let px = st.p[0], py = st.p[1];
    g.fillCircle(ox + px * scale, oy + py * scale, r);
    for (let i = 2; i + 1 < st.p.length; i += 2) {
      const x = st.p[i], y = st.p[i + 1], d = Math.hypot(x - px, y - py), n = Math.max(1, Math.ceil(d / (r / scale * 0.6 + 0.5)));
      for (let j = 1; j <= n; j++) g.fillCircle(ox + (px + ((x - px) * j) / n) * scale, oy + (py + ((y - py) * j) / n) * scale, r);
      px = x; py = y;
    }
  }
}
