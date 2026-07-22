import { afterEach, describe, expect, it } from 'vitest';
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
