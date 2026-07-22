import { Dialog } from '../core/Dialog';
import { dialogStack } from '../core/DialogStack';
import { getLabels } from '../i18n/defaultLabels';
import { pluginManager } from '../plugins/PluginManager';
import type { DialogInstance, DialogOptions } from '../types';

export function open<TResult = unknown>(
  options: DialogOptions<TResult> = {},
): DialogInstance<TResult> {
  const labels = { ...getLabels(), ...options.labels };
  const dialog = new Dialog<TResult>(options, labels, dialogStack, pluginManager);
  void dialog.open();
  return dialog;
}
