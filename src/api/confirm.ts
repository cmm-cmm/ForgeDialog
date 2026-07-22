import { getLabels } from '../i18n/defaultLabels';
import type { DialogOptions } from '../types';
import { open } from './open';

export function confirm(message: string, options: Partial<DialogOptions> = {}): Promise<boolean> {
  const labels = { ...getLabels(), ...options.labels };
  const instance = open({
    ...options,
    type: 'confirm',
    role: 'alertdialog',
    message,
    buttons: [
      { text: labels.cancel, role: 'secondary', autoFocus: true, onClick: (i) => i.close(false) },
      { text: labels.ok, role: 'primary', onClick: (i) => i.close(true) },
    ],
  });
  return instance.whenClosed().then((result) => Boolean(result));
}
