import Phaser from 'phaser';
import { UI } from '../content/frameIndex';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { burst, makeButton } from '../ui/touchTargets';
import { HUGE, STAGE_H, STAGE_W, fullBackdrop, stagePoint, useStage } from '../ui/stage';
import { MERMAID_LOOK } from '../art/looks';
import type { RaceMode } from '../world/race';
import { LANE_MAX, LANE_MIN, RUN_RINGS, buildCourse, finishDistance, speedAt, starsForRun, touches, type RunItem } from '../world/riverRun';

export interface RaceResult { mode: RaceMode; finished: boolean; stars: number; ms: number; rings: number }

const MY = 292;            // the mermaid's fixed screen row
const CRUISE = 120;        // px per second
const STEER = 9;           // how quickly she follows the thumb
const KEY_SPEED = 230;

/**
 * v0.4d.5 River Race: a classic scrolling 2D run. The mermaid stays near the bottom of the screen, the river scrolls toward her, and she
 * steers left and right with a thumb (or arrow keys), passing through glowing rings and dodging kelp and rocks. Bumps only slow her for a
 * moment. There are no time penalties and no clock on screen; the exit button is always there.
 */
export class RaceScene extends Phaser.Scene {
  private mode: RaceMode = 'friendly';
  private items: RunItem[] = [];
  private sprites: Phaser.GameObjects.Image[] = [];
  private hit: boolean[] = [];
  private dist = 0;
  private mx = 256;
  private target = 256;
  private boost = 0;
  private slow = 0;
  private passed = 0;
  private pearls = 0;
  private bumps = 0;
  private elapsed = 0;
  private done = false;
  private closing = false;
  private best: RaceResult | null = null;
  private mer!: Phaser.GameObjects.Sprite;
  private dolphin!: Phaser.GameObjects.Image;
  private bubbles: Phaser.GameObjects.Arc[] = [];
  private hudRings: Phaser.GameObjects.Image[] = [];
  private pearlText!: Phaser.GameObjects.Text;
  private endUi: Phaser.GameObjects.GameObject[] = [];
  private finishObjs: Phaser.GameObjects.GameObject[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private seed = 1;
  constructor() { super('Race'); }

  init(data: { mode: RaceMode }) { this.mode = data.mode ?? 'friendly'; this.best = null; }

  create() {
    useStage(this);
    this.closing = false;
    this.seed = 1 + Math.floor(Math.random() * 9000);
    fullBackdrop(this, 0x2aa3d8, 0x0c4a8a, 0);
    this.drawBanks();
    this.bubbles = [];
    for (let i = 0; i < 16; i++) {
      this.bubbles.push(this.add.circle(Phaser.Math.Between(LANE_MIN, LANE_MAX), Phaser.Math.Between(-20, STAGE_H + 20), Phaser.Math.Between(2, 4), 0xffffff, 0.22).setDepth(1));
    }
    this.dolphin = this.add.image(256, MY - 90, 'px_dolphin', 0).setScale(2).setAngle(-90).setDepth(8);
    this.mer = this.add.sprite(256, MY, MERMAID_LOOK, 0).setOrigin(0.5, 0.78).setDepth(9);
    this.playSwim();
    this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

    const back = makeButton(this, 38, 38, 'icon_back', 1.5, () => this.leave());
    back.container.setDepth(50);
    this.pearlText = this.add.text(STAGE_W - 14, 14, '', { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff', stroke: '#0c3b78', strokeThickness: 4 }).setOrigin(1, 0).setDepth(50);
    this.input.on('pointerdown', this.onPoint, this);
    this.input.on('pointermove', this.onPoint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.onPoint, this);
      this.input.off('pointermove', this.onPoint, this);
      delete (window as unknown as { __race?: unknown }).__race;
    });
    (window as unknown as { __race?: unknown }).__race = {
      state: () => ({ mode: this.mode, dist: this.dist, mx: this.mx, passed: this.passed, pearls: this.pearls, bumps: this.bumps, done: this.done, closing: this.closing,
        total: this.items.filter((i) => i.kind === 'ring').length, slow: this.slow, boost: this.boost, finish: this.mode === 'free' ? 0 : finishDistance(this.mode), best: this.best, items: this.items.length }),
      steer: (x: number) => { this.target = Phaser.Math.Clamp(x, LANE_MIN, LANE_MAX); },
      nextRing: () => this.items.find((it, i) => it.kind === 'ring' && !this.hit[i] && it.d > this.dist - 20) ?? null,
      buttons: () => ({ back: { x: 38, y: 38 }, again: this.endUi.length ? { x: STAGE_W / 2 - 70, y: 250 } : null, leave: this.endUi.length ? { x: STAGE_W / 2 + 70, y: 250 } : null }),
      leave: () => this.leave(), again: () => this.again()
    };
    this.cameras.main.fadeIn(dur(250));
    this.begin();
  }

  private drawBanks() {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xe9d49b, 1).fillRect(-HUGE, -HUGE, HUGE + 18, 2 * HUGE).fillRect(STAGE_W - 18, -HUGE, HUGE + 18, 2 * HUGE);
    g.fillStyle(0xc9b273, 1).fillRect(10, -HUGE, 8, 2 * HUGE).fillRect(STAGE_W - 18, -HUGE, 8, 2 * HUGE);
  }

  private begin() {
    this.items = buildCourse(this.mode, this.seed);
    this.hit = this.items.map(() => false);
    this.sprites.forEach((s) => s.destroy()); this.finishObjs.forEach((o) => o.destroy()); this.endUi.forEach((o) => o.destroy());
    this.endUi = []; this.finishObjs = [];
    this.sprites = this.items.map((it) => {
      const key = it.kind === 'ring' ? 'px_ring' : it.kind === 'pearl' ? 'px_pearl' : it.kind === 'kelp' ? 'px_kelp' : 'px_rock';
      return this.add.image(it.x, -100, key).setScale(it.kind === 'ring' ? 1.5 : 2).setDepth(it.kind === 'ring' ? 6 : 5).setVisible(false);
    });
    if (this.mode !== 'free') {
      const fd = finishDistance(this.mode);
      const l = this.add.image(LANE_MIN - 20, -100, 'px_startpost').setScale(3).setDepth(5);
      const r = this.add.image(LANE_MAX + 20, -100, 'px_startpost').setScale(3).setDepth(5);
      const line = this.add.rectangle(STAGE_W / 2, -100, LANE_MAX - LANE_MIN + 40, 8, 0xfff2a8, 0.9).setDepth(4);
      this.finishObjs = [l, r, line];
      this.finishD = fd;
    }
    this.dist = 0; this.mx = 256; this.target = 256; this.boost = 0; this.slow = 0; this.passed = 0; this.pearls = 0; this.bumps = 0; this.elapsed = 0; this.done = false;
    this.hudRings.forEach((h) => h.destroy());
    this.hudRings = [];
    if (this.mode !== 'free') {
      const n = RUN_RINGS[this.mode];
      const step = Math.min(26, 300 / n);
      const x0 = STAGE_W / 2 - ((n - 1) * step) / 2 + 20;
      for (let i = 0; i < n; i++) this.hudRings.push(this.add.image(x0 + i * step, 26, 'px_ring').setScale(0.5).setAlpha(0.35).setDepth(50));
    }
    this.updateHud();
  }
  private finishD = 0;

  private playSwim() {
    const k = 'mermaid_swim_up';
    if (this.anims.exists(k)) this.mer.play(k, true);
  }

  private updateHud() {
    this.hudRings.forEach((h, i) => h.setAlpha(i < this.passed ? 1 : 0.35));
    this.pearlText.setText(this.pearls > 0 || this.mode === 'free' ? `● ${this.pearls}` : '');
  }

  private onPoint(p: Phaser.Input.Pointer) {
    if (this.done || this.closing || !p.isDown) return;
    const s = stagePoint(this, p);
    if (s.x < 76 && s.y < 76) return; // the exit button
    this.target = Phaser.Math.Clamp(s.x, LANE_MIN, LANE_MAX);
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    // bubbles drift down the screen even while she is waiting at the finish
    const sp = this.done ? CRUISE * 0.3 : speedAt(CRUISE, this.boost, this.slow);
    for (const b of this.bubbles) { b.y += sp * dt * 1.4; if (b.y > STAGE_H + 20) { b.y = -10; b.x = Phaser.Math.Between(LANE_MIN, LANE_MAX); } }
    if (this.closing) return;
    // the dolphin points the way to the next ring
    const next = this.items.find((it, i) => it.kind === 'ring' && !this.hit[i]);
    const dtx = this.done || !next ? 256 : Phaser.Math.Clamp(next.x, LANE_MIN, LANE_MAX);
    this.dolphin.x += (dtx - this.dolphin.x) * Math.min(1, dt * 3);
    this.dolphin.y = MY - 96 + Math.sin(this.time.now / 260) * 5;
    this.dolphin.setFrame(Math.floor(this.time.now / 220) % 2);
    if (this.done) return;
    this.elapsed += dtMs;
    if (this.cursors?.left?.isDown) this.target = Phaser.Math.Clamp(this.target - KEY_SPEED * dt, LANE_MIN, LANE_MAX);
    if (this.cursors?.right?.isDown) this.target = Phaser.Math.Clamp(this.target + KEY_SPEED * dt, LANE_MIN, LANE_MAX);
    this.mx += (this.target - this.mx) * Math.min(1, dt * STEER);
    this.boost = Math.max(0, this.boost - dtMs); this.slow = Math.max(0, this.slow - dtMs);
    this.dist += speedAt(CRUISE, this.boost, this.slow) * dt;
    this.mer.x = this.mx; this.mer.rotation = Phaser.Math.Clamp((this.target - this.mx) / 300, -0.25, 0.25);
    this.items.forEach((it, i) => {
      const sp2 = this.sprites[i];
      const y = MY - (it.d - this.dist);
      sp2.y = y; sp2.setVisible(y > -50 && y < STAGE_H + 60 && !this.hit[i] || (it.kind !== 'ring' && it.kind !== 'pearl' && y > -50 && y < STAGE_H + 60));
      if (it.kind === 'ring' && !this.hit[i] && next === it) sp2.setScale(1.5 + Math.sin(this.time.now / 180) * 0.1);
      if (this.hit[i]) return;
      const dy = y - MY;
      if (it.kind === 'ring' && touches(this.mx, it.x, dy, 40, 22)) this.collect(i, it);
      else if (it.kind === 'pearl' && touches(this.mx, it.x, dy, 26, 22)) this.collect(i, it);
      else if ((it.kind === 'kelp' || it.kind === 'rock') && touches(this.mx, it.x, dy, it.kind === 'rock' ? 24 : 14, it.kind === 'rock' ? 14 : 24)) this.bump(i, it);
    });
    if (this.mode === 'free' && this.items.length && this.dist > this.items[this.items.length - 1].d - 600) this.extend();
    if (this.mode !== 'free') {
      const fy = MY - (this.finishD - this.dist);
      const [l, r, line] = this.finishObjs as Phaser.GameObjects.Image[];
      l.y = r.y = fy; (line as unknown as Phaser.GameObjects.Rectangle).y = fy;
      if (this.dist >= this.finishD) this.finish();
    }
  }

  private extend() {
    const last = this.items[this.items.length - 1].d;
    const more = buildCourse('free', this.seed + this.items.length, last, 8);
    for (const it of more) {
      this.items.push(it); this.hit.push(false);
      const key = it.kind === 'ring' ? 'px_ring' : it.kind === 'pearl' ? 'px_pearl' : it.kind === 'kelp' ? 'px_kelp' : 'px_rock';
      this.sprites.push(this.add.image(it.x, -100, key).setScale(it.kind === 'ring' ? 1.5 : 2).setDepth(it.kind === 'ring' ? 6 : 5).setVisible(false));
    }
  }

  private collect(i: number, it: RunItem) {
    this.hit[i] = true; this.sprites[i].setVisible(false);
    if (it.kind === 'ring') { this.passed += 1; this.boost = 700; services.audio.sfx('chime'); } else { this.pearls += 1; services.audio.sfx('pop'); }
    burst(this, it.x, MY, it.kind === 'ring' ? 10 : 5, 60);
    this.updateHud();
  }

  private bump(i: number, it: RunItem) {
    this.hit[i] = true; this.bumps += 1; this.slow = 700;
    this.target = Phaser.Math.Clamp(this.mx + (this.mx >= it.x ? 40 : -40), LANE_MIN, LANE_MAX);
    services.audio.sfx('pop');
    this.tweens.add({ targets: this.mer, angle: { from: -10, to: 10 }, duration: dur(90), yoyo: true, repeat: 1 });
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    const total = this.mode === 'free' ? 0 : RUN_RINGS[this.mode];
    const stars = this.mode === 'star' ? starsForRun(this.passed, total) : 1;
    const res: RaceResult = { mode: this.mode, finished: true, stars, ms: Math.floor(this.elapsed), rings: this.passed };
    if (!this.best || res.stars > this.best.stars) this.best = res;
    services.audio.sfx('chime');
    burst(this, STAGE_W / 2, 150, 16, 60);
    const o: Phaser.GameObjects.GameObject[] = [];
    o.push(this.add.rectangle(STAGE_W / 2, 190, 360, 200, 0x0c3b78, 0.82).setDepth(60));
    for (let i = 0; i < 3; i++) {
      const on = this.mode === 'star' ? i < stars : true;
      if (this.mode === 'star' || i === 1) o.push(this.add.image(STAGE_W / 2 + (this.mode === 'star' ? (i - 1) * 70 : 0), 130, 'ui', UI.icon_star).setScale(2.4).setAlpha(on ? 1 : 0.25).setDepth(61));
    }
    const again = makeButton(this, STAGE_W / 2 - 70, 250, 'icon_undo', 2, () => this.again());
    const leave = makeButton(this, STAGE_W / 2 + 70, 250, 'icon_back', 2, () => this.leave());
    again.container.setDepth(62); leave.container.setDepth(62);
    o.push(again.container, leave.container);
    this.endUi = o;
  }

  private again() { if (this.closing) return; this.seed += 1; this.begin(); }

  private leave() {
    if (this.closing) return;
    this.closing = true;
    services.save.save();
    const world = this.scene.get('World');
    this.scene.resume('World'); this.scene.resume('UI');
    world.events.emit('race-closed', this.best ?? { mode: this.mode, finished: false, stars: 0, ms: 0, rings: this.passed } satisfies RaceResult);
    this.scene.stop();
  }
}
