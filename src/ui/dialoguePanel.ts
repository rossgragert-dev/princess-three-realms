import Phaser from 'phaser';
import type { Line } from '../content/dialogue';
import { narrationByKey, type Speaker } from '../content/narrationManifest';
import { ITEM, UI } from '../content/frameIndex';
import { narrationOn } from '../systems/accessibility';
import { glyphsFor } from '../content/lineGlyphs';
import { services } from '../systems/services';
import { makeButton, pic, type Btn } from './touchTargets';

const NPC_SHEETS: Partial<Record<Speaker, string>> = { pip: 'npc_pip', willa: 'npc_willa', bramble: 'npc_bramble', marina: 'npc_marina', nana: 'npc_nana', coralie: 'npc_coralie', king: 'npc_king', queen: 'npc_queen', dapple: 'dapple' };
const FONT = 'Trebuchet MS, Arial, sans-serif';

/**
 * v0.4a dialogue: a friendly portrait, 1-2 short written sentences, a row of small pictures, and a big Next arrow.
 * Written text only: no voice unless a grown-up turns narration on in Parent settings (then a replay button appears).
 * A line NEVER advances by itself: the child taps the panel or the arrow. The tap that opened the panel cannot skip it.
 */
export class DialoguePanel {
  private root: Phaser.GameObjects.Container;
  private portrait!: Phaser.GameObjects.Image;
  private text: Phaser.GameObjects.Text;
  private glyphs: Phaser.GameObjects.GameObject[] = [];
  private replay: Btn;
  private next: Btn;
  private skip?: () => void;
  private replayFn?: () => void;
  private armedAt = 0;
  isOpen = false;
  /** Current line, for browser tests. */
  current = '';

  /** Shift for the current screen: ox centres it horizontally, by pins it to the real bottom edge. */
  setOffset(ox: number, by: number) { this.root.setPosition(ox, by); }

  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {
    this.root = scene.add.container(0, 0).setDepth(50).setVisible(false);
    const frame = scene.add.graphics();
    frame.fillStyle(0x40255a, 0.35).fillRoundedRect(19, 273, 474, 106, 14);
    frame.fillStyle(0xfff6e4, 1).fillRoundedRect(16, 268, 480, 108, 14).lineStyle(4, 0xa06bff, 1).strokeRoundedRect(16, 268, 480, 108, 14);
    frame.fillStyle(0xe9defc, 1).fillRoundedRect(26, 278, 70, 88, 12).lineStyle(3, 0xc9b8ff, 1).strokeRoundedRect(26, 278, 70, 88, 12);
    this.portrait = scene.add.image(61, 330, 'ui', UI.icon_star).setScale(2);
    this.text = scene.add.text(108, 278, '', { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#40255a', wordWrap: { width: 300 }, lineSpacing: 3 });
    this.replay = makeButton(scene, 438, 296, 'icon_speaker', 0.8, () => this.replayFn?.());
    this.next = makeButton(scene, 454, 344, 'icon_next', 1.5, () => this.tap());
    const zone = scene.add.zone(256, 322, 480, 108).setInteractive();
    zone.on('pointerdown', () => this.tap());
    this.root.add([frame, zone, this.portrait, this.text, this.replay.container, this.next.container]);
  }

  hit(_x: number, _y: number) { return this.isOpen; }

  private tap() { if (this.scene.time.now >= this.armedAt) this.skip?.(); }

  private setPortrait(sp: Speaker) {
    const sheet = NPC_SHEETS[sp];
    if (sheet) this.portrait.setTexture(sheet, 0).setScale(2.3).setCrop();
    else if (sp === 'tree') this.portrait.setTexture('ui', UI.icon_tree).setScale(2).setCrop();
    else if (sp === 'shell') this.portrait.setTexture('items', ITEM.shell).setScale(3.4).setCrop();
    else if (this.scene.textures.exists('princess_look')) this.portrait.setTexture('princess_look', 0).setScale(2.3).setCrop();
    else this.portrait.setTexture('ui', UI.icon_star).setScale(2).setCrop();
  }

  /** Largest font that fits the text box (2-3 lines) on every screen. */
  private fit(t: string) {
    this.text.setText(t);
    for (const size of [17, 16, 15, 14, 13, 12]) {
      this.text.setFontSize(size);
      if (this.text.height <= 52) break;
    }
  }

  private playLine(line: Line): Promise<void> {
    const s = this.scene;
    this.setPortrait(line.speaker);
    const msg = narrationByKey(line.key)?.text ?? '';
    this.current = msg;
    this.fit(msg);
    this.drawGlyphs(line.key);
    const voice = narrationOn();
    this.replay.setVisible(voice);
    this.next.pulse(false);
    this.armedAt = s.time.now + 250;
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.skip = this.replayFn = undefined;
        services.audio.stopVoice();
        this.next.pulse(false);
        resolve();
      };
      this.skip = finish;
      this.replayFn = () => void services.audio.speak(line.key);
      s.tweens.add({ targets: this.portrait, y: this.portrait.y - 4, duration: 180, yoyo: true });
      if (voice) this.replayFn();
      // a gentle nudge toward the arrow after a pause. It never advances by itself.
      s.time.delayedCall(1800, () => { if (!done) this.next.pulse(true); });
    });
  }

  async say(lines: readonly Line[]): Promise<void> {
    if (!lines.length) return;
    this.isOpen = true;
    this.setModal(true);
    this.root.setVisible(true);
    for (const l of lines) await this.playLine(l);
    this.current = '';
    this.glyphs.forEach((g) => g.destroy());
    this.glyphs = [];
    this.root.setVisible(false);
    this.isOpen = false;
    this.setModal(false);
  }

  buttons(): Btn[] { return this.isOpen ? [this.replay, this.next] : []; }

  /** Row of pictures for this line, centred between the portrait and the buttons. */
  private drawGlyphs(key: string) {
    const s = this.scene;
    this.glyphs.forEach((g) => g.destroy());
    this.glyphs = [];
    const gl = glyphsFor(key);
    const step = 40, x0 = 124, y = 346;
    gl.forEach((g, i) => {
      let o: Phaser.GameObjects.GameObject;
      if (g.startsWith('#')) o = s.add.text(x0 + i * step, y, g.slice(1), { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#6a3fc8', stroke: '#ffffff', strokeThickness: 4 }).setOrigin(0.5);
      else o = pic(s, g, x0 + i * step, y, g.startsWith('icon_') ? 1.1 : 2);
      this.root.add(o);
      this.glyphs.push(o);
      (o as unknown as Phaser.GameObjects.Image).setAlpha(0);
      s.tweens.add({ targets: o, alpha: 1, y: { from: y + 8, to: y }, duration: 220, delay: i * 140, ease: 'Back.Out' });
    });
  }
}
