import { afterEach, describe, expect, it } from 'vitest';
import { lockScroll, resetScrollLockForTests, unlockScroll } from '../../src/core/scrollLock';

afterEach(() => {
  resetScrollLockForTests();
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('scrollLock', () => {
  it('locks and unlocks body overflow', () => {
    lockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    unlockScroll();
    expect(document.body.style.overflow).toBe('');
  });

  it('only unlocks once all locks are released', () => {
    lockScroll();
    lockScroll();
    unlockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    unlockScroll();
    expect(document.body.style.overflow).toBe('');
  });
});
