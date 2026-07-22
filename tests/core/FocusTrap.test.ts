import { beforeEach, describe, expect, it } from 'vitest';
import { FocusTrap } from '../../src/core/FocusTrap';

function pressTab(shiftKey = false) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }));
}

describe('FocusTrap', () => {
  let outsideButton: HTMLButtonElement;
  let container: HTMLElement;
  let first: HTMLButtonElement;
  let last: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    outsideButton = document.createElement('button');
    outsideButton.textContent = 'outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    container = document.createElement('div');
    first = document.createElement('button');
    first.textContent = 'first';
    const middle = document.createElement('button');
    middle.textContent = 'middle';
    last = document.createElement('button');
    last.textContent = 'last';
    container.append(first, middle, last);
    document.body.appendChild(container);
  });

  it('focuses the first focusable element on activate', () => {
    const trap = new FocusTrap(container);
    trap.activate();
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it('falls back to the container itself when there is nothing focusable', () => {
    const empty = document.createElement('div');
    document.body.appendChild(empty);
    const trap = new FocusTrap(empty);
    trap.activate();
    expect(empty.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(empty);
    trap.deactivate();
  });

  it('wraps focus from last to first on Tab', () => {
    const trap = new FocusTrap(container);
    trap.activate();
    last.focus();
    pressTab(false);
    expect(document.activeElement).toBe(first);
    trap.deactivate();
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const trap = new FocusTrap(container);
    trap.activate();
    first.focus();
    pressTab(true);
    expect(document.activeElement).toBe(last);
    trap.deactivate();
  });

  it('restores focus to the previously focused element on deactivate', () => {
    const trap = new FocusTrap(container);
    trap.activate();
    trap.deactivate();
    expect(document.activeElement).toBe(outsideButton);
  });

  it('can defer focus restoration until a native dialog has been removed', () => {
    const trap = new FocusTrap(container);
    trap.activate();
    trap.deactivate(false);
    expect(document.activeElement).toBe(first);
    trap.restoreFocus();
    expect(document.activeElement).toBe(outsideButton);
  });

  it('ignores Tab events when focus is outside the trapped container', () => {
    const other = document.createElement('div');
    const otherButton = document.createElement('button');
    other.appendChild(otherButton);
    document.body.appendChild(other);

    const trap = new FocusTrap(container);
    trap.activate();
    otherButton.focus();
    pressTab(false);
    expect(document.activeElement).toBe(otherButton);
    trap.deactivate();
  });
});
