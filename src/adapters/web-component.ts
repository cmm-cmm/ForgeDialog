import { open } from '../api/open';
import type { DialogInstance } from '../types';

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export class ForgeDialogElement extends HTMLElementBase {
  private instance?: DialogInstance<void>;

  connectedCallback(): void {
    if (this.hasAttribute('open')) this.show();
  }

  show(): void {
    if (this.instance?.isOpen()) return;
    this.instance = open<void>({
      title: this.getAttribute('title') ?? undefined,
      message: this.getAttribute('message') ?? this.textContent ?? undefined,
      size: (this.getAttribute('size') as 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen') ?? 'md',
      buttons: [{ text: 'Close', role: 'primary', closesDialog: true }],
    });
    void this.instance.whenClosed().then(() => {
      this.removeAttribute('open');
      this.dispatchEvent(new CustomEvent('fd-close'));
    });
  }

  close(): void {
    void this.instance?.close();
  }
}

export function defineForgeDialog(tagName = 'forge-dialog'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, ForgeDialogElement);
  }
}
