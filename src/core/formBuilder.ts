import type { FormFieldConfig, FormValues } from '../types';

type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface BuiltForm {
  formError: HTMLParagraphElement;
  getValues(): FormValues;
  setFieldError(name: string, message: string): void;
  clearErrors(): void;
  setFormError(message: string | null): void;
  focusFirst(): void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildLabel(id: string, config: FormFieldConfig): HTMLLabelElement | null {
  if (!config.label) return null;
  const label = document.createElement('label');
  label.className = 'fd-field__label';
  label.htmlFor = id;
  label.textContent = config.label;
  if (config.required) {
    const marker = document.createElement('span');
    marker.className = 'fd-field__required';
    marker.textContent = ' *';
    marker.setAttribute('aria-hidden', 'true');
    label.appendChild(marker);
  }
  return label;
}

function buildTextLikeInput(id: string, config: FormFieldConfig): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'fd-input';
  input.id = id;
  input.name = config.name;
  input.type = config.type === 'text' ? 'text' : config.type;
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.defaultValue !== undefined) input.value = String(config.defaultValue);
  if (config.required) input.required = true;
  if (config.type === 'number') {
    if (config.min !== undefined) input.min = String(config.min);
    if (config.max !== undefined) input.max = String(config.max);
    if (config.step !== undefined) input.step = String(config.step);
  }
  return input;
}

function buildTextarea(id: string, config: FormFieldConfig): HTMLTextAreaElement {
  const textarea = document.createElement('textarea');
  textarea.className = 'fd-input fd-textarea';
  textarea.id = id;
  textarea.name = config.name;
  textarea.rows = config.rows ?? 3;
  if (config.placeholder) textarea.placeholder = config.placeholder;
  if (config.defaultValue !== undefined) textarea.value = String(config.defaultValue);
  if (config.required) textarea.required = true;
  return textarea;
}

function buildSelect(id: string, config: FormFieldConfig): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'fd-input fd-select';
  select.id = id;
  select.name = config.name;
  if (config.multiple) select.multiple = true;
  for (const option of config.options ?? []) {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  }
  if (config.defaultValue !== undefined) select.value = String(config.defaultValue);
  return select;
}

function buildCheckbox(id: string, config: FormFieldConfig): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'fd-field__checkbox-row';
  const label = document.createElement('label');
  label.className = 'fd-field__checkbox';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.name = config.name;
  input.checked = Boolean(config.defaultValue);
  label.appendChild(input);
  const text = document.createElement('span');
  text.textContent = config.label ?? '';
  label.appendChild(text);
  wrapper.appendChild(label);
  return wrapper;
}

function buildRadioGroup(id: string, config: FormFieldConfig): HTMLDivElement {
  const group = document.createElement('div');
  group.className = 'fd-field__radio-group';
  group.id = id;
  group.setAttribute('role', 'radiogroup');
  for (const option of config.options ?? []) {
    const label = document.createElement('label');
    label.className = 'fd-field__radio';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = config.name;
    input.value = option.value;
    if (config.defaultValue !== undefined) {
      input.checked = String(config.defaultValue) === option.value;
    }
    label.appendChild(input);
    const text = document.createElement('span');
    text.textContent = option.label;
    label.appendChild(text);
    group.appendChild(label);
  }
  return group;
}

interface BuiltFileField {
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  getFiles: () => File[];
}

function buildFileField(
  id: string,
  config: FormFieldConfig,
  onError: (message: string) => void,
): BuiltFileField {
  const wrapper = document.createElement('div');
  wrapper.className = 'fd-dropzone';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('aria-label', config.label ?? 'Choose files');

  const input = document.createElement('input');
  input.type = 'file';
  input.id = id;
  input.name = config.name;
  input.className = 'fd-dropzone__input';
  input.hidden = true;
  if (config.accept) input.accept = config.accept;
  if (config.multiple) input.multiple = true;

  const prompt = document.createElement('div');
  prompt.className = 'fd-dropzone__prompt';
  prompt.textContent = config.placeholder ?? 'Drag & drop files here, or click to browse';

  const list = document.createElement('ul');
  list.className = 'fd-dropzone__list';

  let files: File[] = [];

  function renderList(): void {
    list.innerHTML = '';
    for (const file of files) {
      const item = document.createElement('li');
      item.className = 'fd-dropzone__item';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'fd-dropzone__thumb';
        const url = URL.createObjectURL(file);
        img.src = url;
        img.addEventListener('load', () => URL.revokeObjectURL(url));
        item.appendChild(img);
      }

      const name = document.createElement('span');
      name.className = 'fd-dropzone__filename';
      name.textContent = `${file.name} (${formatBytes(file.size)})`;
      item.appendChild(name);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'fd-dropzone__remove';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        files = files.filter((f) => f !== file);
        renderList();
      });
      item.appendChild(remove);

      list.appendChild(item);
    }
  }

  function addFiles(incoming: FileList | File[]): void {
    let accepted = Array.from(incoming);
    if (config.maxSizeBytes !== undefined) {
      const tooLarge = accepted.some((f) => f.size > config.maxSizeBytes!);
      accepted = accepted.filter((f) => f.size <= config.maxSizeBytes!);
      if (tooLarge) onError(`Files must be smaller than ${formatBytes(config.maxSizeBytes)}.`);
    }
    files = config.multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    if (config.maxFiles !== undefined) files = files.slice(0, config.maxFiles);
    renderList();
  }

  input.addEventListener('change', () => {
    if (input.files) addFiles(input.files);
    input.value = '';
  });
  wrapper.addEventListener('click', () => input.click());
  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });
  wrapper.addEventListener('dragover', (event) => {
    event.preventDefault();
    wrapper.classList.add('fd-dropzone--dragover');
  });
  wrapper.addEventListener('dragleave', () => wrapper.classList.remove('fd-dropzone--dragover'));
  wrapper.addEventListener('drop', (event) => {
    event.preventDefault();
    wrapper.classList.remove('fd-dropzone--dragover');
    if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
  });

  wrapper.appendChild(prompt);
  wrapper.appendChild(list);
  wrapper.appendChild(input);

  return { wrapper, input, getFiles: () => files };
}

export function buildFormFields(
  container: HTMLElement,
  fields: readonly FormFieldConfig[],
  formId: string,
): BuiltForm {
  const errorEls = new Map<string, HTMLParagraphElement>();
  const focusableByName = new Map<string, HTMLElement>();
  const fileGettersByName = new Map<string, () => File[]>();

  const formError = document.createElement('p');
  formError.className = 'fd-form__error';
  formError.setAttribute('aria-live', 'polite');
  formError.hidden = true;

  function showFieldError(name: string, message: string): void {
    const el = errorEls.get(name);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.closest<HTMLElement>('.fd-field')?.classList.add('fd-field--invalid');
  }

  fields.forEach((config, index) => {
    const id = `${formId}-${config.name}`;
    const row = document.createElement('div');
    row.className = 'fd-field';
    row.dataset.fdField = config.name;

    if (config.type === 'checkbox') {
      const checkboxRow = buildCheckbox(id, config);
      row.appendChild(checkboxRow);
      const input = checkboxRow.querySelector<HTMLInputElement>('input');
      if (input) focusableByName.set(config.name, input);
    } else if (config.type === 'radio') {
      const label = buildLabel(id, config);
      if (label) {
        label.removeAttribute('for');
        row.appendChild(label);
      }
      const group = buildRadioGroup(id, config);
      row.appendChild(group);
      const first = group.querySelector<HTMLElement>('input');
      if (first) focusableByName.set(config.name, first);
    } else if (config.type === 'file') {
      const label = buildLabel(id, config);
      if (label) {
        label.removeAttribute('for');
        row.appendChild(label);
      }
      const fileField = buildFileField(id, config, (message) => {
        showFieldError(config.name, message);
      });
      row.appendChild(fileField.wrapper);
      fileGettersByName.set(config.name, fileField.getFiles);
      focusableByName.set(config.name, fileField.wrapper);
    } else {
      const label = buildLabel(id, config);
      if (label) row.appendChild(label);

      let field: FieldEl;
      if (config.type === 'textarea') {
        field = buildTextarea(id, config);
      } else if (config.type === 'select') {
        field = buildSelect(id, config);
      } else {
        field = buildTextLikeInput(id, config);
      }
      row.appendChild(field);
      focusableByName.set(config.name, field);
    }

    if (config.helpText) {
      const help = document.createElement('p');
      help.className = 'fd-field__help';
      help.textContent = config.helpText;
      row.appendChild(help);
    }

    const error = document.createElement('p');
    error.className = 'fd-field__error';
    error.setAttribute('aria-live', 'polite');
    error.hidden = true;
    row.appendChild(error);
    errorEls.set(config.name, error);

    if (config.autoFocus || index === 0) {
      const target = focusableByName.get(config.name);
      target?.setAttribute('data-fd-autofocus', '');
    }

    container.appendChild(row);
  });

  container.appendChild(formError);

  return {
    formError,
    getValues(): FormValues {
      const values: FormValues = {};
      for (const config of fields) {
        if (config.type === 'checkbox') {
          const input = container.querySelector<HTMLInputElement>(
            `[data-fd-field="${cssEscape(config.name)}"] input[type="checkbox"]`,
          );
          values[config.name] = input?.checked ?? false;
        } else if (config.type === 'radio') {
          const checked = container.querySelector<HTMLInputElement>(
            `[data-fd-field="${cssEscape(config.name)}"] input[type="radio"]:checked`,
          );
          values[config.name] = checked?.value ?? '';
        } else if (config.type === 'file') {
          values[config.name] = fileGettersByName.get(config.name)?.() ?? [];
        } else if (config.type === 'number') {
          const input = container.querySelector<HTMLInputElement>(
            `#${cssEscape(`${formId}-${config.name}`)}`,
          );
          values[config.name] = input && input.value !== '' ? Number(input.value) : '';
        } else if (config.type === 'select' && config.multiple) {
          const select = container.querySelector<HTMLSelectElement>(
            `#${cssEscape(`${formId}-${config.name}`)}`,
          );
          values[config.name] = select
            ? Array.from(select.selectedOptions).map((option) => option.value)
            : [];
        } else {
          const el = container.querySelector<FieldEl>(`#${cssEscape(`${formId}-${config.name}`)}`);
          values[config.name] = el?.value ?? '';
        }
      }
      return values;
    },
    setFieldError: showFieldError,
    clearErrors(): void {
      for (const el of errorEls.values()) {
        el.textContent = '';
        el.hidden = true;
        el.closest<HTMLElement>('.fd-field')?.classList.remove('fd-field--invalid');
      }
      formError.textContent = '';
      formError.hidden = true;
    },
    setFormError(message: string | null): void {
      if (message) {
        formError.textContent = message;
        formError.hidden = false;
      } else {
        formError.textContent = '';
        formError.hidden = true;
      }
    },
    focusFirst(): void {
      const first = fields[0];
      if (!first) return;
      focusableByName.get(first.name)?.focus();
    },
  };
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value;
}
