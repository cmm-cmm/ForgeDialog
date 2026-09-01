import type { DialogAppearance } from '../types';

export type AppearanceApplier = (
  overlay: HTMLElement,
  dialog: HTMLElement,
  appearance?: DialogAppearance,
) => void;

export const SHADOW_PRESETS = new Set(['none', 'sm', 'md', 'lg', 'xl']);
export const PREFIX = '--fd-dialog-';
export const HOVER_PREFIX = '--fd-dialog-hover-';

/** Scalars, plus the structured values (radius, shadow) the full applier takes. */
export type AppearanceValue = string | number | boolean | object;
export type Formatter = (value: AppearanceValue) => string;

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export const percent: Formatter = (value) => `${clamp(Number(value)) * 100}%`;
export const text: Formatter = (value) => String(value);
export const length: Formatter = (value) =>
  typeof value === 'number' ? `${Math.max(0, value)}px` : String(value);

/**
 * The always-bundled appearance applier. It covers the surface, backdrop, and
 * border so focused entries such as `forgedialog/alert` stay small; importing
 * `forgedialog` (or `forgedialog/appearance`) upgrades this to the full applier
 * with per-component colors, composed shadows, and hover styling.
 */
export const applyBasicAppearance: AppearanceApplier = (overlay, dialog, appearance) => {
  const style = dialog.style;
  style.removeProperty(`${PREFIX}opacity`);
  style.removeProperty(`${PREFIX}border-color`);
  style.removeProperty(`${PREFIX}border-width`);
  style.removeProperty(`${PREFIX}border-style`);
  style.removeProperty(`${PREFIX}shadow`);
  dialog.removeAttribute('data-fd-shadow');
  overlay.style.removeProperty('--fd-overlay-opacity');
  overlay.style.removeProperty('--fd-backdrop-blur');
  if (!appearance) return;

  if (appearance.opacity !== undefined) {
    style.setProperty(`${PREFIX}opacity`, percent(appearance.opacity));
  }
  if (appearance.borderColor) style.setProperty(`${PREFIX}border-color`, appearance.borderColor);
  if (appearance.borderWidth !== undefined) {
    style.setProperty(`${PREFIX}border-width`, length(appearance.borderWidth));
  }
  if (appearance.borderStyle) style.setProperty(`${PREFIX}border-style`, appearance.borderStyle);
  if (appearance.overlayOpacity !== undefined) {
    overlay.style.setProperty('--fd-overlay-opacity', percent(appearance.overlayOpacity));
  }
  if (appearance.backdropBlur !== undefined) {
    overlay.style.setProperty('--fd-backdrop-blur', length(appearance.backdropBlur));
  }

  const shadow = appearance.shadow;
  if (typeof shadow !== 'string') return;
  if (SHADOW_PRESETS.has(shadow)) dialog.dataset.fdShadow = shadow;
  else style.setProperty(`${PREFIX}shadow`, shadow);
};
