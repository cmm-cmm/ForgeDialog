import { onUnmounted, shallowRef } from 'vue';
import { open } from '../api/open';
import type { DialogInstance, DialogOptions } from '../types';

export function useForgeDialog<TResult = unknown>() {
  const active = shallowRef<DialogInstance<TResult> | null>(null);
  onUnmounted(() => void active.value?.destroy());
  const show = (options: DialogOptions<TResult>) => {
    const instance = open<TResult>(options);
    active.value = instance;
    void instance.whenClosed().then(() => {
      if (active.value === instance) active.value = null;
    });
    return instance;
  };
  return { open: show, active };
}
