import { generateId } from '../utils/id';
import { getLabels } from '../i18n/defaultLabels';
import { open } from './open';
import type { DialogInstance } from '../types';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';
export interface ToastOptions {
  tone?: ToastTone;
  /**
   * Auto-dismiss delay in milliseconds. Defaults to 4000. Pass `0` or
   * `Infinity` to keep the toast until it is dismissed explicitly.
   */
  duration?: number;
  action?: { text: string; onClick: () => void | Promise<void> };
}
export interface ToastHandle {
  id: string;
  dismiss(): void;
}

let region: HTMLElement | undefined;
const history: Array<{ id: string; message: string; tone: ToastTone; createdAt: number }> = [];

const DEFAULT_TOAST_DURATION = 4000;

function getRegion(): HTMLElement {
  const label = getLabels().notifications ?? 'Notifications';
  if (region?.isConnected) {
    region.setAttribute('aria-label', label);
    return region;
  }
  region = document.createElement('section');
  region.className = 'fd-toast-region';
  region.setAttribute('aria-label', label);
  document.body.appendChild(region);
  return region;
}

export function toast(message: string, options: ToastOptions = {}): ToastHandle {
  const id = generateId('fd-toast');
  const tone = options.tone ?? 'info';
  const element = document.createElement('div');
  element.id = id;
  element.className = `fd-toast fd-toast--${tone}`;
  element.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
  const text = document.createElement('span');
  text.textContent = message;
  element.appendChild(text);

  let timer: number | undefined;
  const dismiss = (): void => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    element.remove();
  };

  if (options.action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fd-toast__action';
    button.textContent = options.action.text;
    button.addEventListener('click', async () => {
      try {
        await options.action?.onClick();
      } finally {
        dismiss();
      }
    });
    element.appendChild(button);
  }
  getRegion().appendChild(element);
  history.unshift({ id, message, tone, createdAt: Date.now() });
  if (history.length > 100) history.length = 100;

  const duration = options.duration ?? DEFAULT_TOAST_DURATION;
  // A non-positive or non-finite delay would be coerced to 0 by setTimeout and
  // dismiss the toast immediately; treat it as "keep until dismissed" instead.
  if (Number.isFinite(duration) && duration > 0) {
    timer = window.setTimeout(dismiss, duration);
  }

  return { id, dismiss };
}

export function getNotificationHistory() {
  return history.map((item) => ({ ...item }));
}

export function clearNotificationHistory(): void {
  history.length = 0;
}

export function notificationCenter(): DialogInstance<void> {
  return open<void>({
    title: 'Notifications',
    size: 'lg',
    content: (container) => {
      const list = document.createElement('ol');
      list.className = 'fd-notification-list';
      for (const item of history) {
        const row = document.createElement('li');
        row.className = `fd-notification fd-notification--${item.tone}`;
        const message = document.createElement('span');
        message.textContent = item.message;
        const time = document.createElement('time');
        time.dateTime = new Date(item.createdAt).toISOString();
        time.textContent = new Date(item.createdAt).toLocaleTimeString();
        row.append(message, time);
        list.appendChild(row);
      }
      if (history.length === 0) list.textContent = 'No notifications yet.';
      container.appendChild(list);
    },
    buttons: [{ text: 'Close', role: 'primary', closesDialog: true }],
  });
}
