export type DialogType = 'alert' | 'confirm' | 'prompt' | 'custom';

export type DialogRole = 'dialog' | 'alertdialog';

export type AnimationPreset = 'fade' | 'scale' | 'slide' | 'none';

export type ButtonRole = 'primary' | 'secondary' | 'danger';

export interface DialogLabels {
  ok: string;
  cancel: string;
  close: string;
  promptPlaceholder?: string;
}

export interface ButtonConfig {
  id?: string;
  text: string;
  role?: ButtonRole;
  autoFocus?: boolean;
  closesDialog?: boolean;
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
