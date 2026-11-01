import { useCallback, useEffect, useRef } from 'react';
import { open, type DialogInstance, type DialogOptions } from 'forgedialog';

export function useForgeDialog<TResult = unknown>() {
  const active = useRef<DialogInstance<TResult> | null>(null);
  useEffect(() => () => void active.current?.destroy(), []);
  const show = useCallback((options: DialogOptions<TResult>) => {
    const instance = open<TResult>(options);
    active.current = instance;
    void instance.whenClosed().then(() => {
      if (active.current === instance) active.current = null;
    });
    return instance;
  }, []);
  return { open: show, active };
}
