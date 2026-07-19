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
