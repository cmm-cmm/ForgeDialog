import { getLabels } from '../i18n/defaultLabels';
import type { DialogOptions } from '../types';
import { open } from './open';

export function confirm(message: string, options: Partial<DialogOptions> = {}): Promise<boolean> {
  const labels = { ...getLabels(), ...options.labels };
  const instance = open({
    type: 'confirm',
    role: 'alertdialog',
    message,
    buttons: [
      { text: labels.cancel, role: 'secondary', onClick: (i) => i.close(false) },
      { text: labels.ok, role: 'primary', autoFocus: true, onClick: (i) => i.close(true) },
    ],
    ...options,
  });
  return instance.whenClosed().then((result) => Boolean(result));
}
