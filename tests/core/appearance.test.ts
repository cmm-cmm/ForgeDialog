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

  it('scopes color and opacity per component', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    applyAppearance(overlay, dialog, {
      surfaceColor: '#101014',
      titleColor: '#ffd166',
      titleOpacity: 0.9,
      contentColor: '#c8ccd4',
      contentOpacity: 0.75,
      borderColor: '#7c5cff',
      borderOpacity: 0.5,
    });
    expect(dialog.style.getPropertyValue('--fd-dialog-surface-color')).toBe('#101014');
    expect(dialog.style.getPropertyValue('--fd-dialog-title-color')).toBe('#ffd166');
    expect(dialog.style.getPropertyValue('--fd-dialog-title-opacity')).toBe('0.9');
    expect(dialog.style.getPropertyValue('--fd-dialog-content-color')).toBe('#c8ccd4');
    expect(dialog.style.getPropertyValue('--fd-dialog-content-opacity')).toBe('0.75');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-opacity')).toBe('50%');
  });

  it('composes a shadow from its direction and strength', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');

    applyAppearance(overlay, dialog, {
      shadow: { angle: 180, distance: 10, blur: 30, spread: 2, color: '#000', opacity: 0.4 },
    });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toBe(
      '0px 10px 30px 2px color-mix(in srgb, #000 40%, transparent)',
    );

    // 90deg casts the shadow to the right, 270deg to the left, 0deg upwards.
    applyAppearance(overlay, dialog, { shadow: { angle: 90, distance: 12 } });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toContain('12px 0px');
    applyAppearance(overlay, dialog, { shadow: { angle: 270, distance: 12 } });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toContain('-12px 0px');
    applyAppearance(overlay, dialog, { shadow: { angle: 0, distance: 12 } });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toContain('0px -12px');
  });

  it('supports inset shadows and CSS length distances', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');

    applyAppearance(overlay, dialog, { shadow: { inset: true, angle: 180, distance: 4 } });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toContain('inset 0px 4px');

    applyAppearance(overlay, dialog, { shadow: { angle: 270, distance: '1rem' } });
    expect(dialog.style.getPropertyValue('--fd-dialog-shadow')).toContain('calc(-1 * 1rem) 0');
  });

  it('records hover overrides only when hover styling is requested', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');

    applyAppearance(overlay, dialog, { opacity: 0.9 });
    expect(dialog.hasAttribute('data-fd-hover')).toBe(false);

    applyAppearance(overlay, dialog, {
      hover: {
        opacity: 1,
        surfaceColor: '#1b1e26',
        titleColor: '#ffffff',
        contentColor: '#e6e8ec',
        borderColor: '#9f7bff',
        shadow: 'xl',
        lift: 6,
        scale: 1.02,
        duration: 150,
      },
    });
    expect(dialog.hasAttribute('data-fd-hover')).toBe(true);
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-opacity')).toBe('100%');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-surface-color')).toBe('#1b1e26');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-title-color')).toBe('#ffffff');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-content-color')).toBe('#e6e8ec');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-border-color')).toBe('#9f7bff');
    expect(dialog.dataset.fdHoverShadow).toBe('xl');
    // Lift is inverted so a positive value raises the dialog.
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-lift')).toBe('-6px');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-scale')).toBe('1.02');
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-duration')).toBe('150ms');

    applyAppearance(overlay, dialog);
    expect(dialog.hasAttribute('data-fd-hover')).toBe(false);
    expect(dialog.hasAttribute('data-fd-hover-shadow')).toBe(false);
    expect(dialog.style.getPropertyValue('--fd-dialog-hover-lift')).toBe('');
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
