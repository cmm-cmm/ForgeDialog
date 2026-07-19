import type { ButtonConfig, DialogLabels, DialogOptions, DialogRole } from '../types';
import { fallbackTitleForType } from './aria';

export interface BuiltDialog {
  overlay: HTMLDivElement;
  dialog: HTMLDivElement;
  body: HTMLDivElement;
  buttonElements: HTMLButtonElement[];
}

function appendContent(body: HTMLDivElement, options: DialogOptions): void {
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
      wrapper.innerHTML = options.content;
      body.appendChild(wrapper);
    } else {
      body.appendChild(options.content);
    }
  }
}

function buildButton(
  config: ButtonConfig,
  getInstance: () => import('../types').DialogInstance | null,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `fd-btn fd-btn--${config.role ?? 'secondary'}`;
  btn.textContent = config.text;
  if (config.id) btn.id = config.id;
  btn.addEventListener('click', () => {
    const instance = getInstance();
    if (!instance) return;
    void config.onClick?.(instance);
  });
  return btn;
}

export function buildDialogDom(
  id: string,
  options: DialogOptions,
  role: DialogRole,
  labels: DialogLabels,
  getInstance: () => import('../types').DialogInstance | null,
): BuiltDialog {
  const overlay = document.createElement('div');
  overlay.className = 'fd-overlay';

  const dialog = document.createElement('div');
  dialog.className = ['fd-dialog', options.className].filter(Boolean).join(' ');
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
      const btn = buildButton(config, getInstance);
      buttonElements.push(btn);
      footer.appendChild(btn);
    }
    dialog.appendChild(footer);
  }

  overlay.appendChild(dialog);

  return { overlay, dialog, body, buttonElements };
}

export function updateDialogTitle(dialog: HTMLElement, title: string): void {
  const titleEl = dialog.querySelector<HTMLElement>('.fd-dialog__title');
  if (!titleEl) return;
  titleEl.textContent = title;
  titleEl.classList.remove('fd-dialog__title--visually-hidden');
}

export function updateDialogBody(
  body: HTMLDivElement,
  options: Pick<DialogOptions, 'message' | 'content'>,
): void {
  body.innerHTML = '';
  appendContent(body, options as DialogOptions);
}

export function updateDialogButtons(
  dialog: HTMLElement,
  buttons: ButtonConfig[],
  getInstance: () => import('../types').DialogInstance | null,
): HTMLButtonElement[] {
  let footer = dialog.querySelector<HTMLElement>('.fd-dialog__footer');
  if (!footer) {
    footer = document.createElement('div');
    footer.className = 'fd-dialog__footer';
    dialog.appendChild(footer);
  }
  footer.innerHTML = '';
  const buttonElements = buttons.map((config) => buildButton(config, getInstance));
  for (const btn of buttonElements) footer.appendChild(btn);
  return buttonElements;
}
