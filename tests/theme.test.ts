import { afterEach, describe, expect, it } from 'vitest';
import { getTheme, getThemePreset, setTheme, setThemePreset } from '../src/theme/index';

afterEach(() => {
  document.documentElement.removeAttribute('data-fd-theme');
});

describe('theme', () => {
  it('defaults to system', () => {
    expect(getTheme()).toBe('system');
  });

  it('sets and clears visual theme presets', () => {
    setThemePreset('glass');
    expect(getThemePreset()).toBe('glass');
    expect(document.documentElement.dataset.fdThemePreset).toBe('glass');
    setThemePreset('default');
    expect(getThemePreset()).toBe('default');
    expect(document.documentElement.hasAttribute('data-fd-theme-preset')).toBe(false);
  });

  it('sets and reads an explicit light/dark theme', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-fd-theme')).toBe('dark');
    expect(getTheme()).toBe('dark');

    setTheme('light');
    expect(document.documentElement.getAttribute('data-fd-theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });

  it('removes the override attribute when set back to system', () => {
    setTheme('dark');
    setTheme('system');
    expect(document.documentElement.hasAttribute('data-fd-theme')).toBe(false);
    expect(getTheme()).toBe('system');
  });
});
