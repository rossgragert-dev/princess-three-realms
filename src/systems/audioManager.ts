import { clipUrls, narrationByKey } from '../content/narrationManifest';

export interface AudioSettings {
  musicVolume: number;
  voiceVolume: number;
  sfxVolume: number;
  /** Spoken narration on/off (grown-up setting). Off by default: gameplay never needs voice. */
  voiceEnabled: boolean;
}

/**
 * Central audio. No scattered `new Audio()` in UI handlers.
 * Voice plays a local clip when its file loads; otherwise it reports `missing` so the game
 * can show a picture/caption cue. Browser speechSynthesis is a DEV-ONLY fallback behind `devTts`
 * and is never enabled in production builds.
 */
export class AudioManager {
  unlocked = false;
  devTts = false;
  settings: AudioSettings = { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, voiceEnabled: false };
  private ctx?: AudioContext;
  private voice?: HTMLAudioElement;
  private missing = new Set<string>();
  private queueToken = 0;
  onMusicDuck?: (ducked: boolean) => void;

  /** Call from the first user tap. */
  unlock(): void {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      void this.ctx.resume();
    } catch {
      /* no WebAudio: voice clips still work via <audio> */
    }
    this.unlocked = true;
  }

  isMissing(key: string): boolean {
    return this.missing.has(key);
  }

  /** Cancels any current voice line so lines never overlap. Resolves when the line ends or is cancelled. */
  async speak(key: string): Promise<'played' | 'missing' | 'cancelled' | 'off'> {
    this.stopVoice();
    const token = ++this.queueToken;
    if (!this.settings.voiceEnabled) return 'off';
    if (!this.unlocked) return 'missing';
    const urls = clipUrls(key);
    for (const url of urls) {
      if (this.missing.has(url)) continue;
      const result = await this.tryPlay(url, token);
      if (result !== 'missing') return result;
      this.missing.add(url);
    }
    this.missing.add(key);
    if (this.devTts && 'speechSynthesis' in window) {
      const line = narrationByKey(key);
      if (line) {
        const u = new SpeechSynthesisUtterance(line.text);
        u.volume = this.settings.voiceVolume;
        const token2 = token;
        return new Promise((resolve) => {
          u.onend = () => resolve(token2 === this.queueToken ? 'played' : 'cancelled');
          u.onerror = () => resolve('cancelled');
          window.speechSynthesis.speak(u);
        });
      }
    }
    return 'missing';
  }

  private tryPlay(url: string, token: number): Promise<'played' | 'missing' | 'cancelled'> {
    return new Promise((resolve) => {
      const a = new Audio();
      a.preload = 'auto';
      a.volume = this.settings.voiceVolume;
      const done = (r: 'played' | 'missing' | 'cancelled') => {
        a.onended = a.onerror = null;
        this.duck(false);
        resolve(r);
      };
      a.onerror = () => done('missing');
      a.onended = () => done(token === this.queueToken ? 'played' : 'cancelled');
      a.src = url;
      this.voice = a;
      this.duck(true);
      a.play().catch(() => done('missing'));
    });
  }

  stopVoice(): void {
    this.queueToken++;
    if (this.voice) {
      this.voice.pause();
      this.voice = undefined;
    }
    if (this.devTts && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.duck(false);
  }

  private duck(on: boolean) {
    this.ducked = on;
    this.applyMusicVolume();
    this.onMusicDuck?.(on);
  }

  // ---------------------------------------------------------------- music (original synthesized loops, no files)
  private musicGain?: GainNode;
  private musicTimer?: number;
  private musicRealm?: 'sunlit' | 'wilds' | 'seas';
  private ducked = false;

  private static readonly LOOPS: Record<'sunlit' | 'wilds' | 'seas', { bpm: number; chords: number[][]; wave: OscillatorType }> = {
    // C major pentatonic, bright and bouncy
    sunlit: { bpm: 84, wave: 'triangle', chords: [[523, 659, 784, 659], [587, 698, 880, 698], [494, 622, 740, 622], [523, 659, 784, 1047]] },
    // A minor-ish pentatonic, mysterious but friendly
    wilds: { bpm: 72, wave: 'sine', chords: [[440, 523, 659, 523], [392, 494, 587, 494], [349, 440, 523, 440], [392, 494, 587, 784]] },
    // slow, floaty, lydian colours
    seas: { bpm: 60, wave: 'sine', chords: [[392, 494, 587, 740], [440, 554, 659, 831], [370, 466, 554, 698], [392, 494, 587, 740]] }
  };

  applyMusicVolume(): void {
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(this.musicLevel(), this.ctx.currentTime, 0.2);
  }
  private musicLevel() {
    return 0.09 * this.settings.musicVolume * (this.ducked ? 0.3 : 1);
  }

  startMusic(realm: 'sunlit' | 'wilds' | 'seas'): void {
    if (!this.ctx || this.musicRealm === realm) return;
    this.stopMusic();
    this.musicRealm = realm;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(ctx.destination);
    this.musicGain = g;
    g.gain.setTargetAtTime(this.musicLevel(), ctx.currentTime, 0.8);
    const loop = AudioManager.LOOPS[realm];
    const beat = 60 / loop.bpm;
    let step = 0;
    const tick = () => {
      if (!this.ctx || this.musicRealm !== realm) return;
      const chord = loop.chords[Math.floor(step / 4) % loop.chords.length];
      const f = chord[step % 4];
      const t0 = ctx.currentTime + 0.05;
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.type = loop.wave;
      o.frequency.value = f;
      e.gain.setValueAtTime(0.0001, t0);
      e.gain.exponentialRampToValueAtTime(0.5, t0 + 0.04);
      e.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 1.6);
      o.connect(e).connect(g);
      o.start(t0);
      o.stop(t0 + beat * 1.7);
      if (step % 4 === 0) {
        const pad = ctx.createOscillator();
        const pe = ctx.createGain();
        pad.type = 'sine';
        pad.frequency.value = chord[0] / 2;
        pe.gain.setValueAtTime(0.0001, t0);
        pe.gain.exponentialRampToValueAtTime(0.35, t0 + 0.3);
        pe.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 4);
        pad.connect(pe).connect(g);
        pad.start(t0);
        pad.stop(t0 + beat * 4.1);
      }
      step++;
    };
    tick();
    this.musicTimer = window.setInterval(tick, beat * 1000);
  }

  stopMusic(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
    this.musicRealm = undefined;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    this.musicGain = undefined;
  }

  /** v0.4c: one soft musical note (musical mushrooms, shell chimes, lanterns). */
  note(hz: number, ms = 420, type: OscillatorType = 'sine'): void {
    if (!this.ctx || this.settings.sfxVolume <= 0) return;
    const t0 = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.2 * this.settings.sfxVolume, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + ms / 1000 + 0.05);
  }

  /** Short synthesized SFX (originals, no files needed). */
  sfx(kind: 'chime' | 'pop' | 'sparkle' | 'bloom' | 'splash' | 'wand' | 'shimmer' | 'spray'): void {
    if (!this.ctx || this.settings.sfxVolume <= 0) return;
    const notes: Record<string, number[]> = {
      chime: [784, 988, 1175],
      pop: [520],
      sparkle: [1319, 1568, 2093],
      bloom: [523, 659, 784],
      splash: [330, 247],
      wand: [880, 1175, 1568],
      shimmer: [1568, 2093, 2637, 3136],
      spray: [392, 523, 659, 784]
    };
    const t0 = this.ctx.currentTime;
    notes[kind].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = kind === 'splash' || kind === 'spray' ? 'triangle' : 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.18 * this.settings.sfxVolume, t0 + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.35);
      o.connect(g).connect(this.ctx!.destination);
      o.start(t0 + i * 0.09);
      o.stop(t0 + i * 0.09 + 0.4);
    });
  }
}
