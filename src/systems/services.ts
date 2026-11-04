import { AudioManager } from './audioManager';
import { SaveManager, type KV } from './saveManager';

const memory = (): KV => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

function pickStore(): KV {
  try {
    const s = window.localStorage;
    s.setItem('__ptr_probe', '1');
    s.removeItem('__ptr_probe');
    return s;
  } catch {
    return memory(); // private mode: play works, saves do not persist
  }
}

/** Singletons shared by every scene. Created once in main.ts. */
export const services = {
  save: new SaveManager(pickStore()),
  audio: new AudioManager()
};

export function applySettingsToAudio() {
  const s = services.save.state.settings;
  services.audio.settings.musicVolume = s.musicVolume;
  services.audio.settings.voiceVolume = s.voiceVolume;
  services.audio.settings.sfxVolume = s.sfxVolume;
  services.audio.applyMusicVolume();
}
