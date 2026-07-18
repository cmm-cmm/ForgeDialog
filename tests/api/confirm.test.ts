import { afterEach, describe, expect, it } from 'vitest';
import { confirm } from '../../src/api/confirm';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('confirm()', () => {
  it('resolves true when OK is clicked', async () => {
    const promise = confirm('Proceed?');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when Cancel is clicked', async () => {
    const promise = confirm('Proceed?');
    document.querySelector<HTMLButtonElement>('.fd-btn--secondary')!.click();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when closed via Escape', async () => {
    const promise = confirm('Proceed?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when closed via overlay click', async () => {
    const promise = confirm('Proceed?');
    const overlay = document.querySelector('.fd-overlay')!;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await expect(promise).resolves.toBe(false);
  });
});
