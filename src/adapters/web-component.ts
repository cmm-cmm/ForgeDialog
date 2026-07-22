import { open } from '../api/open';
import type { DialogInstance } from '../types';

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export class ForgeDialogElement extends HTMLElementBase {
  private instance?: DialogInstance<void>;

  static get observedAttributes(): string[] {
    return ['open', 'title', 'message', 'size'];
  }

  connectedCallback(): void {
    if (this.hasAttribute('open')) this.show();
  }

  disconnectedCallback(): void {
    void this.instance?.destroy();
    this.instance = undefined;
  }

  attributeChangedCallback(name: string, oldValue: string | null, value: string | null): void {
    if (!this.isConnected || oldValue === value) return;
    if (name === 'open') {
      if (value === null) void this.instance?.close();
      else this.show();
      return;
    }
    if (!this.instance?.isOpen()) return;
    if (name === 'title') this.instance.update({ title: value ?? undefined });
    if (name === 'message') this.instance.update({ message: value ?? undefined });
    if (name === 'size') {
      this.instance.update({
        size: (value as 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen' | null) ?? 'md',
      });
    }
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
      this.instance = undefined;
    });
    if (!this.hasAttribute('open')) this.setAttribute('open', '');
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
