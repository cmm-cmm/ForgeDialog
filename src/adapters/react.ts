import { useCallback, useEffect, useRef } from 'react';
import { open } from '../api/open';
import type { DialogInstance, DialogOptions } from '../types';

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
