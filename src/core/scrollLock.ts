let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

export function lockScroll(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  const root = document.documentElement;
  const scrollbarWidth = window.innerWidth - root.clientWidth;

  originalOverflow = document.body.style.overflow;
  originalPaddingRight = document.body.style.paddingRight;

  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    const currentPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }
}

export function unlockScroll(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;

  document.body.style.overflow = originalOverflow;
  document.body.style.paddingRight = originalPaddingRight;
}

export function resetScrollLockForTests(): void {
  lockCount = 0;
  originalOverflow = '';
  originalPaddingRight = '';
}
