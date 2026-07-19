import { getLabels } from '../i18n/defaultLabels';
import type { DialogInstance, PromptOptions } from '../types';
import { open } from './open';

export function prompt(
  message: string,
  options: Partial<PromptOptions> = {},
): Promise<string | null> {
  const labels = { ...getLabels(), ...options.labels };

  let inputEl: HTMLInputElement;
  let errorEl: HTMLParagraphElement | null = null;
  const ref: { instance?: DialogInstance } = {};

  function showError(msg: string): void {
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'fd-input-error';
      errorEl.setAttribute('aria-live', 'polite');
      inputEl.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = msg;
  }

  function clearError(): void {
    errorEl?.remove();
    errorEl = null;
  }

  async function submit(instance: DialogInstance): Promise<void> {
    const value = inputEl.value;
    if (options.validate) {
      const result = await options.validate(value);
      if (result !== true) {
        showError(typeof result === 'string' ? result : 'Invalid value');
        return;
      }
    }
    clearError();
    await instance.close(value);
  }

  const instance = open({
    type: 'prompt',
    role: 'dialog',
    message,
    content: (container) => {
      inputEl = document.createElement('input');
      inputEl.className = 'fd-input';
      inputEl.type = options.inputType ?? 'text';
      inputEl.value = options.defaultValue ?? '';
      inputEl.placeholder = options.placeholder ?? labels.promptPlaceholder ?? '';
      inputEl.setAttribute('data-fd-autofocus', '');
      inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && ref.instance) {
          event.preventDefault();
          void submit(ref.instance);
        }
      });
      container.appendChild(inputEl);
    },
    buttons: [
      { text: labels.cancel, role: 'secondary', onClick: (i) => i.close(null) },
      { text: labels.ok, role: 'primary', onClick: (i) => submit(i) },
    ],
    ...options,
  });
  ref.instance = instance;

  return instance.whenClosed().then((result) => (typeof result === 'string' ? result : null));
}
