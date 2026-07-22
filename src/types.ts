export type DialogType = 'alert' | 'confirm' | 'prompt' | 'form' | 'wizard' | 'custom';

export type DialogRole = 'dialog' | 'alertdialog';

export type AnimationPreset = 'fade' | 'scale' | 'slide' | 'spring' | 'bounce' | 'blur' | 'none';

export type ButtonRole = 'primary' | 'secondary' | 'danger';
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
export type DialogPresentation =
  'modal' | 'drawer-left' | 'drawer-right' | 'bottom-sheet' | 'lightbox';
export type DialogState = 'idle' | 'opening' | 'open' | 'closing' | 'closed' | 'destroyed';
export type CloseReason = 'button' | 'escape' | 'backdrop' | 'api' | 'abort' | 'destroy';

export interface DialogPosition {
  x: number;
  y: number;
}

export interface DialogAppearance {
  /** Dialog surface opacity from 0 (transparent) to 1 (opaque). */
  opacity?: number;
  /** Backdrop opacity from 0 (transparent) to 1 (opaque). */
  overlayOpacity?: number;
  /** Backdrop blur in CSS pixels, or any CSS length. */
  backdropBlur?: number | string;
  borderColor?: string;
  borderWidth?: number | string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  /** A built-in preset or any valid CSS box-shadow value. */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string;
}

export interface DialogDragEvent {
  position: DialogPosition;
  originalEvent: PointerEvent | KeyboardEvent;
}

export interface DraggableOptions {
  /** Header by default; accepts a selector inside the dialog or an element. */
  handle?: 'header' | string | HTMLElement;
  axis?: 'both' | 'x' | 'y';
  /** Constrain movement to the viewport (default), an element, or a fixed rectangle. */
  bounds?: 'viewport' | HTMLElement | DOMRect;
  initialPosition?: DialogPosition;
  /** Persist the position in localStorage under this key. */
  persistKey?: string;
  keyboard?: boolean;
  keyboardStep?: number;
  onDragStart?: (event: DialogDragEvent) => void;
  onDrag?: (event: DialogDragEvent) => void;
  onDragEnd?: (event: DialogDragEvent) => void;
}

export interface DialogOutcome<TResult = unknown> {
  result: TResult | undefined;
  reason: CloseReason;
}

export interface DialogLabels {
  ok: string;
  cancel: string;
  close: string;
  promptPlaceholder?: string;
  submit?: string;
  fieldRequired?: string;
}

export interface ButtonConfig<TResult = unknown> {
  id?: string;
  text: string;
  role?: ButtonRole;
  autoFocus?: boolean;
  closesDialog?: boolean;
  disabled?: boolean;
  result?: TResult;
  onClick?: (instance: DialogInstance<TResult>) => void | Promise<void>;
}

/** Structural subset accepted from browser Trusted Types implementations. */
export interface TrustedHtmlLike {
  toString(): string;
}

export type HtmlSanitizer = (html: string) => string | TrustedHtmlLike;

export interface DialogOptions<TResult = unknown> {
  type?: DialogType;
  title?: string;
  message?: string | HTMLElement;
  content?: string | HTMLElement | ((container: HTMLElement) => void);
  /** Trusted HTML only. Never pass unsanitized user input. */
  unsafeHtml?: string;
  /** Untrusted HTML. A sanitizer must be supplied before it can be rendered. */
  html?: string;
  sanitizeHtml?: HtmlSanitizer;
  buttons?: ButtonConfig<TResult>[];
  closable?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  draggable?: boolean | DraggableOptions;
  appearance?: DialogAppearance;
  className?: string;
  size?: DialogSize;
  presentation?: DialogPresentation;
  role?: DialogRole;
  animation?: AnimationPreset;
  labels?: Partial<DialogLabels>;
  data?: unknown;
  signal?: AbortSignal;
  portalTarget?: HTMLElement;
  initialFocus?: string | HTMLElement | ((element: HTMLElement) => HTMLElement | null);
  restoreFocus?: boolean;
  onOpen?: (instance: DialogInstance<TResult>) => void | Promise<void>;
  onClose?: (
    instance: DialogInstance<TResult>,
    result: TResult | undefined,
  ) => void | Promise<void>;
  onBeforeClose?: (
    instance: DialogInstance<TResult>,
    result: TResult | undefined,
  ) => boolean | void | Promise<boolean | void>;
  onError?: (error: unknown, instance: DialogInstance<TResult>) => void;
}

export interface DialogInstance<TResult = unknown> {
  readonly id: string;
  readonly element: HTMLElement;
  open(): Promise<void>;
  close(result?: TResult, reason?: CloseReason): Promise<void>;
  cancel(reason?: CloseReason): Promise<void>;
  destroy(): Promise<void>;
  whenClosed(): Promise<TResult | undefined>;
  whenSettled(): Promise<DialogOutcome<TResult>>;
  update(options: Partial<DialogOptions<TResult>>): void;
  isOpen(): boolean;
  getState(): DialogState;
  getPosition(): DialogPosition;
  setPosition(position: DialogPosition): DialogPosition;
  resetPosition(): void;
}

export type HookName = 'beforeOpen' | 'afterOpen' | 'beforeClose' | 'afterClose' | 'beforeDestroy';

export interface HookContext {
  instance: DialogInstance<unknown>;
  options: DialogOptions<unknown>;
  result?: unknown;
  reason?: CloseReason;
  readonly defaultPrevented?: boolean;
  preventClose?: () => void;
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
  inputLabel?: string;
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
  accept?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  validate?: (
    value: FormFieldValue,
    values: FormValues,
  ) => boolean | string | Promise<boolean | string>;
}

export interface FormOptions extends Partial<DialogOptions<FormValues | null>> {
  submitText?: string;
  cancelText?: string;
  validate?: (values: FormValues) => boolean | string | Promise<boolean | string>;
}

type FieldValueOf<F extends FormFieldConfig> = F['type'] extends 'checkbox'
  ? boolean
  : F['type'] extends 'number'
    ? number
    : F['type'] extends 'file'
      ? File[]
      : F['type'] extends 'select'
        ? F['multiple'] extends true
          ? string[]
          : string
        : string;

export type InferFormValues<F extends readonly FormFieldConfig[]> = {
  [K in F[number] as K['name']]: FieldValueOf<K>;
};

export interface FormWizardStep {
  id: string;
  title?: string;
  fields?: readonly FormFieldConfig[];
  content?: (container: HTMLElement, valuesSoFar: FormValues) => void;
  validate?: (
    stepValues: FormValues,
    allValues: FormValues,
  ) => boolean | string | Promise<boolean | string>;
}

export interface FormWizardOptions extends Partial<
  Omit<DialogOptions<FormValues | null>, 'content' | 'buttons'>
> {
  backText?: string;
  nextText?: string;
  finishText?: string;
  cancelText?: string;
  onStepChange?: (index: number, step: FormWizardStep) => void;
}

type AllFieldsOf<Steps extends readonly FormWizardStep[]> = NonNullable<
  Steps[number]['fields']
>[number];

export type InferWizardValues<Steps extends readonly FormWizardStep[]> = {
  [K in AllFieldsOf<Steps> as K['name']]: FieldValueOf<K>;
};
