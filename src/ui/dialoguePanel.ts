import Phaser from 'phaser';
import type { Line } from '../content/dialogue';
import { narrationByKey, type Speaker } from '../content/narrationManifest';
import { ITEM, UI } from '../content/frameIndex';
import { captionsOn, narrationOn } from '../systems/accessibility';
import { glyphsFor } from '../content/lineGlyphs';
import { services } from '../systems/services';
import { makeButton, pic, roundedPanel, type Btn } from './touchTargets';

/** How long a picture-only line stays before moving on by itself (a tap on the arrow skips ahead). */
export const AUTO_MS = 4200;

const NPC_SHEETS: Partial<Record<Speaker, string>> = { pip: 'npc_pip', willa: 'npc_willa', bramble: 'npc_bramble', marina: 'npc_marina', nana: 'npc_nana', coralie: 'npc_coralie' };

/**
 * Picture-first dialogue: speaker portrait + a row of pictures that tell the line, and a big next arrow.
 * Voice is optional (Parent setting): when narration is on and a clip plays, the line advances when it ends and a
 * replay button appears. With narration off (default) the line waits for a tap and advances by itself after a few seconds.
 * Captions for grown-ups are optional and small.
 */
export class DialoguePanel {
  private root: Phaser.GameObjects.Container;
  private portrait!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;
  private glyphs: Phaser.GameObjects.GameObject[] = [];
  private replay: Btn;
  private next: Btn;
  private skip?: () => void;
  private replayFn?: () => void;
  isOpen = false;

  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {
    this.root = scene.add.container(0, 0).setDepth(50).setVisible(false);
    this.root.add(roundedPanel(scene, 16, 282, 480, 92));
    this.portrait = scene.add.image(62, 328, 'ui', UI.icon_star).setScale(2);
    this.caption = scene.add.text(112, 287, '', { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px', color: '#6a4a8c', wordWrap: { width: 290 } });
    this.replay = makeButton(scene, 424, 328, 'icon_speaker', 1.25, () => this.replayFn?.());
    this.next = makeButton(scene, 468, 328, 'icon_next', 1.25, () => this.skip?.());
    this.root.add([this.portrait, this.caption, this.replay.container, this.next.container]);
  }

  hit(x: number, y: number) { return this.isOpen; }

  private setPortrait(sp: Speaker) {
    const sheet = NPC_SHEETS[sp];
    if (sheet) this.portrait.setTexture(sheet, 0).setScale(2);
    else if (sp === 'tree') this.portrait.setTexture('ui', UI.icon_tree).setScale(2);
    else if (sp === 'shell') this.portrait.setTexture('items', ITEM.shell).setScale(3);
    else this.portrait.setTexture('ui', UI.icon_star).setScale(2);
  }

  private playLine(line: Line): Promise<void> {
    const s = this.scene;
    this.setPortrait(line.speaker);
    this.caption.setText(captionsOn() ? narrationByKey(line.key)?.text ?? '' : '');
    this.drawGlyphs(line.key);
    const voice = narrationOn();
    this.replay.setVisible(voice);
    this.next.pulse(false);
    return new Promise<void>((resolve) => {
      let done = false;
      let timer: Phaser.Time.TimerEvent | undefined;
      const finish = () => {
        if (done) return;
        done = true;
        timer?.remove();
        this.skip = this.replayFn = undefined;
        services.audio.stopVoice();
        this.next.pulse(false);
        resolve();
      };
      this.skip = finish;
      // No voice (off, or clip missing): pulse the arrow and move on by itself after a few seconds.
      const wait = () => { this.next.pulse(true); timer?.remove(); timer = s.time.delayedCall(AUTO_MS, finish); };
      const speak = () =>
        void services.audio.speak(line.key).then((st) => {
          if (done) return;
          if (st === 'played') s.time.delayedCall(350, finish);
          else if (st !== 'cancelled') wait();
        });
      this.replayFn = speak;
      s.tweens.add({ targets: this.portrait, y: this.portrait.y - 4, duration: 180, yoyo: true });
      speak();
    });
  }

  async say(lines: readonly Line[]): Promise<void> {
    if (!lines.length) return;
    this.isOpen = true;
    this.setModal(true);
    this.root.setVisible(true);
    for (const l of lines) await this.playLine(l);
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
    const step = 58, x0 = 262 - ((gl.length - 1) * step) / 2, y = 330;
    gl.forEach((g, i) => {
      let o: Phaser.GameObjects.GameObject;
      if (g.startsWith('#')) o = s.add.text(x0 + i * step, y, g.slice(1), { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#6a3fc8', stroke: '#ffffff', strokeThickness: 5 }).setOrigin(0.5);
      else o = pic(s, g, x0 + i * step, y, g.startsWith('icon_') ? 1.5 : 3);
      this.root.add(o);
      this.glyphs.push(o);
      (o as unknown as Phaser.GameObjects.Image).setAlpha(0);
      s.tweens.add({ targets: o, alpha: 1, y: { from: y + 8, to: y }, duration: 220, delay: i * 140, ease: 'Back.Out' });
    });
  }
}
