import Phaser from 'phaser';
import { services, applySettingsToAudio } from '../systems/services';
import { makeButton, burst } from '../ui/touchTargets';
import { UI } from '../content/frameIndex';

/** One giant picture button. The first tap also unlocks audio (required by iOS Safari). */
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#6ec6ff');
    const g = this.add.graphics();
    g.fillGradientStyle(0x8fd3ff, 0x8fd3ff, 0xffd6f0, 0xffd6f0, 1).fillRect(0, 0, 512, 384);
    for (let i = 0; i < 24; i++) {
      const s = this.add.star(Phaser.Math.Between(10, 502), Phaser.Math.Between(10, 250), 4, 2, 5, 0xffffff, 0.9);
      this.tweens.add({ targets: s, alpha: 0.2, duration: Phaser.Math.Between(700, 1600), yoyo: true, repeat: -1 });
    }
    // three forms parade across the title
    const forms = ['princess', 'unicorn', 'mermaid'] as const;
    forms.forEach((f, i) => {
      const s = this.add.sprite(130 + i * 126, 150, f, 0).setScale(3);
      if (this.anims.exists(`${f}_idle_down`)) s.play(`${f}_idle_down`);
      this.tweens.add({ targets: s, y: 142, duration: 900 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });
    this.add.image(256, 60, 'crown_hud').setScale(2.5);

    const play = makeButton(this, 256, 300, 'icon_play', 3, () => this.start());
    play.pulse(true);
    const gear = makeButton(this, 476, 348, 'icon_parent', 0.7, () => { services.audio.unlock(); this.scene.start('ParentSettings', { from: 'Title' }); });
    gear.container.setAlpha(0.5);
    void UI;
  }

  private start() {
    services.audio.unlock();
    applySettingsToAudio();
    burst(this, 256, 300, 18, 100);
    const st = services.save.state;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('World', { scene: st.scene, spawn: st.spawn, resume: true });
    });
  }
}
