import type { AnimationPreset } from '../types';

export type AnimationRunner = (
  overlay: HTMLElement,
  dialog: HTMLElement,
  preset?: AnimationPreset,
  duration?: number,
) => Promise<void>;

const immediate: AnimationRunner = () => Promise.resolve();
let enter: AnimationRunner = immediate;
let exit: AnimationRunner = immediate;

export function registerAnimationRunners(animateIn: AnimationRunner, animateOut: AnimationRunner) {
  enter = animateIn;
  exit = animateOut;
}

export const animateDialogIn: AnimationRunner = (...args) => enter(...args);
export const animateDialogOut: AnimationRunner = (...args) => exit(...args);
