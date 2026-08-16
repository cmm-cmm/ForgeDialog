import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetLabelsForTests, setLabels } from '../../src/i18n/defaultLabels';
import { bottomSheet, drawer, lightbox, loading } from '../../src/api/presentation';
import { commandPalette } from '../../src/api/commandPalette';
import {
  clearNotificationHistory,
  getNotificationHistory,
  notificationCenter,
  toast,
} from '../../src/api/toast';

afterEach(() => {
  document.body.innerHTML = '';
  clearNotificationHistory();
});

describe('presentation APIs', () => {
  it('opens a right drawer', async () => {
    const instance = drawer({ title: 'Settings' });
    expect(instance.element.querySelector('.fd-dialog--drawer-right')).not.toBeNull();
    await instance.close();
  });

  it('updates and closes a loading dialog', async () => {
    const controller = loading('Starting');
    controller.update('Almost done');
    expect(controller.instance.element.textContent).toContain('Almost done');
    await controller.close();
  });

  it('creates dismissible toast notifications and immutable history', () => {
    const handle = toast('Saved', { tone: 'success', duration: 10_000 });
    expect(document.getElementById(handle.id)?.getAttribute('role')).toBe('status');
    expect(getNotificationHistory()[0]).toMatchObject({ message: 'Saved', tone: 'success' });
    handle.dismiss();
    expect(document.getElementById(handle.id)).toBeNull();
  });

  it('keeps toasts until dismissed when the duration is zero or infinite', () => {
    vi.useFakeTimers();
    try {
      const sticky = toast('Upload in progress', { duration: 0 });
      const endless = toast('Connection lost', { tone: 'danger', duration: Infinity });

      // Regression: setTimeout coerces these delays to 0, so the toasts used to
      // disappear on the next tick instead of waiting for an explicit dismiss.
      vi.advanceTimersByTime(60_000);
      expect(document.getElementById(sticky.id)).not.toBeNull();
      expect(document.getElementById(endless.id)).not.toBeNull();

      sticky.dismiss();
      endless.dismiss();
      expect(document.getElementById(sticky.id)).toBeNull();
      expect(document.getElementById(endless.id)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('auto-dismisses after the configured duration and clears the timer on action', async () => {
    vi.useFakeTimers();
    try {
      const expiring = toast('Saved', { duration: 5_000 });
      vi.advanceTimersByTime(4_999);
      expect(document.getElementById(expiring.id)).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(document.getElementById(expiring.id)).toBeNull();

      let undone = false;
      const withAction = toast('Item deleted', {
        duration: 5_000,
        action: {
          text: 'Undo',
          onClick: () => {
            undone = true;
          },
        },
      });
      const element = document.getElementById(withAction.id)!;
      element.querySelector<HTMLButtonElement>('.fd-toast__action')!.click();
      await vi.runAllTimersAsync();
      expect(undone).toBe(true);
      expect(document.getElementById(withAction.id)).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('labels the toast region using the configured locale', () => {
    setLabels({ notifications: 'Thông báo' });
    try {
      toast('Xin chào', { duration: 10_000 });
      expect(document.querySelector('.fd-toast-region')?.getAttribute('aria-label')).toBe(
        'Thông báo',
      );
    } finally {
      resetLabelsForTests();
    }
  });

  it('opens bottom sheets and accessible lightboxes', async () => {
    const sheet = bottomSheet({ title: 'Actions' });
    expect(sheet.element.querySelector('.fd-dialog--bottom-sheet')).not.toBeNull();
    await sheet.close();
    const viewer = lightbox('/photo.jpg', { alt: 'Mountain', caption: 'Sunrise' });
    expect(viewer.element.querySelector('img')?.getAttribute('alt')).toBe('Mountain');
    expect(viewer.element.textContent).toContain('Sunrise');
    await viewer.close();
  });

  it('filters and runs command palette actions', async () => {
    let ran = false;
    const palette = commandPalette([
      {
        id: 'save',
        label: 'Save project',
        keywords: ['write'],
        run: () => {
          ran = true;
        },
      },
      { id: 'close', label: 'Close project', run: () => {} },
    ]);
    const input = palette.element.querySelector<HTMLInputElement>('input')!;
    input.value = 'write';
    input.dispatchEvent(new Event('input'));
    const commands = palette.element.querySelectorAll<HTMLButtonElement>('.fd-command');
    expect(commands).toHaveLength(1);
    commands[0].click();
    await expect(palette.whenClosed()).resolves.toBe('save');
    expect(ran).toBe(true);
  });

  it('renders notification history in a center dialog', async () => {
    toast('Build complete', { duration: 10_000 });
    const center = notificationCenter();
    expect(center.element.textContent).toContain('Build complete');
    await center.close();
  });
});
