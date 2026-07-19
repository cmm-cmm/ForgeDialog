import type { DialogLabels } from '../types';

const defaultLabels: DialogLabels = {
  ok: 'OK',
  cancel: 'Cancel',
  close: 'Close',
  promptPlaceholder: '',
  submit: 'Submit',
  fieldRequired: 'This field is required.',
};

let currentLabels: DialogLabels = { ...defaultLabels };

export function setLabels(overrides: Partial<DialogLabels>): void {
  currentLabels = { ...currentLabels, ...overrides };
}

export function getLabels(): DialogLabels {
  return currentLabels;
}

export function resetLabelsForTests(): void {
  currentLabels = { ...defaultLabels };
}
