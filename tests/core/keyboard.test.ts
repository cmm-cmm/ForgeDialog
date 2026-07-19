import { describe, expect, it } from 'vitest';
import { getFocusableElements, isEscapeKey, isTabKey } from '../../src/core/keyboard';

describe('keyboard utils', () => {
  it('detects Escape key', () => {
    expect(isEscapeKey(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe(true);
    expect(isEscapeKey(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
  });

  it('detects Tab key', () => {
    expect(isTabKey(new KeyboardEvent('keydown', { key: 'Tab' }))).toBe(true);
    expect(isTabKey(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
  });

  it('finds focusable elements within a container', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>One</button>
      <button disabled>Two</button>
      <input type="text" />
      <div tabindex="-1">skip</div>
      <a href="#">link</a>
    `;
    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(3);
  });
});
