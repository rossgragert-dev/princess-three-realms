import Phaser from 'phaser';
import { services, applySettingsToAudio } from '../systems/services';
import { resetSession } from '../world/story';
import { makeButton, roundedPanel } from '../ui/touchTargets';

const FONT = 'Trebuchet MS, Arial, sans-serif';

/** Adult-only. Gate: press and hold the padlock for 3 seconds (a young child will not do this by accident). */
export class ParentSettingsScene extends Phaser.Scene {
  private from: 'Title' | 'World' = 'World';
  private panel?: Phaser.GameObjects.Container;
  constructor() { super('ParentSettings'); }

  init(d: { from?: 'Title' | 'World' }) { this.from = d?.from ?? 'World'; }

  create() {
    this.add.rectangle(256, 192, 512, 384, 0x1a1033, 0.85).setInteractive();
    makeButton(this, 28, 30, 'icon_back', 0.9, () => this.close());
    this.gate();
  }

  private holdButton(x: number, y: number, label: string, ms: number, done: () => void) {
    const bg = this.add.rectangle(x, y, 190, 44, 0x6a3fc8).setStrokeStyle(3, 0xffffff).setInteractive();
    const fill = this.add.rectangle(x - 95, y, 0, 44, 0xffc800, 0.6).setOrigin(0, 0.5);
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    let tween: Phaser.Tweens.Tween | undefined;
    bg.on('pointerdown', () => { tween = this.tweens.add({ targets: fill, width: 190, duration: ms, onComplete: done }); });
    const cancel = () => { tween?.stop(); fill.width = 0; };
    bg.on('pointerup', cancel);
    bg.on('pointerout', cancel);
    return [bg, fill];
  }

  private gate() {
    const t = this.add.text(256, 130, 'Grown-ups only', { fontFamily: FONT, fontSize: '22px', color: '#fff' }).setOrigin(0.5);
    const t2 = this.add.text(256, 165, 'Press and hold the button for 3 seconds.', { fontFamily: FONT, fontSize: '14px', color: '#d8ccff' }).setOrigin(0.5);
    const parts = this.holdButton(256, 230, 'Hold to open', 3000, () => { [t, t2, ...parts].forEach((o) => o.destroy()); this.menu(); });
  }

  private menu() {
    const s = services.save.state.settings;
    this.panel?.destroy();
    const c = (this.panel = this.add.container(0, 0));
    c.add(roundedPanel(this, 56, 24, 400, 340));
    c.add(this.add.text(256, 46, 'Settings', { fontFamily: FONT, fontSize: '20px', color: '#40255a' }).setOrigin(0.5));
    let y = 78;
    const row = (label: string, value: () => string, onTap: () => void) => {
      c.add(this.add.text(76, y, label, { fontFamily: FONT, fontSize: '15px', color: '#40255a' }));
      const b = this.add.text(380, y, value(), { fontFamily: FONT, fontSize: '15px', color: '#fff', backgroundColor: '#6a3fc8', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => { onTap(); b.setText(value()); applySettingsToAudio(); services.save.save(); });
      c.add(b);
      y += 36;
    };
    const vol = (k: 'musicVolume' | 'voiceVolume' | 'sfxVolume') => () => { s[k] = s[k] >= 1 ? 0 : Math.round((s[k] + 0.25) * 100) / 100; };
    row('Music volume', () => `${Math.round(s.musicVolume * 100)}%`, vol('musicVolume'));
    row('Voice volume', () => `${Math.round(s.voiceVolume * 100)}%`, vol('voiceVolume'));
    row('Sound effects', () => `${Math.round(s.sfxVolume * 100)}%`, vol('sfxVolume'));
    row('Captions (for grown-ups)', () => (s.captions ? 'On' : 'Off'), () => { s.captions = !s.captions; });
    row('On-screen arrows', () => (s.dpad ? 'On' : 'Off'), () => { s.dpad = !s.dpad; });
    row('Calmer effects', () => (s.reducedEffects ? 'On' : 'Off'), () => { s.reducedEffects = !s.reducedEffects; });
    if (import.meta.env?.DEV) row('Dev: browser voice (no recordings)', () => (services.audio.devTts ? 'On' : 'Off'), () => { services.audio.devTts = !services.audio.devTts; });
    c.add(this.add.text(76, y + 10, 'Hold to erase all progress:', { fontFamily: FONT, fontSize: '13px', color: '#a02020' }));
    this.holdButton(350, y + 18, 'Hold 3s: reset', 3000, () => {
      resetSession();
      services.save.reset();
      this.scene.stop('UI');
      this.scene.stop('World');
      this.scene.start('Title');
    });
  }

  private close() {
    services.save.save();
    if (this.from === 'Title') { this.scene.start('Title'); return; }
    (this.scene.get('UI') as unknown as { refresh?: () => void })?.refresh?.();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.stop();
  }
}
