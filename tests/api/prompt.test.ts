import { afterEach, describe, expect, it } from 'vitest';
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
    input.value = 'ok now';
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await expect(promise).resolves.toBe('ok now');
  });

  it('shows an inline error instead of throwing when validate() rejects', async () => {
    const promise = prompt('Your age?', {
      validate: () => {
        throw new Error('boom');
      },
    });
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await Promise.resolve();
    await Promise.resolve();

    const error = document.querySelector('.fd-input-error');
    expect(error?.textContent).toBe('boom');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(promise).resolves.toBeNull();
  });

  it('submits on Enter key in the input', async () => {
    const promise = prompt('Your name?');
    const input = document.querySelector<HTMLInputElement>('.fd-input')!;
    input.value = 'Linus';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await expect(promise).resolves.toBe('Linus');
  });
});
