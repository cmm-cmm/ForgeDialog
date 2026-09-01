import { type AppearanceApplier, applyBasicAppearance } from './appearance-basic';

let applier: AppearanceApplier = applyBasicAppearance;

export function registerAppearanceApplier(next: AppearanceApplier): void {
  applier = next;
}

export const applyDialogAppearance: AppearanceApplier = (overlay, dialog, appearance) => {
  applier(overlay, dialog, appearance);
};

export type { AppearanceApplier } from './appearance-basic';
