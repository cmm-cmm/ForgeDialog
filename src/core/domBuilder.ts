import type { ButtonConfig, DialogLabels, DialogOptions, DialogRole } from '../types';
import { fallbackTitleForType } from './aria';

export interface BuiltDialog {
  overlay: HTMLDialogElement;
  dialog: HTMLDivElement;
  header: HTMLDivElement;
  body: HTMLDivElement;
  buttonElements: HTMLButtonElement[];
}

function appendContent<TResult>(body: HTMLDivElement, options: DialogOptions<TResult>): void {
  if (options.message !== undefined) {
    if (typeof options.message === 'string') {
      const p = document.createElement('p');
      p.className = 'fd-dialog__message';
      p.textContent = options.message;
      body.appendChild(p);
    } else {
      body.appendChild(options.message);
    }
  }

  if (options.content !== undefined) {
    if (typeof options.content === 'function') {
      options.content(body);
    } else if (typeof options.content === 'string') {
      const wrapper = document.createElement('div');
      wrapper.textContent = options.content;
      body.appendChild(wrapper);
    } else {
      body.appendChild(options.content);
    }
  }

  if (options.unsafeHtml !== undefined) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = options.unsafeHtml;
    body.appendChild(wrapper);
  }

  if (options.html !== undefined) {
    if (!options.sanitizeHtml) {
      throw new TypeError('DialogOptions.html requires a sanitizeHtml function');
    }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = options.sanitizeHtml(options.html) as string;
    body.appendChild(wrapper);
  }
}

function buildButton<TResult>(
  config: ButtonConfig<TResult>,
  getInstance: () => import('../types').DialogInstance<TResult> | null,
  onError?: (error: unknown) => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `fd-btn fd-btn--${config.role ?? 'secondary'}`;
  btn.textContent = config.text;
  if (config.id) btn.id = config.id;
  btn.disabled = Boolean(config.disabled);
  btn.addEventListener('click', async () => {
    const instance = getInstance();
    if (!instance) return;
    try {
      await config.onClick?.(instance);
      if (config.closesDialog ?? 'result' in config) {
        await instance.close(config.result, 'button');
      }
    } catch (error) {
      onError?.(error);
    }
  });
  return btn;
}

export function buildDialogDom<TResult = unknown>(
  id: string,
  options: DialogOptions<TResult>,
  role: DialogRole,
  labels: DialogLabels,
  getInstance: () => import('../types').DialogInstance<TResult> | null,
  onError?: (error: unknown) => void,
): BuiltDialog {
  const overlay = document.createElement('dialog');
  overlay.className = 'fd-overlay';

  const dialog = document.createElement('div');
  dialog.className = [
    'fd-dialog',
    `fd-dialog--${options.size ?? 'md'}`,
    `fd-dialog--${options.presentation ?? 'modal'}`,
    options.className,
  ]
    .filter(Boolean)
    .join(' ');
  dialog.setAttribute('role', role);
  dialog.setAttribute('aria-modal', 'true');
  dialog.id = id;

  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const header = document.createElement('div');
  header.className = 'fd-dialog__header';

  const titleEl = document.createElement('h2');
  titleEl.id = titleId;
  const hasExplicitTitle = Boolean(options.title);
  titleEl.className = hasExplicitTitle
    ? 'fd-dialog__title'
    : 'fd-dialog__title fd-dialog__title--visually-hidden';
  titleEl.textContent = options.title ?? fallbackTitleForType(options.type ?? 'custom');
  header.appendChild(titleEl);

  let closeButton: HTMLButtonElement | null = null;
  if (options.closable !== false) {
    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'fd-dialog__close';
    closeButton.setAttribute('aria-label', labels.close);
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
      getInstance()?.close();
    });
    header.appendChild(closeButton);
  }

  dialog.appendChild(header);
  dialog.setAttribute('aria-labelledby', titleId);

  const body = document.createElement('div');
  body.className = 'fd-dialog__body';
  body.id = descId;
  appendContent(body, options);
  dialog.appendChild(body);
  if (body.childNodes.length > 0) {
    dialog.setAttribute('aria-describedby', descId);
  }

  const buttonElements: HTMLButtonElement[] = [];
  const buttons = options.buttons ?? [];
  if (buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'fd-dialog__footer';
    for (const config of buttons) {
      const btn = buildButton(config, getInstance, onError);
      buttonElements.push(btn);
      footer.appendChild(btn);
    }
    dialog.appendChild(footer);
  }

  overlay.appendChild(dialog);

  return { overlay, dialog, header, body, buttonElements };
}

export function updateDialogTitle(
  dialog: HTMLElement,
  title: string | undefined,
  type: DialogOptions['type'] = 'custom',
): void {
  const titleEl = dialog.querySelector<HTMLElement>('.fd-dialog__title');
  if (!titleEl) return;
  titleEl.textContent = title ?? fallbackTitleForType(type ?? 'custom');
  titleEl.classList.toggle('fd-dialog__title--visually-hidden', !title);
}

export function updateDialogBody(
  body: HTMLDivElement,
  options: Pick<DialogOptions, 'message' | 'content' | 'unsafeHtml' | 'html' | 'sanitizeHtml'>,
): void {
  body.innerHTML = '';
  appendContent(body, options as DialogOptions<unknown>);
  const dialog = body.closest<HTMLElement>('.fd-dialog');
  if (body.childNodes.length > 0) {
    dialog?.setAttribute('aria-describedby', body.id);
  } else {
    dialog?.removeAttribute('aria-describedby');
  }
}

export function updateDialogButtons<TResult = unknown>(
  dialog: HTMLElement,
  buttons: ButtonConfig<TResult>[],
  getInstance: () => import('../types').DialogInstance<TResult> | null,
  onError?: (error: unknown) => void,
): HTMLButtonElement[] {
  let footer = dialog.querySelector<HTMLElement>('.fd-dialog__footer');
  if (!footer) {
    footer = document.createElement('div');
    footer.className = 'fd-dialog__footer';
    dialog.appendChild(footer);
  }
  footer.innerHTML = '';
  const buttonElements = buttons.map((config) => buildButton(config, getInstance, onError));
  for (const btn of buttonElements) footer.appendChild(btn);
  return buttonElements;
}
