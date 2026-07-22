import { getLabels } from '../i18n/defaultLabels';
import type { DialogInstance, PromptOptions } from '../types';
import { open } from './open';
import { generateId } from '../utils/id';

export function prompt(
  message: string,
  options: Partial<PromptOptions> = {},
): Promise<string | null> {
  const labels = { ...getLabels(), ...options.labels };

  let inputEl: HTMLInputElement;
  let errorEl: HTMLParagraphElement | null = null;
  let validating = false;
  const inputId = generateId('fd-input');
  const errorId = `${inputId}-error`;
  const ref: { instance?: DialogInstance } = {};

  function showError(msg: string): void {
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'fd-input-error';
      errorEl.setAttribute('aria-live', 'polite');
      inputEl.insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = msg;
    errorEl.id = errorId;
    inputEl.setAttribute('aria-invalid', 'true');
    inputEl.setAttribute('aria-describedby', errorId);
  }

  function clearError(): void {
    errorEl?.remove();
    errorEl = null;
    inputEl.removeAttribute('aria-invalid');
    inputEl.removeAttribute('aria-describedby');
  }

  async function submit(instance: DialogInstance): Promise<void> {
    if (validating) return;
    validating = true;
    const value = inputEl.value;
    try {
      if (options.validate) {
        const result = await options.validate(value);
        if (result !== true) {
          showError(typeof result === 'string' ? result : 'Invalid value');
          return;
        }
      }
      clearError();
      await instance.close(value);
    } catch {
      showError('Unable to validate value');
    } finally {
      validating = false;
    }
  }

  const instance = open({
    type: 'prompt',
    role: 'dialog',
    message,
    content: (container) => {
      const label = document.createElement('label');
      label.className = 'fd-dialog__title--visually-hidden';
      label.htmlFor = inputId;
      label.textContent = options.inputLabel ?? message;
      inputEl = document.createElement('input');
      inputEl.id = inputId;
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
      container.append(label, inputEl);
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
