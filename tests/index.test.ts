import { afterEach, describe, expect, it, vi } from 'vitest';
import { alert, off, on, registerPlugin } from '../src/index';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('public plugin sugar', () => {
  it('on()/off() register and remove a hook on the shared plugin manager', async () => {
    const fn = vi.fn();
    on('afterOpen', fn);
    const promise = alert('hi');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await promise;
    expect(fn).toHaveBeenCalledTimes(1);

    off('afterOpen', fn);
    const promise2 = alert('hi again');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await promise2;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('registerPlugin() wires a full plugin object into the lifecycle', async () => {
    const beforeClose = vi.fn();
    registerPlugin({ name: 'test-plugin-' + Math.random(), hooks: { beforeClose } });
    const promise = alert('hi');
    document.querySelector<HTMLButtonElement>('.fd-btn--primary')!.click();
    await promise;
    expect(beforeClose).toHaveBeenCalledTimes(1);
  });
});
