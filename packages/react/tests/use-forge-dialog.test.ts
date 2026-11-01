import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useForgeDialog } from '../src/index';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

afterEach(() => {
  document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
});

describe('useForgeDialog', () => {
  it('clears the active dialog once it closes, and destroys it on unmount', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let api: ReturnType<typeof useForgeDialog> | undefined;
    function Harness() {
      api = useForgeDialog();
      return null;
    }
    const root = createRoot(host);
    await act(async () => root.render(createElement(Harness)));

    const closed = api!.open({ title: 'React dialog' });
    await closed.close();
    expect(api!.active.current).toBeNull();

    // A dialog still open when the component goes away has to be torn down, or
    // it outlives the tree that owns it.
    const instance = api!.open({ title: 'React dialog 2' });
    const destroy = vi.spyOn(instance, 'destroy');
    await act(async () => root.unmount());
    expect(destroy).toHaveBeenCalledOnce();
  });
});
