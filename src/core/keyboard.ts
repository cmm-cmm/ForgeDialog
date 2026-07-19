export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape' || event.key === 'Esc';
}

export function isTabKey(event: KeyboardEvent): boolean {
  return event.key === 'Tab';
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}
