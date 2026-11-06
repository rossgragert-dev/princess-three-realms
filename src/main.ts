import Phaser from 'phaser';
import { makeConfig } from './config/gameConfig';
import { applySettingsToAudio } from './systems/services';

applySettingsToAudio();
const game = new Phaser.Game(makeConfig('game'));

// Stop iOS Safari from pinch-zooming or rubber-banding the page while a child is tapping.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// iPad Safari reports the new size late after a rotation; nudge the scale manager so the canvas never keeps the old shape.
const refit = () => { game.scale.refresh(); };
window.addEventListener('orientationchange', () => { setTimeout(refit, 120); setTimeout(refit, 450); });
window.visualViewport?.addEventListener('resize', refit);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js'); });
}
(window as unknown as { __game?: Phaser.Game }).__game = game;
