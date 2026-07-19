import { describe, expect, it } from 'vitest';
import { animateIn, animateOut } from '../../src/core/animation';

describe('animation', () => {
  it('resolves immediately for the "none" preset', async () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await expect(animateIn(overlay, dialog, 'none')).resolves.toBeUndefined();
    await expect(animateOut(overlay, dialog, 'none')).resolves.toBeUndefined();
  });

  it('resolves after animating in with the default preset', async () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await expect(animateIn(overlay, dialog)).resolves.toBeUndefined();
  });

  it('resolves after animating out', async () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await expect(animateOut(overlay, dialog, 'scale')).resolves.toBeUndefined();
  });

  it('resolves in and out for the bounce preset (which uses explicit offsets)', async () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await expect(animateIn(overlay, dialog, 'bounce')).resolves.toBeUndefined();
    await expect(animateOut(overlay, dialog, 'bounce')).resolves.toBeUndefined();
  });

  it('resolves in and out for the blur preset', async () => {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    await expect(animateIn(overlay, dialog, 'blur')).resolves.toBeUndefined();
    await expect(animateOut(overlay, dialog, 'blur')).resolves.toBeUndefined();
  });
});
