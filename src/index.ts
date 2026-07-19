import type { HookFn, HookName, Plugin } from './types';
import { pluginManager } from './plugins/PluginManager';

export { alert } from './api/alert';
export { confirm } from './api/confirm';
export { open } from './api/open';
export { prompt } from './api/prompt';

export { getLabels, setLabels } from './i18n/defaultLabels';
export { getTheme, setTheme } from './theme/index';
export type { ThemeMode } from './theme/index';

export type {
  AnimationPreset,
  ButtonConfig,
  ButtonRole,
  DialogInstance,
  DialogLabels,
  DialogOptions,
  DialogRole,
  DialogType,
  HookContext,
  HookFn,
  HookName,
  Plugin,
  PluginApi,
  PromptOptions,
} from './types';

export function registerPlugin(plugin: Plugin): void {
  pluginManager.use(plugin);
}

export function on(hook: HookName, fn: HookFn): void {
  pluginManager.on(hook, fn);
}

export function off(hook: HookName, fn: HookFn): void {
  pluginManager.off(hook, fn);
}

export const VERSION = '0.1.0';
