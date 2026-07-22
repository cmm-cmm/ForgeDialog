import { isEscapeKey } from './keyboard';
import { lockScroll, unlockScroll } from './scrollLock';
import type { CloseReason } from '../types';

interface StackDialog {
  allowsEscapeClose(): boolean;
  close(result?: never, reason?: CloseReason): Promise<void>;
  cancel?: (reason?: CloseReason) => Promise<void>;
}

const Z_INDEX_BASE = 1000;
const Z_INDEX_STEP = 10;

export class DialogStackManager {
  private stack: StackDialog[] = [];
  private escapeListenerAttached = false;

  push(dialog: StackDialog): number {
    this.stack.push(dialog);
    if (this.stack.length === 1) {
      lockScroll();
      this.attachEscapeListener();
    }
    return Z_INDEX_BASE + (this.stack.length - 1) * Z_INDEX_STEP;
  }

  remove(dialog: StackDialog): void {
    const index = this.stack.indexOf(dialog);
    if (index === -1) return;
    this.stack.splice(index, 1);
    if (this.stack.length === 0) {
      unlockScroll();
      this.detachEscapeListener();
    }
  }

  top(): StackDialog | undefined {
    return this.stack[this.stack.length - 1];
  }

  size(): number {
    return this.stack.length;
  }

  closeTop(result?: never): void {
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
      if (top.cancel) void top.cancel('escape');
      else void top.close(undefined, 'escape');
    }
  };
}

export const dialogStack = new DialogStackManager();

export function resetDialogStackForTests(): void {
  dialogStack.resetForTests();
}
