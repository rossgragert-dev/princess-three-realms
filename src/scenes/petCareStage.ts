import Phaser from 'phaser';
import { ITEM } from '../content/frameIndex';
import { dur, reducedEffects, sparkleCount } from '../systems/accessibility';
import { services } from '../systems/services';
import { findPath, type NavGrid } from '../world/navigation';
import { SPECIES_CARE, type Species } from '../world/petCare';
import type { Tile } from '../world/types';
import type { UIScene } from './UIScene';

const T = 16;
export const PLAY_ROUNDS = 8;

export interface PetHost {
  scene: Phaser.Scene;
  sprite(): Phaser.GameObjects.Sprite | undefined;
  tile(): Tile;
  setTile(t: Tile): void;
  grid(): NavGrid;
  /** Is this a floor tile the pet may stand on (inside the room, not furniture)? */
  free(t: Tile): boolean;
  playerTile(): Tile;
  ui(): UIScene;
  setBusy(b: boolean): void;
}

const px = (t: Tile) => ({ x: t.x * T + T / 2, y: (t.y + 1) * T });
const dist = (a: Tile, b: Tile) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** The pet-care animations: feed, water, play. Gentle and repeatable; every action leaves the pet standing happily on a free tile. */
export class PetCareStage {
  readonly log = { fed: 0, watered: 0, thrown: 0, lastAction: '' as string };
  constructor(private h: PetHost, private species: Species) {}

  private get s() { return this.h.sprite()!; }
  private get cfg() { return SPECIES_CARE[this.species]; }
  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((res) => this.h.scene.tweens.add({ ...cfg, onComplete: () => res() }));
  }
  private wait(ms: number) { return new Promise<void>((res) => this.h.scene.time.delayedCall(dur(ms), () => res())); }

  private nearFree(from: Tile, offsets: [number, number][]): Tile | null {
    for (const [dx, dy] of offsets) {
      const t = { x: from.x + dx, y: from.y + dy };
      if (this.h.free(t) && !(t.x === this.h.playerTile().x && t.y === this.h.playerTile().y)) return t;
    }
    return null;
  }

  /** Walk (or fly) to a tile along a real path, flapping/trotting the two frames as she goes. */
  private async go(to: Tile, msPerTile = this.cfg.msPerTile, fly = false) {
    const s = this.s, from = this.h.tile();
    if (from.x === to.x && from.y === to.y) return;
    const path = fly ? [from, to] : (findPath(this.h.grid(), from, to) ?? [from, to]);
    let f = 0;
    const gait = this.h.scene.time.addEvent({ delay: 110, loop: true, callback: () => { f = 1 - f; if (s.active) s.setFrame(f); } });
    for (let i = 1; i < path.length; i++) {
      const a = px(path[i - 1]), b = px(path[i]);
      s.setFlipX(b.x < a.x ? true : b.x > a.x ? false : s.flipX);
      const d = fly ? dist(path[i - 1], path[i]) : 1;
      await this.tw({ targets: s, x: b.x, y: b.y - (fly ? 10 : 0), duration: dur(msPerTile * Math.max(1, d)), onUpdate: () => s.setDepth(s.y + 1) });
      this.h.setTile(path[i]);
    }
    gait.remove(); s.setFrame(0);
    if (fly) await this.tw({ targets: s, y: px(to).y, duration: dur(160), onUpdate: () => s.setDepth(s.y + 1) });
  }

  private hearts(n = 4) {
    const s = this.s;
    for (let i = 0; i < sparkleCount(n); i++) {
      const h = this.h.scene.add.sprite(s.x + (i - n / 2) * 6, s.y - 20, 'items', ITEM.heart).setDepth(9999).setScale(0.6);
      this.h.scene.tweens.add({ targets: h, y: h.y - 22, alpha: 0, duration: dur(900), delay: i * 90, onComplete: () => h.destroy() });
    }
  }

  /** The species' own happy dance. */
  private async cheer() {
    const s = this.s, base = s.y;
    services.audio.sfx(this.cfg.happy);
    this.hearts(5);
    const calm = reducedEffects();
    if (this.species === 'dog') {                                   // tail-wag wiggle and a hop
      await this.tw({ targets: s, angle: { from: -10, to: 10 }, duration: dur(80), yoyo: true, repeat: calm ? 1 : 5 }); s.setAngle(0);
      await this.tw({ targets: s, y: base - 9, duration: dur(130), yoyo: true });
    } else if (this.species === 'cat') {                            // a contented purr: gentle swelling
      await this.tw({ targets: s, scaleX: 1.08, scaleY: 0.94, duration: dur(260), yoyo: true, repeat: calm ? 1 : 3 }); s.setScale(1);
    } else if (this.species === 'pony') {                           // two proud hops
      await this.tw({ targets: s, y: base - 12, angle: s.flipX ? 12 : -12, duration: dur(200), yoyo: true, repeat: 1, ease: 'Sine.Out' }); s.setAngle(0);
    } else {                                                        // bird: flutter up and settle
      let f = 0;
      const wing = this.h.scene.time.addEvent({ delay: 70, loop: true, callback: () => { f = 1 - f; if (s.active) s.setFrame(f); } });
      await this.tw({ targets: s, y: base - 20, duration: dur(320), yoyo: true, ease: 'Sine.Out' });
      wing.remove(); s.setFrame(0);
    }
    s.y = base;
  }

  /** Where a bowl goes: a free tile close to the pet. */
  private bowlTile(): Tile {
    const p = this.h.tile();
    return this.nearFree(p, [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 1], [-2, 1], [1, 2], [-1, 2], [3, 0], [-3, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) ?? p;
  }

  private async dropBowl(key: string, at: Tile) {
    const b = px(at);
    const bowl = this.h.scene.add.image(b.x, b.y - 80, key).setOrigin(0.5, 1).setDepth(b.y);
    await this.tw({ targets: bowl, y: b.y, duration: dur(380), ease: 'Bounce.Out' });
    services.audio.sfx('pop');
    return bowl;
  }

  /** One mouthful animation in the species' own style. */
  private async bite() {
    const s = this.s, base = s.y, dir = s.flipX ? -1 : 1;
    if (this.cfg.eat === 'peck') { await this.tw({ targets: s, y: base + 3, angle: 22 * dir, duration: dur(90), yoyo: true }); s.setAngle(0); }
    else if (this.cfg.eat === 'nuzzle') { await this.tw({ targets: s, angle: 16 * dir, y: base + 1, duration: dur(220), yoyo: true }); s.setAngle(0); }
    else { await this.tw({ targets: s, scaleY: 0.84, scaleX: 1.06, y: base + 1, duration: dur(130), yoyo: true }); s.setScale(1); }
    s.y = base;
  }

  async feed(foodKey: string): Promise<void> {
    if (!SPECIES_CARE[this.species].foods.includes(foodKey)) return;
    this.h.setBusy(true);
    try {
      const at = this.bowlTile(), b = px(at);
      const bowl = await this.dropBowl('px_bowl_food', at);
      const food = this.h.scene.add.image(b.x, b.y - 60, foodKey).setDepth(b.y + 1).setScale(0.9);
      await this.tw({ targets: food, y: b.y - 9, duration: dur(300), ease: 'Bounce.Out' });
      await this.go(at, this.cfg.msPerTile);
      this.s.setFlipX(b.x < this.s.x);
      const bites = reducedEffects() ? 2 : 5;
      for (let i = 0; i < bites; i++) {
        services.audio.sfx('pop');
        await this.bite();
        food.setScale(0.9 * (1 - (i + 1) / bites) + 0.05);
      }
      food.destroy();
      await this.cheer();
      this.log.fed++; this.log.lastAction = 'feed';
      await this.wait(500);
      await this.tw({ targets: bowl, alpha: 0, duration: dur(500) }); bowl.destroy();
    } finally { this.h.setBusy(false); }
  }

  async water(): Promise<void> {
    this.h.setBusy(true);
    try {
      const at = this.bowlTile(), b = px(at);
      const bowl = await this.dropBowl('px_bowl_water', at);
      await this.go(at, this.cfg.msPerTile);
      this.s.setFlipX(b.x < this.s.x);
      const laps = reducedEffects() ? 2 : 4;
      for (let i = 0; i < laps; i++) {
        services.audio.sfx('splash');
        this.ripple(b.x, b.y - 6);
        await this.bite();
        await this.wait(80);
      }
      await this.cheer();
      this.log.watered++; this.log.lastAction = 'water';
      await this.wait(500);
      await this.tw({ targets: bowl, alpha: 0, duration: dur(500) }); bowl.destroy();
    } finally { this.h.setBusy(false); }
  }

  private ripple(x: number, y: number) {
    for (let i = 0; i < sparkleCount(3); i++) {
      const r = this.h.scene.add.ellipse(x, y, 6, 3).setStrokeStyle(1, 0xb8ecff).setDepth(9998);
      this.h.scene.tweens.add({ targets: r, scaleX: 3, scaleY: 3, alpha: 0, duration: dur(700), delay: i * 140, onComplete: () => r.destroy() });
    }
    for (let i = 0; i < sparkleCount(4); i++) {
      const d = this.h.scene.add.circle(x + (i - 1.5) * 3, y, 1.2, 0x9fe3ff).setDepth(9998);
      this.h.scene.tweens.add({ targets: d, y: y - 8 - i * 2, alpha: 0, duration: dur(500), delay: i * 60, onComplete: () => d.destroy() });
    }
  }

  // ------------------------------------------------------------------ play
  /**
   * Interactive play. Every tap on the floor sends the toy there and the pet responds in its own way (dog fetches, cat chases, pony
   * trots circles, bird flutters). Resolves when she presses the back button or after a happy round of throws.
   */
  play(): Promise<{ throws: number }> {
    return new Promise((resolve) => {
      let busy = false, throws = 0, over = false;
      this.h.setBusy(true);
      const end = (release: boolean) => {
        if (over) return; over = true; this.h.setBusy(false);
        if (release) rel();
        resolve({ throws });
      };
      const rel = this.h.ui().holdTaps((p) => {
        if (busy || over) return;
        const wp = this.h.scene.cameras.main.getWorldPoint(p.x, p.y);
        const tile = { x: Math.floor(wp.x / T), y: Math.floor(wp.y / T) };
        const here = this.h.tile();
        if (!this.h.free(tile) || (tile.x === here.x && tile.y === here.y)) { this.sparkleNo(wp.x, wp.y); return; }
        busy = true;
        void this.throwTo(tile).then(() => { throws++; this.log.thrown++; this.log.lastAction = 'play'; busy = false; if (throws >= PLAY_ROUNDS && !over) { void this.cheer().then(() => end(true)); } });
      }, () => end(false));
    });
  }

  private sparkleNo(x: number, y: number) {
    const c = this.h.scene.add.circle(x, y, 3, 0xffffff, 0.7).setDepth(9998);
    this.h.scene.tweens.add({ targets: c, scale: 2.5, alpha: 0, duration: dur(300), onComplete: () => c.destroy() });
  }

  private async throwTo(tile: Tile) {
    const key = this.cfg.toy, from = px(this.h.playerTile()), to = px(tile);
    const toy = this.h.scene.add.image(from.x, from.y - 14, key).setDepth(9000);
    await new Promise<void>((res) => {
      const c = { t: 0 };
      this.h.scene.tweens.add({ targets: c, t: 1, duration: dur(480), onUpdate: () => { toy.x = from.x + (to.x - from.x) * c.t; toy.y = from.y - 14 + (to.y - 6 - (from.y - 14)) * c.t - Math.sin(Math.PI * c.t) * 30; toy.angle = c.t * 360; }, onComplete: () => res() });
    });
    toy.setAngle(0).setDepth(to.y); services.audio.sfx('pop');
    await this.tw({ targets: toy, y: to.y - 6 - 5, duration: dur(110), yoyo: true });
    const s = this.s;
    if (this.cfg.play === 'fetch') {
      await this.go(tile, 80);
      toy.destroy();
      const carry = this.h.scene.add.image(s.x, s.y - 14, key).setDepth(9999).setScale(0.8);
      const follow = this.h.scene.time.addEvent({ delay: 16, loop: true, callback: () => carry.setPosition(s.x + (s.flipX ? -5 : 5), s.y - 11) });
      const back = this.nearFree(this.h.playerTile(), [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) ?? this.h.tile();
      await this.go(back, 85);
      follow.remove(); carry.setPosition(s.x + (s.flipX ? -8 : 8), s.y - 3);
      await this.cheer();
      await this.tw({ targets: carry, alpha: 0, duration: dur(400) }); carry.destroy();
    } else if (this.cfg.play === 'chase') {
      await this.go(this.nearFree(tile, [[0, 0], [1, 0], [-1, 0], [0, 1]]) ?? tile, 120);
      for (let k = 0; k < 2; k++) {
        await this.tw({ targets: s, scaleY: 0.72, duration: dur(140) });             // crouch…
        await this.tw({ targets: s, scaleY: 1, y: s.y - 10, duration: dur(150), yoyo: true });   // …and pounce
        const next = this.nearFree(this.h.tile(), [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 2], [-1, -2]]) ?? this.h.tile();
        const nb = px(next);
        await this.tw({ targets: toy, x: nb.x, y: nb.y - 6, angle: 540 * (k ? -1 : 1), duration: dur(420), ease: 'Sine.Out' });
        if (k === 0) await this.go(next, 100);
      }
      toy.destroy(); s.setScale(1);
      await this.cheer();
    } else if (this.cfg.play === 'trot') {
      await this.go(tile, 110);
      const c = px(tile), ring = [[-9, 0], [0, -6], [9, 0], [0, 6]] as const;
      for (const [dx, dy] of ring) { s.setFlipX(dx < 0 || (dx === 0 && dy > 0)); await this.tw({ targets: s, x: c.x + dx, y: c.y + dy * 0.8, duration: dur(210), onUpdate: () => s.setDepth(s.y + 1) }); }
      s.setPosition(c.x, c.y);
      await this.tw({ targets: s, y: s.y - 11, angle: s.flipX ? 16 : -16, duration: dur(210), yoyo: true, repeat: 1 }); s.setAngle(0);
      toy.destroy();
      await this.cheer();
    } else {
      // bird: flutter over, circle the feather, land on it
      await this.go(tile, 70, true);
      let f = 0;
      const wing = this.h.scene.time.addEvent({ delay: 70, loop: true, callback: () => { f = 1 - f; if (s.active) s.setFrame(f); } });
      const c = px(tile), orbit = { a: 0 };
      await this.tw({ targets: orbit, a: Math.PI * 4, duration: dur(1100), onUpdate: () => { s.x = c.x + Math.cos(orbit.a) * 11; s.y = c.y - 16 + Math.sin(orbit.a) * 5; s.setFlipX(Math.sin(orbit.a) < 0); s.setDepth(s.y + 1); } });
      await this.tw({ targets: s, x: c.x, y: c.y, duration: dur(220), onUpdate: () => s.setDepth(s.y + 1) });
      wing.remove(); s.setFrame(0);
      toy.destroy();
      await this.cheer();
    }
    this.s.setScale(1).setAngle(0);
  }
}
