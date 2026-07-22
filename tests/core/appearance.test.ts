import { describe, expect, it } from 'vitest';
import { applyAppearance } from '../../src/core/appearance';

describe('applyAppearance', () => {
  it('maps appearance options to scoped CSS variables', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    applyAppearance(overlay, dialog, {
      opacity: 0.8,
      overlayOpacity: 0.4,
      backdropBlur: 12,
      borderColor: '#ff00aa',
      borderWidth: 3,
      borderStyle: 'dashed',
      shadow: 'xl',
    });
    expect(dialog.style.getPropertyValue('--fd-dialog-opacity')).toBe('80%');
    expect(overlay.style.getPropertyValue('--fd-overlay-opacity')).toBe('40%');
    expect(overlay.style.getPropertyValue('--fd-backdrop-blur')).toBe('12px');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-color')).toBe('#ff00aa');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-width')).toBe('3px');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-style')).toBe('dashed');
    expect(dialog.dataset.fdShadow).toBe('xl');
  });

  it('clamps opacity and clears previous overrides', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    applyAppearance(overlay, dialog, { opacity: 2, overlayOpacity: -1, shadow: 'none' });
    expect(dialog.style.getPropertyValue('--fd-dialog-opacity')).toBe('100%');
    expect(overlay.style.getPropertyValue('--fd-overlay-opacity')).toBe('0%');
    applyAppearance(overlay, dialog);
    expect(dialog.style.getPropertyValue('--fd-dialog-opacity')).toBe('');
    expect(overlay.style.getPropertyValue('--fd-overlay-opacity')).toBe('');
    expect(dialog.hasAttribute('data-fd-shadow')).toBe(false);
  });

  it('accepts CSS lengths and custom shadow values', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    applyAppearance(overlay, dialog, {
      backdropBlur: '1rem',
      borderWidth: 'thin',
      shadow: '0 0 10px red',
    });
    expect(overlay.style.getPropertyValue('--fd-backdrop-blur')).toBe('1rem');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-width')).toBe('thin');
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toBe('0 0 10px red');
  });
});
