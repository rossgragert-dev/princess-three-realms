import Phaser from 'phaser';
import { STICKERS } from '../content/stickers';
import { ITEM, UI, type ItemName, type UiName } from '../content/frameIndex';
import { services } from '../systems/services';
import { makeButton, roundedPanel } from '../ui/touchTargets';
import { dimmer, useStage } from '../ui/stage';

/** Picture sticker book. Tap a collected sticker to hear its story; empty spots are dark shapes. */
export class StickerbookScene extends Phaser.Scene {
  constructor() { super('Stickerbook'); }

  create() {
    useStage(this);
    dimmer(this, 0x1a1033, 0.7);
    this.add.existing(roundedPanel(this, 28, 24, 456, 336));
    const have = new Set(services.save.state.stickers);
    const cols = 4, gx = 104, x0 = 256 - ((cols - 1) * gx) / 2;
    STICKERS.forEach((s, i) => {
      const x = x0 + (i % cols) * gx, y = 120 + Math.floor(i / cols) * 110;
      const owned = have.has(s.id);
      const bg = this.add.graphics();
      bg.fillStyle(owned ? 0xffffff : 0xe0d6f5, 1).fillRoundedRect(x - 40, y - 40, 80, 80, 12);
      bg.lineStyle(4, owned ? 0xffc800 : 0xc9b8ff, 1).strokeRoundedRect(x - 40, y - 40, 80, 80, 12);
      const img = s.sheet === 'ui'
        ? this.add.image(x, y, 'ui', UI[s.frame as UiName]).setScale(2)
        : this.add.image(x, y, 'items', ITEM[s.frame as ItemName]).setScale(3);
      if (!owned) img.setTint(0x6a5a8a).setAlpha(0.35);
      else {
        const hit = this.add.zone(x, y, 84, 84).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => { void services.audio.speak(s.narrationKey); this.tweens.add({ targets: img, scale: img.scale * 1.15, yoyo: true, duration: 120 }); });
      }
    });
    makeButton(this, 62, 56, 'icon_back', 1.1, () => this.close());
    void services.audio.speak('ui_book');
  }

  private close() {
    services.audio.stopVoice();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.stop();
  }
}
