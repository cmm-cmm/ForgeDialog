import { generateId } from '../utils/id';
import { open } from './open';
import type { DialogInstance } from '../types';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';
export interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
  action?: { text: string; onClick: () => void | Promise<void> };
}
export interface ToastHandle {
  id: string;
  dismiss(): void;
}

let region: HTMLElement | undefined;
const history: Array<{ id: string; message: string; tone: ToastTone; createdAt: number }> = [];

function getRegion(): HTMLElement {
  if (region?.isConnected) return region;
  region = document.createElement('section');
  region.className = 'fd-toast-region';
  region.setAttribute('aria-label', 'Notifications');
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
  if (options.action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fd-toast__action';
    button.textContent = options.action.text;
    button.addEventListener('click', async () => {
      await options.action?.onClick();
      element.remove();
    });
    element.appendChild(button);
  }
  getRegion().appendChild(element);
  history.unshift({ id, message, tone, createdAt: Date.now() });
  if (history.length > 100) history.length = 100;
  const timer = window.setTimeout(() => element.remove(), options.duration ?? 4000);
  return {
    id,
    dismiss: () => {
      window.clearTimeout(timer);
      element.remove();
    },
  };
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
