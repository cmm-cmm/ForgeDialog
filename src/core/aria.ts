import type { DialogRole, DialogType } from '../types';

export function resolveRole(type: DialogType, explicit?: DialogRole): DialogRole {
  if (explicit) return explicit;
  return type === 'alert' || type === 'confirm' ? 'alertdialog' : 'dialog';
}

export function fallbackTitleForType(type: DialogType): string {
  switch (type) {
    case 'alert':
      return 'Alert';
    case 'confirm':
      return 'Confirm';
    case 'prompt':
      return 'Prompt';
    case 'form':
      return 'Form';
    case 'wizard':
      return 'Wizard';
    default:
      return 'Dialog';
  }
}
