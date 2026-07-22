import type { DialogInstance, DialogOptions } from '../types';
import { open } from '../api/open';

export interface WizardContext<TData extends object> {
  data: TData;
  set(patch: Partial<TData>): void;
  signal: AbortSignal;
}

export interface WizardStep<TData extends object> {
  id: string;
  title: string;
  render(container: HTMLElement, context: WizardContext<TData>): void | Promise<void>;
  validate?(context: WizardContext<TData>): boolean | string | Promise<boolean | string>;
  next?: string | ((data: TData) => string | undefined);
}

export interface WizardOptions<TData extends object> extends Omit<
  DialogOptions<TData>,
  'content' | 'buttons' | 'title'
> {
  steps: WizardStep<TData>[];
  initialData: TData;
  persistKey?: string;
  confirmUnsaved?: boolean;
  onComplete?: (data: TData) => void | Promise<void>;
}

export interface WizardController<TData extends object> {
  instance: DialogInstance<TData>;
  result: Promise<TData | null>;
  getData(): TData;
  goTo(stepId: string): Promise<void>;
  next(): Promise<void>;
  back(): Promise<void>;
}

export function wizard<TData extends object>(
  options: WizardOptions<TData>,
): WizardController<TData> {
  if (options.steps.length === 0) throw new Error('ForgeDialog wizard requires at least one step');
  const stepMap = new Map(options.steps.map((step) => [step.id, step]));
  if (stepMap.size !== options.steps.length) throw new Error('Wizard step ids must be unique');

  const abortController = new AbortController();
  const saved = options.persistKey ? readPersisted<TData>(options.persistKey) : undefined;
  let data = { ...options.initialData, ...saved };
  let currentIndex = 0;
  let busy = false;
  let dirty = false;
  let body!: HTMLElement;
  let title!: HTMLElement;
  let progress!: HTMLElement;
  let error!: HTMLElement;
  let backButton!: HTMLButtonElement;
  let nextButton!: HTMLButtonElement;

  const context: WizardContext<TData> = {
    get data() {
      return data;
    },
    set: (patch) => {
      data = { ...data, ...patch };
      dirty = true;
      if (options.persistKey) localStorage.setItem(options.persistKey, JSON.stringify(data));
    },
    signal: abortController.signal,
  };

  async function renderStep(): Promise<void> {
    const step = options.steps[currentIndex];
    title.textContent = step.title;
    progress.textContent = `Step ${currentIndex + 1} of ${options.steps.length}`;
    progress.setAttribute('aria-valuenow', String(currentIndex + 1));
    progress.setAttribute('aria-valuemax', String(options.steps.length));
    body.replaceChildren();
    error.textContent = '';
    backButton.disabled = currentIndex === 0 || busy;
    nextButton.textContent = currentIndex === options.steps.length - 1 ? 'Complete' : 'Next';
    try {
      await step.render(body, context);
    } catch {
      error.textContent = 'Unable to load this step.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'fd-btn fd-btn--secondary';
      retry.textContent = 'Retry';
      retry.addEventListener('click', () => void renderStep());
      body.appendChild(retry);
    }
  }

  async function next(): Promise<void> {
    if (busy) return;
    busy = true;
    nextButton.disabled = true;
    error.textContent = '';
    const step = options.steps[currentIndex];
    try {
      const valid = await step.validate?.(context);
      if (valid === false || typeof valid === 'string') {
        error.textContent = typeof valid === 'string' ? valid : 'Please check this step.';
        return;
      }
      const nextId = typeof step.next === 'function' ? step.next(data) : step.next;
      if (nextId) {
        const index = options.steps.findIndex((candidate) => candidate.id === nextId);
        if (index < 0) throw new Error(`Unknown wizard step: ${nextId}`);
        currentIndex = index;
      } else if (currentIndex < options.steps.length - 1) {
        currentIndex += 1;
      } else {
        await options.onComplete?.(data);
        dirty = false;
        if (options.persistKey) localStorage.removeItem(options.persistKey);
        await instance.close(data, 'button');
        return;
      }
      await renderStep();
    } catch (caught) {
      error.textContent = caught instanceof Error ? caught.message : 'Unable to continue.';
    } finally {
      busy = false;
      nextButton.disabled = false;
    }
  }

  async function back(): Promise<void> {
    if (busy || currentIndex === 0) return;
    currentIndex -= 1;
    await renderStep();
  }

  async function goTo(stepId: string): Promise<void> {
    const step = stepMap.get(stepId);
    if (!step) throw new Error(`Unknown wizard step: ${stepId}`);
    currentIndex = options.steps.indexOf(step);
    await renderStep();
  }

  const instance = open<TData>({
    ...options,
    title: options.steps[0].title,
    signal: options.signal ?? abortController.signal,
    onBeforeClose: async (dialog, result) => {
      if (result === undefined && dirty && options.confirmUnsaved) {
        return window.confirm('Discard your unsaved changes?');
      }
      return options.onBeforeClose?.(dialog, result);
    },
    content: (container) => {
      const shell = document.createElement('div');
      shell.className = 'fd-wizard';
      progress = document.createElement('div');
      progress.className = 'fd-wizard__progress';
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-valuemin', '1');
      title = document.createElement('h3');
      title.className = 'fd-wizard__title';
      body = document.createElement('div');
      body.className = 'fd-wizard__body';
      error = document.createElement('p');
      error.className = 'fd-input-error';
      error.setAttribute('aria-live', 'polite');
      const navigation = document.createElement('div');
      navigation.className = 'fd-wizard__navigation';
      backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.className = 'fd-btn fd-btn--secondary';
      backButton.textContent = 'Back';
      backButton.addEventListener('click', () => void back());
      nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'fd-btn fd-btn--primary';
      nextButton.addEventListener('click', () => void next());
      navigation.append(backButton, nextButton);
      shell.append(progress, title, body, error, navigation);
      container.appendChild(shell);
      void renderStep();
    },
    buttons: [],
  });

  instance.whenSettled().then(({ reason }) => {
    if (reason !== 'button') abortController.abort();
  });

  return {
    instance,
    result: instance.whenClosed().then((value) => value ?? null),
    getData: () => ({ ...data }),
    goTo,
    next,
    back,
  };
}

function readPersisted<TData>(key: string): Partial<TData> | undefined {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as Partial<TData>) : undefined;
  } catch {
    return undefined;
  }
}
