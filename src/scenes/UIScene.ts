import { stickFromOffset, knobOffset, NEUTRAL, type Stick } from '../input/joystick';
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
import { DecorReveal } from '../ui/decorUi';
import { unplacedEarned } from '../content/furniture';
import { UI, type UiName } from '../content/frameIndex';
import { gameSize } from '../ui/stage';
import { runBake, runPaint, type BakeSpec } from '../ui/creativePanels';
import type { Topping } from '../world/foodDesign';
import type { ArtStroke } from '../ui/paintStrokes';

export interface UIHandlers {
  form?: (f: Form) => void;
  home?: () => void;
  hint?: () => void;
  book?: () => void;
  /** The furniture button (bedroom only). */
  decorate?: () => void;
  settings?: () => void;
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
  private reveal!: DecorReveal;
  private homeBtn!: Btn;
  private decorBtn!: Btn;
  private hud: Btn[] = [];
  private wandBtn!: Btn;
  private formBtns = new Map<Form, Btn>();
  private trayOpen = false;
  private hintBtn!: Btn;
  private objBubble!: Phaser.GameObjects.Container;
  private starsTxt!: Phaser.GameObjects.Text;
  private crown!: Phaser.GameObjects.Image;
  private countTray!: Phaser.GameObjects.Container;
  private seenForms = 1;
  private heldId = -1;
  private chrome: { setVisible(v: boolean): unknown }[] = [];
  private knob!: Phaser.GameObjects.Image;
  private knobGlow!: Phaser.GameObjects.Graphics;
  /** Current steering vector (neutral when no finger is on the base). WorldScene reads this every frame. */
  stick: Stick = NEUTRAL;
  /** Test-only override so drivers can set an exact vector without a finger. */
  debugStick: Stick | null = null;
  private aBtn!: Btn;
  private magicBtn!: Btn;
  private gearBtn!: Btn;
  /** Where the permanent d-pad sits (logical px). Exposed for the browser test drivers. */
  readonly pad = { x: 64, y: 316, r: 58 };
  /** Layout shifts for the current screen: extra width (bx), extra height (by), and the centred-stage offsets (ox, oy). */
  L = { bx: 0, by: 0, ox: 0, oy: 0 };
  private padBase!: Phaser.GameObjects.Graphics;

  constructor() { super('UI'); }

  get modal() { return this.modalDepth > 0; }
  /** Test hook: the puzzle on screen and where its picture cards are. */
  get puzzleInfo() { return { def: this.puzzle?.defNow ?? null, cards: this.puzzle?.cardPos ?? [] }; }
  get panel(): 'dialogue' | 'puzzle' | 'reveal' | null { return this.dialogue?.isOpen ? 'dialogue' : this.puzzle?.isOpen ? 'puzzle' : this.reveal?.isOpen ? 'reveal' : null; }

  create() {
    const setModal = (on: boolean) => {
      this.modalDepth = Math.max(0, this.modalDepth + (on ? 1 : -1));
      if (on) this.releasePad();
      this.hud.forEach((b) => b.container.setAlpha(this.modal ? 0.45 : 1));
    };
    this.dialogue = new DialoguePanel(this, setModal);
    this.puzzle = new PuzzlePanel(this, setModal);
    this.reveal = new DecorReveal(this, setModal);

    const tap = (fn?: () => void) => () => { if (!this.modal) fn?.(); };

    // ---- top strip (slim): Home + Book left, star count centre, goal hint right, quiet grown-up gear below
    const home = makeButton(this, 36, 30, 'icon_home', 1, tap(() => this.handlers.home?.()));
    const book = makeButton(this, 96, 30, 'icon_book', 1, tap(() => this.handlers.book?.()));
    this.homeBtn = home;
    this.decorBtn = makeButton(this, 156, 30, 'icon_decorate', 1, tap(() => this.handlers.decorate?.()));
    this.hintBtn = makeButton(this, 476, 30, 'icon_hint', 1, tap(() => this.handlers.hint?.()));
    this.objBubble = this.add.container(416, 30);
    const crownImg = this.add.image(222, 26, 'crown_hud').setScale(1).setInteractive({ useHandCursor: true });
    // The crown used to look tappable without doing anything. It now opens the Royal Stickerbook.
    crownImg.on('pointerdown', tap(() => this.handlers.book?.()));
    this.crown = crownImg;
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

    // ---- bottom left: the analog joystick. Touch the base and drag; the knob follows the thumb and springs back on release.
    const { x: px, y: py, r } = this.pad;
    const base = this.add.graphics().setDepth(5);
    this.padBase = base;
    base.fillStyle(0x40255a, 0.32).fillCircle(px, py, r);
    base.fillStyle(0xffffff, 0.08).fillCircle(px, py, r * 0.62);
    base.lineStyle(3, 0xffffff, 0.4).strokeCircle(px, py, r);
    base.lineStyle(2, 0xffffff, 0.18).strokeCircle(px, py, r * 0.62);
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; base.fillStyle(0xffffff, 0.45).fillCircle(px + Math.cos(a) * (r - 7), py + Math.sin(a) * (r - 7), 2); }
    this.knobGlow = this.add.graphics().setDepth(5.5);
    this.knob = this.add.image(px, py, 'ui', UI.icon_knob).setScale(1.55).setAlpha(0.88).setDepth(6);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!this.modal && this.heldId < 0 && this.inPad(p.x, p.y)) { this.heldId = p.id; this.moveStick(p); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (p.id === this.heldId) this.moveStick(p); });
    const up = (p: Phaser.Input.Pointer) => { if (p.id === this.heldId) this.releasePad(); };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
    this.input.on('pointercancel', up);
    this.input.on('gameout', () => this.releasePad());
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.releasePad());
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.releasePad());

    // ---- bottom right: two clearly different big buttons, well apart
    this.aBtn = makeButton(this, 458, 318, 'icon_a', 2.0, tap(() => this.handlers.action?.()));
    this.magicBtn = makeButton(this, 386, 344, 'icon_magic', 1.7, tap(() => this.handlers.magic?.()));
    this.aBtn.container.setDepth(6); this.magicBtn.container.setDepth(6);

    this.countTray = this.add.container(256, 70).setVisible(false);
    this.chrome = [base, this.knob, this.knobGlow, this.objBubble, crownImg, this.starsTxt];
    this.hud = [book, home, this.decorBtn, this.hintBtn, this.wandBtn, this.gearBtn, this.aBtn, this.magicBtn];
    this.refresh();
    // v0.4b.2: anchor everything to the real screen edges, now and whenever the screen changes (rotation, resize)
    this.layoutHud();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutHud, this));
  }

  /**
   * Places every control relative to the visible screen. The authored 512x384 numbers are kept as the reference:
   * things authored on the left/top stay put, things authored on the right/bottom move with the real right/bottom edge,
   * and centred things follow the middle. No gameplay coordinate is touched.
   */
  layoutHud() {
    const { w, h } = gameSize(this);
    const bx = Math.max(0, w - 512), by = Math.max(0, h - 384), ox = Math.floor(bx / 2), oy = Math.floor(by / 2);
    this.L = { bx, by, ox, oy };
    this.hintBtn.container.setPosition(476 + bx, 30);
    this.objBubble.setPosition(416 + bx, 30);
    this.crown.setPosition(222 + ox, 26);
    this.starsTxt.setPosition(244 + ox, 16);
    this.wandBtn.container.setPosition(256 + ox, 352 + by);
    this.gearBtn.container.setPosition(176, 362 + by);
    this.pad.y = 316 + by;
    this.padBase.setPosition(0, by);
    this.knobGlow.clear();
    this.knob.setPosition(this.pad.x, this.pad.y);
    this.aBtn.container.setPosition(458 + bx, 318 + by);
    this.magicBtn.container.setPosition(386 + bx, 344 + by);
    this.countTray.setPosition(256 + ox, 70);
    if (this.trayOpen) this.placeTray(false);
    this.dialogue.setOffset(ox, by);
    this.puzzle.setOffset(ox, oy);
    this.reveal.setOffset(ox, oy);
    this.raceHud?.panel.setPosition(256 + ox, 24);
    if (this.mg) { this.mg.panel.setPosition(ox, 0); this.mg.stars.forEach((q, i) => q.setPosition(256 - 44 + i * 44 + ox, 30)); }
  }

  // ------------------------------------------------------------------ HUD state
  update() {
    if (this.modal && (this.heldId >= 0 || this.stick.mag > 0)) this.releasePad();
  }

  private inPad(x: number, y: number) { return Math.hypot(x - this.pad.x, y - this.pad.y) <= this.pad.r + 14; }

  private moveStick(p: Phaser.Input.Pointer) {
    const dx = p.x - this.pad.x, dy = p.y - this.pad.y;
    this.stick = stickFromOffset(dx, dy, this.pad.r);
    const k = knobOffset(dx, dy, this.pad.r * 0.78);
    this.knob.setPosition(this.pad.x + k.x, this.pad.y + k.y).setAlpha(1);
    this.knobGlow.clear();
    if (this.stick.mag > 0) this.knobGlow.fillStyle(0xffffff, 0.12 + 0.18 * this.stick.mag).fillCircle(this.pad.x + k.x, this.pad.y + k.y, 30);
  }

  releasePad() {
    this.heldId = -1;
    this.stick = NEUTRAL;
    this.knobGlow?.clear();
    if (this.knob) { this.tweens.killTweensOf(this.knob); this.tweens.add({ targets: this.knob, x: this.pad.x, y: this.pad.y, alpha: 0.88, duration: dur(90) }); }
  }

  /** What the world should steer with this frame (a test override wins). */
  get steering(): Stick { return this.debugStick ?? this.stick; }

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
    if (this.mg) return; // minigame: keep the stripped-down controls
    const forms = availableForms(st.flags);
    this.wandBtn.setVisible(forms.length > 1);
    if (forms.length > this.seenForms) { this.wandBtn.pulse(true); this.time.delayedCall(4000, () => this.wandBtn.pulse(false)); }
    this.seenForms = forms.length;
    this.formBtns.forEach((b, f) => {
      b.setEnabled(forms.includes(f));
      b.container.setAlpha(f === st.form ? 1 : 0.85);
    });
    // something new to place? the Home button glows until the child has put it in the room (not while already there)
    const waiting = unplacedEarned(st.unlockedDecor, st.bedroomLayout).length > 0;
    this.homeBtn.pulse(waiting && st.scene !== 'bedroom');
    this.decorBtn.setVisible((st.scene === 'bedroom' || st.scene === 'garden') && !this.editing);
    this.decorBtn.pulse(waiting && st.scene === 'bedroom');
    this.objBubble.removeAll(true);
    const step = chapterComplete(st) ? null : nextObjective(st);
    if (step) {
      this.objBubble.add(roundedPanel(this, -26, -22, 52, 44, 0xfff6e4, 0xffc800, 10));
      this.objBubble.add(pic(this, step.hintIcon, 0, 0, 1.1));
    }
    this.objBubble.setVisible(!!step);
  }

  // ------------------------------------------------------------------ minigame mode (Unicorn Tag): only the stick, an exit and the tally
  private mg?: { exit: Btn; stars: Phaser.GameObjects.Image[]; panel: Phaser.GameObjects.Graphics };
  get inMinigame() { return !!this.mg; }
  setTagMode(on: boolean, onExit?: () => void) {
    if (on && !this.mg) {
      const keep = this.gearBtn;
      this.hud.forEach((b) => { if (b !== keep) b.setVisible(false); });
      this.objBubble.setVisible(false); this.crown.setVisible(false); this.starsTxt.setVisible(false);
      this.trayOpen = false; this.formBtns.forEach((b) => b.setVisible(false));
      const panel = this.add.graphics().setDepth(7);
      panel.fillStyle(0x40255a, 0.45).fillRoundedRect(256 - 78, 8, 156, 44, 22).setPosition(this.L.ox, 0);
      const stars = [0, 1, 2].map((i) => this.add.image(256 - 44 + i * 44 + this.L.ox, 30, 'ui', UI.icon_star).setScale(1.1).setAlpha(0.3).setDepth(8));
      const exit = makeButton(this, 36, 32, 'icon_back', 1, () => onExit?.());
      exit.container.setDepth(9);
      this.mg = { exit, stars, panel };
    } else if (!on && this.mg) {
      this.mg.exit.container.destroy(); this.mg.stars.forEach((q) => q.destroy()); this.mg.panel.destroy();
      this.mg = undefined; this.crown.setVisible(true); this.starsTxt.setVisible(true);
      [this.homeBtn, this.hintBtn, this.aBtn, this.magicBtn, ...this.hud].forEach((b) => b.setVisible(true));
      this.refresh();
    }
  }
  /** Fills the gold stars in the tally (0..3). */
  setTally(n: number) {
    this.mg?.stars.forEach((q, i) => { const on = i < n; q.setAlpha(on ? 1 : 0.3); if (on) this.tweens.add({ targets: q, scale: 1.7, duration: dur(160), yoyo: true }); });
  }
  get tallyState() { return this.mg?.stars.map((q) => q.alpha > 0.9) ?? null; }
  get exitPos() { return this.mg ? { x: this.mg.exit.container.x, y: this.mg.exit.container.y } : null; }

  get dialogueText() { return this.dialogue.current; }
  get puzzleCards() { return this.puzzle.cardPos; }

  pulseHint(on: boolean) { this.hintBtn.pulse(on); }
  pulseDecorate(on: boolean) { this.decorBtn?.pulse(on); }

  editing = false;
  /** Decorate mode owns the screen: hide the adventure controls, stop steering, block world taps. */
  setEditing(on: boolean) {
    if (on === this.editing) return;
    this.editing = on;
    this.modalDepth = Math.max(0, this.modalDepth + (on ? 1 : -1));
    this.releasePad();
    this.toggleTray(false);
    const vis = !on;
    for (const o of this.chrome) o.setVisible(vis);
    this.hud.forEach((b) => b.setVisible(vis));
    this.hud.forEach((b) => b.container.setAlpha(this.modal ? 0.45 : 1));
    if (vis) this.refresh();
  }

  private toggleTray(open = !this.trayOpen) {
    this.trayOpen = open;
    const forms: Form[] = ['princess', 'unicorn', 'mermaid'];
    const avail = availableForms(services.save.state.flags);
    const shown = forms.filter((f) => avail.includes(f));
    shown.forEach((f) => this.formBtns.get(f)!.setVisible(open));
    if (open) this.placeTray(true);
    forms.filter((f) => !shown.includes(f)).forEach((f) => this.formBtns.get(f)!.setVisible(false));
  }

  /** Lines the open form tray up above the wand button (centred, bottom-anchored). */
  private placeTray(animate: boolean) {
    const forms: Form[] = ['princess', 'unicorn', 'mermaid'];
    const shown = forms.filter((f) => availableForms(services.save.state.flags).includes(f));
    const y = 296 + this.L.by;
    shown.forEach((f, i) => {
      const b = this.formBtns.get(f)!;
      b.container.setPosition(256 + this.L.ox + (i - (shown.length - 1) / 2) * 66, y);
      if (animate) this.tweens.add({ targets: b.container, y: { from: y + 34, to: y }, duration: dur(160) });
    });
  }

  // ------------------------------------------------------------------ pointer arbitration
  /** WorldScene calls this first on every pointerdown; true means the UI owns the tap. */
  blocksPointer(x: number, y: number): boolean {
    if (this.modal) return true;
    if (this.crown?.visible && this.crown.getBounds().contains(x, y)) return true;
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


  // ------------------------------------------------------------------ v0.4c: river race HUD (big exit, checkpoint pips, optional timer)
  private raceHud?: { exit: Btn; panel: Phaser.GameObjects.Container; pips: Phaser.GameObjects.Arc[]; time?: Phaser.GameObjects.Text; total: number };
  get raceHudInfo() { return this.raceHud ? { pips: this.raceHud.pips.map((q) => q.fillColor === 0xffc800), exit: { x: this.raceHud.exit.container.x, y: this.raceHud.exit.container.y }, timed: !!this.raceHud.time } : null; }

  showRaceHud(total: number, timed: boolean, onExit: () => void) {
    this.hideRaceHud();
    const panel = this.add.container(256 + this.L.ox, 24).setDepth(8);
    const gap = 26, w = (total - 1) * gap + 56;
    panel.add(roundedPanel(this, -w / 2, -18, w, timed ? 58 : 36, 0xfff6e4, 0x3ea6ff, 16));
    const pips = Array.from({ length: total }, (_, i) => this.add.circle(-((total - 1) * gap) / 2 + i * gap, 0, 8, 0xece4ff).setStrokeStyle(3, 0xc9b8ff));
    panel.add(pips);
    let time: Phaser.GameObjects.Text | undefined;
    if (timed) { time = this.add.text(0, 26, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#40255a', fontStyle: 'bold' }).setOrigin(0.5); panel.add(time); }
    const exit = makeButton(this, 40, 36, 'icon_back', 1.5, onExit);
    exit.container.setDepth(9);
    this.hud.push(exit);
    this.raceHud = { exit, panel, pips, time, total };
  }

  setRaceProgress(done: number, _total: number) {
    const r = this.raceHud; if (!r) return;
    r.pips.forEach((q, i) => {
      const on = i < done;
      q.setFillStyle(on ? 0xffc800 : 0xece4ff).setStrokeStyle(3, on ? 0xff9a00 : 0xc9b8ff);
      if (on && i === done - 1) this.tweens.add({ targets: q, scale: 1.6, duration: dur(150), yoyo: true });
    });
  }

  setRaceTime(ms: number | null) {
    const t = this.raceHud?.time; if (!t) return;
    t.setText(ms === null ? '' : `${Math.floor(ms / 1000)}`);
  }

  hideRaceHud() {
    const r = this.raceHud; if (!r) return;
    this.hud = this.hud.filter((b) => b !== r.exit);
    r.exit.container.destroy(); r.panel.destroy(true);
    this.raceHud = undefined;
  }

  /** A big, picture-only chooser (no reading). Resolves with the tapped id, or null for the back button. */
  pickOne(options: readonly { id: string; picture: string }[]): Promise<string | null> {
    this.modalDepth++;
    return new Promise((resolve) => {
      const cx = 256 + this.L.ox, cy = 192 + this.L.oy, n = options.length, gap = Math.min(112, Math.floor(440 / n)), sc = Math.min(1, gap / 112);
      const root = this.add.container(0, 0).setDepth(60);
      const dim = this.add.rectangle(cx, cy, 2000, 2000, 0x40255a, 0.45).setInteractive();
      root.add(dim);
      const close = (v: string | null) => { root.destroy(true); back.container.destroy(); this.modalDepth = Math.max(0, this.modalDepth - 1); resolve(v); };
      const back = makeButton(this, 40 + this.L.ox * 0, 36, 'icon_back', 1.5, () => close(null));
      back.container.setDepth(61);
      options.forEach((o, i) => {
        const x = cx + (i - (n - 1) / 2) * gap;
        const card = this.add.container(x, cy).setScale(sc);
        card.add(roundedPanel(this, -48, -48, 96, 96, 0xfff6e4, 0x3ea6ff, 18));
        card.add(pic(this, o.picture, 0, 0, 2.2));
        card.setSize(96, 96).setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => { services.audio.sfx('pop'); this.tweens.add({ targets: card, scale: sc * 1.12, duration: 90, yoyo: true, onComplete: () => close(o.id) }); });
        root.add(card);
      });
    });
  }

  /** v0.4d.2: the kitchen decorating table and the gallery canvas (both modal, both picture-only). */
  bake(spec: BakeSpec, initial: readonly Topping[] = []): Promise<Topping[] | null> { this.modalDepth++; return runBake(this, this.L, spec, initial).finally(() => { this.modalDepth = Math.max(0, this.modalDepth - 1); }); }
  paint(strokes: readonly ArtStroke[]): Promise<ArtStroke[] | null> { this.modalDepth++; return runPaint(this, this.L, strokes).finally(() => { this.modalDepth = Math.max(0, this.modalDepth - 1); }); }

  // ------------------------------------------------------------------ reward moment
  celebrate(picture: string, scale = 4) {
    services.audio.sfx('sparkle');
    const cx = 256 + this.L.ox, cy = 200 + this.L.oy;
    const p = pic(this, picture, cx, cy, scale).setDepth(70).setScale(0.1);
    burst(this, cx, cy, 20, 69);
    this.tweens.add({
      targets: p, scale, duration: dur(450), ease: 'Back.Out',
      onComplete: () => this.tweens.add({ targets: p, alpha: 0, y: cy - 50, delay: dur(900), duration: dur(500), onComplete: () => p.destroy() })
    });
    this.refresh();
  }
}
