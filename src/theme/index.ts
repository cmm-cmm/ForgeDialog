import './tokens.css';
import './dialog.css';

export type ThemeMode = 'light' | 'dark' | 'system';

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
