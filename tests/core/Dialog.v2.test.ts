import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '../../src/core/Dialog';
import { DialogStackManager } from '../../src/core/DialogStack';
import { PluginManager } from '../../src/plugins/PluginManager';

const labels = { ok: 'OK', cancel: 'Cancel', close: 'Close' };

describe('Dialog v2 lifecycle', () => {
  it('reports typed outcome and close reason', async () => {
    const dialog = new Dialog<boolean>({}, labels, new DialogStackManager(), new PluginManager());
    await dialog.open();
    await dialog.close(true, 'button');
    await expect(dialog.whenClosed()).resolves.toBe(true);
    await expect(dialog.whenSettled()).resolves.toEqual({ result: true, reason: 'button' });
  });

  it('supports cancellable beforeClose hooks', async () => {
    const plugins = new PluginManager();
    plugins.on('beforeClose', (context) => context.preventClose?.());
    const dialog = new Dialog({}, labels, new DialogStackManager(), plugins);
    await dialog.open();
    await dialog.close();
    expect(dialog.isOpen()).toBe(true);
    plugins.off('beforeClose', vi.fn());
    await dialog.destroy();
  });

  it('closes with abort reason when its signal aborts', async () => {
    const controller = new AbortController();
    const dialog = new Dialog(
      { signal: controller.signal },
      labels,
      new DialogStackManager(),
      new PluginManager(),
    );
    await dialog.open();
    controller.abort();
    await expect(dialog.whenSettled()).resolves.toMatchObject({ reason: 'abort' });
  });

  it('uses native dialog markup', () => {
    const dialog = new Dialog({}, labels, new DialogStackManager(), new PluginManager());
    expect(dialog.element.tagName).toBe('DIALOG');
  });

  it('supports portal, initial focus, close guard, and destroy state', async () => {
    const portal = document.createElement('div');
    document.body.appendChild(portal);
    const guard = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const dialog = new Dialog(
      {
        portalTarget: portal,
        initialFocus: '.target',
        onBeforeClose: guard,
        content: (container) => {
          const button = document.createElement('button');
          button.className = 'target';
          container.appendChild(button);
        },
      },
      labels,
      new DialogStackManager(),
      new PluginManager(),
    );
    await dialog.open();
    expect(portal.contains(dialog.element)).toBe(true);
    expect(document.activeElement?.classList.contains('target')).toBe(true);
    await dialog.close();
    expect(dialog.isOpen()).toBe(true);
    await dialog.close();
    await dialog.destroy();
    expect(dialog.getState()).toBe('destroyed');
  });

  it('can start already aborted without mounting', async () => {
    const controller = new AbortController();
    controller.abort();
    const dialog = new Dialog(
      { signal: controller.signal },
      labels,
      new DialogStackManager(),
      new PluginManager(),
    );
    await dialog.open();
    await expect(dialog.whenSettled()).resolves.toMatchObject({ reason: 'abort' });
    expect(dialog.element.isConnected).toBe(false);
  });
});
