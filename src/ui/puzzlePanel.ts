import Phaser from 'phaser';
import type { PuzzleDef, PuzzleProgress } from '../types/game';
import { ASSIST_AFTER, answerChoice, answerSequence, displayOrder, visibleChoices } from '../systems/puzzleEngine';
import { services } from '../systems/services';
import { burst, makeButton, pic, roundedPanel, sleep, type Btn } from './touchTargets';

export interface PuzzleResult { solved: boolean; assisted: boolean; cancelled: boolean }

type GO = Phaser.GameObjects.GameObject;

/**
 * Picture-only puzzle interfaces. All rules come from puzzleEngine (unit tested); this class only draws,
 * speaks and feeds taps to the engine. No timers, no penalties; hints are spoken and animated.
 */
export class PuzzlePanel {
  private root: Phaser.GameObjects.Container;
  private objs: GO[] = [];
  private timers: Phaser.Time.TimerEvent[] = [];
  private btns: Btn[] = [];
  isOpen = false;

  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {
    this.root = scene.add.container(0, 0).setDepth(60).setVisible(false);
  }

  buttons(): Btn[] { return this.isOpen ? this.btns : []; }

  private add<T extends GO>(o: T): T { this.root.add(o); this.objs.push(o); return o; }

  private open(def: PuzzleDef, onReplay: () => void, onBack: () => void, promptY = 96) {
    this.isOpen = true;
    this.setModal(true);
    this.root.setVisible(true);
    const s = this.scene;
    this.add(s.add.rectangle(256, 192, 512, 384, 0x1a1033, 0.55).setInteractive());
    this.add(roundedPanel(s, 28, 30, 456, 322));
    const pv = this.add(pic(s, def.promptVisual, 214, promptY, def.promptVisual.startsWith('icon_') ? 2 : 4));
    s.tweens.add({ targets: pv, y: pv.y - 3, duration: 700, yoyo: true, repeat: -1 });
    const replay = makeButton(s, 304, promptY, 'icon_speaker', 1.5, onReplay);
    const back = makeButton(s, 62, 62, 'icon_back', 1, onBack);
    this.btns = [replay, back];
    this.root.add([replay.container, back.container]);
    this.objs.push(replay.container, back.container);
    return { replay, back };
  }

  private close() {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.btns = [];
    services.audio.stopVoice();
    this.root.setVisible(false);
    this.isOpen = false;
    this.setModal(false);
  }

  private hand(x: number, y: number) {
    const h = this.add(this.scene.add.image(x + 20, y + 38, 'hand').setScale(1.4).setAngle(-15));
    this.scene.tweens.add({ targets: h, y: y + 28, duration: 350, yoyo: true, repeat: 3, onComplete: () => h.destroy() });
  }

  // ------------------------------------------------------------------ one-of-N picture choice (sounds, rhymes)
  choice(def: PuzzleDef, prog: PuzzleProgress): Promise<PuzzleResult> {
    const s = this.scene;
    return new Promise<PuzzleResult>((resolve) => {
      const speakPrompt = () => void services.audio.speak(def.narrationKey);
      let selected: string | null = null;
      let locked = false;
      let idleN = 0;
      const cards = new Map<string, { c: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics }>();
      const { replay } = this.open(def, speakPrompt, () => { this.close(); resolve({ solved: false, assisted: false, cancelled: true }); });
      const tick = makeButton(s, 256, 316, 'icon_check', 1.5, () => selected && confirm());
      tick.setEnabled(false);
      this.root.add(tick.container); this.objs.push(tick.container); this.btns.push(tick);

      const order = displayOrder(def, (Date.now() >>> 4) & 0xffff);
      const n = order.length, gap = 124, x0 = 256 - ((n - 1) * gap) / 2, cy = 214;
      const draw = (bg: Phaser.GameObjects.Graphics, on: boolean) => {
        bg.clear();
        bg.fillStyle(0xffffff, 1).fillRoundedRect(-52, -52, 104, 104, 14);
        bg.lineStyle(on ? 6 : 4, on ? 0xffc800 : 0xc9b8ff, 1).strokeRoundedRect(-52, -52, 104, 104, 14);
      };
      order.forEach((id, i) => {
        const ch = def.choices.find((c) => c.id === id)!;
        const bg = s.add.graphics(); draw(bg, false);
        const img = pic(s, ch.picture, 0, 0, 4);
        const c = s.add.container(x0 + i * gap, cy, [bg, img]).setSize(112, 112).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => {
          if (locked) return;
          restartIdle();
          if (selected === id) { confirm(); return; }
          selected = id;
          cards.forEach((v, k) => draw(v.bg, k === id));
          tick.setEnabled(true); tick.pulse(true);
          s.tweens.add({ targets: img, scale: 4.5, duration: 120, yoyo: true });
          void services.audio.speak(ch.narrationKey); // each picture says its word
        });
        this.add(c);
        cards.set(id, { c, bg });
      });

      const restartIdle = () => {
        this.timers.forEach((t) => t.remove());
        this.timers = [s.time.addEvent({
          delay: 10000, loop: true, callback: () => {
            if (locked) return;
            idleN++;
            if (idleN % 2 === 1) { replay.pulse(true); s.time.delayedCall(1800, () => replay.pulse(false)); speakPrompt(); }
            else { const k = cards.get(def.correctAnswer as string)!; this.hand(k.c.x, k.c.y); }
          }
        })];
      };
      restartIdle();
      speakPrompt();

      const succeed = async (assisted: boolean) => {
        locked = true;
        const k = cards.get(def.correctAnswer as string)!;
        services.audio.sfx('chime');
        burst(s, k.c.x, k.c.y, 14, 300);
        s.tweens.add({ targets: k.c, scale: 1.12, duration: 160, yoyo: true, repeat: 1 });
        await sleep(s, 900);
        this.close();
        resolve({ solved: true, assisted, cancelled: false });
      };

      const assistedHelp = async () => {
        locked = true;
        void services.audio.speak('hint_together');
        const k = cards.get(def.correctAnswer as string)!;
        this.hand(k.c.x, k.c.y);
        await sleep(s, 1500);
        selected = def.correctAnswer as string;
        locked = false;
        cards.forEach((v, kk) => draw(v.bg, kk === selected));
        confirm();
      };

      const confirm = () => {
        if (locked || !selected) return;
        const r = answerChoice(def, prog, selected);
        if (r.kind === 'correct') { void succeed(r.assisted); return; }
        if (r.kind !== 'retry') return;
        // gentle, playful retry: wobble, spoken hint, fewer distractors; never a buzzer
        const wrong = cards.get(selected)!;
        services.audio.sfx('pop');
        s.tweens.add({ targets: wrong.c, x: wrong.c.x + 8, duration: 60, yoyo: true, repeat: 3 });
        selected = null;
        cards.forEach((v) => draw(v.bg, false));
        tick.pulse(false); tick.setEnabled(false);
        void services.audio.speak(r.hintKey);
        const keep = new Set(r.remainingChoices);
        cards.forEach((v, id) => { if (!keep.has(id)) { v.c.disableInteractive(); s.tweens.add({ targets: v.c, alpha: 0, duration: 400 }); } });
        if (prog.attempts >= ASSIST_AFTER) void assistedHelp();
      };

      // resume a half-finished ladder (e.g. the child closed the panel and came back)
      const vis = new Set(visibleChoices(def, prog));
      cards.forEach((v, id) => { if (!vis.has(id)) { v.c.setAlpha(0); v.c.disableInteractive(); } });
    });
  }

  // ------------------------------------------------------------------ fill-in-the-order (patterns, sequences)
  sequence(def: PuzzleDef, prog: PuzzleProgress, prefix: string[]): Promise<PuzzleResult> {
    const s = this.scene;
    const target = def.correctAnswer as string[];
    const reuse = def.type === 'pattern';
    return new Promise<PuzzleResult>((resolve) => {
      const speakPrompt = () => void services.audio.speak(def.narrationKey);
      const placed: string[] = [];
      const used = new Set<string>();
      let locked = false;
      let idleN = 0;
      const { replay } = this.open(def, speakPrompt, () => { this.close(); resolve({ solved: false, assisted: false, cancelled: true }); }, 84);

      const total = prefix.length + target.length, sw = 52, x0 = 256 - ((total - 1) * sw) / 2, sy = 156;
      const slotImgs: (Phaser.GameObjects.Image | undefined)[] = [];
      for (let i = 0; i < total; i++) {
        const g = s.add.graphics();
        const filled = i < prefix.length;
        g.fillStyle(filled ? 0xffffff : 0xece4ff, 1).fillRoundedRect(x0 + i * sw - 24, sy - 24, 48, 48, 8);
        g.lineStyle(3, filled ? 0xa06bff : 0xc9b8ff, 1).strokeRoundedRect(x0 + i * sw - 24, sy - 24, 48, 48, 8);
        this.add(g);
        if (filled) this.add(pic(s, prefix[i], x0 + i * sw, sy, 2));
        else for (let d = 0; d <= i - prefix.length; d++) this.add(s.add.circle(x0 + i * sw - (i - prefix.length) * 4 + d * 8, sy + 34, 2.5, 0xa06bff));
        slotImgs.push(undefined);
      }
      const slotXY = (k: number) => ({ x: x0 + (prefix.length + k) * sw, y: sy });

      const ids = def.choices.map((c) => c.id);
      const order = reuse ? ids : displayOrder(def, (Date.now() >>> 4) & 0xffff);
      const gap = 100, cx0 = 256 - ((order.length - 1) * gap) / 2, cy = 252;
      const cards = new Map<string, Phaser.GameObjects.Container>();
      order.forEach((id, i) => {
        const ch = def.choices.find((c) => c.id === id)!;
        const bg = s.add.graphics();
        bg.fillStyle(0xffffff, 1).fillRoundedRect(-40, -40, 80, 80, 12).lineStyle(4, 0xc9b8ff, 1).strokeRoundedRect(-40, -40, 80, 80, 12);
        const img = pic(s, ch.picture, 0, 0, 3);
        const c = s.add.container(cx0 + i * gap, cy, [bg, img]).setSize(92, 92).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => { if (!locked && !(!reuse && used.has(id))) place(id, c); });
        this.add(c);
        cards.set(id, c);
      });
      const undo = (k: number) => {
        if (locked || k !== placed.length - 1) return;
        const gone = placed.pop()!; slotImgs[prefix.length + k]?.destroy(); slotImgs[prefix.length + k] = undefined;
        used.delete(gone); cards.get(gone)?.setAlpha(1);
      };
      // tapping a filled blank slot takes that tile back
      for (let k = 0; k < target.length; k++) {
        const p = slotXY(k);
        const z = s.add.zone(p.x, p.y, 52, 52).setInteractive();
        z.on('pointerdown', () => undo(k));
        this.add(z);
      }

      const put = (id: string) => {
        const k = placed.length;
        placed.push(id);
        const p = slotXY(k);
        const ch = def.choices.find((c) => c.id === id)!;
        const img = this.add(pic(s, ch.picture, p.x, p.y, 2).setScale(0.2));
        slotImgs[prefix.length + k] = img;
        s.tweens.add({ targets: img, scale: 2, duration: 160, ease: 'Back.Out' });
        if (!reuse) { used.add(id); cards.get(id)?.setAlpha(0.35); }
        void services.audio.speak(ch.narrationKey);
      };

      const evaluate = async () => {
        locked = true;
        await sleep(s, 450);
        const r = answerSequence(def, prog, placed);
        if (r.kind === 'correct') {
          services.audio.sfx('chime');
          for (let k = 0; k < target.length; k++) burst(s, slotXY(k).x, slotXY(k).y, 8, 300);
          await sleep(s, 900);
          this.close();
          resolve({ solved: true, assisted: r.assisted, cancelled: false });
          return;
        }
        if (r.kind !== 'retry') { locked = false; return; }
        services.audio.sfx('pop');
        slotImgs.forEach((im) => im && s.tweens.add({ targets: im, x: im.x + 6, duration: 60, yoyo: true, repeat: 3 }));
        void services.audio.speak(r.hintKey);
        await sleep(s, 1100);
        while (placed.length) { locked = false; undo(placed.length - 1); }
        if (prog.attempts >= ASSIST_AFTER) { await togetherDemo(); return; }
        locked = false;
      };

      const togetherDemo = async () => {
        locked = true;
        void services.audio.speak('hint_together');
        await sleep(s, 1400);
        for (const id of target) { const c = cards.get(id)!; this.hand(c.x, c.y); await sleep(s, 650); put(id); await sleep(s, 350); }
        await evaluate();
      };

      const place = (id: string, c: Phaser.GameObjects.Container) => {
        restartIdle();
        s.tweens.add({ targets: c, scale: 1.12, duration: 90, yoyo: true });
        put(id);
        if (placed.length === target.length) void evaluate();
      };

      const restartIdle = () => {
        this.timers.forEach((t) => t.remove());
        this.timers = [s.time.addEvent({
          delay: 10000, loop: true, callback: () => {
            if (locked) return;
            idleN++;
            if (idleN % 2 === 1) { replay.pulse(true); s.time.delayedCall(1800, () => replay.pulse(false)); speakPrompt(); }
            else { const next = target[placed.length]; const c = next && cards.get(next); if (c) this.hand(c.x, c.y); }
          }
        })];
      };
      restartIdle();
      speakPrompt();
    });
  }
}
