import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeDraggable } from '../../src/core/draggable';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
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
    expect(dialog.style.getPropertyValue('--fd-drag-x')).toBe('30px');
    expect(dialog.style.getPropertyValue('--fd-drag-y')).toBe('20px');

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
    expect(handle.getPosition()).toEqual({ x: 40, y: 40 });

    handle.destroy();
    expect(dialog.style.getPropertyValue('--fd-drag-x')).toBe('');
    expect(header.classList.contains('fd-dialog__header--draggable')).toBe(false);

    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 999, clientY: 999, bubbles: true }),
    );
    expect(dialog.style.getPropertyValue('--fd-drag-x')).toBe('');
  });

  it('supports axis locking and programmatic positioning', () => {
    const { dialog, header } = setup();
    const handle = makeDraggable(dialog, header, { axis: 'x' });
    expect(handle.setPosition({ x: 75, y: 80 })).toEqual({ x: 75, y: 0 });
    expect(handle.getPosition()).toEqual({ x: 75, y: 0 });
  });

  it('moves with arrow keys and persists and resets its position', () => {
    const { dialog, header } = setup();
    const handle = makeDraggable(dialog, header, { persistKey: 'test', keyboardStep: 5 });
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(handle.getPosition()).toEqual({ x: 5, y: 0 });
    expect(localStorage.getItem('forgedialog:position:test')).toBe('{"x":5,"y":0}');

    handle.resetPosition();
    expect(handle.getPosition()).toEqual({ x: 0, y: 0 });
    expect(localStorage.getItem('forgedialog:position:test')).toBeNull();
  });

  it('emits drag lifecycle callbacks', () => {
    const { dialog, header } = setup();
    const events: string[] = [];
    makeDraggable(dialog, header, {
      onDragStart: () => events.push('start'),
      onDrag: () => events.push('drag'),
      onDragEnd: () => events.push('end'),
    });
    header.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 1, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 1, bubbles: true }));
    expect(events).toEqual(['start', 'drag', 'end']);
  });

  it('restores a valid saved position and ignores corrupt storage', () => {
    localStorage.setItem('forgedialog:position:saved', '{"x":12,"y":8}');
    const first = setup();
    expect(
      makeDraggable(first.dialog, first.header, { persistKey: 'saved' }).getPosition(),
    ).toEqual({
      x: 12,
      y: 8,
    });
    localStorage.setItem('forgedialog:position:broken', '{');
    const second = setup();
    expect(
      makeDraggable(second.dialog, second.header, {
        persistKey: 'broken',
        initialPosition: { x: 3, y: 4 },
      }).getPosition(),
    ).toEqual({ x: 3, y: 4 });
  });

  it('does not clamp a negative initial or restored position before layout is measurable', () => {
    const { dialog, header } = setup();
    const handle = makeDraggable(dialog, header, { initialPosition: { x: -80, y: -40 } });
    expect(handle.getPosition()).toEqual({ x: -80, y: -40 });

    localStorage.setItem('forgedialog:position:offscreen', '{"x":-120,"y":-60}');
    const second = setup();
    expect(
      makeDraggable(second.dialog, second.header, { persistKey: 'offscreen' }).getPosition(),
    ).toEqual({ x: -120, y: -60 });
  });

  it('supports element bounds and disabling keyboard movement', () => {
    const { dialog, header } = setup();
    const bounds = document.createElement('div');
    const handle = makeDraggable(dialog, header, { bounds, keyboard: false });
    expect(header.hasAttribute('tabindex')).toBe(false);
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(handle.getPosition()).toEqual({ x: 0, y: 0 });
  });

  it('clamps a measurable dialog to explicit bounds and batches pointer moves', () => {
    const { dialog, header } = setup();
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 100, 100));
    let frame: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 7;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const handle = makeDraggable(dialog, header, { bounds: new DOMRect(0, 0, 300, 300) });
    expect(handle.setPosition({ x: 999, y: -999 })).toEqual({ x: 100, y: -100 });
    header.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 20, clientY: 20 }));
    frame?.(0);
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 30 }));
    document.dispatchEvent(new PointerEvent('pointerup'));
    expect(cancel).toHaveBeenCalled();
  });

  it('handles visual viewport bounds, vertical axis, shifted keyboard steps, and tabindex restore', () => {
    const { dialog, header } = setup();
    header.tabIndex = 4;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 20, 40, 40));
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        offsetLeft: 10,
        offsetTop: 10,
        width: 200,
        height: 200,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    const handle = makeDraggable(dialog, header, { axis: 'y', keyboardStep: 2 });
    header.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }),
    );
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handle.getPosition()).toEqual({ x: 0, y: 10 });
    window.dispatchEvent(new Event('resize'));
    handle.destroy();
    expect(header.tabIndex).toBe(4);
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  });

  it('survives unavailable storage and responds to ResizeObserver', () => {
    const { dialog, header } = setup();
    let resize: ResizeObserverCallback | undefined;
    class FakeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resize = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 50, 50));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const handle = makeDraggable(dialog, header, { persistKey: 'blocked' });
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    resize?.([], {} as ResizeObserver);
    handle.resetPosition();
    handle.destroy();
    vi.unstubAllGlobals();
  });
});
