import { getFocusableElements, isTabKey } from './keyboard';

export class FocusTrap {
  private readonly container: HTMLElement;
  private previouslyFocused: HTMLElement | null = null;
  private active = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  activate(initialFocus?: HTMLElement | null): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.active = true;
    document.addEventListener('keydown', this.handleKeydown, true);
    const target = initialFocus ?? this.getInitialFocusTarget();
    target.focus();
  }

  deactivate(restoreFocus = true): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('keydown', this.handleKeydown, true);
    if (restoreFocus) this.restoreFocus();
  }

  restoreFocus(): void {
    const restoreTo = this.previouslyFocused;
    this.previouslyFocused = null;
    if (restoreTo && typeof restoreTo.focus === 'function' && document.contains(restoreTo)) {
      restoreTo.focus();
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getInitialFocusTarget(): HTMLElement {
    const focusable = getFocusableElements(this.container);
    return focusable[0] ?? this.ensureContainerFocusable();
  }

  private ensureContainerFocusable(): HTMLElement {
    if (!this.container.hasAttribute('tabindex')) {
      this.container.setAttribute('tabindex', '-1');
    }
    return this.container;
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (!this.active || !isTabKey(event)) return;
    if (!this.container.contains(document.activeElement)) return;

    const focusable = getFocusableElements(this.container);
    if (focusable.length === 0) {
      event.preventDefault();
      this.container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
