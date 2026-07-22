import { describe, expect, it, vi } from 'vitest';
import { buildDialogDom } from '../../src/core/domBuilder';
import type { DialogInstance, DialogOptions } from '../../src/types';

const labels = { ok: 'OK', cancel: 'Cancel', close: 'Close' };

function noInstance(): DialogInstance | null {
  return null;
}

describe('buildDialogDom', () => {
  it('renders a visually-hidden fallback title when none is given', () => {
    const { dialog } = buildDialogDom('d1', { type: 'alert' }, 'alertdialog', labels, noInstance);
    const title = dialog.querySelector('.fd-dialog__title')!;
    expect(title.textContent).toBe('Alert');
    expect(title.className).toContain('fd-dialog__title--visually-hidden');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });

  it('renders an explicit title without the visually-hidden class', () => {
    const { dialog } = buildDialogDom(
      'd2',
      { title: 'Custom title' },
      'dialog',
      labels,
      noInstance,
    );
    const title = dialog.querySelector('.fd-dialog__title')!;
    expect(title.textContent).toBe('Custom title');
    expect(title.className).not.toContain('visually-hidden');
  });

  it('sets role and aria-modal', () => {
    const { dialog } = buildDialogDom('d3', {}, 'alertdialog', labels, noInstance);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('sets aria-describedby only when there is body content', () => {
    const withMessage = buildDialogDom('d4', { message: 'hi' }, 'dialog', labels, noInstance);
    expect(withMessage.dialog.getAttribute('aria-describedby')).toBe('d4-desc');

    const withoutContent = buildDialogDom('d5', {}, 'dialog', labels, noInstance);
    expect(withoutContent.dialog.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders a close button unless closable is false', () => {
    const withClose = buildDialogDom('d6', {}, 'dialog', labels, noInstance);
    expect(withClose.dialog.querySelector('.fd-dialog__close')).not.toBeNull();

    const withoutClose = buildDialogDom('d7', { closable: false }, 'dialog', labels, noInstance);
    expect(withoutClose.dialog.querySelector('.fd-dialog__close')).toBeNull();
  });

  it('renders buttons and wires their onClick handler to the instance', () => {
    const onClick = vi.fn();
    const fakeInstance = {} as DialogInstance;
    const options: DialogOptions = {
      buttons: [{ text: 'OK', role: 'primary', onClick }],
    };
    const { buttonElements } = buildDialogDom('d8', options, 'dialog', labels, () => fakeInstance);
    expect(buttonElements).toHaveLength(1);
    expect(buttonElements[0].textContent).toBe('OK');
    expect(buttonElements[0].className).toContain('fd-btn--primary');
    buttonElements[0].click();
    expect(onClick).toHaveBeenCalledWith(fakeInstance);
  });

  it('invokes a function content slot with the body container', () => {
    const contentFn = vi.fn((container: HTMLElement) => {
      container.appendChild(document.createElement('input'));
    });
    const { body } = buildDialogDom('d9', { content: contentFn }, 'dialog', labels, noInstance);
    expect(contentFn).toHaveBeenCalledWith(body);
    expect(body.querySelector('input')).not.toBeNull();
  });

  it('renders string content as text and requires unsafeHtml for markup', () => {
    const safe = buildDialogDom(
      'd10',
      { content: '<img src=x onerror=alert(1)>' },
      'dialog',
      labels,
      noInstance,
    );
    expect(safe.body.querySelector('img')).toBeNull();
    expect(safe.body.textContent).toContain('<img');

    const trusted = buildDialogDom(
      'd11',
      { unsafeHtml: '<strong>Trusted</strong>' },
      'dialog',
      labels,
      noInstance,
    );
    expect(trusted.body.querySelector('strong')?.textContent).toBe('Trusted');
  });

  it('closes when a button opts into closesDialog', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const fakeInstance = { close } as unknown as DialogInstance;
    const { buttonElements } = buildDialogDom(
      'd12',
      { buttons: [{ text: 'Done', closesDialog: true }] },
      'dialog',
      labels,
      () => fakeInstance,
    );
    buttonElements[0].click();
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it('reports async button handler failures', async () => {
    const error = new Error('button failed');
    const onError = vi.fn();
    const fakeInstance = {} as DialogInstance;
    const { buttonElements } = buildDialogDom(
      'd13',
      { buttons: [{ text: 'Fail', onClick: () => Promise.reject(error) }] },
      'dialog',
      labels,
      () => fakeInstance,
      onError,
    );
    buttonElements[0].click();
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });
});
