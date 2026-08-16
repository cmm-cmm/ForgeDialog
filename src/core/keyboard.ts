export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'details > summary:first-of-type',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Ancestors that remove their whole subtree from the tab order. */
const HIDDEN_SUBTREE_SELECTOR = '[hidden],[inert],[aria-hidden="true"]';

/**
 * Attribute-based visibility check. Layout-based checks (`offsetParent`,
 * `getClientRects`) are deliberately avoided so the trap behaves identically in
 * jsdom, which has no layout engine.
 */
function isTabbable(element: HTMLElement): boolean {
  return element.closest(HIDDEN_SUBTREE_SELECTOR) === null;
}

export function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape' || event.key === 'Esc';
}

export function isTabKey(event: KeyboardEvent): boolean {
  return event.key === 'Tab';
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
}
