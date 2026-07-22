import type { DialogAppearance } from '../types';

const SHADOW_PRESETS = new Set(['none', 'sm', 'md', 'lg', 'xl']);

const DIALOG_PROPERTIES = [
  '--fd-dialog-opacity',
  '--fd-dialog-border-color',
  '--fd-dialog-border-width',
  '--fd-dialog-border-style',
  '--fd-dialog-shadow',
] as const;

function opacity(value: number): string {
  return `${Math.min(1, Math.max(0, value)) * 100}%`;
}

function length(value: number | string): string {
  return typeof value === 'number' ? `${Math.max(0, value)}px` : value;
}

export function applyAppearance(
  overlay: HTMLElement,
  dialog: HTMLElement,
  appearance?: DialogAppearance,
): void {
  DIALOG_PROPERTIES.forEach((property) => dialog.style.removeProperty(property));
  dialog.removeAttribute('data-fd-shadow');
  overlay.style.removeProperty('--fd-overlay-opacity');
  overlay.style.removeProperty('--fd-backdrop-blur');
  if (!appearance) return;

  if (appearance.opacity !== undefined) {
    dialog.style.setProperty('--fd-dialog-opacity', opacity(appearance.opacity));
  }
  if (appearance.overlayOpacity !== undefined) {
    overlay.style.setProperty('--fd-overlay-opacity', opacity(appearance.overlayOpacity));
  }
  if (appearance.backdropBlur !== undefined) {
    overlay.style.setProperty('--fd-backdrop-blur', length(appearance.backdropBlur));
  }
  if (appearance.borderColor) {
    dialog.style.setProperty('--fd-dialog-border-color', appearance.borderColor);
  }
  if (appearance.borderWidth !== undefined) {
    dialog.style.setProperty('--fd-dialog-border-width', length(appearance.borderWidth));
  }
  if (appearance.borderStyle) {
    dialog.style.setProperty('--fd-dialog-border-style', appearance.borderStyle);
  }
  if (appearance.shadow) {
    if (SHADOW_PRESETS.has(appearance.shadow)) dialog.dataset.fdShadow = appearance.shadow;
    else dialog.style.setProperty('--fd-dialog-shadow', appearance.shadow);
  }
}
