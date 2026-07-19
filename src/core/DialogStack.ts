import { isEscapeKey } from './keyboard';
import { lockScroll, unlockScroll } from './scrollLock';
import type { Dialog } from './Dialog';

const Z_INDEX_BASE = 1000;
const Z_INDEX_STEP = 10;

export class DialogStackManager {
  private stack: Dialog[] = [];
  private escapeListenerAttached = false;

  push(dialog: Dialog): number {
    this.stack.push(dialog);
    if (this.stack.length === 1) {
      lockScroll();
      this.attachEscapeListener();
    }
    return Z_INDEX_BASE + (this.stack.length - 1) * Z_INDEX_STEP;
  }

  remove(dialog: Dialog): void {
    const index = this.stack.indexOf(dialog);
    if (index === -1) return;
    this.stack.splice(index, 1);
    if (this.stack.length === 0) {
      unlockScroll();
      this.detachEscapeListener();
    }
  }

  top(): Dialog | undefined {
    return this.stack[this.stack.length - 1];
  }

  size(): number {
    return this.stack.length;
  }

  closeTop(result?: unknown): void {
    void this.top()?.close(result);
  }

  closeAll(): void {
    for (const dialog of [...this.stack].reverse()) {
      void dialog.close();
    }
  }

  resetForTests(): void {
    this.stack = [];
    this.detachEscapeListener();
  }

  private attachEscapeListener(): void {
    if (this.escapeListenerAttached) return;
    this.escapeListenerAttached = true;
    document.addEventListener('keydown', this.handleKeydown);
  }

  private detachEscapeListener(): void {
    if (!this.escapeListenerAttached) return;
    this.escapeListenerAttached = false;
    document.removeEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (!isEscapeKey(event)) return;
    const top = this.top();
    if (top && top.allowsEscapeClose()) {
      void top.close();
    }
  };
}

export const dialogStack = new DialogStackManager();

export function resetDialogStackForTests(): void {
  dialogStack.resetForTests();
}
