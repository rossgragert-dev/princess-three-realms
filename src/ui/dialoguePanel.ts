import Phaser from 'phaser';
import type { Line } from '../content/dialogue';
import { narrationByKey, type Speaker } from '../content/narrationManifest';
import { ITEM, UI } from '../content/frameIndex';
import { captionsOn } from '../systems/accessibility';
import { services } from '../systems/services';
import { makeButton, roundedPanel, type Btn } from './touchTargets';

const NPC_SHEETS: Partial<Record<Speaker, string>> = { pip: 'npc_pip', willa: 'npc_willa', bramble: 'npc_bramble', marina: 'npc_marina', nana: 'npc_nana', coralie: 'npc_coralie' };

/**
 * Voice-first dialogue: speaker portrait, replay button, next button, optional caption for adults.
 * A line advances by itself after its audio finishes. If a clip is missing the child taps the arrow.
 */
export class DialoguePanel {
  private root: Phaser.GameObjects.Container;
  private portrait!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;
  private replay: Btn;
  private next: Btn;
  private skip?: () => void;
  private replayFn?: () => void;
  isOpen = false;

  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {
    this.root = scene.add.container(0, 0).setDepth(50).setVisible(false);
    this.root.add(roundedPanel(scene, 16, 282, 480, 92));
    this.portrait = scene.add.image(62, 328, 'ui', UI.icon_star).setScale(2);
    this.caption = scene.add.text(112, 296, '', { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px', color: '#40255a', wordWrap: { width: 250 } });
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
    this.next.pulse(false);
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
      const speak = () =>
        void services.audio.speak(line.key).then((st) => {
          if (done) return;
          if (st === 'played') s.time.delayedCall(350, finish);
          else if (st === 'missing') this.next.pulse(true); // no clip yet: wait for the child's tap
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
    this.root.setVisible(false);
    this.isOpen = false;
    this.setModal(false);
  }

  buttons(): Btn[] { return this.isOpen ? [this.replay, this.next] : []; }
}
