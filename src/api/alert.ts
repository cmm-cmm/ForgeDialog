import { getLabels } from '../i18n/defaultLabels';
import type { DialogOptions } from '../types';
import { open } from './open';

export function alert(message: string, options: Partial<DialogOptions> = {}): Promise<void> {
  const labels = { ...getLabels(), ...options.labels };
  const instance = open({
    type: 'alert',
    role: 'alertdialog',
    message,
    buttons: [{ text: labels.ok, role: 'primary', autoFocus: true, onClick: (i) => i.close() }],
    ...options,
  });
  return instance.whenClosed().then(() => undefined);
}
