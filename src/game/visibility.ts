import type { Point } from './types';

export const isVisibleFromHead = (cell: Point, head: Point, radius: number): boolean =>
  Math.abs(cell.x - head.x) + Math.abs(cell.y - head.y) <= radius;
