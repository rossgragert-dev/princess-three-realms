import Phaser from 'phaser';
import type { Form, PuzzleDef } from '../types/game';
import { newProgress } from '../systems/puzzleEngine';
import { chapterComplete, nextObjective } from '../systems/questEngine';
import { availableForms } from '../actors/transformations';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { burst, makeButton, pic, roundedPanel, type Btn } from '../ui/touchTargets';
import { DialoguePanel } from '../ui/dialoguePanel';
import { PuzzlePanel, type PuzzleResult } from '../ui/puzzlePanel';
import type { Line } from '../content/dialogue';
import type { UiName } from '../content/frameIndex';

export interface UIHandlers {
  form?: (f: Form) => void;
  home?: () => void;
  hint?: () => void;
  book?: () => void;
  settings?: () => void;
}

const FORM_ICON: Record<Form, UiName> = { princess: 'icon_princess', unicorn: 'icon_unicorn', mermaid: 'icon_mermaid' };

/**
 * HUD + modal host. Runs in parallel above WorldScene. WorldScene talks to it through the public API below
 * (say / choicePuzzle / sequencePuzzle / showCount / celebrate / blocksPointer / refresh).
 * Everything is picture-based; there is no text a non-reader needs.
 */
export class UIScene extends Phaser.Scene {
  handlers: UIHandlers = {};
  private modalDepth = 0;
  private dialogue!: DialoguePanel;
  private puzzle!: PuzzlePanel;
  private hud: Btn[] = [];
  private wandBtn!: Btn;
  private formBtns = new Map<Form, Btn>();
  private trayOpen = false;
  private hintBtn!: Btn;
  private objBubble!: Phaser.GameObjects.Container;
  private starsTxt!: Phaser.GameObjects.Text;
  private countTray!: Phaser.GameObjects.Container;
  private seenForms = 1;

  constructor() { super('UI'); }

  get modal() { return this.modalDepth > 0; }

  create() {
    const setModal = (on: boolean) => {
      this.modalDepth = Math.max(0, this.modalDepth + (on ? 1 : -1));
      this.hud.forEach((b) => b.container.setAlpha(this.modal ? 0.45 : 1));
    };
    this.dialogue = new DialoguePanel(this, setModal);
    this.puzzle = new PuzzlePanel(this, setModal);

    const tap = (fn?: () => void) => () => { if (!this.modal) fn?.(); };

    // top-left: sticker book, home
    const book = makeButton(this, 36, 36, 'icon_book', 1.1, tap(() => this.handlers.book?.()));
    const home = makeButton(this, 100, 36, 'icon_home', 1.1, tap(() => this.handlers.home?.()));
    // top-right: hint (replays the next-goal narration) with the goal picture beside it
    this.hintBtn = makeButton(this, 476, 36, 'icon_hint', 1.1, tap(() => this.handlers.hint?.()));
    this.objBubble = this.add.container(412, 36);
    // star counter, centre top
    const crown = this.add.image(214, 30, 'crown_hud').setScale(1);
    this.starsTxt = this.add.text(236, 20, '', { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '20px', color: '#fff2a8', stroke: '#40255a', strokeThickness: 4 });
    // bottom-left: wand opens the form tray
    this.wandBtn = makeButton(this, 36, 348, 'icon_wand', 1.25, tap(() => this.toggleTray()));
    for (const f of ['princess', 'unicorn', 'mermaid'] as Form[]) {
      const b = makeButton(this, 36, 348, FORM_ICON[f], 1.1, tap(() => { this.toggleTray(false); this.handlers.form?.(f); }));
      b.setVisible(false);
      this.formBtns.set(f, b);
    }
    // parent gear: small and out of the way, needs an adult gate in the settings scene
    const gear = makeButton(this, 476, 348, 'icon_parent', 0.7, tap(() => this.handlers.settings?.()));
    gear.container.setAlpha(0.5);

    this.countTray = this.add.container(256, 70).setVisible(false);
    this.hud = [book, home, this.hintBtn, this.wandBtn, gear];
    void crown;
    this.refresh();
  }

  // ------------------------------------------------------------------ HUD state
  refresh() {
    const st = services.save.state;
    this.starsTxt.setText(st.stars > 0 ? `x${st.stars}` : '');
    const forms = availableForms(st.flags);
    this.wandBtn.setVisible(forms.length > 1);
    if (forms.length > this.seenForms) { this.wandBtn.pulse(true); this.time.delayedCall(4000, () => this.wandBtn.pulse(false)); }
    this.seenForms = forms.length;
    this.formBtns.forEach((b, f) => {
      b.setEnabled(forms.includes(f));
      b.container.setAlpha(f === st.form ? 1 : 0.85);
    });
    this.objBubble.removeAll(true);
    const step = chapterComplete(st) ? null : nextObjective(st);
    if (step) {
      this.objBubble.add(roundedPanel(this, -26, -22, 52, 44, 0xfff6e4, 0xffc800, 10));
      this.objBubble.add(pic(this, step.hintIcon, 0, 0, 1.1));
    }
    this.objBubble.setVisible(!!step);
  }

  pulseHint(on: boolean) { this.hintBtn.pulse(on); }

  private toggleTray(open = !this.trayOpen) {
    this.trayOpen = open;
    const forms: Form[] = ['princess', 'unicorn', 'mermaid'];
    const avail = availableForms(services.save.state.flags);
    let i = 0;
    for (const f of forms) {
      const b = this.formBtns.get(f)!;
      const show = open && avail.includes(f);
      b.setVisible(show);
      if (show) {
        const x = 36 + 64 * (++i);
        b.container.setPosition(x - 64 + 64, 348);
        b.container.x = x;
        this.tweens.add({ targets: b.container, y: { from: 380, to: 348 }, duration: dur(160) });
      }
    }
  }

  // ------------------------------------------------------------------ pointer arbitration
  /** WorldScene calls this first on every pointerdown; true means the UI owns the tap. */
  blocksPointer(x: number, y: number): boolean {
    if (this.modal) return true;
    if (this.hud.some((b) => b.container.visible && b.hit(x, y))) return true;
    for (const b of this.formBtns.values()) if (b.container.visible && b.hit(x, y)) return true;
    return false;
  }

  // ------------------------------------------------------------------ modals
  say(lines: readonly Line[]) { return this.dialogue.say(lines); }

  async choicePuzzle(def: PuzzleDef): Promise<PuzzleResult> {
    const st = services.save.state;
    const prog = (st.puzzles[def.id] ??= newProgress());
    const r = await this.puzzle.choice(def, prog);
    services.save.save();
    return r;
  }

  async sequencePuzzle(def: PuzzleDef, prefix: string[] = []): Promise<PuzzleResult> {
    const st = services.save.state;
    const prog = (st.puzzles[def.id] ??= newProgress());
    const r = await this.puzzle.sequence(def, prog, prefix);
    services.save.save();
    return r;
  }

  // ------------------------------------------------------------------ counting tray (carrots, starfish)
  showCount(done: number, total: number) {
    this.countTray.removeAll(true);
    if (total <= 0) { this.countTray.setVisible(false); return; }
    const gap = 30, x0 = -((total - 1) * gap) / 2;
    this.countTray.add(roundedPanel(this, x0 - 24, -20, (total - 1) * gap + 48, 40, 0xfff6e4, 0xa06bff, 12));
    for (let i = 0; i < total; i++) {
      const filled = i < done;
      const dot = this.add.circle(x0 + i * gap, 0, 9, filled ? 0xffc800 : 0xece4ff).setStrokeStyle(3, filled ? 0xff9a00 : 0xc9b8ff);
      this.countTray.add(dot);
      if (filled && i === done - 1) this.tweens.add({ targets: dot, scale: 1.5, duration: dur(150), yoyo: true });
    }
    this.countTray.setVisible(true);
  }

  hideCount() { this.countTray.removeAll(true); this.countTray.setVisible(false); }

  // ------------------------------------------------------------------ reward moment
  celebrate(picture: string, scale = 4) {
    services.audio.sfx('sparkle');
    const p = pic(this, picture, 256, 200, scale).setDepth(70).setScale(0.1);
    burst(this, 256, 200, 20, 69);
    this.tweens.add({
      targets: p, scale, duration: dur(450), ease: 'Back.Out',
      onComplete: () => this.tweens.add({ targets: p, alpha: 0, y: 150, delay: dur(900), duration: dur(500), onComplete: () => p.destroy() })
    });
    this.refresh();
  }
}
