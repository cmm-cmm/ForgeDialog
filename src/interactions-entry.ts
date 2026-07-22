import { registerDraggableFactory } from './core/interactionRegistry';
import { makeDraggable } from './core/draggable';

registerDraggableFactory(makeDraggable);

export { makeDraggable } from './core/draggable';
export type { DraggableHandle } from './core/draggable';
export type { DialogDragEvent, DialogPosition, DraggableOptions } from './types';
