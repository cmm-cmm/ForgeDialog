import type { DialogInstance, DialogOptions } from '../types';
import { open } from './open';

export function drawer<TResult = unknown>(
  options: DialogOptions<TResult> & { side?: 'left' | 'right' },
): DialogInstance<TResult> {
  return open({
    ...options,
    presentation: options.side === 'left' ? 'drawer-left' : 'drawer-right',
    animation: options.animation ?? 'slide',
  });
}

export function bottomSheet<TResult = unknown>(
  options: DialogOptions<TResult>,
): DialogInstance<TResult> {
  return open({
    ...options,
    presentation: 'bottom-sheet',
    animation: options.animation ?? 'slide',
  });
}

export interface LightboxOptions extends Omit<DialogOptions<void>, 'content' | 'message'> {
  alt: string;
  caption?: string;
}

export function lightbox(src: string, options: LightboxOptions): DialogInstance<void> {
  return open<void>({
    ...options,
    presentation: 'lightbox',
    size: options.size ?? 'fullscreen',
    content: (container) => {
      const figure = document.createElement('figure');
      figure.className = 'fd-lightbox';
      const image = document.createElement('img');
      image.src = src;
      image.alt = options.alt;
      figure.appendChild(image);
      if (options.caption) {
        const caption = document.createElement('figcaption');
        caption.textContent = options.caption;
        figure.appendChild(caption);
      }
      container.appendChild(figure);
    },
  });
}

export interface LoadingController {
  instance: DialogInstance<void>;
  update(message: string): void;
  close(): Promise<void>;
}

export function loading(message: string, options: DialogOptions<void> = {}): LoadingController {
  const instance = open<void>({
    ...options,
    message,
    closable: options.closable ?? false,
    closeOnEscape: options.closeOnEscape ?? false,
    closeOnOverlayClick: options.closeOnOverlayClick ?? false,
    content: (container) => {
      const spinner = document.createElement('span');
      spinner.className = 'fd-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      container.prepend(spinner);
    },
  });
  return {
    instance,
    update: (nextMessage) => instance.update({ message: nextMessage }),
    close: () => instance.close(),
  };
}
