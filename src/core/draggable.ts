import type { DialogPosition, DraggableOptions } from '../types';
import type { DraggableHandle } from './draggable-basic';

export type { DraggableHandle } from './draggable-basic';

const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable="true"]';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readStoredPosition(key?: string): DialogPosition | undefined {
  if (!key) return undefined;
  try {
    const parsed = JSON.parse(localStorage.getItem(`forgedialog:position:${key}`) ?? 'null');
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) return parsed;
  } catch {
    // Storage may be unavailable or contain stale data; fall back safely.
  }
  return undefined;
}

export function makeDraggable(
  dialogEl: HTMLElement,
  handleEl: HTMLElement,
  options: DraggableOptions = {},
): DraggableHandle {
  let position = { x: 0, y: 0 };
  let startPointer = { x: 0, y: 0 };
  let startPosition = { x: 0, y: 0 };
  let dragging = false;
  let frame = 0;
  let pendingMove: PointerEvent | undefined;
  const axis = options.axis ?? 'both';
  const originalTabIndex = handleEl.getAttribute('tabindex');
  let originRect = dialogEl.getBoundingClientRect();

  function refreshOrigin(): void {
    if (originRect.width > 0 || !dialogEl.isConnected) return;
    const current = dialogEl.getBoundingClientRect();
    if (current.width === 0 && current.height === 0) return;
    originRect = new DOMRect(
      current.left - position.x,
      current.top - position.y,
      current.width,
      current.height,
    );
  }

  function boundsRect(): DOMRect {
    if (options.bounds instanceof HTMLElement) return options.bounds.getBoundingClientRect();
    if (options.bounds && options.bounds !== 'viewport') return options.bounds;
    const viewport = window.visualViewport;
    return viewport
      ? new DOMRect(viewport.offsetLeft, viewport.offsetTop, viewport.width, viewport.height)
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function constrain(next: DialogPosition): DialogPosition {
    refreshOrigin();
    if (originRect.width === 0 && originRect.height === 0) return next;
    const bounds = boundsRect();
    return {
      x: clamp(next.x, bounds.left - originRect.left, bounds.right - originRect.right),
      y: clamp(next.y, bounds.top - originRect.top, bounds.bottom - originRect.bottom),
    };
  }

  function setPosition(next: DialogPosition): DialogPosition {
    const requested = {
      x: axis === 'y' ? position.x : next.x,
      y: axis === 'x' ? position.y : next.y,
    };
    position = constrain(requested);
    dialogEl.style.setProperty('--fd-drag-x', `${position.x}px`);
    dialogEl.style.setProperty('--fd-drag-y', `${position.y}px`);
    return { ...position };
  }

  function persist(): void {
    if (!options.persistKey) return;
    try {
      localStorage.setItem(`forgedialog:position:${options.persistKey}`, JSON.stringify(position));
    } catch {
      // Persistence is optional and must not break dragging.
    }
  }

  function applyPointerMove(event: PointerEvent): void {
    setPosition({
      x: startPosition.x + event.clientX - startPointer.x,
      y: startPosition.y + event.clientY - startPointer.y,
    });
    options.onDrag?.({ position: { ...position }, originalEvent: event });
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!dragging) return;
    if (originRect.width === 0) {
      applyPointerMove(event);
      return;
    }
    pendingMove = event;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (pendingMove) applyPointerMove(pendingMove);
      pendingMove = undefined;
    });
  }

  function stopDragging(event: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (pendingMove) applyPointerMove(pendingMove);
    pendingMove = undefined;
    handleEl.releasePointerCapture?.(event.pointerId);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', stopDragging);
    document.removeEventListener('pointercancel', stopDragging);
    dialogEl.classList.remove('fd-dialog--dragging');
    persist();
    options.onDragEnd?.({ position: { ...position }, originalEvent: event });
  }

  function handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0 || (event.target as HTMLElement).closest(INTERACTIVE)) return;
    dragging = true;
    startPointer = { x: event.clientX, y: event.clientY };
    startPosition = { ...position };
    handleEl.setPointerCapture?.(event.pointerId);
    dialogEl.classList.add('fd-dialog--dragging');
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', stopDragging);
    document.addEventListener('pointercancel', stopDragging);
    options.onDragStart?.({ position: { ...position }, originalEvent: event });
    event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const directions: Record<string, DialogPosition> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;
    const step = (options.keyboardStep ?? 10) * (event.shiftKey ? 5 : 1);
    setPosition({ x: position.x + direction.x * step, y: position.y + direction.y * step });
    persist();
    options.onDrag?.({ position: { ...position }, originalEvent: event });
    options.onDragEnd?.({ position: { ...position }, originalEvent: event });
    event.preventDefault();
  }

  handleEl.classList.add('fd-dialog__header--draggable');
  handleEl.addEventListener('pointerdown', handlePointerDown);
  if (options.keyboard !== false) {
    if (originalTabIndex === null) handleEl.tabIndex = 0;
    handleEl.addEventListener('keydown', handleKeyDown);
  }
  setPosition(readStoredPosition(options.persistKey) ?? options.initialPosition ?? position);
  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => {
          const current = dialogEl.getBoundingClientRect();
          originRect = new DOMRect(
            current.left - position.x,
            current.top - position.y,
            current.width,
            current.height,
          );
          setPosition(position);
        });
  resizeObserver?.observe(dialogEl);
  const handleViewportResize = (): void => void setPosition(position);
  window.addEventListener('resize', handleViewportResize, { passive: true });
  window.visualViewport?.addEventListener('resize', handleViewportResize, { passive: true });

  return {
    destroy(): void {
      handleEl.classList.remove('fd-dialog__header--draggable');
      handleEl.removeEventListener('pointerdown', handlePointerDown);
      handleEl.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', stopDragging);
      document.removeEventListener('pointercancel', stopDragging);
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      if (originalTabIndex === null) handleEl.removeAttribute('tabindex');
      else handleEl.setAttribute('tabindex', originalTabIndex);
      dialogEl.style.removeProperty('--fd-drag-x');
      dialogEl.style.removeProperty('--fd-drag-y');
      dialogEl.classList.remove('fd-dialog--dragging');
    },
    getPosition: () => ({ ...position }),
    setPosition,
    resetPosition(): void {
      if (options.persistKey) {
        try {
          localStorage.removeItem(`forgedialog:position:${options.persistKey}`);
        } catch {
          // Ignore unavailable storage.
        }
      }
      setPosition(options.initialPosition ?? { x: 0, y: 0 });
    },
  };
}
