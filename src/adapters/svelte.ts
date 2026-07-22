import { open } from '../api/open';
import type { DialogOptions } from '../types';

export function dialogTrigger<TResult>(node: HTMLElement, options: DialogOptions<TResult>) {
  let current = options;
  const handleClick = () => open<TResult>(current);
  node.addEventListener('click', handleClick);
  return {
    update(next: DialogOptions<TResult>) {
      current = next;
    },
    destroy() {
      node.removeEventListener('click', handleClick);
    },
  };
}
