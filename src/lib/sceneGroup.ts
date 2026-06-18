import type { SceneEffect } from '../types/story';

const GROUP_EFFECTS: SceneEffect[] = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];

/** Scene id `s3_2` → group `3`. */
export function parseSceneGroup(id: string): number {
  const m = /^s(\d+)_/.exec(id);
  return m ? Number(m[1]) : 0;
}

export function effectForGroup(group: number): SceneEffect {
  const i = ((group % GROUP_EFFECTS.length) + GROUP_EFFECTS.length) % GROUP_EFFECTS.length;
  return GROUP_EFFECTS[i];
}

export type TransitionKind = 'dissolve' | 'fade-black' | 'push-left' | 'push-right' | 'zoom';

const GROUP_TRANSITIONS: TransitionKind[] = ['fade-black', 'push-left', 'push-right', 'zoom'];

/** Кадры внутри одной сцены — мягкий dissolve; между сценами — чередуются эффекты. */
export function transitionFor(prevGroup: number, nextGroup: number): TransitionKind {
  if (prevGroup === nextGroup) return 'dissolve';
  return GROUP_TRANSITIONS[((nextGroup % GROUP_TRANSITIONS.length) + GROUP_TRANSITIONS.length) % GROUP_TRANSITIONS.length];
}

export const TRANSITION_MS: Record<TransitionKind, number> = {
  dissolve: 900,
  'fade-black': 1800,
  'push-left': 1400,
  'push-right': 1400,
  zoom: 1300,
};

/** Длительность затемнения до чёрного (fade-black). */
export const CURTAIN_IN_MS = 650;
export const CURTAIN_OUT_MS = 950;

export const FADE_MS_SAME_GROUP = TRANSITION_MS.dissolve;
export const FADE_MS_NEW_GROUP = TRANSITION_MS['fade-black'];
