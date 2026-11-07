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


  // ------------------------------------------------------------ v0.4d.2: the Royal Kitchen (bases and toppings)
  m('px_cake', 40, 32, (c) => {
    P(c, 2, 18, 36, 12, '#f2b98a'); P(c, 2, 18, 36, 3, '#d99a68'); P(c, 6, 8, 28, 11, '#f7d2ae'); P(c, 6, 8, 28, 3, '#e0b080'); P(c, 0, 29, 40, 3, '#e8e0f5');
  });
  m('px_cookie', 32, 32, (c) => { disc(c, 16, 16, 14, '#c98a4a'); disc(c, 16, 16, 12, '#e0a860'); });
  m('px_pizza', 40, 40, (c) => { disc(c, 20, 20, 19, '#d9a05a'); disc(c, 20, 20, 16, '#d2442f'); disc(c, 20, 20, 14, '#e8624a'); });
  m('px_cone', 24, 40, (c) => {
    c.fillStyle = '#d9a05a'; c.beginPath(); c.moveTo(2, 20); c.lineTo(22, 20); c.lineTo(12, 39); c.closePath(); c.fill();
    P(c, 6, 24, 2, 2, '#b8803a'); P(c, 14, 24, 2, 2, '#b8803a'); P(c, 10, 30, 2, 2, '#b8803a');
  });
  const top = (key: string, fn: (c: CanvasRenderingContext2D) => void, w = 14, h = 14) => m(key, w, h, fn);
  top('px_t_cherry', (c) => { disc(c, 7, 9, 4.5, '#d1103a'); P(c, 7, 1, 1, 5, '#2e8b3a'); P(c, 5, 6, 2, 2, '#ff8da1'); });
  top('px_t_sprinkle', (c) => { P(c, 1, 3, 4, 2, '#ff5a6e'); P(c, 7, 2, 2, 4, '#3ea6ff'); P(c, 10, 7, 4, 2, '#ffd93d'); P(c, 3, 9, 2, 4, '#7bd86a'); P(c, 8, 11, 4, 2, '#a06bff'); });
  top('px_t_star', (c) => { disc(c, 7, 7, 5.5, '#ffd93d'); disc(c, 7, 7, 3, '#fff29a'); });
  top('px_t_choc', (c) => { P(c, 2, 2, 10, 10, '#5a3322'); P(c, 3, 3, 3, 3, '#7a4a30'); P(c, 8, 8, 3, 3, '#7a4a30'); });
  top('px_t_cheese', (c) => { P(c, 1, 1, 12, 12, '#ffd34d'); P(c, 3, 3, 2, 2, '#e0a82a'); P(c, 9, 8, 2, 2, '#e0a82a'); });
  top('px_t_pep', (c) => { disc(c, 7, 7, 6, '#a82a2a'); P(c, 4, 4, 2, 2, '#d04a4a'); P(c, 8, 8, 2, 2, '#d04a4a'); });
  top('px_t_olive', (c) => { disc(c, 7, 7, 5, '#2a2a2a'); disc(c, 7, 7, 2, '#e8624a'); });
  top('px_t_mush', (c) => { P(c, 5, 7, 4, 6, '#f4ecd8'); disc(c, 7, 6, 6, '#c9a27a'); P(c, 1, 6, 12, 2, '#c9a27a'); });
  top('px_t_candy', (c) => { P(c, 4, 3, 6, 8, '#ff7ec3'); P(c, 1, 5, 3, 4, '#ffd0e8'); P(c, 10, 5, 3, 4, '#ffd0e8'); });
  top('px_t_strawb', (c) => { disc(c, 7, 8, 5.5, '#e02a4a'); P(c, 4, 1, 6, 3, '#2e8b3a'); P(c, 5, 7, 1, 1, '#ffd93d'); P(c, 8, 9, 1, 1, '#ffd93d'); });
  top('px_t_pink', (c) => { disc(c, 10, 9, 8.5, '#ff9ccd'); disc(c, 7, 6, 3, '#ffd0e8'); }, 20, 18);
  top('px_t_blue', (c) => { disc(c, 10, 9, 8.5, '#7bc4ff'); disc(c, 7, 6, 3, '#cdeaff'); }, 20, 18);
  top('px_t_yellow', (c) => { disc(c, 10, 9, 8.5, '#ffe36a'); disc(c, 7, 6, 3, '#fff6b8'); }, 20, 18);
  m('px_statue', 16, 32, (c) => {
    P(c, 2, 24, 12, 8, '#b9b4c8'); P(c, 1, 29, 14, 3, '#9a95ad'); P(c, 5, 10, 6, 14, '#e8e4f2'); disc(c, 8, 7, 4, '#f2eefa'); P(c, 3, 12, 3, 8, '#e8e4f2'); P(c, 10, 12, 3, 8, '#e8e4f2'); P(c, 6, 2, 4, 2, '#ffd93d');
  });
  // kitchen furniture
  m('px_stove', 32, 32, (c) => { P(c, 0, 8, 32, 24, '#b8b0c8'); P(c, 0, 8, 32, 3, '#e8e0f5'); P(c, 3, 14, 12, 14, '#5a5470'); P(c, 5, 16, 8, 10, '#8f88a8'); P(c, 18, 14, 11, 3, '#5a5470'); disc(c, 8, 4, 4, '#3a3450'); disc(c, 24, 4, 4, '#3a3450'); });
  m('px_counter', 32, 24, (c) => { P(c, 0, 0, 32, 6, '#e8d4a8'); P(c, 0, 6, 32, 18, '#c98a4a'); P(c, 2, 8, 13, 14, '#a9703a'); P(c, 17, 8, 13, 14, '#a9703a'); P(c, 12, 12, 3, 3, '#ffd93d'); P(c, 17, 12, 3, 3, '#ffd93d'); });
  m('px_easel', 24, 40, (c) => { P(c, 2, 12, 20, 18, '#fffaf0'); P(c, 0, 10, 24, 3, '#8f5c1a'); P(c, 3, 14, 5, 4, '#ff5a6e'); P(c, 10, 18, 5, 4, '#3ea6ff'); P(c, 16, 14, 4, 4, '#ffd93d'); P(c, 4, 30, 3, 10, '#8f5c1a'); P(c, 17, 30, 3, 10, '#8f5c1a'); P(c, 11, 30, 2, 8, '#8f5c1a'); });
  m('px_frame', 48, 32, (c) => { P(c, 0, 0, 48, 32, '#d9a91f'); P(c, 3, 3, 42, 26, '#b8860b'); P(c, 4, 4, 40, 24, '#fffaf0'); });


  // ------------------------------------------------------------ v0.4d.3: princess beds (same footprints as the old sprites), pets, keeper
  const bed = (key: string, wood: string, woodLt: string, sheet: string, pillowA: string, pillowB: string, blanket: string, fold: string, hem: string, dot: string) =>
    m(key, 48, 32, (c) => {
      P(c, 0, 4, 48, 28, wood); P(c, 1, 4, 46, 2, woodLt);                                    // frame
      P(c, 0, 0, 48, 9, wood); P(c, 2, 1, 44, 2, woodLt); P(c, 0, 0, 3, 3, '#0000'); P(c, 21, 0, 6, 2, woodLt); P(c, 23, 1, 2, 2, '#ffd93d'); // tall headboard + star
      P(c, 2, 8, 44, 21, sheet);                                                                // mattress
      P(c, 4, 9, 18, 9, pillowA); P(c, 5, 10, 16, 2, '#ffffff66'); P(c, 4, 16, 18, 2, '#00000018');   // pillows
      P(c, 26, 9, 18, 9, pillowB); P(c, 27, 10, 16, 2, '#ffffff66'); P(c, 26, 16, 18, 2, '#00000018');
      P(c, 2, 17, 44, 12, blanket); P(c, 2, 17, 44, 3, fold); P(c, 2, 20, 44, 1, '#00000022');  // blanket + folded top
      for (const [x, y] of [[8, 23], [16, 26], [24, 22], [32, 26], [40, 23], [12, 21], [36, 21]] as const) P(c, x, y, 2, 2, dot); // pattern
      P(c, 2, 28, 44, 3, hem); P(c, 0, 29, 48, 3, wood); P(c, 0, 29, 48, 1, woodLt);            // hem + footboard
      P(c, 0, 24, 2, 8, woodLt); P(c, 46, 24, 2, 8, woodLt);                                    // posts
    });
  bed('px_bed_cozy', '#a0643a', '#c98a4a', '#fff6e4', '#ffd0e8', '#d0e8ff', '#ff7ec3', '#ffc2e0', '#d95aa0', '#fff0a8');
  bed('px_bed_sunny', '#c9892a', '#f2b84a', '#fffbe6', '#fff0a8', '#ffe0c8', '#ffb347', '#ffd98a', '#d98a1e', '#ffffff');
  m('px_bed_canopy', 50, 50, (c) => {
    P(c, 0, 0, 50, 4, '#c98ad8'); P(c, 2, 4, 46, 12, '#f4c8f2'); P(c, 2, 4, 46, 3, '#ffe0fa');       // canopy top + valance
    for (let i = 0; i < 8; i++) P(c, 3 + i * 6, 14, 4, 4, '#f4c8f2');                               // scalloped edge
    P(c, 0, 4, 4, 46, '#8f5c9a'); P(c, 46, 4, 4, 46, '#8f5c9a'); P(c, 1, 4, 1, 46, '#b080bc');       // posts
    P(c, 4, 6, 4, 26, '#ffe0faaa'); P(c, 42, 6, 4, 26, '#ffe0faaa');                                 // drapes
    P(c, 4, 18, 42, 32, '#8f5c9a'); P(c, 4, 18, 42, 8, '#a874b4');                                   // headboard
    P(c, 6, 24, 38, 22, '#fff6fb');
    P(c, 8, 26, 15, 8, '#ffd0e8'); P(c, 27, 26, 15, 8, '#d0e8ff'); P(c, 9, 27, 13, 2, '#ffffff77'); P(c, 28, 27, 13, 2, '#ffffff77');
    P(c, 6, 34, 38, 12, '#c98ad8'); P(c, 6, 34, 38, 3, '#e8b8f0');
    for (const [x, y] of [[11, 40], [19, 42], [27, 39], [35, 42], [41, 39]] as const) P(c, x, y, 2, 2, '#fff0a8');
    P(c, 6, 45, 38, 3, '#9a5aa8'); P(c, 4, 46, 42, 4, '#8f5c9a'); P(c, 22, 20, 6, 3, '#ffd93d'); disc(c, 25, 21, 2, '#fff29a');
  });
  m('px_sleeper', 40, 22, (c) => {           // the princess tucked in: head on the pillow, blanket up to her chin
    P(c, 12, 0, 16, 11, '#f2c9a0'); P(c, 10, 0, 20, 5, '#8a5a2a'); P(c, 9, 4, 4, 10, '#8a5a2a'); P(c, 27, 4, 4, 10, '#8a5a2a');
    P(c, 16, 6, 2, 1, '#5a3a2a'); P(c, 22, 6, 2, 1, '#5a3a2a'); P(c, 19, 8, 2, 1, '#e8786a'); P(c, 14, 2, 12, 2, '#ffd93d');
    P(c, 2, 11, 36, 11, '#ff7ec3'); P(c, 2, 11, 36, 3, '#ffc2e0'); P(c, 6, 17, 2, 2, '#fff0a8'); P(c, 20, 18, 2, 2, '#fff0a8'); P(c, 30, 16, 2, 2, '#fff0a8');
  });
  const PET_LOOKS = [['#f2a05a', '#888a96', '#f4ecd8', '#3a3040'], ['#c98a4a', '#f4ecd8', '#3a3040', '#e8b84a'], ['#ffffff', '#c98a4a', '#ff9ccd', '#b08af0'], ['#ffd93d', '#3ea6ff', '#ff5a6e', '#7bd86a']];
  const MANES = ['#ff7ec3', '#5a3322', '#ffd93d', '#7be3ff'];
  const dark = (hex: string) => { const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.floor(v * 0.7)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  for (let v = 0; v < 4; v++) {
    const [cc, dc, pc, bc] = [PET_LOOKS[0][v], PET_LOOKS[1][v], PET_LOOKS[2][v], PET_LOOKS[3][v]];
    m(`px_pet_cat${v}`, 20, 20, (c, f) => {                      // cat
      P(c, 5, 10, 10, 8, cc); P(c, 6, 4, 8, 7, cc); P(c, 6, 2, 2, 3, cc); P(c, 12, 2, 2, 3, cc); P(c, 7, 3, 1, 1, '#ff9ccd'); P(c, 12, 3, 1, 1, '#ff9ccd');
      P(c, 8, 7, 1, 2, '#222'); P(c, 11, 7, 1, 2, '#222'); P(c, 9, 9, 2, 1, '#f58'); P(c, 6, 17, 3, 2, dark(cc)); P(c, 11, 17, 3, 2, dark(cc)); P(c, 15, f ? 7 : 9, 3, 2, cc); P(c, 17, f ? 5 : 8, 2, 2, cc);
    }, 2);
    m(`px_pet_dog${v}`, 20, 20, (c, f) => {                       // dog
      P(c, 4, 10, 12, 8, dc); P(c, 5, 3, 10, 8, dc); P(c, 3, 4, 3, 8, dark(dc)); P(c, 14, 4, 3, 8, dark(dc)); P(c, 7, 6, 1, 2, '#222'); P(c, 12, 6, 1, 2, '#222');
      P(c, 8, 8, 4, 3, '#f4ecd8'); P(c, 9, 8, 2, 2, '#222'); if (f) P(c, 9, 11, 2, 2, '#f58'); P(c, 5, 17, 3, 2, dark(dc)); P(c, 12, 17, 3, 2, dark(dc)); P(c, 16, f ? 8 : 10, 2, 4, dc);
    }, 2);
    m(`px_pet_pony${v}`, 20, 20, (c, f) => {                      // pony (the horn-free cousin of the unicorn)
      P(c, 3, 9, 13, 7, pc); P(c, 4, 15, 2, 5, dark(pc)); P(c, 12, 15, 2, 5, dark(pc)); P(c, 13, 3, 5, 9, pc); P(c, 15, 6, 4, 5, pc);
      P(c, 12, 2, 3, 9, MANES[v]); P(c, f ? 0 : 1, 9, 3, 8, MANES[v]); P(c, 16, 6, 1, 2, '#222'); P(c, 17, 9, 1, 1, '#f58'); P(c, 13, 1, 2, 2, pc);
    }, 2);
    m(`px_pet_bird${v}`, 20, 20, (c, f) => {                     // bird
      disc(c, 10, 12, 6.5, bc); disc(c, 10, 5.5, 4.5, bc); P(c, 13, 5, 4, 2, '#ffa31a'); P(c, 11, 4, 1, 2, '#222'); P(c, 8, 17, 1, 3, '#ffa31a'); P(c, 11, 17, 1, 3, '#ffa31a');
      P(c, f ? 3 : 4, f ? 8 : 11, 6, 5, dark(bc)); P(c, 5, 15, 3, 3, dark(bc)); P(c, 9, 0, 2, 2, bc);
    }, 2);
  }
  m('px_keeper', 18, 26, (c) => {
    P(c, 4, 0, 10, 3, '#3b8f4f'); P(c, 2, 3, 14, 2, '#3b8f4f'); P(c, 5, 5, 8, 7, '#f2c9a0'); P(c, 4, 4, 2, 6, '#8a5a2a'); P(c, 12, 4, 2, 6, '#8a5a2a');
    P(c, 7, 8, 1, 1, '#333'); P(c, 10, 8, 1, 1, '#333'); P(c, 8, 10, 2, 1, '#e8786a'); P(c, 3, 12, 12, 10, '#7bd86a'); P(c, 5, 14, 8, 8, '#fff6e4'); P(c, 4, 22, 4, 4, '#5a3a2a'); P(c, 10, 22, 4, 4, '#5a3a2a');
    P(c, 8, 16, 2, 2, '#ff7ec3'); P(c, 0, 13, 3, 6, '#f2c9a0'); P(c, 15, 13, 3, 6, '#f2c9a0');
  });
  m('px_petstall', 32, 32, (c) => {
    P(c, 1, 6, 30, 8, '#ff7ec3'); for (let i = 0; i < 5; i++) P(c, 1 + i * 6, 6, 3, 8, '#fff6e4'); P(c, 3, 14, 3, 18, '#8f5c1a'); P(c, 26, 14, 3, 18, '#8f5c1a');
    P(c, 3, 22, 26, 9, '#c98a4a'); P(c, 3, 22, 26, 2, '#e0a860'); P(c, 6, 17, 5, 5, '#ffd93d'); P(c, 14, 18, 4, 4, '#3ea6ff'); P(c, 21, 17, 5, 5, '#ff5a6e');
  });

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
  // ------------------------------------------------------------ v0.4d.4: garden design pieces (each fits one 16px tile, anchored bottom-centre)
  const stem = (c: CanvasRenderingContext2D, x: number, y: number, h: number) => { P(c, x, y, 1, h, '#2e8f3a'); P(c, x - 2, y + h - 3, 2, 1, '#3fb24a'); P(c, x + 1, y + h - 5, 2, 1, '#3fb24a'); };
  m('px_gd_rose', 16, 16, (c) => { stem(c, 8, 8, 8); disc(c, 8, 6, 4, '#c23a4e'); disc(c, 8, 6, 3, '#ff5a6e'); disc(c, 8, 6, 1.2, '#ffa0ac'); });
  m('px_gd_tulip', 16, 16, (c) => { stem(c, 8, 8, 8); P(c, 5, 3, 6, 6, '#ff7ec3'); P(c, 5, 2, 2, 3, '#ff7ec3'); P(c, 9, 2, 2, 3, '#ff7ec3'); P(c, 7, 3, 2, 5, '#ffc3e2'); });
  m('px_gd_bluebell', 16, 16, (c) => { stem(c, 8, 7, 9); for (const [x, y] of [[5, 5], [8, 3], [11, 6]] as const) { disc(c, x, y, 2.4, '#3ea6ff'); P(c, x - 1, y + 1, 2, 2, '#9fd3ff'); } });
  m('px_gd_daisy', 16, 16, (c) => { stem(c, 8, 9, 7); for (let a = 0; a < 8; a++) disc(c, 8 + Math.cos(a * Math.PI / 4) * 3.4, 6 + Math.sin(a * Math.PI / 4) * 3.4, 1.7, '#ffffff'); disc(c, 8, 6, 2, '#ffd93d'); });
  m('px_gd_sunflower', 16, 20, (c) => { P(c, 8, 9, 1, 11, '#2e8f3a'); P(c, 5, 14, 3, 2, '#3fb24a'); P(c, 9, 12, 3, 2, '#3fb24a'); for (let a = 0; a < 10; a++) disc(c, 8 + Math.cos(a * Math.PI / 5) * 4.6, 6 + Math.sin(a * Math.PI / 5) * 4.6, 2, '#ffd93d'); disc(c, 8, 6, 3.2, '#8f5c1a'); P(c, 7, 5, 1, 1, '#c98a4a'); });
  m('px_gd_lavender', 16, 18, (c) => { for (const x of [4, 7, 10, 13]) { P(c, x, 8, 1, 10, '#4f8f4a'); for (let y = 2; y < 10; y += 2) { P(c, x - 1, y, 3, 2, y % 4 ? '#b58cff' : '#9a6ae0'); } } });
  m('px_gd_tree', 16, 30, (c) => { P(c, 7, 18, 3, 12, '#8f5c36'); P(c, 6, 28, 5, 2, '#6f4528'); disc(c, 8, 11, 8, '#2e8f5f'); disc(c, 5, 13, 5, '#3fb27c'); disc(c, 11, 9, 5, '#3fb27c'); disc(c, 8, 6, 4, '#5ad39a'); });
  m('px_gd_blossom', 16, 30, (c) => { P(c, 7, 18, 3, 12, '#7a4a30'); P(c, 6, 28, 5, 2, '#5f3a24'); disc(c, 8, 11, 8, '#ff9ccd'); disc(c, 5, 13, 5, '#ffc3e2'); disc(c, 11, 9, 5, '#ffb3d8'); disc(c, 8, 6, 4, '#ffe0ef'); for (const [x, y] of [[3, 14], [13, 12], [9, 17], [6, 8]] as const) P(c, x, y, 2, 2, '#ffffff'); });
  m('px_gd_bush', 16, 14, (c) => { disc(c, 8, 8, 7, '#2e8f3a'); disc(c, 5, 9, 4, '#3fb24a'); disc(c, 11, 7, 4, '#3fb24a'); P(c, 3, 12, 10, 2, '#2e8f3a'); P(c, 6, 5, 2, 2, '#7be38a'); });
  m('px_gd_rosebush', 16, 16, (c) => { disc(c, 8, 9, 7, '#2e8f3a'); disc(c, 5, 10, 4, '#3fb24a'); disc(c, 11, 8, 4, '#3fb24a'); P(c, 3, 13, 10, 3, '#2e8f3a'); for (const [x, y] of [[4, 8], [9, 5], [11, 10], [7, 11], [6, 6]] as const) { disc(c, x, y, 1.8, '#ff5a6e'); P(c, x, y, 1, 1, '#ffa0ac'); } });
  m('px_gd_hedge', 16, 14, (c) => { P(c, 0, 2, 16, 12, '#2e7f3a'); P(c, 0, 2, 16, 3, '#3fb24a'); for (let x = 1; x < 16; x += 4) P(c, x, 6, 2, 2, '#3fb24a'); for (let x = 3; x < 16; x += 4) P(c, x, 10, 2, 2, '#256a30'); P(c, 0, 12, 16, 2, '#1f5a28'); });
  m('px_gd_topiary', 16, 28, (c) => { P(c, 7, 20, 3, 8, '#8f5c36'); P(c, 3, 26, 10, 2, '#a06bff'); disc(c, 8, 13, 8, '#2e8f3a'); disc(c, 8, 13, 6, '#3fb24a'); P(c, 7, 6, 2, 2, '#ffd93d'); P(c, 6, 9, 4, 2, '#ffd93d'); P(c, 5, 10, 6, 1, '#ffd93d'); P(c, 6, 11, 4, 2, '#ffd93d'); });
  m('px_gd_birdbath', 16, 22, (c) => { P(c, 6, 10, 4, 10, '#c9c4d8'); P(c, 3, 19, 10, 3, '#b9b4c8'); P(c, 1, 5, 14, 6, '#e8e4f2'); P(c, 3, 6, 10, 3, '#7be3ff'); P(c, 5, 6, 3, 1, '#d6f6ff'); disc(c, 12, 4, 2, '#3ea6ff'); P(c, 13, 4, 2, 1, '#ffd93d'); });
  m('px_gd_fountain', 16, 24, (c) => { P(c, 6, 10, 4, 10, '#c9c4d8'); P(c, 1, 18, 14, 6, '#b9b4c8'); P(c, 2, 19, 12, 3, '#7be3ff'); P(c, 3, 6, 10, 4, '#e8e4f2'); P(c, 4, 7, 8, 2, '#7be3ff'); P(c, 7, 0, 2, 7, '#b8ecff'); P(c, 5, 3, 1, 3, '#b8ecff'); P(c, 10, 3, 1, 3, '#b8ecff'); });
  m('px_gd_stones', 16, 10, (c) => { for (const [x, y, w] of [[1, 1, 6], [8, 3, 7], [3, 6, 7]] as const) { P(c, x, y, w, 3, '#b9b4c8'); P(c, x, y, w, 1, '#e0dcee'); P(c, x + 1, y + 3, w - 2, 1, '#8f8aa5'); } });
  m('px_gd_gnome', 16, 22, (c) => { P(c, 4, 16, 8, 6, '#3ea6ff'); P(c, 5, 10, 6, 7, '#ffd0b0'); P(c, 4, 13, 8, 5, '#ffffff'); P(c, 3, 8, 10, 3, '#ff5a6e'); P(c, 5, 3, 6, 6, '#ff5a6e'); P(c, 7, 0, 2, 4, '#ff5a6e'); P(c, 6, 11, 1, 1, '#2a1a1a'); P(c, 9, 11, 1, 1, '#2a1a1a'); P(c, 6, 19, 4, 3, '#5a3a22'); });
  m('px_gd_pinwheel', 16, 24, (c, f) => { P(c, 8, 8, 1, 16, '#8f5c36'); const a = f ? ['#3ea6ff', '#ff5a6e', '#7be38a', '#ffd93d'] : ['#ff5a6e', '#3ea6ff', '#ffd93d', '#7be38a']; P(c, 3, 2, 5, 5, a[0]); P(c, 9, 2, 5, 5, a[1]); P(c, 3, 8, 5, 4, a[2]); P(c, 9, 8, 5, 4, a[3]); disc(c, 8, 7, 1.5, '#ffffff'); }, 2);
  m('px_gd_pot', 16, 18, (c) => { P(c, 3, 10, 10, 8, '#c9703a'); P(c, 2, 9, 12, 3, '#e08a4a'); P(c, 4, 12, 8, 1, '#a9582a'); disc(c, 8, 6, 4, '#ff7ec3'); disc(c, 5, 7, 3, '#ffc3e2'); disc(c, 11, 7, 3, '#ffc3e2'); P(c, 7, 5, 2, 2, '#ffd93d'); });
  m('px_gd_crystal', 16, 20, (c) => { P(c, 4, 14, 8, 6, '#a06bff'); P(c, 3, 18, 10, 2, '#7a4acf'); disc(c, 8, 9, 7, '#c9b8ff'); disc(c, 8, 9, 5.5, '#e8dcff'); disc(c, 6, 7, 2, '#ffffff'); P(c, 9, 10, 2, 2, '#ff9ccd'); });
  m('px_gd_mushrooms', 16, 12, (c) => { for (const [x, y, r] of [[4, 6, 3], [11, 7, 3.5], [8, 3, 2.6]] as const) { P(c, x - 1, y + 2, 2, 5, '#fff6e4'); disc(c, x, y, r, '#ff5a6e'); P(c, x - 1, y - 1, 1, 1, '#ffffff'); P(c, x + 1, y, 1, 1, '#ffffff'); } });

}

/** Names of every runtime texture (for tests). */
export const KINGDOM_KEYS = ['px_gd_rose', 'px_gd_tulip', 'px_gd_bluebell', 'px_gd_daisy', 'px_gd_sunflower', 'px_gd_lavender', 'px_gd_tree', 'px_gd_blossom', 'px_gd_bush', 'px_gd_rosebush', 'px_gd_hedge', 'px_gd_topiary', 'px_gd_birdbath', 'px_gd_fountain', 'px_gd_stones', 'px_gd_gnome', 'px_gd_pinwheel', 'px_gd_pot', 'px_gd_crystal', 'px_gd_mushrooms', 'px_bed_cozy', 'px_bed_sunny', 'px_bed_canopy', 'px_sleeper', 'px_keeper', 'px_petstall', 'px_pet_cat0', 'px_pet_cat1', 'px_pet_cat2', 'px_pet_cat3', 'px_pet_dog0', 'px_pet_dog1', 'px_pet_dog2', 'px_pet_dog3', 'px_pet_pony0', 'px_pet_pony1', 'px_pet_pony2', 'px_pet_pony3', 'px_pet_bird0', 'px_pet_bird1', 'px_pet_bird2', 'px_pet_bird3', 'px_cake', 'px_cookie', 'px_pizza', 'px_cone', 'px_t_cherry', 'px_t_sprinkle', 'px_t_star', 'px_t_choc', 'px_t_cheese', 'px_t_pep', 'px_t_olive', 'px_t_mush', 'px_t_candy', 'px_t_strawb', 'px_t_pink', 'px_t_blue', 'px_t_yellow', 'px_stove', 'px_counter', 'px_statue', 'px_easel', 'px_frame', 'px_throne', 'px_pillar', 'px_banner', 'px_stained', 'px_carpet', 'px_sconce', 'px_ancient', 'px_stump', 'px_storybook', 'px_rune', 'px_fox', 'px_owl', 'px_squirrel', 'px_deer', 'px_mush', 'px_sflower', 'px_lamp', 'px_vine', 'px_kelp', 'px_plot', 'px_seedmound', 'px_sprout', 'px_ladybug', 'px_arch', 'px_bench', 'px_greenhouse', 'px_fountain', 'px_lily', 'px_reed', 'px_falls', 'px_bridge_over', 'px_wheel', 'px_fish_orange', 'px_shell', 'px_startpost', 'px_ring', 'px_dolphin', 'px_bee', 'px_frog', 'px_treepic', 'px_log', 'px_egg', 'px_chick', 'px_hen', 'px_note', 'px_drop'] as const;
