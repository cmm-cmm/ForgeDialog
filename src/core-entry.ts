// The full appearance applier ships with this entry, so per-component colors,
// composed shadows, and hover work without an extra import. The single-purpose
// entries (forgedialog/alert and friends) stay on the lightweight applier.
import './appearance-entry';

export { alert } from './api/alert';
export { confirm } from './api/confirm';
export { open } from './api/open';
export { prompt } from './api/prompt';
export type * from './types';
