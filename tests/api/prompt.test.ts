import { afterEach, describe, expect, it, vi } from 'vitest';
import { prompt } from '../../src/api/prompt';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('prompt()', () => {
  it('resolves the entered value when OK is clicked', async () => {
    const promise = prompt('Your name?');
    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    input.value = 'Ada';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBe('Ada');
  });

  it('resolves null when Cancel is clicked', async () => {
    const promise = prompt('Your name?');
    document.querySelector<HTMLButtonElement>('.fd-btn--secondary')!.click();
    await expect(promise).resolves.toBeNull();
  });

  it('resolves null when closed via Escape', async () => {
    const promise = prompt('Your name?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBeNull();
  });

  it('pre-fills the input with defaultValue', () => {
    void prompt('Your name?', { defaultValue: 'Grace' });
    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    expect(input.value).toBe('Grace');
  });

  it('blocks close and shows an inline error when validate() fails', async () => {
    const promise = prompt('Your age?', {
      validate: (value) => (value.length > 0 ? true : 'Value is required'),
    });
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await Promise.resolve();
    await Promise.resolve();

    const error = document.querySelector('.fd-input-error');
    expect(error?.textContent).toBe('Value is required');

    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error?.id);
    input.value = 'ok now';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBe('ok now');
  });

  it('provides an accessible input label', () => {
    void prompt('Your name?', { inputLabel: 'Full name' });
    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    const label = document.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    expect(label?.textContent).toBe('Full name');
  });

  it('shows a stable error when async validation rejects', async () => {
    void prompt('Value?', { validate: () => Promise.reject(new Error('network details')) });
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.fd-input-error')?.textContent).toBe(
        'Unable to validate value',
      );
    });
  });

  it('submits on Enter key in the input', async () => {
    const promise = prompt('Your name?');
    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    input.value = 'Linus';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await expect(promise).resolves.toBe('Linus');
  });
});
