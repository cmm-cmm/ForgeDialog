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

  it('skips hidden inputs, which cannot receive focus', () => {
    const container = document.createElement('div');
    container.innerHTML = '<input type="hidden" name="csrf" /><button>Send</button>';
    document.body.appendChild(container);

    const focusable = getFocusableElements(container);
    expect(focusable.map((element) => element.tagName)).toEqual(['BUTTON']);

    // Regression: focusing a hidden input silently leaves focus on <body>,
    // which let focus escape the dialog entirely.
    focusable[0].focus();
    expect(document.activeElement).toBe(focusable[0]);

    container.remove();
  });

  it('skips elements inside hidden, inert, or aria-hidden subtrees', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div hidden><button>Hidden</button></div>
      <div inert><button>Inert</button></div>
      <div aria-hidden="true"><button>Aria hidden</button></div>
      <button>Visible</button>
    `;
    const focusable = getFocusableElements(container);
    expect(focusable.map((element) => element.textContent)).toEqual(['Visible']);
  });

  it('includes summary, iframe, media, and contenteditable targets', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <details><summary>More</summary><p>body</p></details>
      <iframe title="frame"></iframe>
      <video controls></video>
      <div contenteditable="true">edit</div>
      <div contenteditable="false">static</div>
    `;
    const focusable = getFocusableElements(container);
    expect(focusable.map((element) => element.tagName)).toEqual([
      'SUMMARY',
      'IFRAME',
      'VIDEO',
      'DIV',
    ]);
  });
});
