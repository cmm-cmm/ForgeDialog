export type DialogType = 'alert' | 'confirm' | 'prompt' | 'form' | 'wizard' | 'custom';

export type DialogRole = 'dialog' | 'alertdialog';

export type AnimationPreset = 'fade' | 'scale' | 'slide' | 'bounce' | 'blur' | 'none';

export type ButtonRole = 'primary' | 'secondary' | 'danger';

export interface DialogLabels {
  ok: string;
  cancel: string;
  close: string;
  promptPlaceholder?: string;
  submit?: string;
  fieldRequired?: string;
}

export interface ButtonConfig {
  id?: string;
  text: string;
  role?: ButtonRole;
  autoFocus?: boolean;
  closesDialog?: boolean;
  disabled?: boolean;
  onClick?: (instance: DialogInstance) => void | Promise<void>;
}

export interface DialogOptions {
  type?: DialogType;
  title?: string;
  message?: string | HTMLElement;
  content?: string | HTMLElement | ((container: HTMLElement) => void);
  buttons?: ButtonConfig[];
  closable?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  draggable?: boolean;
  className?: string;
  role?: DialogRole;
  animation?: AnimationPreset;
  labels?: Partial<DialogLabels>;
  data?: unknown;
  onOpen?: (instance: DialogInstance) => void | Promise<void>;
  onClose?: (instance: DialogInstance, result: unknown) => void | Promise<void>;
  onBeforeClose?: (instance: DialogInstance, result: unknown) => void | Promise<void>;
}

export interface DialogInstance {
  readonly id: string;
  readonly element: HTMLElement;
  open(): Promise<void>;
  close(result?: unknown): Promise<void>;
  whenClosed(): Promise<unknown>;
  update(options: Partial<DialogOptions>): void;
  isOpen(): boolean;
}

export type HookName = 'beforeOpen' | 'afterOpen' | 'beforeClose' | 'afterClose' | 'beforeDestroy';

export interface HookContext {
  instance: DialogInstance;
  options: DialogOptions;
  result?: unknown;
}

export type HookFn = (ctx: HookContext) => void | Promise<void>;

export interface Plugin {
  name: string;
  install?: (api: PluginApi) => void;
  hooks?: Partial<Record<HookName, HookFn>>;
}

export interface PluginApi {
  on: (hook: HookName, fn: HookFn) => void;
  off: (hook: HookName, fn: HookFn) => void;
}

export interface PromptOptions extends DialogOptions {
  defaultValue?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email' | 'number';
  validate?: (value: string) => boolean | string | Promise<boolean | string>;
}

export type FormFieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file';

export type FormFieldValue = string | string[] | number | boolean | File[];

export type FormValues = Record<string, FormFieldValue>;

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldConfig {
  type: FormFieldType;
  name: string;
  label?: string;
  required?: boolean;
  defaultValue?: FormFieldValue;
  placeholder?: string;
  helpText?: string;
  rows?: number;
  options?: FormFieldOption[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  autoFocus?: boolean;
  /** `type: 'file'` — MIME types / extensions passed straight to the native accept attribute. */
  accept?: string;
  /** `type: 'file'` — caps how many files are kept after each add (extras are dropped). */
  maxFiles?: number;
  /** `type: 'file'` — files larger than this are rejected with a field error. */
  maxSizeBytes?: number;
  validate?: (
    value: FormFieldValue,
    values: FormValues,
  ) => boolean | string | Promise<boolean | string>;
}

export interface FormOptions extends Partial<DialogOptions> {
  submitText?: string;
  cancelText?: string;
  validate?: (values: FormValues) => boolean | string | Promise<boolean | string>;
}

/**
 * Maps a single field config to its collected value type, so `form()`/`wizard()` can return a
 * precisely-typed values object instead of a loose `FormValues` record. `multiple` select fields
 * collect `string[]`; everything else follows its `type`.
 */
type FieldValueOf<F extends FormFieldConfig> = F['type'] extends 'checkbox'
  ? boolean
  : F['type'] extends 'number'
    ? number
    : F['type'] extends 'file'
      ? File[]
      : F['type'] extends 'select'
        ? (F['multiple'] extends true ? string[] : string)
        : string;

/**
 * Infers a `{ [fieldName]: value }` object type from a `const`-typed `FormFieldConfig[]` tuple.
 * Falls back to a loose index signature when `F` isn't a literal tuple (e.g. a plain
 * `FormFieldConfig[]`-typed variable), so untyped callers keep working unchanged.
 */
export type InferFormValues<F extends readonly FormFieldConfig[]> = {
  [K in F[number] as K['name']]: FieldValueOf<K>;
};

export interface WizardStep {
  id: string;
  title?: string;
  fields?: readonly FormFieldConfig[];
  content?: (container: HTMLElement, valuesSoFar: FormValues) => void;
  validate?: (
    stepValues: FormValues,
    allValues: FormValues,
  ) => boolean | string | Promise<boolean | string>;
}

export interface WizardOptions extends Partial<Omit<DialogOptions, 'content' | 'buttons'>> {
  backText?: string;
  nextText?: string;
  finishText?: string;
  cancelText?: string;
  onStepChange?: (index: number, step: WizardStep) => void;
}

type AllFieldsOf<Steps extends readonly WizardStep[]> = NonNullable<
  Steps[number]['fields']
>[number];

/** Same idea as {@link InferFormValues}, merged across every step's `fields`. */
export type InferWizardValues<Steps extends readonly WizardStep[]> = {
  [K in AllFieldsOf<Steps> as K['name']]: FieldValueOf<K>;
};
