import { afterEach } from 'vitest';

class FakeAnimation {
  onfinish: (() => void) | null = null;
  finished: Promise<void>;
  private resolveFinished!: () => void;

  constructor() {
    this.finished = new Promise((resolve) => {
      this.resolveFinished = resolve;
    });
    queueMicrotask(() => {
      this.resolveFinished();
      this.onfinish?.();
    });
  }

  cancel(): void {}
  finish(): void {}
}

if (!Element.prototype.animate) {
  Element.prototype.animate = function animate() {
    return new FakeAnimation() as unknown as Animation;
  };
}

if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

if (typeof window.DragEvent === 'undefined') {
  class DragEventPolyfill extends Event {
    dataTransfer: DataTransfer | null;
    constructor(type: string, params: DragEventInit = {}) {
      super(type, params);
      this.dataTransfer = params.dataTransfer ?? null;
    }
  }
  window.DragEvent = DragEventPolyfill as unknown as typeof DragEvent;
}

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock-url';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
});
