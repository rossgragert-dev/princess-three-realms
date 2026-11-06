import Phaser from 'phaser';
import type { Form } from '../types/game';
import type { Tile } from '../world/types';
import { FORM_SPEED } from './transformations';
import { lookKey } from '../art/looks';
import type { NavGrid } from '../world/navigation';
import { steerMove, footFree, tileOfFoot } from '../world/steer';
import { facingFor, stickVelocity, type Stick } from '../input/joystick';

export type Dir = 'down' | 'up' | 'left' | 'right';

const ORIGIN_Y: Record<Form, number> = { princess: 0.95, unicorn: 0.93, mermaid: 0.78 };
const CAST: Record<Form, string> = { princess: 'cast', unicorn: 'bloom', mermaid: 'bubble' };

export const tilePos = (t: Tile, form: Form = 'princess') => ({ x: t.x * 16 + 8, y: form === 'mermaid' ? t.y * 16 + 16 : (t.y + 1) * 16 - 2 });

/** The heroine in any of her three forms. Movement is tile-to-tile along a precomputed path. */
export class Player {
  sprite: Phaser.GameObjects.Sprite;
  dir: Dir = 'down';
  tile: Tile;
  moving = false;
  private path: Tile[] = [];
  private idx = 0;
  private onStep?: (t: Tile) => void;
  private onDone?: () => void;
  private gallop = false;
  private lastKey = '';
  /** True while the joystick is driving (continuous movement, no tile path). */
  steering = false;

  constructor(private scene: Phaser.Scene, public form: Form, tile: Tile) {
    this.tile = { ...tile };
    const p = tilePos(tile, form);
    this.sprite = scene.add.sprite(p.x, p.y, lookKey(form), 0).setOrigin(0.5, ORIGIN_Y[form]);
    this.idle();
  }

  setForm(form: Form) {
    this.form = form;
    this.lastKey = '';
    this.sprite.setTexture(lookKey(form)).setOrigin(0.5, ORIGIN_Y[form]);
    const p = tilePos(this.tile, form);
    this.sprite.setPosition(p.x, p.y);
    this.idle();
  }

  teleport(t: Tile) {
    this.stop();
    this.tile = { ...t };
    const p = tilePos(t, this.form);
    this.sprite.setPosition(p.x, p.y);
    this.sprite.setDepth(this.sprite.y);
  }

  /** path[0] is the current tile. */
  walk(path: Tile[], onStep?: (t: Tile) => void, onDone?: () => void) {
    this.path = path;
    this.idx = 1;
    this.onStep = onStep;
    this.onDone = onDone;
    this.gallop = this.form === 'unicorn' && path.length > 10;
    this.moving = path.length > 1;
    if (!this.moving) { this.idle(); onDone?.(); }
  }

  get isGalloping() { return this.gallop; }

  /** Sprite y minus feet y: the collision point is the princess's feet, not her sprite anchor. */
  private get footLift() { return this.form === 'mermaid' ? 8 : 6; }
  get foot() { return { x: this.sprite.x, y: this.sprite.y - this.footLift }; }

  /**
   * Joystick movement for one frame. Slides along walls using the tile grid as the authority, normalised so diagonals are not
   * faster, and reports each new tile entered so warps and story steps fire exactly once per tile.
   */
  steer(stick: Stick, dtMs: number, grid: NavGrid, onStep?: (t: Tile) => void) {
    if (stick.mag <= 0) { this.endSteer(); return; }
    if (this.path.length) { this.path = []; this.onStep = undefined; this.onDone = undefined; } // a tapped route is cancelled: no stale callbacks
    this.steering = true; this.moving = true;
    let f = this.foot;
    if (!footFree(grid, f.x, f.y)) { // never stay wedged in something that appeared under her feet
      const c = tilePos(this.tile, this.form);
      this.sprite.setPosition(c.x, c.y); f = this.foot;
    }
    const speed = FORM_SPEED[this.form];
    const { vx, vy } = stickVelocity(stick, speed);
    const dt = Math.min(dtMs, 50) / 1000;
    const r = steerMove(grid, f.x, f.y, vx * dt, vy * dt);
    this.sprite.setPosition(r.x, r.y + this.footLift);
    const nd = facingFor(stick, this.dir);
    this.gallop = this.form === 'unicorn' && stick.mag > 0.7;
    const blockedAll = (r.blockedX && Math.abs(vx) > 0.01 && Math.abs(vy) < 0.01) || (r.blockedY && Math.abs(vy) > 0.01 && Math.abs(vx) < 0.01);
    this.dir = nd;
    if (blockedAll) this.idle(); else this.moveAnim();
    const nt = tileOfFoot(r.x, r.y);
    if (nt.x !== this.tile.x || nt.y !== this.tile.y) { this.tile = nt; onStep?.(nt); }
  }

  /** Called when the thumb lifts: stand still facing where she was walking. */
  endSteer() {
    if (!this.steering) return;
    this.steering = false; this.moving = false; this.gallop = false;
    this.idle();
  }

  stop() {
    this.steering = false;
    this.path = [];
    this.moving = false;
    this.onStep = undefined;
    this.onDone = undefined;
    this.idle();
  }

  face(tx: number, ty: number) {
    const dx = tx - this.tile.x, dy = ty - this.tile.y;
    if (dx === 0 && dy === 0) return;
    this.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    this.idle();
  }

  private play(key: string) {
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.sprite.play(key, true);
  }

  idle() { this.play(`${this.form}_idle_${this.dir}`); }

  private moveAnim() {
    const a = this.form === 'mermaid' ? 'swim' : this.gallop ? 'gallop' : 'walk';
    this.play(`${this.form}_${a}_${this.dir}`);
  }

  /** Plays the form's magic gesture (wand / rainbow bloom / bubble) and resolves when finished. */
  cast(): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const end = () => { if (done) return; done = true; if (!this.moving && !this.steering) { this.lastKey = ''; this.idle(); } resolve(); };
      this.lastKey = '';
      this.sprite.play(`${this.form}_${CAST[this.form]}_${this.dir}`);
      this.sprite.once('animationcomplete', end);
      this.scene.time.delayedCall(900, end);
    });
  }

  update(dtMs: number) {
    this.sprite.setDepth(this.sprite.y);
    if (!this.moving || this.steering || !this.path.length) return;
    const target = this.path[this.idx];
    const tp = tilePos(target, this.form);
    const dx = tp.x - this.sprite.x, dy = tp.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const speed = FORM_SPEED[this.form] * (this.gallop ? 1.35 : 1);
    const step = (speed * dtMs) / 1000;
    const nd: Dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (nd !== this.dir || this.lastKey.includes('_idle_')) {
      this.dir = nd;
      this.moveAnim();
    }
    if (dist <= step) {
      this.sprite.setPosition(tp.x, tp.y);
      this.tile = { ...target };
      const cb = this.onStep;
      this.idx++;
      if (this.idx >= this.path.length) {
        const done = this.onDone;
        this.moving = false; this.path = []; this.onStep = undefined; this.onDone = undefined;
        this.idle();
        cb?.(this.tile);
        done?.();
      } else {
        cb?.(this.tile);
      }
    } else {
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
    }
  }
}
