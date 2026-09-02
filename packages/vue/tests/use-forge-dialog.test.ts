import { createApp, defineComponent, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useForgeDialog } from '../src/index';

afterEach(() => {
  document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
});

describe('useForgeDialog', () => {
  it('clears the active dialog once it closes, and destroys it on unmount', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let api: ReturnType<typeof useForgeDialog> | undefined;
    const app = createApp(
      defineComponent({
        setup() {
          api = useForgeDialog();
          return () => null;
        },
      }),
    );
    app.mount(host);
    await nextTick();

    const closed = api!.open({ title: 'Vue dialog' });
    await closed.close();
    expect(api!.active.value).toBeNull();

    // A dialog still open when the component goes away has to be torn down, or
    // it outlives the tree that owns it.
    const instance = api!.open({ title: 'Vue dialog 2' });
    const destroy = vi.spyOn(instance, 'destroy');
    app.unmount();
    expect(destroy).toHaveBeenCalledOnce();
  });
});
