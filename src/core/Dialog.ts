import type { PluginManager } from '../plugins/PluginManager';
import type { ButtonConfig, DialogInstance, DialogLabels, DialogOptions } from '../types';
import { generateId } from '../utils/id';
import { resolveRole } from './aria';
import { animateIn, animateOut } from './animation';
import type { DialogStackManager } from './DialogStack';
import {
  buildDialogDom,
  updateDialogBody,
  updateDialogButtons,
  updateDialogTitle,
} from './domBuilder';
import { FocusTrap } from './FocusTrap';

type DialogState = 'idle' | 'opening' | 'open' | 'closing' | 'closed';

export class Dialog implements DialogInstance {
  readonly id: string;
  readonly element: HTMLElement;

  private options: DialogOptions;
  private readonly dialogEl: HTMLElement;
  private readonly bodyEl: HTMLDivElement;
  private buttonElements: HTMLButtonElement[];
  private readonly focusTrap: FocusTrap;
  private readonly stack: DialogStackManager;
  private readonly plugins: PluginManager;
  private state: DialogState = 'idle';
  private readonly closedPromise: Promise<unknown>;
  private resolveClosed!: (result: unknown) => void;

  constructor(
    options: DialogOptions,
    labels: DialogLabels,
    stack: DialogStackManager,
    plugins: PluginManager,
  ) {
    this.id = generateId('fd-dialog');
    this.options = options;
    this.stack = stack;
    this.plugins = plugins;

    const role = resolveRole(options.type ?? 'custom', options.role);
    const built = buildDialogDom(this.id, options, role, labels, () => this);
    this.element = built.overlay;
    this.dialogEl = built.dialog;
    this.bodyEl = built.body;
    this.buttonElements = built.buttonElements;
    this.focusTrap = new FocusTrap(this.dialogEl);

    this.closedPromise = new Promise((resolve) => {
      this.resolveClosed = resolve;
    });

    if (options.closeOnOverlayClick !== false) {
      this.element.addEventListener('mousedown', this.handleOverlayMouseDown);
    }
  }

  allowsEscapeClose(): boolean {
    return this.options.closeOnEscape !== false;
  }

  async open(): Promise<void> {
    if (this.state !== 'idle') return;
    this.state = 'opening';

    document.body.appendChild(this.element);
    const zIndex = this.stack.push(this);
    this.element.style.zIndex = String(zIndex);
    this.focusTrap.activate(this.getInitialFocusTarget());

    await this.plugins.runHook('beforeOpen', { instance: this, options: this.options });
    await animateIn(this.element, this.dialogEl, this.options.animation);

    this.state = 'open';
    await this.plugins.runHook('afterOpen', { instance: this, options: this.options });
    await this.options.onOpen?.(this);
  }

  async close(result?: unknown): Promise<void> {
    if (this.state === 'closed' || this.state === 'closing') return;
    this.state = 'closing';

    await this.plugins.runHook('beforeClose', { instance: this, options: this.options, result });
    await this.options.onBeforeClose?.(this, result);

    this.focusTrap.deactivate();
    this.element.removeEventListener('mousedown', this.handleOverlayMouseDown);
    await animateOut(this.element, this.dialogEl, this.options.animation);
    this.element.remove();
    this.stack.remove(this);

    this.state = 'closed';
    await this.plugins.runHook('afterClose', { instance: this, options: this.options, result });
    await this.options.onClose?.(this, result);
    this.resolveClosed(result);
  }

  whenClosed(): Promise<unknown> {
    return this.closedPromise;
  }

  update(partial: Partial<DialogOptions>): void {
    this.options = { ...this.options, ...partial };

    if (partial.title !== undefined) {
      updateDialogTitle(this.dialogEl, partial.title);
    }

    if (partial.message !== undefined || partial.content !== undefined) {
      updateDialogBody(this.bodyEl, {
        message: this.options.message,
        content: this.options.content,
      });
    }

    if (partial.buttons !== undefined) {
      this.buttonElements = updateDialogButtons(this.dialogEl, partial.buttons, () => this);
    }
  }

  isOpen(): boolean {
    return this.state === 'open' || this.state === 'opening';
  }

  private getInitialFocusTarget(): HTMLElement | undefined {
    const explicit = this.dialogEl.querySelector<HTMLElement>('[data-fd-autofocus]');
    if (explicit) return explicit;

    const buttons: ButtonConfig[] = this.options.buttons ?? [];
    const autoFocusIndex = buttons.findIndex((button) => button.autoFocus);
    return autoFocusIndex >= 0 ? this.buttonElements[autoFocusIndex] : undefined;
  }

  private handleOverlayMouseDown = (event: MouseEvent): void => {
    if (event.target === this.element) {
      void this.close();
    }
  };
}
