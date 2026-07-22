import { afterEach, describe, expect, it } from 'vitest';
import { alert } from '../../src/api/alert';
import { resetDialogStackForTests } from '../../src/core/DialogStack';
import { resetScrollLockForTests } from '../../src/core/scrollLock';
import { getLabels, resetLabelsForTests, setLabels } from '../../src/i18n/defaultLabels';

afterEach(() => {
  resetLabelsForTests();
  resetDialogStackForTests();
  resetScrollLockForTests();
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('i18n labels', () => {
  it('defaults to English labels', () => {
    expect(getLabels()).toEqual({
      ok: 'OK',
      cancel: 'Cancel',
      close: 'Close',
      promptPlaceholder: '',
      submit: 'Submit',
      fieldRequired: 'This field is required.',
    });
  });

  it('setLabels overrides labels globally for subsequent dialogs', () => {
    setLabels({ ok: 'Dồng ý' });
    void alert('hi');
    const button = document.querySelector('.fd-btn--primary')!;
    expect(button.textContent).toBe('Dồng ý');
  });

  it('per-call options.labels overrides the global default for a single dialog only', async () => {
    setLabels({ ok: 'Global OK' });
    const firstPromise = alert('first', { labels: { ok: 'Local OK' } });
    expect(document.querySelector('.fd-btn--primary')!.textContent).toBe('Local OK');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await firstPromise;

    void alert('second');
    expect(document.querySelector('.fd-btn--primary')!.textContent).toBe('Global OK');
  });
});
