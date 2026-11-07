// v0.4c: every new picture for the Kingdom Beyond is drawn at runtime on small canvases (crisp pixels, no new asset files).
// Multi-frame textures are one canvas with numbered frames, so `setFrame(1)` works like any sprite sheet.
import type Phaser from 'phaser';

export const SEED_CSS: Record<string, { main: string; dark: string; light: string }> = {
  red: { main: '#ff5a6e', dark: '#c23a4e', light: '#ffa0ac' },
  blue: { main: '#3ea6ff', dark: '#2a72bd', light: '#9fd3ff' },
  yellow: { main: '#ffd93d', dark: '#d9a91f', light: '#fff0a0' },
  pink: { main: '#ff7ec3', dark: '#cf4f94', light: '#ffc3e2' }
};
const COLORS = ['red', 'blue', 'yellow', 'pink'] as const;

type Draw = (c: CanvasRenderingContext2D, f: number) => void;
const P = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const disc = (c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw, frames = 1) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w * frames, h);
  if (!tex) return;
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) { c.save(); c.translate(f * w, 0); c.beginPath(); c.rect(0, 0, w, h); c.clip(); draw(c, f); c.restore(); }
  if (frames > 1) for (let f = 0; f < frames; f++) tex.add(f, 0, f * w, 0, w, h);
  tex.refresh();
}

/** Safe to call from any scene, any number of times. */
export function ensureKingdomTextures(scene: Phaser.Scene) {
  const m = (k: string, w: number, h: number, d: Draw, frames = 1) => make(scene, k, w, h, d, frames);

  // ------------------------------------------------------------ Enchanted Woods
  m('px_ancient', 32, 48, (c, f) => {
    disc(c, 16, 14, 14, '#2e7d4f'); disc(c, 7, 18, 8, '#3a9a5f'); disc(c, 25, 18, 8, '#3a9a5f'); disc(c, 16, 7, 8, '#4fb872');
    P(c, 9, 20, 14, 26, '#7a4a2a'); P(c, 7, 40, 18, 8, '#7a4a2a'); P(c, 11, 22, 3, 20, '#8f5c36'); P(c, 20, 24, 2, 16, '#613a1f');
    const eye = f ? '#ffe14d' : '#fff'; const pup = f ? '#fff6b0' : '#2a1a10';
    P(c, 11, 26, 4, 4, eye); P(c, 18, 26, 4, 4, eye); P(c, f ? 12 : 13, 27, 2, 2, pup); P(c, f ? 19 : 19, 27, 2, 2, pup);
    P(c, 15, 30, 3, 3, '#5a3418');
    if (f) { P(c, 12, 35, 9, 4, '#3a1a10'); P(c, 13, 35, 7, 2, '#ff9a8a'); } else { P(c, 12, 35, 2, 1, '#3a1a10'); P(c, 14, 36, 5, 1, '#3a1a10'); P(c, 19, 35, 2, 1, '#3a1a10'); }
    if (f) { disc(c, 6, 10, 2, '#fff6b0'); disc(c, 26, 12, 2, '#fff6b0'); }
  }, 2);
  m('px_stump', 16, 16, (c) => { P(c, 2, 6, 12, 8, '#8f5c36'); P(c, 2, 4, 12, 4, '#c08a52'); P(c, 4, 5, 8, 2, '#d9a56c'); P(c, 2, 13, 12, 1, '#613a1f'); });
  m('px_storybook', 16, 16, (c) => {
    P(c, 1, 9, 14, 6, '#8f5c36'); P(c, 1, 7, 14, 3, '#c08a52');
    P(c, 2, 2, 6, 7, '#fff8e8'); P(c, 8, 2, 6, 7, '#fff8e8'); P(c, 7, 2, 2, 8, '#d9b36c'); P(c, 2, 2, 12, 1, '#a06bff');
    P(c, 3, 4, 4, 1, '#b9a6d9'); P(c, 3, 6, 3, 1, '#b9a6d9'); P(c, 9, 4, 4, 1, '#b9a6d9'); P(c, 9, 6, 3, 1, '#b9a6d9');
  });
  m('px_rune', 16, 16, (c) => {
    P(c, 3, 5, 10, 10, '#8c93a8'); P(c, 4, 3, 8, 3, '#a9b0c6'); P(c, 3, 13, 10, 2, '#6a7186');
    c.strokeStyle = '#7be3ff'; c.lineWidth = 1; c.beginPath(); c.moveTo(8, 6); c.lineTo(8, 13); c.moveTo(5, 9); c.lineTo(11, 9); c.stroke(); disc(c, 8, 9, 1.4, '#fff');
  });
  m('px_fox', 16, 16, (c) => { P(c, 3, 8, 9, 5, '#ee8a3a'); P(c, 10, 5, 5, 5, '#ee8a3a'); P(c, 10, 3, 2, 3, '#ee8a3a'); P(c, 13, 3, 2, 3, '#ee8a3a'); P(c, 1, 9, 3, 3, '#fff8e8'); P(c, 3, 12, 2, 3, '#7a4a2a'); P(c, 9, 12, 2, 3, '#7a4a2a'); P(c, 13, 7, 2, 2, '#fff8e8'); P(c, 14, 7, 1, 1, '#2a1a10'); P(c, 15, 8, 1, 1, '#2a1a10'); });
  m('px_owl', 16, 16, (c) => { P(c, 4, 4, 8, 10, '#a87a4a'); P(c, 4, 3, 2, 3, '#a87a4a'); P(c, 10, 3, 2, 3, '#a87a4a'); P(c, 6, 9, 4, 5, '#e8d2a8'); disc(c, 6, 7, 2, '#fff'); disc(c, 10, 7, 2, '#fff'); P(c, 6, 7, 1, 1, '#2a1a10'); P(c, 10, 7, 1, 1, '#2a1a10'); P(c, 7, 8, 2, 2, '#ffb02e'); P(c, 5, 14, 6, 1, '#6a4a2a'); });
  m('px_squirrel', 16, 16, (c) => { P(c, 5, 8, 6, 6, '#b86a3a'); P(c, 3, 5, 5, 5, '#b86a3a'); P(c, 3, 3, 2, 3, '#b86a3a'); P(c, 10, 2, 4, 9, '#d98a52'); P(c, 11, 1, 3, 3, '#d98a52'); P(c, 4, 7, 1, 1, '#2a1a10'); P(c, 3, 13, 3, 2, '#7a4a2a'); P(c, 9, 13, 2, 2, '#7a4a2a'); });
  m('px_deer', 16, 16, (c) => { P(c, 3, 7, 9, 5, '#c98f56'); P(c, 10, 3, 4, 5, '#c98f56'); P(c, 11, 0, 1, 3, '#7a4a2a'); P(c, 13, 0, 1, 3, '#7a4a2a'); P(c, 12, 4, 1, 1, '#2a1a10'); P(c, 3, 11, 1, 4, '#8a5a2e'); P(c, 6, 11, 1, 4, '#8a5a2e'); P(c, 10, 11, 1, 4, '#8a5a2e'); P(c, 4, 8, 1, 1, '#fff8e8'); P(c, 7, 9, 1, 1, '#fff8e8'); });
  m('px_mush', 16, 16, (c, f) => {
    P(c, 6, 9, 4, 6, f ? '#e6fff8' : '#d9cde6'); P(c, 2, 4, 12, 6, f ? '#5be3b0' : '#9b7fc4'); P(c, 4, 2, 8, 3, f ? '#7bf5c8' : '#b39ad4');
    P(c, 4, 6, 2, 2, '#fff'); P(c, 9, 4, 2, 2, '#fff'); if (f) { disc(c, 8, 6, 7, 'rgba(123,245,200,.25)'); }
  }, 2);
  m('px_sflower', 16, 16, (c, f) => {
    P(c, 7, 8, 2, 8, '#3a9a5f'); P(c, 4, 11, 3, 2, '#4fb872');
    if (f) { for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) disc(c, 8 + dx, 6 + dy, 2.4, '#ff9ad2'); disc(c, 8, 6, 2, '#ffe14d'); }
    else { P(c, 6, 5, 4, 5, '#c9a0e8'); P(c, 7, 4, 2, 2, '#c9a0e8'); P(c, 7, 9, 2, 1, '#3a9a5f'); }
  }, 2);
  m('px_lamp', 16, 32, (c, f) => {
    P(c, 7, 8, 2, 24, '#5a4a6a'); P(c, 4, 29, 8, 3, '#4a3a5a'); P(c, 5, 4, 6, 2, '#5a4a6a');
    if (f) { disc(c, 8, 12, 9, 'rgba(255,225,120,.28)'); } P(c, 5, 7, 6, 8, f ? '#ffe14d' : '#cdbf8a'); P(c, 6, 8, 4, 6, f ? '#fff6b0' : '#e8dcb0'); P(c, 5, 6, 6, 1, '#5a4a6a'); P(c, 5, 15, 6, 1, '#5a4a6a');
  }, 2);
  for (const col of COLORS) {
    const s = SEED_CSS[col];
    m(`px_lantern_${col}`, 16, 32, (c, f) => {
      P(c, 7, 6, 2, 26, '#5a4a6a'); P(c, 4, 29, 8, 3, '#4a3a5a'); P(c, 3, 4, 10, 2, '#5a4a6a');
      if (f) disc(c, 8, 14, 11, 'rgba(255,255,200,.3)');
      P(c, 3, 7, 10, 12, f ? s.main : s.dark); P(c, 5, 9, 6, 8, f ? s.light : s.main); P(c, 3, 6, 10, 1, '#5a4a6a'); P(c, 3, 19, 10, 1, '#5a4a6a');
    }, 2);
  }
  m('px_vine', 16, 32, (c) => {
    P(c, 7, 0, 2, 32, '#3a9a5f'); P(c, 3, 6, 4, 2, '#4fb872'); P(c, 9, 12, 4, 2, '#4fb872'); P(c, 3, 18, 4, 2, '#4fb872'); P(c, 9, 24, 4, 2, '#4fb872');
    disc(c, 4, 7, 2, '#7bd88f'); disc(c, 12, 13, 2, '#7bd88f'); disc(c, 4, 19, 2, '#7bd88f'); disc(c, 12, 25, 2, '#7bd88f'); P(c, 5, 27, 6, 2, '#2e7d4f'); P(c, 6, 29, 4, 2, '#2e7d4f');
  });
  m('px_kelp', 16, 32, (c) => {
    P(c, 5, 0, 3, 32, '#2f9a6a'); P(c, 9, 4, 3, 28, '#3fb27c'); P(c, 3, 8, 2, 16, '#2f9a6a'); P(c, 12, 10, 2, 18, '#2f9a6a');
  });

  // ------------------------------------------------------------ Garden
  for (const col of COLORS) {
    const s = SEED_CSS[col];
    m(`px_flower_${col}`, 16, 24, (c) => {
      P(c, 7, 10, 2, 14, '#3a9a5f'); P(c, 3, 16, 4, 2, '#4fb872'); P(c, 9, 19, 4, 2, '#4fb872');
      for (const [dx, dy] of [[0, -4], [4, 0], [0, 4], [-4, 0], [3, -3], [-3, -3], [3, 3], [-3, 3]]) disc(c, 8 + dx, 8 + dy, 3, s.main);
      disc(c, 8, 8, 3, s.light); disc(c, 8, 8, 1.5, '#fff8c0');
    });
    m(`px_pkt_${col}`, 16, 16, (c) => {
      P(c, 3, 2, 10, 13, '#fff6e4'); P(c, 3, 2, 10, 4, s.main); P(c, 3, 14, 10, 1, '#d9c9a8');
      disc(c, 8, 10, 2.6, s.main); disc(c, 8, 10, 1.2, s.light);
    });
    m(`px_butterfly_${col}`, 16, 16, (c, f) => {
      const up = f === 0;
      P(c, 7, 4, 2, 9, '#4a3a5a');
      disc(c, up ? 4 : 5, up ? 5 : 8, up ? 4 : 3, s.main); disc(c, up ? 12 : 11, up ? 5 : 8, up ? 4 : 3, s.main);
      disc(c, up ? 5 : 6, up ? 11 : 11, 2.6, s.dark); disc(c, up ? 11 : 10, 11, 2.6, s.dark); disc(c, up ? 4 : 5, up ? 5 : 8, 1.4, s.light); disc(c, up ? 12 : 11, up ? 5 : 8, 1.4, s.light);
    }, 2);
  }
  m('px_plot', 16, 16, (c) => { P(c, 1, 5, 14, 10, '#7a4a2a'); P(c, 2, 4, 12, 3, '#946036'); P(c, 3, 8, 10, 5, '#613a1f'); P(c, 1, 14, 14, 1, '#4a2a14'); P(c, 4, 5, 2, 1, '#b07a48'); P(c, 10, 6, 2, 1, '#b07a48'); });
  m('px_seedmound', 16, 16, (c) => { P(c, 4, 8, 8, 4, '#946036'); P(c, 6, 7, 4, 2, '#b07a48'); disc(c, 8, 8, 1.5, '#e8d2a8'); });
  m('px_sprout', 16, 16, (c) => { P(c, 7, 6, 2, 7, '#3a9a5f'); disc(c, 5, 6, 3, '#4fb872'); disc(c, 11, 5, 3, '#4fb872'); P(c, 4, 12, 8, 3, '#946036'); });
  m('px_ladybug', 16, 16, (c, f) => { disc(c, 8, 9, 5, '#e63946'); P(c, 7, 4, 2, 3, '#2a1a10'); P(c, 8, 5, 1, 9, '#2a1a10'); disc(c, 6, 8, 1, '#2a1a10'); disc(c, 10, 8, 1, '#2a1a10'); disc(c, 6, 11, 1, '#2a1a10'); disc(c, 10, 11, 1, '#2a1a10'); if (f) { disc(c, 8, 9, 7, 'rgba(255,255,200,.35)'); } }, 2);
  m('px_arch', 32, 32, (c) => {
    P(c, 1, 8, 5, 24, '#2e8f4f'); P(c, 26, 8, 5, 24, '#2e8f4f'); P(c, 4, 2, 24, 6, '#2e8f4f'); P(c, 8, 0, 16, 4, '#3a9a5f');
    for (const [x, y, col] of [[2, 12, '#ff7ec3'], [27, 18, '#ffd93d'], [6, 3, '#ff5a6e'], [16, 1, '#fff'], [24, 4, '#3ea6ff'], [3, 24, '#ffd93d'], [28, 10, '#ff7ec3']] as const) disc(c, x, y, 2, col);
  });
  m('px_bench', 32, 16, (c) => { P(c, 2, 4, 28, 4, '#c08a52'); P(c, 2, 9, 28, 3, '#a8703a'); P(c, 3, 12, 3, 4, '#6a4a2a'); P(c, 26, 12, 3, 4, '#6a4a2a'); P(c, 2, 2, 28, 2, '#d9a56c'); });
  m('px_greenhouse', 48, 48, (c) => {
    P(c, 2, 14, 44, 34, 'rgba(190,235,255,.85)'); P(c, 8, 4, 32, 10, 'rgba(190,235,255,.85)'); P(c, 16, 0, 16, 5, 'rgba(190,235,255,.85)');
    c.strokeStyle = '#fff'; c.lineWidth = 2; for (const x of [2, 13, 24, 35, 46]) { c.beginPath(); c.moveTo(x, 14); c.lineTo(x, 48); c.stroke(); } c.beginPath(); c.moveTo(2, 28); c.lineTo(46, 28); c.stroke();
    P(c, 0, 44, 48, 4, '#6a5a8a'); P(c, 18, 28, 12, 20, '#8f5c36'); P(c, 19, 30, 10, 18, '#c08a52'); disc(c, 27, 40, 1, '#ffd93d');
    for (const [x, y, col] of [[6, 22, '#ff7ec3'], [10, 36, '#ffd93d'], [38, 24, '#3ea6ff'], [40, 38, '#ff5a6e']] as const) { P(c, x, y, 2, 7, '#3a9a5f'); disc(c, x + 1, y, 3, col); }
  });
  m('px_fountain', 32, 40, (c, f) => {
    P(c, 1, 28, 30, 10, '#a9b0c6'); P(c, 3, 24, 26, 6, '#c9cfe0'); P(c, 2, 36, 28, 3, '#8c93a8'); P(c, 13, 14, 6, 12, '#a9b0c6'); P(c, 10, 12, 12, 3, '#c9cfe0');
    P(c, 5, 26, 22, 3, f ? '#7be3ff' : '#6a7186'); if (f) { P(c, 15, 4, 2, 10, '#bff3ff'); disc(c, 16, 4, 2, '#fff'); } else { P(c, 8, 27, 3, 1, '#4a5166'); P(c, 20, 27, 3, 1, '#4a5166'); }
  }, 2);


  // ------------------------------------------------------------ v0.4d: the Throne Room
  m('px_throne', 24, 48, (c) => {
    P(c, 4, 4, 16, 30, '#d9a91f'); P(c, 6, 6, 12, 26, '#c23a4e'); P(c, 8, 8, 8, 22, '#e0566a');          // tall gold-framed red back
    P(c, 2, 2, 20, 4, '#ffd93d'); P(c, 4, 0, 4, 3, '#ffd93d'); P(c, 10, 0, 4, 3, '#ffd93d'); P(c, 16, 0, 4, 3, '#ffd93d'); // crown top
    disc(c, 12, 12, 2.2, '#3ea6ff'); disc(c, 6, 4, 1.2, '#fff'); disc(c, 18, 4, 1.2, '#fff');
    P(c, 1, 30, 22, 8, '#d9a91f'); P(c, 3, 32, 18, 6, '#c23a4e'); P(c, 1, 38, 22, 3, '#b8860b');       // seat and arms
    P(c, 2, 41, 4, 7, '#8f5c1a'); P(c, 18, 41, 4, 7, '#8f5c1a'); P(c, 6, 44, 12, 4, '#a0521a');            // legs and footstool
  });
  m('px_pillar', 16, 48, (c) => {
    P(c, 1, 0, 14, 5, '#e8e0f5'); P(c, 3, 5, 10, 38, '#f2ecff'); P(c, 5, 5, 2, 38, '#fff'); P(c, 10, 5, 2, 38, '#cfc4ea'); P(c, 1, 43, 14, 5, '#e8e0f5');
    P(c, 0, 0, 16, 2, '#ffd93d'); P(c, 0, 46, 16, 2, '#ffd93d');
  });
  m('px_banner', 16, 32, (c) => {
    P(c, 0, 0, 16, 3, '#ffd93d'); P(c, 2, 3, 12, 22, '#c23a4e'); P(c, 3, 3, 10, 22, '#e0566a'); P(c, 2, 25, 4, 5, '#c23a4e'); P(c, 10, 25, 4, 5, '#c23a4e'); P(c, 6, 25, 4, 3, '#e0566a');
    P(c, 2, 3, 1, 22, '#ffd93d'); P(c, 13, 3, 1, 22, '#ffd93d');
    for (const [x, y, w, h] of [[7, 8, 2, 8], [4, 11, 8, 2], [5, 9, 6, 2], [5, 14, 6, 2]] as const) P(c, x, y, w, h, '#ffd93d');
  });
  m('px_stained', 16, 32, (c) => {
    P(c, 0, 4, 16, 28, '#8f5c1a'); P(c, 2, 2, 12, 4, '#8f5c1a'); P(c, 4, 0, 8, 3, '#8f5c1a');
    const cols = ['#3ea6ff', '#ff7ec3', '#ffd93d', '#7be3ff', '#ff5a6e', '#7bd86a'];
    for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) P(c, 2 + q * 6, 4 + r * 6, 5, 5, cols[(r * 2 + q) % cols.length]);
    P(c, 4, 1, 8, 3, cols[0]); P(c, 3, 6, 10, 1, '#fff6e4'); P(c, 3, 16, 10, 1, '#fff6e4');
  });
  m('px_carpet', 16, 16, (c, f) => {
    P(c, 0, 0, 16, 16, '#c23a4e'); P(c, 2, 0, 12, 16, '#d84a5e');
    const edge = f === 0 ? 0 : 14; P(c, edge, 0, 2, 16, '#ffd93d'); P(c, f === 0 ? 2 : 12, 0, 2, 16, '#a82a40');
    P(c, 6, 3, 4, 2, '#ffd93d'); P(c, 6, 11, 4, 2, '#ffd93d'); P(c, 7, 7, 2, 2, '#fff6e4');
  }, 2);
  m('px_sconce', 16, 24, (c) => { P(c, 6, 10, 4, 10, '#8f5c1a'); P(c, 3, 18, 10, 4, '#8f5c1a'); disc(c, 8, 7, 4, '#ff9a3d'); disc(c, 8, 6, 2.2, '#ffe14d'); });

  // ------------------------------------------------------------ River
  m('px_lily', 16, 16, (c) => { disc(c, 8, 9, 6, '#3fb27c'); P(c, 8, 4, 1, 5, '#2f9a6a'); disc(c, 10, 7, 2.4, '#ff9ad2'); disc(c, 10, 7, 1, '#ffe14d'); });
  m('px_reed', 16, 32, (c) => { for (const [x, h] of [[4, 28], [8, 32], [12, 24]]) { P(c, x, 32 - h, 2, h, '#4a9a5a'); P(c, x - 1, 32 - h, 4, 6, '#8a5a2e'); } });
  m('px_falls', 16, 32, (c) => { P(c, 0, 0, 16, 32, '#6a7186'); P(c, 3, 0, 10, 32, '#bff3ff'); P(c, 5, 0, 2, 32, '#fff'); P(c, 10, 4, 1, 24, '#fff'); P(c, 1, 28, 14, 4, 'rgba(255,255,255,.7)'); });
  m('px_bridge_over', 16, 144, (c) => { P(c, 0, 0, 16, 144, '#c08a52'); for (let y = 0; y < 144; y += 6) P(c, 0, y, 16, 1, '#8f5c36'); P(c, 0, 0, 2, 144, '#6a4a2a'); P(c, 14, 0, 2, 144, '#6a4a2a'); });
  m('px_wheel', 16, 16, (c, f) => {
    disc(c, 8, 8, 7, '#8f5c36'); disc(c, 8, 8, 5, '#b07a48'); disc(c, 8, 8, 1.6, '#4a2a14');
    c.strokeStyle = '#4a2a14'; c.lineWidth = 1.5; const a = (f * Math.PI) / 4;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(8 + Math.cos(a + (i * Math.PI) / 2) * 7, 8 + Math.sin(a + (i * Math.PI) / 2) * 7); c.lineTo(8 - Math.cos(a + (i * Math.PI) / 2) * 7, 8 - Math.sin(a + (i * Math.PI) / 2) * 7); c.stroke(); }
  }, 4);
  m('px_fish_orange', 16, 16, (c) => { P(c, 3, 6, 9, 5, '#ff9a3c'); P(c, 1, 5, 3, 7, '#ff7a1c'); P(c, 10, 7, 2, 2, '#fff'); P(c, 11, 8, 1, 1, '#2a1a10'); P(c, 6, 5, 3, 1, '#ffc27a'); });
  m('px_shell', 16, 16, (c, f) => {
    if (f) disc(c, 8, 9, 8, 'rgba(255,240,200,.35)');
    disc(c, 8, 9, 6, f ? '#ffd8ea' : '#f6b5d3'); for (const x of [4, 6, 8, 10, 12]) P(c, x, 5, 1, 8, f ? '#fff' : '#d97aa6'); P(c, 6, 13, 4, 2, '#d97aa6');
  }, 2);
  m('px_startpost', 16, 32, (c) => {
    P(c, 7, 6, 2, 26, '#c08a52'); P(c, 5, 29, 6, 3, '#6a4a2a'); disc(c, 8, 8, 7, '#ffd93d'); disc(c, 8, 8, 5, '#1d6fc0'); disc(c, 8, 8, 3, '#7be3ff'); P(c, 7, 2, 2, 3, '#fff');
  });
  m('px_ring', 48, 48, (c) => {
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(24, 24, 19, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.arc(24, 24, 14, 0, Math.PI * 2); c.stroke();
  });
  m('px_dolphin', 24, 16, (c, f) => { P(c, 3, 6, 16, 6, '#7bb8ff'); P(c, 17, 7, 6, 3, '#7bb8ff'); P(c, 0, f ? 2 : 4, 4, 4, '#5a98e0'); P(c, 8, 3, 4, 4, '#5a98e0'); P(c, 5, 10, 12, 2, '#e8f4ff'); P(c, 18, 7, 1, 1, '#2a1a10'); P(c, 22, 9, 2, 1, '#2a1a10'); }, 2);

  // ------------------------------------------------------------ picture cards (letters-free puzzles)
  m('px_bee', 16, 16, (c) => { disc(c, 8, 9, 5, '#ffd93d'); P(c, 5, 6, 2, 7, '#2a1a10'); P(c, 9, 6, 2, 7, '#2a1a10'); disc(c, 6, 3, 3, 'rgba(255,255,255,.9)'); disc(c, 11, 3, 3, 'rgba(255,255,255,.9)'); P(c, 3, 8, 1, 1, '#2a1a10'); });
  m('px_frog', 16, 16, (c) => { P(c, 3, 7, 10, 7, '#5ccf59'); disc(c, 5, 6, 3, '#5ccf59'); disc(c, 11, 6, 3, '#5ccf59'); disc(c, 5, 6, 1.4, '#fff'); disc(c, 11, 6, 1.4, '#fff'); P(c, 5, 6, 1, 1, '#2a1a10'); P(c, 11, 6, 1, 1, '#2a1a10'); P(c, 5, 11, 6, 1, '#2f8f3f'); P(c, 2, 13, 3, 2, '#3fb049'); P(c, 11, 13, 3, 2, '#3fb049'); });
  m('px_treepic', 16, 16, (c) => { disc(c, 8, 6, 6, '#3fb27c'); disc(c, 5, 8, 4, '#2e8f5f'); disc(c, 11, 8, 4, '#2e8f5f'); P(c, 7, 9, 3, 7, '#8f5c36'); });
  m('px_log', 16, 16, (c) => { P(c, 1, 6, 14, 8, '#8f5c36'); P(c, 1, 6, 14, 2, '#a8703a'); disc(c, 14, 10, 4, '#c08a52'); disc(c, 14, 10, 2, '#a8703a'); P(c, 4, 9, 6, 1, '#6a4a2a'); });
  m('px_egg', 16, 16, (c) => { disc(c, 8, 9, 5, '#fff3dc'); disc(c, 8, 7, 4, '#fff3dc'); P(c, 5, 8, 2, 1, '#e8cfa0'); P(c, 9, 10, 2, 1, '#e8cfa0'); });
  m('px_chick', 16, 16, (c) => { disc(c, 8, 9, 5, '#ffe14d'); disc(c, 8, 5, 3.4, '#ffe14d'); P(c, 7, 6, 3, 1, '#ff9a3c'); P(c, 6, 4, 1, 1, '#2a1a10'); P(c, 10, 4, 1, 1, '#2a1a10'); P(c, 6, 14, 1, 2, '#ff9a3c'); P(c, 10, 14, 1, 2, '#ff9a3c'); });
  m('px_hen', 16, 16, (c) => { disc(c, 8, 9, 6, '#fff'); disc(c, 11, 5, 3, '#fff'); P(c, 10, 1, 3, 2, '#e63946'); P(c, 13, 5, 2, 2, '#ffb02e'); P(c, 11, 4, 1, 1, '#2a1a10'); P(c, 2, 8, 4, 4, '#e8d2a8'); P(c, 6, 14, 1, 2, '#ffb02e'); P(c, 10, 14, 1, 2, '#ffb02e'); });

  // ------------------------------------------------------------ small effects
  m('px_note', 8, 10, (c) => { disc(c, 3, 8, 2.2, '#fff'); P(c, 4, 1, 1, 7, '#fff'); P(c, 4, 1, 3, 2, '#fff'); });
  m('px_drop', 4, 5, (c) => { P(c, 1, 0, 2, 5, '#bff3ff'); P(c, 0, 2, 4, 2, '#7be3ff'); });

  // ------------------------------------------------------------ decoration rewards (bedroom)
  m('decor_woodland_plush', 18, 20, (c) => { disc(c, 9, 12, 7, '#b8865a'); disc(c, 9, 6, 5, '#c9955f'); disc(c, 5, 2, 2.2, '#c9955f'); disc(c, 13, 2, 2.2, '#c9955f'); P(c, 6, 5, 1, 1, '#2a1a10'); P(c, 11, 5, 1, 1, '#2a1a10'); P(c, 8, 7, 2, 1, '#2a1a10'); P(c, 6, 11, 6, 6, '#f3dcb8'); });
  m('decor_mushroom_lamp', 16, 22, (c) => { disc(c, 8, 9, 9, 'rgba(123,245,200,.25)'); P(c, 6, 11, 4, 9, '#e6fff8'); P(c, 2, 4, 12, 8, '#5be3b0'); P(c, 4, 2, 8, 3, '#7bf5c8'); P(c, 4, 7, 2, 2, '#fff'); P(c, 9, 5, 2, 2, '#fff'); P(c, 4, 19, 8, 3, '#8c93a8'); });
  m('decor_flower_cushion', 16, 16, (c) => { P(c, 1, 6, 14, 9, '#ff9ad2'); P(c, 2, 4, 12, 4, '#ffb8e2'); for (const [x, y] of [[5, 9], [11, 9], [8, 11]]) { disc(c, x, y, 2, '#fff'); disc(c, x, y, 1, '#ffd93d'); } });
  m('decor_river_fountain', 20, 24, (c) => { P(c, 2, 16, 16, 7, '#a9b0c6'); P(c, 3, 14, 14, 3, '#c9cfe0'); P(c, 8, 4, 4, 11, '#7be3ff'); P(c, 9, 1, 2, 4, '#bff3ff'); P(c, 4, 15, 12, 2, '#7be3ff'); disc(c, 5, 8, 1.4, '#bff3ff'); disc(c, 15, 9, 1.4, '#bff3ff'); disc(c, 4, 12, 1, '#bff3ff'); });
  m('decor_lantern_garland', 32, 16, (c) => {
    c.strokeStyle = '#8f5c36'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(16, 8, 32, 2); c.stroke();
    for (const [x, y, col] of [[4, 4, '#ff5a6e'], [11, 7, '#ffd93d'], [20, 7, '#3ea6ff'], [28, 4, '#ff7ec3']] as const) { P(c, x - 2, y, 5, 6, col); P(c, x - 1, y + 1, 3, 4, '#fff6b0'); }
  });
}

/** Names of every runtime texture (for tests). */
export const KINGDOM_KEYS = ['px_throne', 'px_pillar', 'px_banner', 'px_stained', 'px_carpet', 'px_sconce', 'px_ancient', 'px_stump', 'px_storybook', 'px_rune', 'px_fox', 'px_owl', 'px_squirrel', 'px_deer', 'px_mush', 'px_sflower', 'px_lamp', 'px_vine', 'px_kelp', 'px_plot', 'px_seedmound', 'px_sprout', 'px_ladybug', 'px_arch', 'px_bench', 'px_greenhouse', 'px_fountain', 'px_lily', 'px_reed', 'px_falls', 'px_bridge_over', 'px_wheel', 'px_fish_orange', 'px_shell', 'px_startpost', 'px_ring', 'px_dolphin', 'px_bee', 'px_frog', 'px_treepic', 'px_log', 'px_egg', 'px_chick', 'px_hen', 'px_note', 'px_drop'] as const;
