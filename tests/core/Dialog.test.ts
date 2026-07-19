import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from '../../src/core/Dialog';
import { DialogStackManager } from '../../src/core/DialogStack';
import { PluginManager } from '../../src/plugins/PluginManager';
import type { DialogOptions } from '../../src/types';

const labels = { ok: 'OK', cancel: 'Cancel', close: 'Close' };

function makeDialog(
  options: DialogOptions,
  stack = new DialogStackManager(),
  plugins = new PluginManager(),
) {
  return { dialog: new Dialog(options, labels, stack, plugins), stack, plugins };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('Dialog', () => {
  it('sets role, aria-modal, and aria-labelledby correctly', async () => {
    const { dialog } = makeDialog({ type: 'confirm', message: 'Are you sure?' });
    await dialog.open();
    const el = dialog.element.querySelector('.fd-dialog')!;
    expect(el.getAttribute('role')).toBe('alertdialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.hasAttribute('aria-labelledby')).toBe(true);
    expect(el.getAttribute('aria-describedby')).not.toBeNull();
  });

  it('resolves whenClosed() with the value passed to close()', async () => {
    const { dialog } = makeDialog({ type: 'confirm' });
    await dialog.open();
    const closed = dialog.whenClosed();
    await dialog.close(true);
    await expect(closed).resolves.toBe(true);
  });

  it('closes on Escape only when closeOnEscape is not false', async () => {
    const { dialog } = makeDialog({ closeOnEscape: false });
    await dialog.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    expect(dialog.isOpen()).toBe(true);
    await dialog.close();
  });

  it('closes on overlay click only when the overlay itself is the target', async () => {
    const { dialog } = makeDialog({});
    await dialog.open();
    const inner = dialog.element.querySelector('.fd-dialog')!;
    inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await Promise.resolve();
    expect(dialog.isOpen()).toBe(true);

    dialog.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    expect(dialog.isOpen()).toBe(false);
  });

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const { dialog } = makeDialog({ closeOnOverlayClick: false });
    await dialog.open();
    dialog.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    expect(dialog.isOpen()).toBe(true);
    await dialog.close();
  });

  it('runs lifecycle hooks in order: beforeOpen, afterOpen, beforeClose, afterClose', async () => {
    const plugins = new PluginManager();
    const order: string[] = [];
    plugins.on('beforeOpen', () => {
      order.push('beforeOpen');
    });
    plugins.on('afterOpen', () => {
      order.push('afterOpen');
    });
    plugins.on('beforeClose', () => {
      order.push('beforeClose');
    });
    plugins.on('afterClose', () => {
      order.push('afterClose');
    });

    const { dialog } = makeDialog({}, new DialogStackManager(), plugins);
    await dialog.open();
    await dialog.close();
    expect(order).toEqual(['beforeOpen', 'afterOpen', 'beforeClose', 'afterClose']);
  });

  it('calls onOpen/onClose/onBeforeClose option callbacks', async () => {
    const onOpen = vi.fn();
    const onBeforeClose = vi.fn();
    const onClose = vi.fn();
    const { dialog } = makeDialog({ onOpen, onBeforeClose, onClose });
    await dialog.open();
    expect(onOpen).toHaveBeenCalledWith(dialog);
    await dialog.close('result');
    expect(onBeforeClose).toHaveBeenCalledWith(dialog, 'result');
    expect(onClose).toHaveBeenCalledWith(dialog, 'result');
  });

  it('restores focus to the dialog beneath it when a stacked dialog closes', async () => {
    const stack = new DialogStackManager();
    const plugins = new PluginManager();
    const first = new Dialog(
      { buttons: [{ text: 'First', autoFocus: true }] },
      labels,
      stack,
      plugins,
    );
    await first.open();
    const firstButton = first.element.querySelector('.fd-dialog__footer button')!;
    expect(document.activeElement).toBe(firstButton);

    const second = new Dialog(
      { buttons: [{ text: 'Second', autoFocus: true }] },
      labels,
      stack,
      plugins,
    );
    await second.open();
    const secondButton = second.element.querySelector('.fd-dialog__footer button')!;
    expect(document.activeElement).toBe(secondButton);

    await second.close();
    expect(document.activeElement).toBe(firstButton);
    await first.close();
  });

  it('does not resurrect state to "open" when close() is called synchronously during open()', async () => {
    const { dialog } = makeDialog({});
    const openPromise = dialog.open();
    const closePromise = dialog.close('early');
    await Promise.all([openPromise, closePromise]);
    expect(dialog.isOpen()).toBe(false);
    await expect(dialog.whenClosed()).resolves.toBe('early');
  });

  it('does not resurrect state to "open" when close() is called mid-animateIn', async () => {
    const plugins = new PluginManager();
    const order: string[] = [];
    plugins.on('afterOpen', () => {
      order.push('afterOpen');
    });
    plugins.on('afterClose', () => {
      order.push('afterClose');
    });
    const { dialog } = makeDialog({}, new DialogStackManager(), plugins);

    const openPromise = dialog.open();
    await Promise.resolve();
    const closePromise = dialog.close('early');
    await Promise.all([openPromise, closePromise]);

    expect(dialog.isOpen()).toBe(false);
    expect(order).toEqual(['afterClose']);
    await expect(dialog.whenClosed()).resolves.toBe('early');
  });

  it('falls back to focusing the container when there is nothing focusable', async () => {
    const { dialog } = makeDialog({ closable: false });
    await dialog.open();
    const el = dialog.element.querySelector('.fd-dialog')!;
    expect(document.activeElement).toBe(el);
    await dialog.close();
  });

  it('makes the header draggable when draggable is true', async () => {
    const { dialog } = makeDialog({ draggable: true });
    await dialog.open();
    const header = dialog.element.querySelector('.fd-dialog__header')!;
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(true);
    await dialog.close();
  });

  it('does not make the header draggable by default', async () => {
    const { dialog } = makeDialog({});
    await dialog.open();
    const header = dialog.element.querySelector('.fd-dialog__header')!;
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(false);
    await dialog.close();
  });

  it('toggles draggable via update()', async () => {
    const { dialog } = makeDialog({});
    await dialog.open();
    const header = dialog.element.querySelector('.fd-dialog__header')!;
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(false);

    dialog.update({ draggable: true });
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(true);

    dialog.update({ draggable: false });
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(false);
    await dialog.close();
  });
});
