import { open } from '../api/open';
import type { DialogInstance, DialogOptions } from '../types';

export function dialogTrigger<TResult>(node: HTMLElement, options: DialogOptions<TResult>) {
  let current = options;
  const instances = new Set<DialogInstance<TResult>>();
  const handleClick = () => {
    const instance = open<TResult>(current);
    instances.add(instance);
    void instance.whenClosed().then(() => instances.delete(instance));
  };
  node.addEventListener('click', handleClick);
  return {
    update(next: DialogOptions<TResult>) {
      current = next;
    },
    async destroy() {
      node.removeEventListener('click', handleClick);
      await Promise.all([...instances].map((instance) => instance.destroy()));
      instances.clear();
    },
  };
}
