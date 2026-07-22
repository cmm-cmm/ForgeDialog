import type { DraggableOptions } from '../types';
import { type DraggableFactory, type DraggableHandle, makeBasicDraggable } from './draggable-basic';

let draggableFactory: DraggableFactory = makeBasicDraggable;

export function registerDraggableFactory(factory: DraggableFactory): void {
  draggableFactory = factory;
}

export function createDraggable(
  dialog: HTMLElement,
  handle: HTMLElement,
  options: DraggableOptions,
): DraggableHandle {
  return draggableFactory(dialog, handle, options);
}

export type { DraggableHandle } from './draggable-basic';
