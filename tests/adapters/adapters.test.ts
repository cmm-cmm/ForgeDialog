import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, defineComponent, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useForgeDialog as useReactForgeDialog } from '../../src/adapters/react';
import { dialogTrigger } from '../../src/adapters/svelte';
import { useForgeDialog as useVueForgeDialog } from '../../src/adapters/vue';
import { defineForgeDialog } from '../../src/adapters/web-component';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

afterEach(() => {
  document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
});

describe('framework adapters', () => {
  it('destroys the active React dialog when its component unmounts', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let api: ReturnType<typeof useReactForgeDialog> | undefined;
    function Harness() {
      api = useReactForgeDialog();
      return null;
    }
    const root = createRoot(host);
    await act(async () => root.render(createElement(Harness)));
    const closed = api!.open({ title: 'React dialog' });
    await closed.close();
    expect(api!.active.current).toBeNull();
    const instance = api!.open({ title: 'React dialog 2' });
    const destroy = vi.spyOn(instance, 'destroy');
    await act(async () => root.unmount());
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('destroys the active Vue dialog when its component unmounts', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let api: ReturnType<typeof useVueForgeDialog> | undefined;
    const app = createApp(
      defineComponent({
        setup() {
          api = useVueForgeDialog();
          return () => null;
        },
      }),
    );
    app.mount(host);
    await nextTick();
    const closed = api!.open({ title: 'Vue dialog' });
    await closed.close();
    expect(api!.active.value).toBeNull();
    const instance = api!.open({ title: 'Vue dialog 2' });
    const destroy = vi.spyOn(instance, 'destroy');
    app.unmount();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('destroys every dialog opened by a Svelte action', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const action = dialogTrigger(trigger, { title: 'Svelte dialog' });
    trigger.click();
    trigger.click();
    expect(document.querySelectorAll('dialog')).toHaveLength(2);
    await action.destroy();
    expect(document.querySelectorAll('dialog')).toHaveLength(0);
  });

  it('reflects Web Component attributes and cleans up when disconnected', async () => {
    const tag = `forge-dialog-${Date.now()}`;
    defineForgeDialog(tag);
    const element = document.createElement(tag) as HTMLElement & {
      show(): void;
      close(): void;
    };
    element.setAttribute('title', 'Original');
    element.setAttribute('message', 'First');
    element.setAttribute('open', '');
    document.body.appendChild(element);
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
    element.setAttribute('title', 'Updated');
    element.setAttribute('message', 'Second');
    element.setAttribute('size', 'lg');
    expect(document.querySelector('.fd-dialog__title')?.textContent).toBe('Updated');
    expect(document.querySelector('.fd-dialog__body')?.textContent).toContain('Second');
    expect(document.querySelector('.fd-dialog')?.classList.contains('fd-dialog--lg')).toBe(true);
    const onClose = vi.fn();
    element.addEventListener('fd-close', onClose);
    element.removeAttribute('open');
    await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull());
    expect(onClose).toHaveBeenCalledOnce();

    element.show();
    await vi.waitFor(() => expect(document.querySelector('dialog')).not.toBeNull());
    element.close();
    await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull());
    element.remove();
  });
});
