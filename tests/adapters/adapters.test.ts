import { afterEach, describe, expect, it, vi } from 'vitest';
import { dialogTrigger } from '../../src/adapters/svelte';
import { defineForgeDialog } from '../../src/adapters/web-component';

afterEach(() => {
  document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
});

describe('framework adapters', () => {
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
