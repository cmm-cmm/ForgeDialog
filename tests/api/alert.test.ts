import { afterEach, describe, expect, it } from 'vitest';
import { alert } from '../../src/api/alert';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('alert()', () => {
  it('renders the message and role="alertdialog"', async () => {
    void alert('Something happened');
    const dialog = document.querySelector('.fd-dialog')!;
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.querySelector('.fd-dialog__message')?.textContent).toBe('Something happened');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
  });

  it('resolves when the OK button is clicked', async () => {
    const promise = alert('hi');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves when closed via Escape', async () => {
    const promise = alert('hi');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBeUndefined();
  });

  it('keeps its own OK button even if the caller passes options.buttons', async () => {
    const promise = alert('hi', { buttons: [{ text: 'Custom' }] });
    const buttons = document.querySelectorAll('.fd-dialog__footer .fd-btn');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe('OK');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBeUndefined();
  });
});
