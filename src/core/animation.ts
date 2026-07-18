import type { AnimationPreset } from '../types';

interface PresetKeyframes {
  overlay: Keyframe[];
  dialog: Keyframe[];
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
};

const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function runAnimation(el: HTMLElement, keyframes: Keyframe[], duration: number): Promise<void> {
  if (prefersReducedMotion() || typeof el.animate !== 'function') {
    return Promise.resolve();
  }
  const animation = el.animate(keyframes, { duration, easing: EASING, fill: 'both' });
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
    runAnimation(dialog, [...kf.dialog].reverse(), duration),
  ]);
}
