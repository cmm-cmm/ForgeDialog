import { afterEach, describe, expect, it } from 'vitest';
import { makeDraggable } from '../../src/core/draggable';

afterEach(() => {
  document.body.innerHTML = '';
});

function setup() {
  const dialog = document.createElement('div');
  const header = document.createElement('div');
  dialog.appendChild(header);
  document.body.appendChild(dialog);
  return { dialog, header };
}

describe('makeDraggable', () => {
  it('translates the dialog as the pointer moves after pointerdown on the handle', () => {
    const { dialog, header } = setup();
    makeDraggable(dialog, header);

    header.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0, bubbles: true }),
    );
    expect(dialog.classList.contains('fd-dialog--dragging')).toBe(true);

    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 130, clientY: 120, bubbles: true }),
    );
    expect(dialog.style.transform).toBe('translate(30px, 20px)');

    document.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 130, clientY: 120, bubbles: true }),
    );
    expect(dialog.classList.contains('fd-dialog--dragging')).toBe(false);
  });

  it('ignores pointerdown originating from interactive elements inside the handle', () => {
    const { dialog, header } = setup();
    const button = document.createElement('button');
    header.appendChild(button);
    makeDraggable(dialog, header);

    button.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 10, clientY: 10, button: 0, bubbles: true }),
    );
    expect(dialog.classList.contains('fd-dialog--dragging')).toBe(false);
  });

  it('destroy() removes listeners and resets the transform', () => {
    const { dialog, header } = setup();
    const handle = makeDraggable(dialog, header);

    header.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 0, clientY: 0, button: 0, bubbles: true }),
    );
    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 40, clientY: 40, bubbles: true }),
    );
    expect(dialog.style.transform).not.toBe('');

    handle.destroy();
    expect(dialog.style.transform).toBe('');
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(false);

    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 999, clientY: 999, bubbles: true }),
    );
    expect(dialog.style.transform).toBe('');
  });
});
