import { applyAppearance } from './core/appearance';
import { registerAppearanceApplier } from './core/appearanceRegistry';

registerAppearanceApplier(applyAppearance);

export { applyAppearance } from './core/appearance';
export type {
  DialogAppearance,
  DialogHoverAppearance,
  DialogShadow,
  DialogShadowConfig,
  ShadowPreset,
} from './types';
