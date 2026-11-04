import { services } from './services';

export const reducedEffects = () => services.save.state.settings.reducedEffects;
export const captionsOn = () => services.save.state.settings.captions;
/** Particle/sparkle budget: halved with reduced effects. */
export const sparkleCount = (n: number) => (reducedEffects() ? Math.ceil(n / 3) : n);
/** Tween duration helper: reduced effects shortens flourishes. */
export const dur = (ms: number) => (reducedEffects() ? Math.min(ms, 200) : ms);
/** Spoken narration is an optional extra; the child flow must work with this false. */
export const narrationOn = () => services.save.state.settings.narration;
