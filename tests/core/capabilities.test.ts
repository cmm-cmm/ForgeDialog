import { describe, expect, it, vi } from 'vitest';
import {
  registerAnimationRunners,
  animateDialogIn,
  animateDialogOut,
} from '../../src/core/animationRegistry';
import { applyAppearance } from '../../src/core/appearance';
import { applyBasicAppearance } from '../../src/core/appearance-basic';
import {
  applyDialogAppearance,
  registerAppearanceApplier,
} from '../../src/core/appearanceRegistry';
import { makeBasicDraggable } from '../../src/core/draggable-basic';
import { createDraggable, registerDraggableFactory } from '../../src/core/interactionRegistry';

describe('optional capabilities', () => {
  it('delegates animation runners after registration', async () => {
    const enter = vi.fn().mockResolvedValue(undefined);
    const exit = vi.fn().mockResolvedValue(undefined);
    registerAnimationRunners(enter, exit);
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await animateDialogIn(overlay, dialog, 'scale');
    await animateDialogOut(overlay, dialog, 'fade');
    expect(enter).toHaveBeenCalledWith(overlay, dialog, 'scale');
    expect(exit).toHaveBeenCalledWith(overlay, dialog, 'fade');
  });

  it('applies basic appearance until the full applier is registered', () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');

    // The lightweight applier covers surface, backdrop, and border only, so
    // focused entries stay small; richer options are simply ignored.
    applyBasicAppearance(overlay, dialog, {
      opacity: 0.5,
      borderColor: '#123456',
      shadow: 'lg',
      titleColor: '#ff0000',
      hover: { titleColor: '#00ff00' },
    });
    expect(dialog.style.getPropertyValue('--fd-dialog-opacity')).toBe('50%');
    expect(dialog.style.getPropertyValue('--fd-dialog-border-color')).toBe('#123456');
    expect(dialog.dataset.fdShadow).toBe('lg');
    expect(dialog.style.getPropertyValue('--fd-dialog-title-color')).toBe('');
    expect(dialog.hasAttribute('data-fd-hover')).toBe(false);

    registerAppearanceApplier(applyAppearance);
    applyDialogAppearance(overlay, dialog, {
      titleColor: '#ff0000',
      hover: { titleColor: '#00ff00' },
    });
    expect(dialog.style.getPropertyValue('--fd-dialog-title-color')).toBe('#ff0000');
    expect(dialog.dataset.fdHover).toBe('');

    registerAppearanceApplier(applyBasicAppearance);
  });

  it('allows the draggable factory to be replaced', () => {
    const custom = vi.fn(makeBasicDraggable);
    registerDraggableFactory(custom);
    const dialog = document.createElement('div');
    const header = document.createElement('div');
    createDraggable(dialog, header, { initialPosition: { x: 4, y: 6 } });
    expect(custom).toHaveBeenCalledOnce();
  });

  it('provides lightweight pointer dragging, axis locking, reset, and cleanup', () => {
    const dialog = document.createElement('div');
    const header = document.createElement('div');
    document.body.append(dialog);
    const handle = makeBasicDraggable(dialog, header, {
      axis: 'x',
      initialPosition: { x: 2, y: 3 },
    });
    header.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, clientX: 10, bubbles: true }),
    );
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 30 }));
    expect(handle.getPosition()).toEqual({ x: 12, y: 3 });
    document.dispatchEvent(new PointerEvent('pointerup'));
    handle.resetPosition();
    expect(handle.getPosition()).toEqual({ x: 2, y: 3 });
    handle.destroy();
    expect(dialog.style.getPropertyValue('--fd-drag-x')).toBe('');
  });

  it('ignores interactive and non-primary pointer starts', () => {
    const dialog = document.createElement('div');
    const header = document.createElement('div');
    const button = document.createElement('button');
    header.append(button);
    const handle = makeBasicDraggable(dialog, header);
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    header.dispatchEvent(new PointerEvent('pointerdown', { button: 1, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 50 }));
    expect(handle.getPosition()).toEqual({ x: 0, y: 0 });
  });
});
