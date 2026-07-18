import type { HookContext, HookFn, HookName, Plugin, PluginApi } from '../types';

export class PluginManager {
  private readonly hooks = new Map<HookName, HookFn[]>();
  private readonly plugins = new Set<string>();

  private readonly api: PluginApi = {
    on: (hook, fn) => this.on(hook, fn),
    off: (hook, fn) => this.off(hook, fn),
  };

  use(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) return;
    this.plugins.add(plugin.name);

    if (plugin.hooks) {
      for (const [hook, fn] of Object.entries(plugin.hooks) as [HookName, HookFn | undefined][]) {
        if (fn) this.on(hook, fn);
      }
    }

    plugin.install?.(this.api);
  }

  on(hook: HookName, fn: HookFn): void {
    const list = this.hooks.get(hook) ?? [];
    list.push(fn);
    this.hooks.set(hook, list);
  }

  off(hook: HookName, fn: HookFn): void {
    const list = this.hooks.get(hook);
    if (!list) return;
    const index = list.indexOf(fn);
    if (index !== -1) list.splice(index, 1);
  }

  async runHook(name: HookName, ctx: HookContext): Promise<void> {
    const list = this.hooks.get(name);
    if (!list || list.length === 0) return;
    for (const fn of [...list]) {
      await fn(ctx);
    }
  }
}

export const pluginManager = new PluginManager();
