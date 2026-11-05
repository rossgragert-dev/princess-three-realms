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
import { DecorPicker, DecorReveal } from '../ui/decorUi';
import { slotById, unplacedCount } from '../content/decorCatalog';
import { UI, type UiName } from '../content/frameIndex';

export interface UIHandlers {
  form?: (f: Form) => void;
  home?: () => void;
  hint?: () => void;
  book?: () => void;
  settings?: () => void;
  dpad?: (dx: number, dy: number) => void;
  /** The big A button: talk / open / plant / collect, or walk to the highlighted friend first. */
  action?: () => void;
  /** The magic button: the form's spell (wand sparkles / rainbow bloom / bubbles). */
  magic?: () => void;
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
  private picker!: DecorPicker;
  private reveal!: DecorReveal;
  private homeBtn!: Btn;
  private hud: Btn[] = [];
  private wandBtn!: Btn;
  private formBtns = new Map<Form, Btn>();
  private trayOpen = false;
  private hintBtn!: Btn;
  private objBubble!: Phaser.GameObjects.Container;
  private starsTxt!: Phaser.GameObjects.Text;
  private countTray!: Phaser.GameObjects.Container;
  private seenForms = 1;
  private held: { dx: number; dy: number } | null = null;
  private heldId = -1;
  private padArrows = new Map<string, Phaser.GameObjects.Image>();
  private aBtn!: Btn;
  private magicBtn!: Btn;
  private gearBtn!: Btn;
  /** Where the permanent d-pad sits (logical px). Exposed for the browser test drivers. */
  readonly pad = { x: 62, y: 322, r: 66 };

  constructor() { super('UI'); }

  get modal() { return this.modalDepth > 0; }
  get panel(): 'dialogue' | 'puzzle' | 'decor' | 'reveal' | null { return this.dialogue?.isOpen ? 'dialogue' : this.puzzle?.isOpen ? 'puzzle' : this.picker?.isOpen ? 'decor' : this.reveal?.isOpen ? 'reveal' : null; }

  create() {
    const setModal = (on: boolean) => {
      this.modalDepth = Math.max(0, this.modalDepth + (on ? 1 : -1));
      if (on) this.releasePad();
      this.hud.forEach((b) => b.container.setAlpha(this.modal ? 0.45 : 1));
    };
    this.dialogue = new DialoguePanel(this, setModal);
    this.puzzle = new PuzzlePanel(this, setModal);
    this.picker = new DecorPicker(this, setModal);
    this.reveal = new DecorReveal(this, setModal);

    const tap = (fn?: () => void) => () => { if (!this.modal) fn?.(); };

    // ---- top strip (slim): Home + Book left, star count centre, goal hint right, quiet grown-up gear below
    const home = makeButton(this, 36, 30, 'icon_home', 1, tap(() => this.handlers.home?.()));
    const book = makeButton(this, 96, 30, 'icon_book', 1, tap(() => this.handlers.book?.()));
    this.homeBtn = home;
    this.hintBtn = makeButton(this, 476, 30, 'icon_hint', 1, tap(() => this.handlers.hint?.()));
    this.objBubble = this.add.container(416, 30);
    this.add.image(222, 26, 'crown_hud').setScale(1);
    this.starsTxt = this.add.text(244, 16, '', { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '20px', color: '#fff2a8', stroke: '#40255a', strokeThickness: 4 });
    // ---- bottom centre: the wand opens a small tray of forms (never overlaps the pad or the two big buttons)
    this.wandBtn = makeButton(this, 256, 352, 'icon_wand', 1.1, tap(() => this.toggleTray()));
    for (const f of ['princess', 'unicorn', 'mermaid'] as Form[]) {
      const b = makeButton(this, 256, 296, FORM_ICON[f], 1.1, tap(() => { this.toggleTray(false); this.handlers.form?.(f); }));
      b.setVisible(false);
      this.formBtns.set(f, b);
    }
    this.gearBtn = makeButton(this, 176, 362, 'icon_parent', 0.7, tap(() => this.handlers.settings?.()));
    this.gearBtn.container.setAlpha(0.5);

    // ---- bottom left: the permanent four-way pad. Press and hold; slide the thumb to change direction.
    const { x: px, y: py, r } = this.pad;
    const base = this.add.graphics().setDepth(5);
    base.fillStyle(0x40255a, 0.28).fillCircle(px, py, r);
    base.lineStyle(3, 0xffffff, 0.35).strokeCircle(px, py, r);
    const arrows: [UiName, number, number, string][] = [['icon_up', 0, -1, 'up'], ['icon_down', 0, 1, 'down'], ['icon_left', -1, 0, 'left'], ['icon_right', 1, 0, 'right']];
    for (const [icon, dx, dy, name] of arrows) {
      const im = this.add.image(px + dx * 40, py + dy * 40, 'ui', UI[icon]).setScale(1.25).setAlpha(0.92).setDepth(6);
      this.padArrows.set(name, im);
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!this.modal && this.inPad(p.x, p.y) && this.heldId < 0) { this.heldId = p.id; this.setHeld(p); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.id === this.heldId) this.setHeld(p); });
    const up = (p: Phaser.Input.Pointer) => { if (p.id === this.heldId) this.releasePad(); };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
    this.input.on('gameout', () => this.releasePad());
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.releasePad());
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.releasePad());

    // ---- bottom right: two clearly different big buttons, well apart
    this.aBtn = makeButton(this, 458, 318, 'icon_a', 2.0, tap(() => this.handlers.action?.()));
    this.magicBtn = makeButton(this, 386, 344, 'icon_magic', 1.7, tap(() => this.handlers.magic?.()));
    this.aBtn.container.setDepth(6); this.magicBtn.container.setDepth(6);

    this.countTray = this.add.container(256, 70).setVisible(false);
    this.hud = [book, home, this.hintBtn, this.wandBtn, this.gearBtn, this.aBtn, this.magicBtn];
    this.refresh();
  }

  // ------------------------------------------------------------------ HUD state
  update() {
    // While a direction is held, ask the world for the next tile every frame (it ignores the call mid-step), so walking is smooth.
    if (this.held && !this.modal) this.handlers.dpad?.(this.held.dx, this.held.dy);
  }

  private inPad(x: number, y: number) { return Math.hypot(x - this.pad.x, y - this.pad.y) <= this.pad.r + 6; }

  private setHeld(p: Phaser.Input.Pointer) {
    const dx = p.x - this.pad.x, dy = p.y - this.pad.y;
    let dir: { dx: number; dy: number } | null = null, name = '';
    if (Math.hypot(dx, dy) >= 10) {
      if (Math.abs(dx) >= Math.abs(dy)) { dir = { dx: Math.sign(dx), dy: 0 }; name = dx > 0 ? 'right' : 'left'; }
      else { dir = { dx: 0, dy: Math.sign(dy) }; name = dy > 0 ? 'down' : 'up'; }
    }
    this.held = dir;
    this.padArrows.forEach((im, k) => im.setScale(k === name ? 1.5 : 1.25).setAlpha(k === name ? 1 : 0.92));
  }

  private releasePad() {
    this.held = null; this.heldId = -1;
    this.padArrows.forEach((im) => im.setScale(1.25).setAlpha(0.92));
  }

  /** WorldScene tells the A button whether something is in reach (glow) or merely highlighted (walk there first). */
  setAction(state: 'none' | 'near' | 'far') {
    this.aBtn?.pulse(state === 'near');
    this.aBtn?.container.setAlpha(this.modal ? 0.45 : state === 'none' ? 0.7 : 1);
  }

  /** Button centres for the browser test drivers. */
  get buttonPos() { return { pad: { ...this.pad }, a: { x: this.aBtn.container.x, y: this.aBtn.container.y }, magic: { x: this.magicBtn.container.x, y: this.magicBtn.container.y }, wand: { x: this.wandBtn.container.x, y: this.wandBtn.container.y }, home: { x: this.homeBtn.container.x, y: this.homeBtn.container.y }, book: { x: 96, y: 30 }, hint: { x: this.hintBtn.container.x, y: this.hintBtn.container.y } }; }

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
    // something new to place? the Home button glows until the child has put it in the room (not while already there)
    this.homeBtn.pulse(unplacedCount(st.unlockedDecor, st.bedroom) > 0 && st.scene !== 'bedroom');
    this.objBubble.removeAll(true);
    const step = chapterComplete(st) ? null : nextObjective(st);
    if (step) {
      this.objBubble.add(roundedPanel(this, -26, -22, 52, 44, 0xfff6e4, 0xffc800, 10));
      this.objBubble.add(pic(this, step.hintIcon, 0, 0, 1.1));
    }
    this.objBubble.setVisible(!!step);
  }

  get dialogueText() { return this.dialogue.current; }
  get pickerCards() { return this.picker.cards; }
  get puzzleCards() { return this.puzzle.cardPos; }

  pulseHint(on: boolean) { this.hintBtn.pulse(on); }

  private toggleTray(open = !this.trayOpen) {
    this.trayOpen = open;
    const forms: Form[] = ['princess', 'unicorn', 'mermaid'];
    const avail = availableForms(services.save.state.flags);
    const shown = forms.filter((f) => avail.includes(f));
    shown.forEach((f, i) => {
      const b = this.formBtns.get(f)!;
      b.setVisible(open);
      if (open) {
        b.container.setPosition(256 + (i - (shown.length - 1) / 2) * 66, 296);
        this.tweens.add({ targets: b.container, y: { from: 330, to: 296 }, duration: dur(160) });
      }
    });
    forms.filter((f) => !shown.includes(f)).forEach((f) => this.formBtns.get(f)!.setVisible(false));
  }

  // ------------------------------------------------------------------ pointer arbitration
  /** WorldScene calls this first on every pointerdown; true means the UI owns the tap. */
  blocksPointer(x: number, y: number): boolean {
    if (this.modal) return true;
    if (this.hud.some((b) => b.container.visible && b.hit(x, y))) return true;
    if (this.heldId >= 0 || this.inPad(x, y)) return true;
    for (const b of this.formBtns.values()) if (b.container.visible && b.hit(x, y)) return true;
    return false;
  }

  // ------------------------------------------------------------------ modals
  say(lines: readonly Line[]) { return this.dialogue.say(lines); }

  async choicePuzzle(def: PuzzleDef, speakOnOpen = true): Promise<PuzzleResult> {
    const st = services.save.state;
    const prog = (st.puzzles[def.id] ??= newProgress());
    const r = await this.puzzle.choice(def, prog, speakOnOpen);
    services.save.save();
    return r;
  }

  async sequencePuzzle(def: PuzzleDef, prefix: string[] = [], speakOnOpen = true): Promise<PuzzleResult> {
    const st = services.save.state;
    const prog = (st.puzzles[def.id] ??= newProgress());
    const r = await this.puzzle.sequence(def, prog, prefix, speakOnOpen);
    services.save.save();
    return r;
  }

  // ------------------------------------------------------------------ bedroom decorating
  /** Open the picker for one hotspot. Resolves with item id / null (empty it) / undefined (closed). */
  pickDecor(slotId: string, current: string | undefined) {
    const slot = slotById(slotId);
    return slot ? this.picker.pick(slot, services.save.state.unlockedDecor, current) : Promise.resolve(undefined);
  }

  /** The "new thing earned!" moment. */
  revealDecor(id: string) { return this.reveal.show(id); }

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
