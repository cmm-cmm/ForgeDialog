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
});
