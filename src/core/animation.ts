import type { AnimationPreset } from '../types';

interface PresetKeyframes {
  overlay: Keyframe[];
  dialog: Keyframe[];
  dialogExit?: Keyframe[];
}

const PRESETS: Record<Exclude<AnimationPreset, 'none'>, PresetKeyframes> = {
  fade: {
    overlay: [{ opacity: 0 }, { opacity: 1 }],
    dialog: [{ opacity: 0 }, { opacity: 1 }],
  },
  scale: {
    overlay: [{ opacity: 0 }, { opacity: 1 }],
    dialog: [
      { opacity: 0, transform: 'scale(0.95)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
  slide: {
    overlay: [{ opacity: 0 }, { opacity: 1 }],
    dialog: [
      { opacity: 0, transform: 'translateY(16px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
  spring: {
    overlay: [{ opacity: 0 }, { opacity: 1 }],
    dialog: [
      { opacity: 0, transform: 'translateY(24px) scale(0.96)' },
      { opacity: 1, transform: 'translateY(-3px) scale(1.01)', offset: 0.72 },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
  },
  bounce: {
    overlay: [{ opacity: 0 }, { opacity: 1 }],
    dialog: [
      { opacity: 0, transform: 'scale(0.85)', offset: 0 },
      { opacity: 1, transform: 'scale(1.03)', offset: 0.7 },
      { opacity: 1, transform: 'scale(0.99)', offset: 0.9 },
      { opacity: 1, transform: 'scale(1)', offset: 1 },
    ],
    dialogExit: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.9)' },
    ],
  },
  blur: {
    overlay: [
      { opacity: 0, backdropFilter: 'blur(0px)' },
      { opacity: 1, backdropFilter: 'blur(6px)' },
    ],
    dialog: [
      { opacity: 0, transform: 'scale(0.92)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

export const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const activeAnimations = new WeakMap<Element, Animation>();

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function runAnimation(
  el: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
): Promise<void> {
  if (prefersReducedMotion() || typeof el.animate !== 'function') {
    return Promise.resolve();
  }
  activeAnimations.get(el)?.cancel();
  const animation = el.animate(keyframes, { duration, easing: EASING, fill: 'both' });
  activeAnimations.set(el, animation);
  return animation.finished.then(
    () => undefined,
    () => undefined,
  );
}

export async function animateIn(
  overlay: HTMLElement,
  dialog: HTMLElement,
  preset: AnimationPreset = 'fade',
  duration = 200,
): Promise<void> {
  if (preset === 'none') return;
  const kf = PRESETS[preset] ?? PRESETS.fade;
  await Promise.all([
    runAnimation(overlay, kf.overlay, duration),
    runAnimation(dialog, kf.dialog, duration),
  ]);
}

export async function animateOut(
  overlay: HTMLElement,
  dialog: HTMLElement,
  preset: AnimationPreset = 'fade',
  duration = 150,
): Promise<void> {
  if (preset === 'none') return;
  const kf = PRESETS[preset] ?? PRESETS.fade;
  await Promise.all([
    runAnimation(overlay, [...kf.overlay].reverse(), duration),
    runAnimation(dialog, kf.dialogExit ?? [...kf.dialog].reverse(), duration),
  ]);
}
