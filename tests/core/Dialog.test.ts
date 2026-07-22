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
    plugins.on('beforeDestroy', () => {
      order.push('beforeDestroy');
    });

    const { dialog } = makeDialog({}, new DialogStackManager(), plugins);
    await dialog.open();
    await dialog.close();
    expect(order).toEqual([
      'beforeOpen',
      'afterOpen',
      'beforeClose',
      'beforeDestroy',
      'afterClose',
    ]);
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

  it('falls back to focusing the container when there is nothing focusable', async () => {
    const { dialog } = makeDialog({ closable: false });
    await dialog.open();
    const el = dialog.element.querySelector('.fd-dialog')!;
    expect(document.activeElement).toBe(el);
    await dialog.close();
  });

  it('does not return to open state when closed during beforeOpen', async () => {
    const plugins = new PluginManager();
    let release!: () => void;
    plugins.on('beforeOpen', () => new Promise<void>((resolve) => (release = resolve)));
    const { dialog } = makeDialog({}, new DialogStackManager(), plugins);

    const opening = dialog.open();
    const closing = dialog.close('early');
    release();
    await Promise.all([opening, closing]);

    expect(dialog.isOpen()).toBe(false);
    expect(dialog.element.isConnected).toBe(false);
    await expect(dialog.whenClosed()).resolves.toBe('early');
  });

  it('cleans up and reports lifecycle hook failures', async () => {
    const error = new Error('plugin failed');
    const onError = vi.fn();
    const plugins = new PluginManager();
    plugins.on('beforeClose', () => {
      throw error;
    });
    const { dialog, stack } = makeDialog({ onError }, new DialogStackManager(), plugins);
    await dialog.open();
    await dialog.close();

    expect(onError).toHaveBeenCalledWith(error, dialog);
    expect(dialog.element.isConnected).toBe(false);
    expect(stack.size()).toBe(0);
    await expect(dialog.whenClosed()).resolves.toBeUndefined();
  });

  it('updates aria-describedby when body content changes', async () => {
    const { dialog } = makeDialog({});
    await dialog.open();
    const el = dialog.element.querySelector<HTMLElement>('.fd-dialog')!;
    expect(el.hasAttribute('aria-describedby')).toBe(false);
    dialog.update({ message: 'Now described' });
    expect(el.getAttribute('aria-describedby')).toBe(`${dialog.id}-desc`);
    dialog.update({ message: undefined, content: undefined });
    expect(el.hasAttribute('aria-describedby')).toBe(false);
    await dialog.close();
  });

  it('updates scoped appearance and exposes draggable position controls', async () => {
    const { dialog } = makeDialog({
      draggable: { initialPosition: { x: 10, y: 12 } },
      appearance: { opacity: 0.75, borderColor: 'rebeccapurple' },
    });
    const el = dialog.element.querySelector<HTMLElement>('.fd-dialog')!;
    expect(el.style.getPropertyValue('--fd-dialog-opacity')).toBe('75%');
    expect(dialog.getPosition()).toEqual({ x: 10, y: 12 });
    expect(dialog.setPosition({ x: 20, y: 24 })).toEqual({ x: 20, y: 24 });
    dialog.resetPosition();
    expect(dialog.getPosition()).toEqual({ x: 10, y: 12 });
    dialog.update({ appearance: { shadow: 'none' }, draggable: false });
    expect(el.style.getPropertyValue('--fd-dialog-opacity')).toBe('');
    expect(el.dataset.fdShadow).toBe('none');
    expect(dialog.getPosition()).toEqual({ x: 0, y: 0 });
  });

  it('updates layout classes and sanitized HTML at runtime', () => {
    const { dialog } = makeDialog({
      size: 'sm',
      presentation: 'drawer-left',
      className: 'before extra',
      html: '<em>before</em>',
      sanitizeHtml: (html) => html,
    });
    const el = dialog.element.querySelector<HTMLElement>('.fd-dialog')!;
    dialog.update({
      size: 'lg',
      presentation: 'lightbox',
      className: 'after',
      html: '<strong>after</strong>',
    });
    expect(el.classList).toContain('fd-dialog--lg');
    expect(el.classList).toContain('fd-dialog--lightbox');
    expect(el.classList).toContain('after');
    expect(el.classList).not.toContain('before');
    expect(el.querySelector('strong')?.textContent).toBe('after');

    dialog.update({ size: undefined, presentation: undefined, className: undefined });
    expect(el.classList).toContain('fd-dialog--md');
    expect(el.classList).toContain('fd-dialog--modal');
    expect(el.classList).not.toContain('after');
  });

  it('resolves custom drag handles and disables generic dragging for bottom sheets', () => {
    const selectorDialog = makeDialog({
      draggable: { handle: '.grab' },
      content: (container) => {
        const handle = document.createElement('div');
        handle.className = 'grab';
        container.append(handle);
      },
    }).dialog;
    expect(selectorDialog.element.querySelector('.grab')?.classList).toContain(
      'fd-dialog__header--draggable',
    );

    const external = document.createElement('div');
    const elementDialog = makeDialog({ draggable: { handle: external } }).dialog;
    expect(external.classList).toContain('fd-dialog__header--draggable');
    elementDialog.update({ draggable: undefined });
    expect(elementDialog.getPosition()).toEqual({ x: 0, y: 0 });
    expect(elementDialog.setPosition({ x: 8, y: 9 })).toEqual({ x: 0, y: 0 });
    elementDialog.resetPosition();

    const sheet = makeDialog({ presentation: 'bottom-sheet', draggable: true }).dialog;
    expect(sheet.element.querySelector('.fd-dialog__header--draggable')).toBeNull();
  });
});
