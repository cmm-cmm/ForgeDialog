import { describe, expect, it, vi } from 'vitest';
import { PluginManager } from '../../src/plugins/PluginManager';
import type { DialogInstance, HookContext } from '../../src/types';

function makeCtx(): HookContext {
  return { instance: {} as DialogInstance, options: {} };
}

describe('PluginManager', () => {
  it('invokes hooks registered via on() in registration order', async () => {
    const manager = new PluginManager();
    const order: number[] = [];
    manager.on('beforeOpen', () => {
      order.push(1);
    });
    manager.on('beforeOpen', () => {
      order.push(2);
    });
    await manager.runHook('beforeOpen', makeCtx());
    expect(order).toEqual([1, 2]);
  });

  it('awaits async hooks before continuing', async () => {
    const manager = new PluginManager();
    const order: string[] = [];
    manager.on('afterOpen', async () => {
      order.push('start-async');
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push('end-async');
    });
    manager.on('afterOpen', () => {
      order.push('sync');
    });
    await manager.runHook('afterOpen', makeCtx());
    expect(order).toEqual(['start-async', 'end-async', 'sync']);
  });

  it('registers a plugin object with hooks and calls install() once', () => {
    const install = vi.fn();
    const hookFn = vi.fn();
    const manager = new PluginManager();
    manager.use({ name: 'test-plugin', install, hooks: { beforeClose: hookFn } });
    manager.use({ name: 'test-plugin', install, hooks: { beforeClose: hookFn } });

    expect(install).toHaveBeenCalledTimes(1);
  });

  it('runs hooks registered by a plugin', async () => {
    const manager = new PluginManager();
    const hookFn = vi.fn();
    manager.use({ name: 'p', hooks: { beforeDestroy: hookFn } });
    await manager.runHook('beforeDestroy', makeCtx());
    expect(hookFn).toHaveBeenCalledTimes(1);
  });

  it('supports off() to remove a hook', async () => {
    const manager = new PluginManager();
    const fn = vi.fn();
    manager.on('afterClose', fn);
    manager.off('afterClose', fn);
    await manager.runHook('afterClose', makeCtx());
    expect(fn).not.toHaveBeenCalled();
  });

  it('exposes on/off to plugins via install(api)', async () => {
    const manager = new PluginManager();
    const fn = vi.fn();
    manager.use({
      name: 'sugar',
      install: (api) => {
        api.on('beforeOpen', fn);
      },
    });
    await manager.runHook('beforeOpen', makeCtx());
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
