import './tokens.css';
import './dialog.css';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'default' | 'minimal' | 'glass' | 'material';

const THEME_ATTR = 'data-fd-theme';

export function setTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute(THEME_ATTR);
    return;
  }
  root.setAttribute(THEME_ATTR, mode);
}

export function getTheme(): ThemeMode {
  const attr = document.documentElement.getAttribute(THEME_ATTR);
  return attr === 'dark' || attr === 'light' ? attr : 'system';
}

export function setThemePreset(preset: ThemePreset): void {
  if (preset === 'default') document.documentElement.removeAttribute('data-fd-theme-preset');
  else document.documentElement.setAttribute('data-fd-theme-preset', preset);
}

export function getThemePreset(): ThemePreset {
  const value = document.documentElement.getAttribute('data-fd-theme-preset');
  return value === 'minimal' || value === 'glass' || value === 'material' ? value : 'default';
}
