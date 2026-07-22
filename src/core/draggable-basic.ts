import type { DialogPosition, DraggableOptions } from '../types';

export interface DraggableHandle {
  destroy(): void;
  getPosition(): DialogPosition;
  setPosition(position: DialogPosition): DialogPosition;
  resetPosition(): void;
}

export type DraggableFactory = (
  dialog: HTMLElement,
  handle: HTMLElement,
  options?: DraggableOptions,
) => DraggableHandle;

export const makeBasicDraggable: DraggableFactory = (dialog, handle, options = {}) => {
  let position = options.initialPosition ?? { x: 0, y: 0 };
  let pointer: DialogPosition | undefined;
  let start = position;
  const axis = options.axis ?? 'both';

  const setPosition = (next: DialogPosition): DialogPosition => {
    position = {
      x: axis === 'y' ? position.x : next.x,
      y: axis === 'x' ? position.y : next.y,
    };
    dialog.style.setProperty('--fd-drag-x', `${position.x}px`);
    dialog.style.setProperty('--fd-drag-y', `${position.y}px`);
    return { ...position };
  };
  const move = (event: PointerEvent): void => {
    if (!pointer) return;
    setPosition({ x: start.x + event.clientX - pointer.x, y: start.y + event.clientY - pointer.y });
  };
  const up = (): void => {
    pointer = undefined;
    dialog.classList.remove('fd-dialog--dragging');
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  };
  const down = (event: PointerEvent): void => {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest('button,a,input,textarea,select')
    )
      return;
    pointer = { x: event.clientX, y: event.clientY };
    start = { ...position };
    dialog.classList.add('fd-dialog--dragging');
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    event.preventDefault();
  };

  handle.classList.add('fd-dialog__header--draggable');
  handle.addEventListener('pointerdown', down);
  setPosition(position);
  return {
    getPosition: () => ({ ...position }),
    setPosition,
    resetPosition: () => void setPosition(options.initialPosition ?? { x: 0, y: 0 }),
    destroy: () => {
      up();
      handle.classList.remove('fd-dialog__header--draggable');
      handle.removeEventListener('pointerdown', down);
      dialog.style.removeProperty('--fd-drag-x');
      dialog.style.removeProperty('--fd-drag-y');
    },
  };
};
