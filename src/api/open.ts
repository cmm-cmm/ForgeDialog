import { Dialog } from '../core/Dialog';
import { dialogStack } from '../core/DialogStack';
import { getLabels } from '../i18n/defaultLabels';
import { pluginManager } from '../plugins/PluginManager';
import type { DialogInstance, DialogOptions } from '../types';

export function open(options: DialogOptions = {}): DialogInstance {
  const labels = { ...getLabels(), ...options.labels };
  const dialog = new Dialog(options, labels, dialogStack, pluginManager);
  void dialog.open();
  return dialog;
}
