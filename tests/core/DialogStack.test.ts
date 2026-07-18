import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogStackManager } from '../../src/core/DialogStack';
import { resetScrollLockForTests } from '../../src/core/scrollLock';

function fakeDialog(closeOnEscape = true) {
  const close = vi.fn(async () => {});
  return {
    close,
    allowsEscapeClose: () => closeOnEscape,
  } as unknown as import('../../src/core/Dialog').Dialog & { close: typeof close };
}

afterEach(() => {
  resetScrollLockForTests();
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('DialogStackManager', () => {
  it('assigns increasing z-index values as dialogs are pushed', () => {
    const stack = new DialogStackManager();
    const z1 = stack.push(fakeDialog());
    const z2 = stack.push(fakeDialog());
    expect(z2).toBeGreaterThan(z1);
  });

  it('tracks the top of the stack', () => {
    const stack = new DialogStackManager();
    const d1 = fakeDialog();
    const d2 = fakeDialog();
    stack.push(d1);
    stack.push(d2);
    expect(stack.top()).toBe(d2);
    stack.remove(d2);
    expect(stack.top()).toBe(d1);
  });

  it('locks scroll on first push and unlocks when the stack empties', () => {
    const stack = new DialogStackManager();
    const d1 = fakeDialog();
    stack.push(d1);
    expect(document.body.style.overflow).toBe('hidden');
    stack.remove(d1);
    expect(document.body.style.overflow).toBe('');
  });

  it('closeTop closes only the top dialog', () => {
    const stack = new DialogStackManager();
    const d1 = fakeDialog();
    const d2 = fakeDialog();
    stack.push(d1);
    stack.push(d2);
    stack.closeTop();
    expect(d2.close).toHaveBeenCalledTimes(1);
    expect(d1.close).not.toHaveBeenCalled();
  });

  it('closeAll closes every dialog top-down', () => {
    const stack = new DialogStackManager();
    const d1 = fakeDialog();
    const d2 = fakeDialog();
    stack.push(d1);
    stack.push(d2);
    stack.closeAll();
    expect(d1.close).toHaveBeenCalledTimes(1);
    expect(d2.close).toHaveBeenCalledTimes(1);
  });

  it('routes Escape only to the top dialog when it allows escape-close', () => {
    const stack = new DialogStackManager();
    const d1 = fakeDialog(true);
    const d2 = fakeDialog(false);
    stack.push(d1);
    stack.push(d2);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(d2.close).not.toHaveBeenCalled();
    expect(d1.close).not.toHaveBeenCalled();

    stack.remove(d2);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(d1.close).toHaveBeenCalledTimes(1);
  });
});
