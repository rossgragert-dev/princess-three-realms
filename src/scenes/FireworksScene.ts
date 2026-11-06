import Phaser from 'phaser';
import {
  ACTIVITY_REWARD, FIREWORKS_SESSION_LAUNCHES, FW_COLORS, FW_MAX_ACTIVE_BURSTS, FW_MAX_PARTICLES, FW_MAX_PARTICLES_REDUCED, FW_MODES, FW_SHAPES,
  burstPoints, designId, fwTint, grantDecor, syncWandUnlocks, type FwColor, type FwMode, type FwShape
} from '../content/family';
import { UI } from '../content/frameIndex';
import { services } from '../systems/services';
import { dur, reducedEffects } from '../systems/accessibility';
import { burst, makeButton } from '../ui/touchTargets';
import { HUGE, fullBackdrop, stagePoint, useStage } from '../ui/stage';

const SKY_H = 262;           // taps above this line launch fireworks
const HIT = 58;              // >= 44 CSS px even on a phone held upright (512 logical px -> ~390 CSS px)
const SWATCH_HEX: Record<FwColor, number> = { pink: 0xff7ec3, gold: 0xffd93d, blue: 0x3ea6ff, green: 0x5ccf59, violet: 0xa06bff, rainbow: 0xffffff };
const last = { color: 'pink' as FwColor, shape: 'star' as FwShape, mode: 1 as FwMode };

/**
 * The King's Fireworks Festival: a night sky with the castle silhouette. Tap the sky to launch; pick a colour, a shape and
 * 1, 2 or 3 rockets in a row from big picture buttons. Nothing can go wrong: unlimited practice, no timers, no scores.
 * Safe by design: no full-screen flashes, a hard cap on particles and active bursts, and gentler/slower in reduced-effects.
 */
export class FireworksScene extends Phaser.Scene {
  private color: FwColor = 'pink';
  private shape: FwShape = 'star';
  private mode: FwMode = 1;
  private active = 0;
  private queue: { x: number; y: number }[] = [];
  private launchedThisVisit = 0;
  private sessionDone = false;
  private closing = false;
  private openedAt = 0;
  private rings: { kind: 'color' | 'shape' | 'mode'; id: string | number; x: number; y: number; g: Phaser.GameObjects.Graphics }[] = [];
  private btnPos: Record<string, { x: number; y: number }> = {};
  private totalParticles = 0;
  private stagger = 0;
  private maxLiveParticles = 0;
  private live = 0;
  constructor() { super('Fireworks'); }

  create() {
    this.closing = false; this.active = 0; this.queue = []; this.launchedThisVisit = 0; this.sessionDone = false; this.rings = []; this.btnPos = {};
    this.stagger = 0; this.live = 0; this.maxLiveParticles = 0; this.totalParticles = 0; this.openedAt = this.time.now;
    ({ color: this.color, shape: this.shape, mode: this.mode } = last);
    this.drawSky();
    this.buildPanel();
    const back = makeButton(this, 32, 32, 'icon_back', 0.9, () => this.close());
    back.container.setDepth(30); this.btnPos.back = { x: 32, y: 32 };
    this.input.on('pointerdown', this.onSky, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.onSky, this);
      delete (window as unknown as { __station?: unknown }).__station;
    });
    (window as unknown as { __station?: unknown }).__station = {
      key: 'Fireworks', buttons: () => ({ ...this.btnPos }), rings: () => this.rings.map(({ kind, id, x, y }) => ({ kind, id, x, y })),
      state: () => ({ color: this.color, shape: this.shape, mode: this.mode, active: this.active, queued: this.queue.length, launched: this.launchedThisVisit, sessionDone: this.sessionDone, closing: this.closing, live: this.live, maxLive: this.maxLiveParticles, total: this.totalParticles, skyH: SKY_H }),
      launch: (x: number, y: number) => this.launchAt(x, y), setColor: (c: FwColor) => this.pick('color', c), setShape: (s: FwShape) => this.pick('shape', s), setMode: (m: FwMode) => this.pick('mode', m)
    };
    this.cameras.main.fadeIn(dur(250));
    services.audio.sfx('chime');
  }

  // ------------------------------------------------------------------ backdrop
  private drawSky() {
    useStage(this);
    fullBackdrop(this, 0x0b0a2e, 0x4a2f8f);
    const rnd = new Phaser.Math.RandomDataGenerator(['festival']);
    for (let i = 0; i < 46; i++) {
      const s = this.add.image(rnd.between(6, 506), rnd.between(6, 200), 'fw_spark').setAlpha(0.5 + rnd.frac() * 0.4).setScale(rnd.pick([0.6, 0.8, 1])).setDepth(1);
      if (!reducedEffects() && i % 4 === 0) this.tweens.add({ targets: s, alpha: 0.25, duration: 1400 + i * 30, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    // the ground and castle silhouette run on past the stage edges so wide screens never show a seam
    this.add.graphics().setDepth(2).fillStyle(0x1a1245, 1).fillRect(-HUGE, 226, 512 + 2 * HUGE, 40);
    this.add.image(256, 226, 'fw_castle').setScale(2.2).setOrigin(0.5, 1).setTint(0x1a1245).setDepth(2);
    const ground = this.add.graphics().setDepth(3);
    ground.fillStyle(0x2c2068, 1).fillRect(-HUGE, 226, 512 + 2 * HUGE, 3);
    this.add.image(256, 238, 'fw_dais').setScale(1.4).setDepth(4);
  }

  // ------------------------------------------------------------------ the picture-only control panel
  private buildPanel() {
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x000000, 0.25).fillRect(-HUGE, SKY_H + 3, 512 + 2 * HUGE, HUGE);
    g.fillStyle(0x4a2f8f, 1).fillRect(-HUGE, SKY_H, 512 + 2 * HUGE, HUGE).lineStyle(3, 0xffd93d, 1).lineBetween(-HUGE, SKY_H, 512 + HUGE, SKY_H);
    const row1 = SKY_H + 33, row2 = SKY_H + 92;
    const cx0 = 256 - (FW_COLORS.length * HIT) / 2 + HIT / 2;
    FW_COLORS.forEach((c, i) => this.addChoice('color', c, cx0 + i * HIT, row1, (x, y) => this.drawSwatch(x, y, c)));
    const items = FW_SHAPES.length + FW_MODES.length;
    const sx0 = 256 - (items * HIT) / 2 + HIT / 2 - 6;
    FW_SHAPES.forEach((s, i) => this.addChoice('shape', s, sx0 + i * HIT, row2, (x, y) => this.add.image(x, y, `fw_shape_${s}`).setScale(1.5).setDepth(12)));
    FW_MODES.forEach((m, i) => this.addChoice('mode', m, sx0 + (FW_SHAPES.length + i) * HIT + 12, row2, (x, y) => this.add.image(x, y, `fw_mode_${m}`).setScale(1.15).setDepth(12)));
    this.refreshRings();
  }

  private drawSwatch(x: number, y: number, c: FwColor) {
    const g = this.add.graphics().setDepth(12);
    if (c === 'rainbow') {
      const cols = [0xff5a6e, 0xff9a3c, 0xffe14d, 0x5ccf59, 0x3ea6ff, 0xa06bff];
      cols.forEach((col, i) => g.fillStyle(col, 1).slice(x, y, 19, (Math.PI * 2 * i) / 6, (Math.PI * 2 * (i + 1)) / 6, false).fillPath());
    } else g.fillStyle(SWATCH_HEX[c], 1).fillCircle(x, y, 19);
    g.lineStyle(2, 0xffffff, 0.8).strokeCircle(x, y, 19);
    return g;
  }

  private addChoice(kind: 'color' | 'shape' | 'mode', id: string | number, x: number, y: number, draw: (x: number, y: number) => Phaser.GameObjects.GameObject) {
    const ring = this.add.graphics().setDepth(11);
    draw(x, y);
    const z = this.add.zone(x, y, HIT, HIT).setDepth(14).setInteractive({ useHandCursor: true });
    z.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.pick(kind, id); });
    this.rings.push({ kind, id, x, y, g: ring });
    this.btnPos[`${kind}:${id}`] = { x, y };
  }

  private pick(kind: 'color' | 'shape' | 'mode', id: string | number) {
    if (kind === 'color' && (FW_COLORS as readonly string[]).includes(id as string)) this.color = id as FwColor;
    else if (kind === 'shape' && (FW_SHAPES as readonly string[]).includes(id as string)) this.shape = id as FwShape;
    else if (kind === 'mode' && (FW_MODES as readonly number[]).includes(Number(id))) this.mode = Number(id) as FwMode;
    else return;
    ({ color: last.color, shape: last.shape, mode: last.mode } = this);
    services.audio.sfx('pop');
    this.refreshRings();
  }

  private refreshRings() {
    for (const r of this.rings) {
      const on = (r.kind === 'color' && r.id === this.color) || (r.kind === 'shape' && r.id === this.shape) || (r.kind === 'mode' && Number(r.id) === this.mode);
      r.g.clear();
      if (on) r.g.lineStyle(4, 0xffd93d, 1).strokeRoundedRect(r.x - 27, r.y - 27, 54, 54, 12).fillStyle(0xffffff, 0.12).fillRoundedRect(r.x - 27, r.y - 27, 54, 54, 12);
      else r.g.fillStyle(0x000000, 0.18).fillRoundedRect(r.x - 27, r.y - 27, 54, 54, 12);
    }
  }

  // ------------------------------------------------------------------ launching
  private onSky(ptr: Phaser.Input.Pointer) {
    const p = stagePoint(this, ptr);
    if (this.closing || p.y >= SKY_H || this.time.now - this.openedAt < 250) return;
    if (p.x < 70 && p.y < 70) return; // the back button
    this.launchAt(p.x, p.y);
  }

  /** Queue up `mode` rockets in a row around the tapped spot. Never refuses: extra taps beyond the queue are simply ignored. */
  launchAt(x: number, y: number) {
    if (this.closing) return;
    const ty = Phaser.Math.Clamp(y, 40, SKY_H - 60), tx = Phaser.Math.Clamp(x, 40, 472);
    const spread = [[0], [-46, 46], [-70, 0, 70]][this.mode - 1];
    spread.forEach((dx) => {
      if (this.queue.length >= 3) return;
      this.queue.push({ x: Phaser.Math.Clamp(tx + dx, 30, 482), y: ty + (dx === 0 && this.mode === 3 ? -14 : 0) });
    });
    this.pump();
  }

  private pump() {
    while (this.queue.length && this.active < FW_MAX_ACTIVE_BURSTS) {
      const t = this.queue.shift()!;
      this.active++;
      const { color, shape } = this;
      this.time.delayedCall(dur(this.stagger++ % 3 * 260), () => { if (!this.closing) this.rocket(t.x, t.y, color, shape); else this.active--; });
    }
  }

  private rocket(tx: number, ty: number, color: FwColor, shape: FwShape) {
    const sx = 256 + (tx - 256) * 0.25, sy = 232;
    const r = this.add.image(sx, sy, 'fw_rocket').setDepth(6).setTint(fwTint(color, 0));
    services.audio.sfx('spray');
    const rise = reducedEffects() ? 900 : 620;
    let lastTrail = 0;
    this.tweens.add({
      targets: r, x: tx, y: ty, duration: rise, ease: 'Quad.Out',
      onUpdate: () => {
        if (reducedEffects() || this.time.now - lastTrail < 45) return;
        lastTrail = this.time.now;
        const t = this.add.image(r.x, r.y + 6, 'fw_spark').setDepth(5).setAlpha(0.8).setTint(0xffe9a8);
        this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
      },
      onComplete: () => { r.destroy(); this.explode(tx, ty, color, shape); }
    });
  }

  private explode(cx: number, cy: number, color: FwColor, shape: FwShape) {
    const reduced = reducedEffects();
    const n = Math.min(reduced ? FW_MAX_PARTICLES_REDUCED : 72, reduced ? FW_MAX_PARTICLES_REDUCED : FW_MAX_PARTICLES);
    const radius = shape === 'rainbow' ? 62 : 52, life = reduced ? 1500 : 1100;
    const pts = burstPoints(shape, n);
    services.audio.sfx('sparkle');
    // a small soft glow (never full-screen, never white) so the burst feels bright without flashing
    const glow = this.add.image(cx, cy, 'fx_glow').setDepth(4).setAlpha(0.3).setScale(1.2).setTint(fwTint(color, 0)).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0, scale: 2, duration: life * 0.7, onComplete: () => glow.destroy() });
    let remaining = pts.length;
    const done = () => { if (--remaining === 0) this.burstEnded(); };
    pts.forEach((p, i) => {
      const s = this.add.image(cx, cy, 'fw_spark').setDepth(7).setTint(fwTint(color, i, p.band)).setScale(1.4);
      this.live++; this.totalParticles++; this.maxLiveParticles = Math.max(this.maxLiveParticles, this.live);
      this.tweens.add({
        targets: s, x: cx + p.x * radius, y: cy + p.y * radius + 6, duration: reduced ? 700 : 480, ease: 'Cubic.Out',
        onComplete: () => this.tweens.add({ targets: s, y: s.y + 26, alpha: 0, scale: 0.5, duration: life, ease: 'Sine.In', onComplete: () => { s.destroy(); this.live--; done(); } })
      });
    });
    this.count(color, shape);
  }

  private burstEnded() { this.active = Math.max(0, this.active - 1); this.pump(); }

  private count(color: FwColor, shape: FwShape) {
    const a = services.save.state.activities.fireworks;
    this.launchedThisVisit++;
    a.launched++;
    const id = designId(shape, color);
    if (!a.designs.includes(id)) a.designs.push(id);
    if (!this.sessionDone && this.launchedThisVisit >= FIREWORKS_SESSION_LAUNCHES) this.finishSession();
    else services.save.save();
  }

  /** The first three launches of a visit complete a session: a garland for her room (once) and a new wand shape (once). */
  private finishSession() {
    this.sessionDone = true;
    const st = services.save.state;
    st.activities.fireworks.sessions++;
    const newDecor = grantDecor(st, ACTIVITY_REWARD.fireworks);
    syncWandUnlocks(st);
    services.save.save();
    this.time.delayedCall(dur(1200), () => {
      if (this.closing) return;
      services.audio.sfx('chime');
      const img = newDecor ? this.add.image(256, 120, 'festival_garland').setScale(5) : this.add.image(256, 120, 'ui', UI.icon_star).setScale(3);
      img.setDepth(40);
      this.tweens.add({ targets: img, scale: img.scale * 1.15, duration: dur(420), yoyo: true, repeat: 2 });
      burst(this, 256, 120, 14, 41);
      this.tweens.add({ targets: img, alpha: 0, delay: dur(2200), duration: dur(500), onComplete: () => img.destroy() });
    });
  }

  // ------------------------------------------------------------------ leaving
  private close() {
    if (this.closing) return;
    this.closing = true;
    services.save.save();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.get('World').events.emit('station-closed');
    this.scene.stop();
  }
}
