import type { PluginManager } from '../plugins/PluginManager';
import type {
  ButtonConfig,
  CloseReason,
  DialogInstance,
  DialogLabels,
  DialogOptions,
  DialogOutcome,
  DialogPosition,
  DialogState,
  DraggableOptions,
} from '../types';
import { generateId } from '../utils/id';
import { resolveRole } from './aria';
import { animateDialogIn, animateDialogOut } from './animationRegistry';
import { applyAppearance } from './appearance';
import type { DialogStackManager } from './DialogStack';
import {
  buildDialogDom,
  updateDialogBody,
  updateDialogButtons,
  updateDialogTitle,
} from './domBuilder';
import { FocusTrap } from './FocusTrap';
import { createDraggable, type DraggableHandle } from './interactionRegistry';

export class Dialog<TResult = unknown> implements DialogInstance<TResult> {
  readonly id: string;
  readonly element: HTMLElement;

  private options: DialogOptions<TResult>;
  private readonly dialogEl: HTMLElement;
  private readonly bodyEl: HTMLDivElement;
  private buttonElements: HTMLButtonElement[];
  private readonly focusTrap: FocusTrap;
  private readonly stack: DialogStackManager;
  private readonly plugins: PluginManager;
  private state: DialogState = 'idle';
  private pushedToStack = false;
  private finishPromise?: Promise<void>;
  private readonly closedPromise: Promise<TResult | undefined>;
  private resolveClosed!: (result: TResult | undefined) => void;
  private readonly settledPromise: Promise<DialogOutcome<TResult>>;
  private resolveSettled!: (outcome: DialogOutcome<TResult>) => void;
  private abortListener?: () => void;
  private cleanupGesture?: () => void;
  private draggableHandle?: DraggableHandle;

  constructor(
    options: DialogOptions<TResult>,
    labels: DialogLabels,
    stack: DialogStackManager,
    plugins: PluginManager,
  ) {
    this.id = generateId('fd-dialog');
    this.options = options;
    this.stack = stack;
    this.plugins = plugins;

    const role = resolveRole(options.type ?? 'custom', options.role);
    const built = buildDialogDom(
      this.id,
      options,
      role,
      labels,
      () => this,
      (error) => this.reportError(error),
    );
    this.element = built.overlay;
    this.dialogEl = built.dialog;
    this.bodyEl = built.body;
    this.buttonElements = built.buttonElements;
    this.focusTrap = new FocusTrap(this.dialogEl);
    applyAppearance(this.element, this.dialogEl, options.appearance);
    this.setupDraggable(options.draggable, built.header);

    this.closedPromise = new Promise((resolve) => {
      this.resolveClosed = resolve;
    });
    this.settledPromise = new Promise((resolve) => {
      this.resolveSettled = resolve;
    });

    if (options.closeOnOverlayClick !== false) {
      this.element.addEventListener('mousedown', this.handleOverlayMouseDown);
    }
    this.element.addEventListener('cancel', this.handleNativeCancel);
    if (options.signal) {
      this.abortListener = () => void this.cancel('abort');
      options.signal.addEventListener('abort', this.abortListener, { once: true });
    }
    if (options.presentation === 'bottom-sheet') this.setupSheetGesture();
  }

  allowsEscapeClose(): boolean {
    return this.options.closeOnEscape !== false;
  }

  async open(): Promise<void> {
    if (this.state !== 'idle') return;
    this.state = 'opening';

    try {
      if (this.options.signal?.aborted) {
        await this.cancel('abort');
        return;
      }
      (this.options.portalTarget ?? document.body).appendChild(this.element);
      const nativeDialog = this.element as HTMLDialogElement;
      if (typeof nativeDialog.showModal === 'function') nativeDialog.showModal();
      else nativeDialog.setAttribute('open', '');
      const zIndex = this.stack.push(this);
      this.pushedToStack = true;
      this.element.style.zIndex = String(zIndex);
      this.focusTrap.activate(this.getInitialFocusTarget());

      await this.plugins.runHook('beforeOpen', {
        instance: this,
        options: this.options,
      } as unknown as import('../types').HookContext);
      if (this.state !== 'opening') return;
      await animateDialogIn(this.element, this.dialogEl, this.options.animation);
      if (this.state !== 'opening') return;

      this.state = 'open';
      await this.plugins.runHook('afterOpen', {
        instance: this,
        options: this.options,
      } as unknown as import('../types').HookContext);
      if (this.state !== 'open') return;
      await this.options.onOpen?.(this);
    } catch (error) {
      await this.finishClose(undefined, 'destroy', false);
      this.reportError(error);
    }
  }

  async close(result?: TResult, reason: CloseReason = 'api'): Promise<void> {
    if (this.state === 'closed' || this.state === 'closing') return;
    this.state = 'closing';

    try {
      let prevented = false;
      const context = {
        instance: this,
        options: this.options,
        result,
        reason,
        get defaultPrevented() {
          return prevented;
        },
        preventClose: () => {
          prevented = true;
        },
      };
      await this.plugins.runHook(
        'beforeClose',
        context as unknown as import('../types').HookContext,
      );
      const allowed = await this.options.onBeforeClose?.(this, result);
      if (prevented || allowed === false) {
        this.state = 'open';
        return;
      }
      await this.finishClose(result, reason, true);
    } catch (error) {
      await this.finishClose(result, reason, true);
      this.reportError(error);
    }
  }

  cancel(reason: CloseReason = 'api'): Promise<void> {
    return this.close(undefined, reason);
  }

  async destroy(): Promise<void> {
    if (this.state === 'destroyed') return;
    if (this.state !== 'closed') await this.finishClose(undefined, 'destroy', false);
    this.state = 'destroyed';
  }

  whenClosed(): Promise<TResult | undefined> {
    return this.closedPromise;
  }

  whenSettled(): Promise<DialogOutcome<TResult>> {
    return this.settledPromise;
  }

  update(partial: Partial<DialogOptions<TResult>>): void {
    const previous = this.options;
    this.options = { ...this.options, ...partial };

    if ('title' in partial) {
      updateDialogTitle(this.dialogEl, partial.title ?? undefined, this.options.type ?? 'custom');
    }

    if (
      'message' in partial ||
      'content' in partial ||
      'unsafeHtml' in partial ||
      'html' in partial ||
      'sanitizeHtml' in partial
    ) {
      updateDialogBody(this.bodyEl, {
        message: this.options.message,
        content: this.options.content,
        unsafeHtml: this.options.unsafeHtml,
        html: this.options.html,
        sanitizeHtml: this.options.sanitizeHtml,
      });
    }

    if (partial.buttons !== undefined) {
      this.buttonElements = updateDialogButtons(
        this.dialogEl,
        partial.buttons,
        () => this,
        (error) => this.reportError(error),
      );
    }

    if ('draggable' in partial) {
      const header = this.dialogEl.querySelector<HTMLElement>('.fd-dialog__header');
      this.setupDraggable(partial.draggable, header ?? undefined);
    }
    if ('appearance' in partial) applyAppearance(this.element, this.dialogEl, partial.appearance);
    if ('size' in partial) {
      this.dialogEl.classList.remove(`fd-dialog--${previous.size ?? 'md'}`);
      this.dialogEl.classList.add(`fd-dialog--${partial.size ?? 'md'}`);
    }
    if ('presentation' in partial) {
      this.dialogEl.classList.remove(`fd-dialog--${previous.presentation ?? 'modal'}`);
      this.dialogEl.classList.add(`fd-dialog--${partial.presentation ?? 'modal'}`);
    }
    if ('className' in partial) {
      if (previous.className) this.dialogEl.classList.remove(...previous.className.split(/\s+/));
      if (partial.className) this.dialogEl.classList.add(...partial.className.split(/\s+/));
    }
  }

  isOpen(): boolean {
    return this.state === 'open' || this.state === 'opening';
  }

  getState(): DialogState {
    return this.state;
  }

  getPosition(): DialogPosition {
    return this.draggableHandle?.getPosition() ?? { x: 0, y: 0 };
  }

  setPosition(position: DialogPosition): DialogPosition {
    return this.draggableHandle?.setPosition(position) ?? { x: 0, y: 0 };
  }

  resetPosition(): void {
    this.draggableHandle?.resetPosition();
  }

  private setupDraggable(
    configured: boolean | DraggableOptions | undefined,
    defaultHandle?: HTMLElement,
  ): void {
    this.draggableHandle?.destroy();
    this.draggableHandle = undefined;
    if (!configured || !defaultHandle || this.options.presentation === 'bottom-sheet') return;
    const options = typeof configured === 'object' ? configured : {};
    let handle = defaultHandle;
    if (options.handle instanceof HTMLElement) handle = options.handle;
    else if (options.handle && options.handle !== 'header') {
      handle = this.dialogEl.querySelector<HTMLElement>(options.handle) ?? defaultHandle;
    }
    this.draggableHandle = createDraggable(this.dialogEl, handle, options);
  }

  private getInitialFocusTarget(): HTMLElement | undefined {
    const configured = this.options.initialFocus;
    if (typeof configured === 'string') {
      const matched = this.dialogEl.querySelector<HTMLElement>(configured);
      if (matched) return matched;
    } else if (configured instanceof HTMLElement) {
      return configured;
    } else if (typeof configured === 'function') {
      return configured(this.dialogEl) ?? undefined;
    }

    const explicit = this.dialogEl.querySelector<HTMLElement>('[data-fd-autofocus]');
    if (explicit) return explicit;

    const buttons: ButtonConfig<TResult>[] = this.options.buttons ?? [];
    const autoFocusIndex = buttons.findIndex((button) => button.autoFocus);
    return autoFocusIndex >= 0 ? this.buttonElements[autoFocusIndex] : undefined;
  }

  private handleOverlayMouseDown = (event: MouseEvent): void => {
    if (event.target === this.element) {
      void this.cancel('backdrop');
    }
  };

  private handleNativeCancel = (event: Event): void => {
    event.preventDefault();
    if (this.allowsEscapeClose()) void this.cancel('escape');
  };

  private finishClose(
    result: TResult | undefined,
    reason: CloseReason,
    animate: boolean,
  ): Promise<void> {
    if (!this.finishPromise) {
      this.finishPromise = this.performFinishClose(result, reason, animate);
    }
    return this.finishPromise;
  }

  private async performFinishClose(
    result: TResult | undefined,
    reason: CloseReason,
    animate: boolean,
  ): Promise<void> {
    if (this.state === 'closed') return;
    this.focusTrap.deactivate(false);
    this.element.removeEventListener('mousedown', this.handleOverlayMouseDown);

    try {
      if (animate && this.element.isConnected) {
        await animateDialogOut(this.element, this.dialogEl, this.options.animation);
      }
      await this.plugins.runHook('beforeDestroy', {
        instance: this,
        options: this.options,
        result,
        reason,
      } as unknown as import('../types').HookContext);
    } catch (error) {
      this.reportError(error);
    } finally {
      const nativeDialog = this.element as HTMLDialogElement;
      if (typeof nativeDialog.close === 'function' && nativeDialog.open) nativeDialog.close();
      this.element.remove();
      if (this.options.restoreFocus !== false) this.focusTrap.restoreFocus();
      this.cleanupGesture?.();
      this.draggableHandle?.destroy();
      this.draggableHandle = undefined;
      if (this.pushedToStack) {
        this.stack.remove(this);
        this.pushedToStack = false;
      }
      this.state = 'closed';
      this.resolveClosed(result);
      this.resolveSettled({ result, reason });
      if (this.options.signal && this.abortListener) {
        this.options.signal.removeEventListener('abort', this.abortListener);
      }
    }

    try {
      await this.plugins.runHook('afterClose', {
        instance: this,
        options: this.options,
        result,
        reason,
      } as unknown as import('../types').HookContext);
      await this.options.onClose?.(this, result);
    } catch (error) {
      this.reportError(error);
    }
  }

  private reportError(error: unknown): void {
    if (this.options.onError) {
      try {
        this.options.onError(error, this);
      } catch (handlerError) {
        console.error('[ForgeDialog] onError callback failed', handlerError);
      }
      return;
    }
    console.error('[ForgeDialog] lifecycle error', error);
  }

  private setupSheetGesture(): void {
    let startY = 0;
    let offset = 0;
    const down = (event: PointerEvent) => {
      startY = event.clientY;
      offset = 0;
      this.dialogEl.setPointerCapture?.(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!startY) return;
      offset = Math.max(0, event.clientY - startY);
      this.dialogEl.style.transform = `translateY(${offset}px)`;
    };
    const up = () => {
      startY = 0;
      this.dialogEl.style.transform = '';
      if (offset > 96) void this.cancel('backdrop');
      offset = 0;
    };
    this.dialogEl.addEventListener('pointerdown', down);
    this.dialogEl.addEventListener('pointermove', move);
    this.dialogEl.addEventListener('pointerup', up);
    this.dialogEl.addEventListener('pointercancel', up);
    this.cleanupGesture = () => {
      this.dialogEl.removeEventListener('pointerdown', down);
      this.dialogEl.removeEventListener('pointermove', move);
      this.dialogEl.removeEventListener('pointerup', up);
      this.dialogEl.removeEventListener('pointercancel', up);
    };
  }
}
