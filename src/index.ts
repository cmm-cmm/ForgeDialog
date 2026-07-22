import type { HookFn, HookName, Plugin } from './types';
import { pluginManager } from './plugins/PluginManager';
import './interactions-entry';
import './animations-entry';

declare const __FORGEDIALOG_VERSION__: string;

export { alert } from './api/alert';
export { confirm } from './api/confirm';
export { form } from './api/form';
export { open } from './api/open';
export { prompt } from './api/prompt';
export { bottomSheet, drawer, lightbox, loading } from './api/presentation';
export type { LightboxOptions, LoadingController } from './api/presentation';
export {
  clearNotificationHistory,
  getNotificationHistory,
  notificationCenter,
  toast,
} from './api/toast';
export type { ToastHandle, ToastOptions, ToastTone } from './api/toast';
export { commandPalette } from './api/commandPalette';
export type { Command } from './api/commandPalette';
export { wizard } from './workflow/wizard';
export { wizard as formWizard } from './api/wizard';
export type { WizardContext, WizardController, WizardOptions, WizardStep } from './workflow/wizard';

export { getLabels, setLabels } from './i18n/defaultLabels';
export { getTheme, getThemePreset, setTheme, setThemePreset } from './theme/index';
export type { ThemeMode, ThemePreset } from './theme/index';

export type {
  AnimationPreset,
  ButtonConfig,
  ButtonRole,
  CloseReason,
  DialogOutcome,
  DialogAppearance,
  DialogDragEvent,
  DialogPosition,
  DialogPresentation,
  DialogSize,
  DialogState,
  DialogInstance,
  DialogLabels,
  DialogOptions,
  DialogRole,
  DialogType,
  DraggableOptions,
  FormFieldConfig,
  FormFieldOption,
  FormFieldType,
  FormFieldValue,
  FormOptions,
  FormValues,
  FormWizardOptions,
  FormWizardStep,
  HookContext,
  HookFn,
  HookName,
  InferFormValues,
  InferWizardValues,
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

export const VERSION: string = __FORGEDIALOG_VERSION__;
