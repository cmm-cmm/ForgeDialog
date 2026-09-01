import type { DialogAppearance, DialogHoverAppearance, DialogRadius, DialogShadow } from '../types';
import {
  type AppearanceApplier,
  type AppearanceValue,
  type Formatter,
  HOVER_PREFIX,
  PREFIX,
  SHADOW_PRESETS,
  clamp,
  length,
  percent,
  text,
} from './appearance-basic';

type Field<T> = readonly [keyof T & string, string, Formatter];

const ratio: Formatter = (value) => String(clamp(Number(value)));

/**
 * Resolves a radius into a `border-radius` value. A per-corner object leaves
 * omitted corners on the theme radius rather than collapsing them to zero.
 */
function resolveRadius(radius: DialogRadius): string {
  if (typeof radius === 'number' || typeof radius === 'string') return length(radius);
  const corner = (value: number | string | undefined): string =>
    value === undefined ? 'var(--fd-radius)' : length(value);
  return [radius.topLeft, radius.topRight, radius.bottomRight, radius.bottomLeft]
    .map(corner)
    .join(' ');
}

const radiusValue: Formatter = (value) => resolveRadius(value as DialogRadius);

function applyFields<T extends object>(
  element: HTMLElement,
  prefix: string,
  source: T | undefined,
  fields: ReadonlyArray<Field<T>>,
): void {
  for (const [key, suffix, format] of fields) {
    const value = source?.[key];
    if (value === undefined) element.style.removeProperty(prefix + suffix);
    else element.style.setProperty(prefix + suffix, format(value as AppearanceValue));
  }
}

const DEFAULT_ANGLE = 180;
const DEFAULT_DISTANCE = 20;
const DEFAULT_BLUR = 60;
const DEFAULT_COLOR = 'rgb(15 17 21)';
const DEFAULT_STRENGTH = 0.25;

const time: Formatter = (value) =>
  typeof value === 'number' ? `${Math.max(0, value)}ms` : String(value);
const scale: Formatter = (value) => String(Math.max(0, Number(value)));
/** A positive lift raises the dialog, so the offset is negated. */
const lift: Formatter = (value) =>
  typeof value === 'number' ? `${-value}px` : `calc(-1 * ${String(value)})`;

const BASE_FIELDS: ReadonlyArray<Field<DialogAppearance>> = [
  ['opacity', 'opacity', percent],
  ['surfaceColor', 'surface-color', text],
  ['titleColor', 'title-color', text],
  ['titleBackground', 'title-background', text],
  ['titleOpacity', 'title-opacity', ratio],
  ['contentColor', 'content-color', text],
  ['contentOpacity', 'content-opacity', ratio],
  ['borderColor', 'border-color', text],
  ['borderOpacity', 'border-opacity', percent],
  ['borderWidth', 'border-width', length],
  ['borderStyle', 'border-style', text],
  ['radius', 'radius', radiusValue],
];

const HOVER_FIELDS: ReadonlyArray<Field<DialogHoverAppearance>> = [
  ['opacity', 'opacity', percent],
  ['surfaceColor', 'surface-color', text],
  ['titleColor', 'title-color', text],
  ['titleBackground', 'title-background', text],
  ['contentColor', 'content-color', text],
  ['borderColor', 'border-color', text],
  ['radius', 'radius', radiusValue],
  ['lift', 'lift', lift],
  ['scale', 'scale', scale],
  ['duration', 'duration', time],
];

/** Blends `color` down to `strength` (0..1) without parsing it. */
function fade(color: string, strength: number): string {
  return `color-mix(in srgb, ${color} ${percent(strength)}, transparent)`;
}

/**
 * Resolves a composed shadow into a `box-shadow` value. `angle` is measured
 * clockwise from "cast upwards", so 180deg drops the shadow straight down.
 */
function composeShadow(shadow: Exclude<DialogShadow, string>): string {
  const radians = ((shadow.angle ?? DEFAULT_ANGLE) * Math.PI) / 180;
  const blur = length(shadow.blur ?? DEFAULT_BLUR);
  const spread = length(shadow.spread ?? 0);
  const color = fade(shadow.color ?? DEFAULT_COLOR, shadow.opacity ?? DEFAULT_STRENGTH);
  const inset = shadow.inset ? 'inset ' : '';
  const tail = `${blur} ${spread} ${color}`;
  const x = Math.sin(radians);
  const y = -Math.cos(radians);

  if (typeof shadow.distance === 'string') {
    // A CSS length cannot be projected onto an angle, so honor the axis the
    // angle points at and let the author's unit through untouched.
    const horizontal = Math.abs(x) > Math.abs(y);
    const along = (horizontal ? x : y) < 0 ? `calc(-1 * ${shadow.distance})` : shadow.distance;
    return horizontal ? `${inset}${along} 0 ${tail}` : `${inset}0 ${along} ${tail}`;
  }

  const distance = shadow.distance ?? DEFAULT_DISTANCE;
  const round = (value: number): string => `${Math.round(value * distance * 100) / 100}px`;
  return `${inset}${round(x)} ${round(y)} ${tail}`;
}

function applyShadow(dialog: HTMLElement, shadow: DialogShadow, hover: boolean): void {
  const property = hover ? `${HOVER_PREFIX}shadow` : `${PREFIX}shadow`;
  if (typeof shadow !== 'string') {
    dialog.style.setProperty(property, composeShadow(shadow));
    return;
  }
  // Presets live in CSS so they stay themeable; anything else is a raw value.
  if (!SHADOW_PRESETS.has(shadow)) dialog.style.setProperty(property, shadow);
  else if (hover) dialog.dataset.fdHoverShadow = shadow;
  else dialog.dataset.fdShadow = shadow;
}

export const applyAppearance: AppearanceApplier = (overlay, dialog, appearance) => {
  const hover = appearance?.hover;

  applyFields(dialog, PREFIX, appearance, BASE_FIELDS);
  applyFields(dialog, HOVER_PREFIX, hover, HOVER_FIELDS);
  dialog.style.removeProperty(`${PREFIX}shadow`);
  dialog.style.removeProperty(`${HOVER_PREFIX}shadow`);
  dialog.removeAttribute('data-fd-shadow');
  dialog.removeAttribute('data-fd-hover-shadow');
  overlay.style.removeProperty('--fd-overlay-opacity');
  overlay.style.removeProperty('--fd-backdrop-blur');

  // A header that paints its own background needs the bottom padding a bare
  // header would otherwise borrow from the body.
  if (appearance?.titleBackground ?? hover?.titleBackground) dialog.dataset.fdTitleBackground = '';
  else dialog.removeAttribute('data-fd-title-background');

  // Marks the dialog as opted into hover styling so every other dialog keeps
  // its entirely static appearance.
  if (hover) dialog.dataset.fdHover = '';
  else dialog.removeAttribute('data-fd-hover');
  if (!appearance) return;

  if (appearance.overlayOpacity !== undefined) {
    overlay.style.setProperty('--fd-overlay-opacity', percent(appearance.overlayOpacity));
  }
  if (appearance.backdropBlur !== undefined) {
    overlay.style.setProperty('--fd-backdrop-blur', length(appearance.backdropBlur));
  }
  if (appearance.shadow) applyShadow(dialog, appearance.shadow, false);
  if (hover?.shadow) applyShadow(dialog, hover.shadow, true);
};
