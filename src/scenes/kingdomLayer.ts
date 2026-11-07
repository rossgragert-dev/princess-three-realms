// v0.4c: the living layer of the three Kingdom areas. Owns every sprite and temporary effect that WorldScene would
// otherwise have to know about: magic-reactive scenery, the garden, butterflies, the lantern game and the river race.
// Everything here is bounded, forgiving and either flag-driven (secrets) or session-only (spell effects).
import Phaser from 'phaser';
import type { GameState, QuestFlag } from '../types/game';
import type { MapDef, PropDef, Tile } from '../world/types';
import type { SpellTarget } from '../world/spells';
import type { StoryCtx, } from '../world/story';
import { Effects } from '../world/spells';
import { ENV_RULES, MAX_ACTIVE_ENV_FX, NOTE_HZ, envKey, type EnvDef } from '../world/envMagic';
import {
  FOUNTAIN_COLORS, SEED_HEX, nextStage, type PlotId, type PlotStage, type Seed, SEEDS
} from '../content/kingdom';
import {
  companionPos, guideDir, progress, startRace, starsFor, stepRace, type RaceMode, type RaceState
} from '../world/race';
import { RIVER_COURSE } from '../world/riverCourse';
import { GOALS, PLOT_TILES } from '../world/kingdomMaps';
import { onButterfliesDone, onRaceFinish, onSecretRevealed, onShellChime, type KingdomApi } from '../world/kingdomStory';
import { services } from '../systems/services';
import { drawStrokes, PAINT_BG, PAINT_H, PAINT_W } from '../ui/paintStrokes';
import { dur, reducedEffects, sparkleCount } from '../systems/accessibility';
import type { UIScene } from './UIScene';

const T = 16;

export interface KingdomHost {
  scene: Phaser.Scene;
  map: MapDef;
  state(): GameState;
  props: { def: PropDef; sprite: Phaser.GameObjects.Sprite }[];
  objSprite(id: string): Phaser.GameObjects.Sprite | undefined;
  setObjPos(id: string, t: Tile): void;
  /** The princess' feet in tile units (floating point). */
  playerPos(): { x: number; y: number };
  ctx(): StoryCtx;
  ui(): UIScene;
  sparkle(tx: number, ty: number, n?: number): void;
}

interface PropEnv { env: EnvDef; sprite?: Phaser.GameObjects.Sprite }

const PROP_KEY: Partial<Record<EnvDef['type'], string>> = {
  sleepy_flower: 'px_sflower', lantern: 'px_lamp', music_mushroom: 'px_mush', ancient_tree: 'px_ancient',
  water_wheel: 'px_wheel', fountain: 'px_fountain', butterfly: 'px_butterfly_pink'
};

export class KingdomLayer implements KingdomApi {
  private readonly scene: Phaser.Scene;
  private readonly map: MapDef;
  private readonly fx = new Effects();
  private readonly envs: PropEnv[] = [];
  private vines = new Map<string, Phaser.GameObjects.Sprite>();
  private revealedGuard = new Set<string>();

  // garden
  private plots = new Map<PlotId, { stage: PlotStage; seed: Seed | null; sprite?: Phaser.GameObjects.Sprite }>();
  private heldSeed: Seed | null = null;
  private heldIcon?: Phaser.GameObjects.Image;
  private spray?: Phaser.Time.TimerEvent;
  private bf = new Map<Seed, { following: boolean; landed: boolean; until: number; lastWrong: number }>();

  // lanterns
  private lant = { active: false, showing: false, seq: [] as number[], pos: 0, mistakes: 0, token: 0, onDone: undefined as undefined | (() => void) };
  private lanternGlow: Phaser.GameObjects.Image[] = [];
  /** Test hook: force the lantern order so drivers can solve it. */
  lanternSeedOverride?: number[];

  // race
  private race: RaceState | null = null;
  private raceSprites: Phaser.GameObjects.Image[] = [];
  private arrow?: Phaser.GameObjects.Graphics;
  private companion?: Phaser.GameObjects.Image;

  constructor(private readonly h: KingdomHost) {
    this.scene = h.scene; this.map = h.map;
    for (const e of h.map.env ?? []) this.envs.push({ env: e, sprite: this.findSprite(e) });
    this.buildVines();
    this.buildShells();
    this.buildGarden();
    this.refreshArt();
    this.buildAmbient();
    this.buildLanternGlows();
    this.applyFlags(false);
  }

  // ---------------------------------------------------------------- build
  private findSprite(e: EnvDef): Phaser.GameObjects.Sprite | undefined {
    const key = PROP_KEY[e.type];
    if (!key) return undefined;
    let best: Phaser.GameObjects.Sprite | undefined, bd = 1.3;
    for (const p of this.h.props) {
      if (p.def.key !== key) continue;
      const d = Math.hypot(p.def.x + 0.5 + (p.def.ox ?? 0) / T - e.x, p.def.y + 0.5 - e.y);
      if (d < bd) { bd = d; best = p.sprite; }
    }
    return best;
  }

  private buildVines() {
    for (const e of this.map.env ?? []) {
      if (e.type !== 'vine') continue;
      const key = this.map.id === 'river' ? 'px_kelp' : 'px_vine';
      const s = this.scene.add.sprite(e.x * T + T / 2, (e.y + 1) * T, key).setOrigin(0.5, 1).setDepth((e.y + 1) * T + 2);
      this.vines.set(e.id, s);
    }
  }

  private shells = new Map<string, Phaser.GameObjects.Sprite>();
  private buildShells() {
    for (const e of this.map.env ?? []) {
      if (e.type !== 'shell') continue;
      const s = this.scene.add.sprite(e.x * T + T / 2, (e.y + 1) * T, 'px_shell').setOrigin(0.5, 1).setDepth((e.y + 1) * T);
      this.shells.set(e.id, s);
      this.envs.find((p) => p.env.id === e.id)!.sprite = s;
    }
  }

  private artG?: Phaser.GameObjects.Graphics;
  /** The Royal Gallery's big frame shows her saved painting (or a blank canvas waiting for one). */
  refreshArt() {
    if (this.map.id !== 'gallery') return;
    const g = this.artG ?? (this.artG = this.scene.add.graphics().setDepth(3));
    const fw = 92, fh = 60, cx = this.map.w * T / 2, top = 4, sc = (fw - 12) / PAINT_W;
    g.clear().fillStyle(0xb8860b, 1).fillRect(cx - fw / 2 - 3, top - 3, fw + 6, fh + 6).fillStyle(0xd9a91f, 1).fillRect(cx - fw / 2, top, fw, fh)
      .fillStyle(PAINT_BG, 1).fillRect(cx - fw / 2 + 6, top + 6, PAINT_W * sc, PAINT_H * sc);
    drawStrokes(g, this.h.state().kingdom.art, cx - fw / 2 + 6, top + 6, sc);
  }

  private buildGarden() {
    if (this.map.id !== 'garden') return;
    const saved = this.h.state().kingdom.garden;
    for (const [id, t] of Object.entries(PLOT_TILES) as [PlotId, Tile][]) {
      const seed = saved[id] ?? null;
      const rec: { stage: PlotStage; seed: Seed | null; sprite?: Phaser.GameObjects.Sprite } = { stage: seed ? 'flower' : 'empty', seed };
      if (seed) rec.sprite = this.plotSprite(t, `px_flower_${seed}`);
      this.plots.set(id, rec);
    }
    for (const c of ['red', 'blue', 'yellow'] as const) this.bf.set(c, { following: false, landed: false, until: 0, lastWrong: 0 });
    this.heldIcon = this.scene.add.image(0, 0, 'px_pkt_red').setDepth(9500).setScale(0.8).setVisible(false);
  }

  private plotSprite(t: Tile, key: string) {
    return this.scene.add.sprite(t.x * T + T / 2, (t.y + 1) * T, key).setOrigin(0.5, 1).setDepth((t.y + 1) * T + 1);
  }

  private buildAmbient() {
    const reduced = reducedEffects();
    if (this.map.id === 'enchanted') {
      const w = this.map.w * T, h = this.map.h * T;
      this.scene.add.rectangle(0, 0, w, h, 0x8f99d4, 1).setOrigin(0).setDepth(8000).setBlendMode(Phaser.BlendModes.MULTIPLY);
      for (const p of this.h.props) {
        if (p.def.key !== 'px_mush' && p.def.key !== 'px_lamp') continue;
        const g = this.scene.add.image(p.sprite.x, p.sprite.y - 6, 'fx_glow').setDepth(8100).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setScale(0.9);
        if (!reduced) this.scene.tweens.add({ targets: g, alpha: 0.25, duration: 1400 + (p.def.x * 90) % 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
    }
    // small friends: butterflies flap, fish drift (calmer effects: stay still)
    const flap = this.h.props.filter((p) => p.def.key.startsWith('px_butterfly_'));
    if (flap.length && !reduced) this.scene.time.addEvent({ delay: 380, loop: true, callback: () => { for (const p of flap) if (p.sprite.active) p.sprite.setFrame(p.sprite.frame.name === '0' ? 1 : 0); } });
    if (!reduced) for (const p of this.h.props) {
      if (p.def.key !== 'px_fish_orange') continue;
      this.scene.tweens.add({ targets: p.sprite, x: p.sprite.x + 18, duration: 2600 + (p.def.x * 70) % 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut', onYoyo: () => p.sprite.setFlipX(!p.sprite.flipX) });
    }
  }

  private buildLanternGlows() {
    if (this.map.id !== 'enchanted') return;
    for (let i = 1; i <= 4; i++) {
      const s = this.h.objSprite(`lantern_${i}`);
      const g = this.scene.add.image(s?.x ?? 0, (s?.y ?? 0) - 12, 'fx_glow').setDepth(8100).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(1.6);
      this.lanternGlow.push(g);
    }
  }

  // ---------------------------------------------------------------- flags
  /** Re-derive everything that depends on quest flags (secret vines, lit lanterns, restored fountain, landed butterflies). */
  applyFlags(_animated: boolean) {
    const f = this.h.state().flags;
    for (const e of this.map.env ?? []) {
      if (e.type !== 'vine' || !e.reveals) continue;
      const v = this.vines.get(e.id);
      if (!v) continue;
      const open = !!f[e.reveals];
      if (open && v.visible && _animated) this.scene.tweens.add({ targets: v, scaleY: 0.1, alpha: 0, duration: dur(700), onComplete: () => v.setVisible(false) });
      else v.setVisible(!open).setScale(1).setAlpha(1);
    }
    if (!this.lant.active && !this.lant.showing) this.paintLanterns(!!f.LANTERNS_LIT);
    if (f.BUTTERFLIES_GUIDED) for (const c of ['red', 'blue', 'yellow'] as const) this.landAt(c, false);
    if (f.FOUNTAIN_RESTORED && this.map.id === 'garden' && !this.spray && !reducedEffects() && _animated) this.fountainFx();
  }

  private paintLanterns(lit: boolean) {
    for (let i = 1; i <= 4; i++) {
      this.h.objSprite(`lantern_${i}`)?.setFrame(lit ? 1 : 0);
      this.lanternGlow[i - 1]?.setAlpha(lit ? 0.7 : 0);
    }
  }

  // ---------------------------------------------------------------- magic reactions
  /** One reaction per environmental type. Temporary, bounded, always visible; shooting again simply restarts it. */
  react(t: SpellTarget) {
    const e = this.envs.find((p) => p.env.id === envKey(t));
    if (!e) return;
    const now = performance.now(), rule = ENV_RULES[e.env.type];
    if (this.fx.count(now) >= MAX_ACTIVE_ENV_FX && !this.fx.active(t.id, now)) return;
    this.fx.start(t.id, rule.ms, now);
    const x = e.env.x * T + (Number.isInteger(e.env.x) ? T / 2 : 0), y = e.env.y * T + (Number.isInteger(e.env.y) ? T / 2 : 0);
    const spr = e.sprite;
    const revert = (fn: () => void) => this.scene.time.delayedCall(dur(rule.ms), () => { if (this.scene.sys.isActive()) fn(); });
    switch (e.env.type) {
      case 'sleepy_flower':
        services.audio.sfx('sparkle');
        spr?.setFrame(1);
        this.puff(x, y - 4, 'fx_petal', 10, 14, 24, 900);
        revert(() => spr?.setFrame(0));
        break;
      case 'lantern': {
        services.audio.sfx('chime');
        spr?.setFrame(1);
        const g = this.scene.add.image(x, y - 6, 'fx_glow').setDepth(8100).setBlendMode(Phaser.BlendModes.ADD).setScale(1.4).setAlpha(0.9);
        this.scene.tweens.add({ targets: g, alpha: 0, delay: dur(rule.ms - 600), duration: dur(600), onComplete: () => g.destroy() });
        revert(() => spr?.setFrame(0));
        break;
      }
      case 'music_mushroom':
        services.audio.note(NOTE_HZ[(e.env.note ?? 0) % NOTE_HZ.length]);
        spr?.setFrame(1);
        this.note(x, y - 8);
        if (spr && !reducedEffects()) this.scene.tweens.add({ targets: spr, scaleY: { from: 0.8, to: 1 }, duration: 160, ease: 'Back.Out' });
        revert(() => spr?.setFrame(0));
        break;
      case 'vine':
        this.uncurl(e.env);
        break;
      case 'butterfly':
        services.audio.sfx('sparkle');
        this.followBriefly(spr, rule.ms);
        break;
      case 'water_wheel':
        services.audio.sfx('splash');
        this.spin(spr, rule.ms);
        this.puff(x, y, 'fx_glow', 6, 14, 20, 900);
        break;
      case 'shell':
        services.audio.note(NOTE_HZ[(e.env.note ?? 0) % NOTE_HZ.length] * 1.5, 700, 'triangle');
        spr?.setFrame(1);
        this.note(x, y - 10);
        revert(() => spr?.setFrame(0));
        void onShellChime(this.h.ctx(), e.env.id);
        break;
      case 'fountain':
        this.cycleFountain();
        break;
      case 'ancient_tree':
        this.treeSpeaks(e.env, spr, rule.ms);
        break;
      case 'treasure':
        services.audio.sfx('chime');
        this.puff(x, y - 4, 'fx_glow', 8, 18, 22, 1100);
        this.h.sparkle(Math.floor(e.env.x), Math.floor(e.env.y), 10);
        break;
    }
  }

  private puff(x: number, y: number, key: string, n: number, spread: number, rise: number, ms: number) {
    for (let i = 0; i < sparkleCount(n); i++) {
      const sp = this.scene.add.image(x + Phaser.Math.Between(-spread, spread), y + Phaser.Math.Between(-4, 4), key).setDepth(9999).setAngle(Phaser.Math.Between(0, 360));
      this.scene.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-spread, spread), y: sp.y - rise, alpha: 0, duration: dur(ms + Phaser.Math.Between(0, 300)), onComplete: () => sp.destroy() });
    }
  }

  private note(x: number, y: number) {
    const n = this.scene.add.image(x, y, 'px_note').setDepth(9999);
    this.scene.tweens.add({ targets: n, y: y - 22, x: x + Phaser.Math.Between(-6, 6), alpha: 0, duration: dur(900), onComplete: () => n.destroy() });
  }

  private uncurl(e: EnvDef) {
    const v = this.vines.get(e.id);
    services.audio.sfx('chime');
    if (v && !reducedEffects()) this.scene.tweens.add({ targets: v, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, repeat: 4, onComplete: () => v.setAngle(0) });
    this.puff(e.x * T + T / 2, e.y * T, 'fx_petal', 12, 16, 26, 1000);
    if (e.reveals && !this.h.state().flags[e.reveals] && !this.revealedGuard.has(e.id)) {
      this.revealedGuard.add(e.id);
      this.scene.time.delayedCall(dur(600), () => { void onSecretRevealed(this.h.ctx(), e.reveals as QuestFlag).finally(() => this.revealedGuard.delete(e.id)); });
    }
  }

  private followBriefly(spr: Phaser.GameObjects.Sprite | undefined, ms: number) {
    if (!spr) return;
    const home = { x: spr.x, y: spr.y }, p = this.h.playerPos();
    this.scene.tweens.add({
      targets: spr, x: p.x * T + Phaser.Math.Between(-16, 16), y: p.y * T - 18, duration: dur(1100), ease: 'Sine.InOut',
      onComplete: () => this.scene.tweens.add({ targets: spr, x: home.x, y: home.y, delay: dur(ms - 2400), duration: dur(1300), ease: 'Sine.InOut' })
    });
  }

  private spin(spr: Phaser.GameObjects.Sprite | undefined, ms: number) {
    if (!spr) return;
    const frames = 4, end = performance.now() + ms;
    const ev = this.scene.time.addEvent({
      delay: 110, loop: true, callback: () => {
        if (!spr.active || performance.now() > end) { ev.remove(); spr.setFrame(0); return; }
        spr.setFrame((Number(spr.frame.name) + 1) % frames);
      }
    });
  }

  private treeSpeaks(e: EnvDef, spr: Phaser.GameObjects.Sprite | undefined, ms: number) {
    services.audio.sfx('chime');
    spr?.setFrame(1);
    this.scene.time.delayedCall(dur(ms), () => { if (spr?.active) spr.setFrame(0); });
    this.puff(e.x * T, (e.y - 1.5) * T, 'fx_glow', 6, 14, 18, 900);
    const letter = /^#([a-z])$/i.exec(e.clue ?? '')?.[1]?.toLowerCase();
    if (letter) void services.audio.speak(`atree_sound_${letter}`);
    else if (e.clue) this.h.ui().celebrate(e.clue, 3);
  }

  // ---------------------------------------------------------------- garden (KingdomApi)
  held() { return this.heldSeed; }
  hold(s: Seed) {
    this.heldSeed = s;
    this.heldIcon?.setTexture(`px_pkt_${s}`).setVisible(true);
    services.audio.sfx('pop');
  }
  plotStage(id: PlotId): PlotStage { return this.plots.get(id)?.stage ?? 'empty'; }
  plantedSeed(id: PlotId): Seed | null { return this.plots.get(id)?.seed ?? null; }

  plant(id: PlotId) {
    const rec = this.plots.get(id), seed = this.heldSeed;
    if (!rec || !seed || rec.stage !== 'empty') return;
    rec.stage = nextStage('empty', 'plant'); rec.seed = seed;
    rec.sprite?.destroy();
    rec.sprite = this.plotSprite(PLOT_TILES[id], 'px_seedmound');
    services.audio.sfx('pop');
    this.heldSeed = null; this.heldIcon?.setVisible(false);
    this.puff(PLOT_TILES[id].x * T + 8, PLOT_TILES[id].y * T + 4, 'fx_glow', 4, 8, 10, 600);
  }

  /** Pour water: the seed sprouts, then blooms in its own colour. Resolves with that colour. Saved the moment it blooms. */
  water(id: PlotId): Promise<Seed> {
    const rec = this.plots.get(id), t = PLOT_TILES[id];
    if (!rec || !rec.seed) return Promise.resolve('red');
    const seed = rec.seed;
    rec.stage = nextStage('seed', 'water');
    services.audio.sfx('splash');
    for (let i = 0; i < sparkleCount(5); i++) {
      const d = this.scene.add.image(t.x * T + 8 + (i - 2) * 3, t.y * T - 14, 'px_drop').setDepth(9999);
      this.scene.tweens.add({ targets: d, y: t.y * T + 8, alpha: 0.2, delay: i * 70, duration: dur(380), onComplete: () => d.destroy() });
    }
    return new Promise((res) => {
      this.scene.time.delayedCall(dur(520), () => {
        rec.sprite?.destroy(); rec.sprite = this.plotSprite(t, 'px_sprout'); rec.stage = 'sprout'; services.audio.sfx('pop');
        this.scene.time.delayedCall(dur(650), () => {
          rec.sprite?.destroy();
          rec.sprite = this.plotSprite(t, `px_flower_${seed}`);
          rec.stage = 'flower';
          this.bloom(rec.sprite, t);
          this.h.state().kingdom.garden[id] = seed; // the grown flower is part of the saved garden
          services.save.save();
          res(seed);
        });
      });
    });
  }

  private bloom(s: Phaser.GameObjects.Sprite, t: Tile) {
    services.audio.sfx('chime');
    if (!reducedEffects()) this.scene.tweens.add({ targets: s, scale: { from: 0.4, to: 1 }, duration: dur(420), ease: 'Back.Out' });
    this.puff(t.x * T + 8, t.y * T, 'fx_petal', 12, 14, 24, 900);
  }

  replant(id: PlotId) {
    const rec = this.plots.get(id), seed = this.heldSeed, t = PLOT_TILES[id];
    if (!rec || !seed) return;
    rec.seed = seed; rec.sprite?.destroy(); rec.sprite = this.plotSprite(t, `px_flower_${seed}`); rec.stage = 'flower';
    this.bloom(rec.sprite, t);
    this.h.state().kingdom.garden[id] = seed;
    services.save.save();
    this.heldSeed = null; this.heldIcon?.setVisible(false);
  }

  petFlower(id: PlotId) {
    const rec = this.plots.get(id), t = PLOT_TILES[id];
    if (!rec?.sprite) return;
    services.audio.sfx('sparkle');
    if (!reducedEffects()) this.scene.tweens.add({ targets: rec.sprite, angle: { from: -8, to: 8 }, duration: 110, yoyo: true, repeat: 2, onComplete: () => rec.sprite?.setAngle(0) });
    this.puff(t.x * T + 8, t.y * T, 'fx_petal', 5, 10, 18, 700);
  }

  fountainFx() {
    const e = this.map.env?.find((x) => x.type === 'fountain');
    if (!e) return;
    this.spray?.remove();
    const color = FOUNTAIN_COLORS[this.h.state().kingdom.fountain % FOUNTAIN_COLORS.length];
    const x = e.x * T, y = e.y * T;
    let n = 0;
    const total = reducedEffects() ? 8 : 26;
    this.spray = this.scene.time.addEvent({
      delay: 120, repeat: total, callback: () => {
        n++;
        for (let k = 0; k < 2; k++) {
          const d = this.scene.add.image(x, y, 'px_drop').setDepth(9999).setTint(color);
          const dx = Phaser.Math.Between(-18, 18);
          this.scene.tweens.add({ targets: d, x: x + dx, y: y + 16 + Phaser.Math.Between(0, 8), duration: dur(520), ease: 'Quad.In', onComplete: () => d.destroy() });
          this.scene.tweens.add({ targets: d, y: { from: y, to: y - 26 }, duration: dur(260), yoyo: false, ease: 'Quad.Out' });
        }
        if (n >= total) this.spray = undefined;
      }
    });
  }

  cycleFountain() {
    const k = this.h.state().kingdom;
    k.fountain = (k.fountain + 1) % FOUNTAIN_COLORS.length;
    services.audio.sfx('splash');
    services.save.save();
    this.fountainFx();
  }

  // ---------------------------------------------------------------- butterflies
  followButterfly(c: Seed): boolean {
    const b = this.bf.get(c);
    if (!b || b.landed) return false;
    b.following = true; b.until = performance.now() + 20000;
    services.audio.sfx('sparkle');
    return true;
  }

  private landAt(c: 'red' | 'blue' | 'yellow', animated: boolean) {
    const b = this.bf.get(c), s = this.h.objSprite(`bf_${c}`), g = GOALS[c];
    if (!b || !s) return;
    b.landed = true; b.following = false;
    const x = g.x * T + T / 2, y = (g.y + 1) * T - 8;
    this.h.setObjPos(`bf_${c}`, { x: g.x, y: g.y });
    if (animated) {
      // v0.4d: a clearly visible success moment. The butterfly glides in on an arc, the flower blooms and glows,
      // sparkles and petals burst, and a soft golden ring spreads out from where it settles.
      const sx = s.x, sy = s.y;
      this.scene.tweens.addCounter({
        from: 0, to: 1, duration: dur(900), ease: 'Sine.InOut',
        onUpdate: (tw) => { const t = tw.getValue() ?? 0; s.x = sx + (x - sx) * t; s.y = sy + (y - sy) * t - Math.sin(t * Math.PI) * 18; s.setDepth(s.y + 2); }
      });
      this.scene.time.delayedCall(dur(900), () => {
        this.puff(x, y - 6, 'fx_petal', 10, 14, 22, 900);
        this.puff(x, y - 8, 'fx_glow', 8, 16, 26, 1000);
        const flower = this.h.objSprite(`goal_${c}`);
        if (flower) this.scene.tweens.add({ targets: flower, scale: 1.45, duration: dur(200), yoyo: true, repeat: 1, ease: 'Back.Out' });
        const ring = this.scene.add.image(x, y - 6, 'fx_glow').setDepth(8100).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe38a).setScale(0.4).setAlpha(0.9);
        this.scene.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: dur(900), onComplete: () => ring.destroy() });
        services.audio.sfx('chime');
      });
      services.audio.sfx('sparkle');
    } else { s.setPosition(x, y); }
    s.setDepth(y + 2);
  }

  /** v0.4d: tapping a settled butterfly lets it flutter home so the matching game can be played again (progress stays saved). */
  releaseButterfly(c: Seed): boolean {
    const b = this.bf.get(c), s = this.h.objSprite(`bf_${c}`), home = this.map.objects.find((o) => o.id === `bf_${c}`);
    if (!b || !s || !home || !b.landed) return false;
    b.landed = false; b.following = false;
    const x = home.x * T + T / 2, y = (home.y + 1) * T - 8;
    this.h.setObjPos(`bf_${c}`, { x: home.x, y: home.y });
    this.scene.tweens.add({ targets: s, x, y, duration: dur(900), ease: 'Sine.InOut', onUpdate: () => s.setDepth(s.y + 2) });
    this.puff(s.x, s.y - 4, 'fx_glow', 5, 10, 16, 700);
    services.audio.sfx('sparkle');
    return true;
  }

  private matched(): number { return [...this.bf.values()].filter((b) => b.landed).length; }

  private updateButterflies(now: number, dt: number) {
    const p = this.h.playerPos();
    for (const [c, b] of this.bf) {
      if (!b.following) continue;
      const s = this.h.objSprite(`bf_${c}`);
      if (!s) continue;
      if (now > b.until) { b.following = false; continue; }
      const tx = p.x * T - 10, ty = p.y * T - 18 + Math.sin(now / 220) * 3, k = Math.min(1, dt / 220);
      s.x += (tx - s.x) * k; s.y += (ty - s.y) * k; s.setDepth(s.y + 2);
      this.h.setObjPos(`bf_${c}`, { x: Math.floor(s.x / T), y: Math.floor(s.y / T) });
      const col = c as 'red' | 'blue' | 'yellow';
      const near = (g: Tile) => Math.hypot(s.x / T - (g.x + 0.5), s.y / T - (g.y + 0.5)) < 2.5;
      if (near(GOALS[col])) {
        const was = this.matched();
        this.landAt(col, true);
        if (was < 3 && this.matched() >= 3) void onButterfliesDone(this.h.ctx());
      } else if (now - b.lastWrong > 3500) {
        // a different colour's flower: a gentle flutter, never a penalty
        for (const o of ['red', 'blue', 'yellow'] as const) if (o !== col && near(GOALS[o])) {
          b.lastWrong = now;
          this.scene.tweens.add({ targets: s, y: s.y - 8, duration: dur(160), yoyo: true, repeat: 1 });
        }
      }
    }
  }

  // ---------------------------------------------------------------- lantern game
  lanternsActive() { return this.lant.active; }

  startLanterns(onDone: () => void) {
    this.lant.onDone = onDone;
    this.lant.token++;
    this.lant.mistakes = 0; this.lant.pos = 0; this.lant.active = false;
    this.lant.seq = (this.lanternSeedOverride ?? this.randomSeq()).slice();
    this.paintLanterns(false);
    this.playSeq(this.lant.token);
  }

  private randomSeq(): number[] {
    const a = [0, 1, 2, 3];
    for (let i = a.length - 1; i > 0; i--) { const j = Phaser.Math.Between(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, 3);
  }

  private light(i: number, on: boolean) {
    this.h.objSprite(`lantern_${i + 1}`)?.setFrame(on ? 1 : 0);
    const g = this.lanternGlow[i];
    if (g) g.setAlpha(on ? 0.85 : 0);
    if (on) { services.audio.note(NOTE_HZ[i * 2], 520, 'triangle'); }
  }

  private playSeq(token: number) {
    this.lant.showing = true; this.lant.active = false;
    const step = dur(750);
    this.lant.seq.forEach((n, k) => {
      this.scene.time.delayedCall(600 + k * step, () => { if (token === this.lant.token) this.light(n, true); });
      this.scene.time.delayedCall(600 + k * step + step * 0.7, () => { if (token === this.lant.token) this.light(n, false); });
    });
    this.scene.time.delayedCall(600 + this.lant.seq.length * step + 100, () => {
      if (token !== this.lant.token) return;
      this.lant.showing = false; this.lant.active = true; this.lant.pos = 0;
    });
  }

  lanternTap(i: number) {
    if (!this.lant.active || this.lant.showing) return;
    const token = this.lant.token;
    this.light(i, true);
    if (i === this.lant.seq[this.lant.pos]) {
      this.lant.pos++;
      if (this.lant.pos >= this.lant.seq.length) {
        this.lant.active = false;
        this.scene.time.delayedCall(dur(450), () => {
          if (token !== this.lant.token) return;
          for (let n = 0; n < 4; n++) this.light(n, true);
          this.lant.onDone?.();
        });
      }
    } else {
      // never a failure: the lanterns dim, then show the pattern again
      this.lant.mistakes++; this.lant.active = false;
      if (this.lant.mistakes === 1) void services.audio.speak('lanterns_again');
      this.scene.time.delayedCall(dur(500), () => {
        if (token !== this.lant.token) return;
        for (let n = 0; n < 4; n++) this.light(n, false);
        this.playSeq(token);
      });
    }
  }

  // ---------------------------------------------------------------- race
  raceActive() { return !!this.race && !this.race.done; }

  startRace(mode: RaceMode) {
    this.stopRace(true);
    if (mode === 'free') return;
    this.race = startRace(mode, RIVER_COURSE.rings);
    const ui = this.h.ui();
    this.raceSprites = this.race.rings.map((r, i) =>
      this.scene.add.image(r.x * T, r.y * T, 'px_ring').setDepth(7000).setScale(1.5).setAlpha(i === 0 ? 1 : 0.45).setTint(i === 0 ? 0xfff0a0 : 0xffffff));
    this.arrow = this.scene.add.graphics().setDepth(9600);
    if (mode === 'friendly') this.companion = this.scene.add.image(0, 0, 'px_dolphin').setDepth(9000);
    ui.showRaceHud(this.race.rings.length, mode === 'star', () => this.stopRace());
    ui.setRaceProgress(0, this.race.rings.length);
    void services.audio.speak('race_go');
    this.pulseNext();
  }

  stopRace(silent = false) {
    this.raceSprites.forEach((s) => s.destroy()); this.raceSprites = [];
    this.arrow?.destroy(); this.arrow = undefined;
    this.companion?.destroy(); this.companion = undefined;
    const had = !!this.race;
    this.race = null;
    if (had || !silent) this.h.ui().hideRaceHud();
  }

  private pulseNext() {
    const s = this.race && this.raceSprites[this.race.next];
    if (!s || reducedEffects()) return;
    this.scene.tweens.add({ targets: s, scale: { from: 1.4, to: 1.8 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private updateRace(now: number, dt: number) {
    const r = this.race;
    if (!r || r.done) return;
    const p = this.h.playerPos();
    const ev = stepRace(r, p, now);
    if (r.mode === 'star') this.h.ui().setRaceTime(r.startedAt === null ? null : r.elapsedMs);
    if (ev !== 'none') {
      const passed = this.raceSprites[r.next - 1];
      if (passed) { this.scene.tweens.killTweensOf(passed); this.scene.tweens.add({ targets: passed, alpha: 0, scale: 2.4, duration: dur(450), onComplete: () => passed.setVisible(false) }); }
      services.audio.note(NOTE_HZ[(r.passed + 2) % NOTE_HZ.length], 420, 'triangle');
      this.h.sparkle(Math.floor(passed?.x ? passed.x / T : p.x), Math.floor(passed?.y ? passed.y / T : p.y), 8);
      this.h.ui().setRaceProgress(progress(r).done, progress(r).total);
      const nx = this.raceSprites[r.next];
      if (nx) { nx.setAlpha(1).setTint(0xfff0a0); this.pulseNext(); }
    }
    if (ev === 'finish') {
      const mode = r.mode, ms = r.elapsedMs, stars = mode === 'star' ? starsFor(ms) : 0;
      this.stopRace(true);
      this.h.ui().hideRaceHud();
      void onRaceFinish(this.h.ctx(), mode, stars, ms);
      return;
    }
    // big, clear direction arrow in front of the swimmer
    const g = guideDir(r, p);
    if (g && this.arrow) {
      const ang = Math.atan2(g.y, g.x), cx = p.x * T + g.x * 30, cy = p.y * T - 10 + g.y * 30;
      const gr = this.arrow.clear();
      const pt = (a: number, d: number) => ({ x: cx + Math.cos(ang + a) * d, y: cy + Math.sin(ang + a) * d });
      const tip = pt(0, 11), l = pt(2.5, 9), rr = pt(-2.5, 9);
      gr.fillStyle(0xffe14d, 0.95).lineStyle(2, 0xffffff, 1).beginPath().moveTo(tip.x, tip.y).lineTo(l.x, l.y).lineTo(rr.x, rr.y).closePath().fillPath().strokePath();
    }
    if (this.companion) {
      const c = companionPos(r, p);
      this.companion.x += (c.x * T - this.companion.x) * Math.min(1, dt / 260);
      this.companion.y += (c.y * T - 8 + Math.sin(now / 260) * 3 - this.companion.y) * Math.min(1, dt / 260);
      this.companion.setFlipX(c.x * T < p.x * T);
    }
  }

  // ---------------------------------------------------------------- frame update
  update(now: number, dt: number) {
    if (this.heldIcon?.visible) {
      const p = this.h.playerPos();
      this.heldIcon.setPosition(p.x * T + 12, p.y * T - 34 + Math.sin(now / 260) * 2);
    }
    if (this.bf.size) this.updateButterflies(now, dt);
    if (this.race) this.updateRace(now, dt);
  }

  // ---------------------------------------------------------------- debugging / tests
  debug() {
    const now = performance.now();
    return {
      activeFx: this.fx.count(now),
      lantern: { active: this.lant.active, showing: this.lant.showing, seq: this.lant.seq.slice(), pos: this.lant.pos, mistakes: this.lant.mistakes },
      plots: Object.fromEntries([...this.plots].map(([id, p]) => [id, { stage: p.stage, seed: p.seed }])),
      held: this.heldSeed,
      butterflies: Object.fromEntries([...this.bf].map(([c, b]) => [c, { following: b.following, landed: b.landed }])),
      race: this.race ? { mode: this.race.mode, next: this.race.next, passed: this.race.passed, total: this.race.rings.length, done: this.race.done, elapsedMs: this.race.elapsedMs } : null,
      seeds: SEEDS.length,
      hex: SEED_HEX.red
    };
  }
}
