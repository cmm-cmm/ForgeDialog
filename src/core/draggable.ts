export interface DraggableHandle {
  destroy(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function makeDraggable(dialogEl: HTMLElement, handleEl: HTMLElement): DraggableHandle {
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  let lastX = 0;
  let lastY = 0;
  let dragging = false;

  function handlePointerMove(event: PointerEvent): void {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const rect = dialogEl.getBoundingClientRect();
    const minX = baseX - rect.left;
    const maxX = baseX + (window.innerWidth - rect.right);
    const minY = baseY - rect.top;
    const maxY = baseY + (window.innerHeight - rect.bottom);
    lastX = clamp(baseX + dx, minX, maxX);
    lastY = clamp(baseY + dy, minY, maxY);
    dialogEl.style.transform = `translate(${lastX}px, ${lastY}px)`;
  }

  function stopDragging(event: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    baseX = lastX;
    baseY = lastY;
    handleEl.releasePointerCapture?.(event.pointerId);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', stopDragging);
    dialogEl.classList.remove('fd-dialog--dragging');
  }

  function handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    handleEl.setPointerCapture?.(event.pointerId);
    dialogEl.classList.add('fd-dialog--dragging');
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', stopDragging);
    event.preventDefault();
  }

  handleEl.classList.add('fd-dialog__header--draggable');
  handleEl.addEventListener('pointerdown', handlePointerDown);

  return {
    destroy(): void {
      handleEl.classList.remove('fd-dialog__header--draggable');
      handleEl.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', stopDragging);
      dialogEl.style.transform = '';
      dialogEl.classList.remove('fd-dialog--dragging');
    },
  };
}
