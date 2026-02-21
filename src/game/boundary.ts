import type { BoundaryMode, GridSize, Point } from './types';

const isOutOfBounds = (point: Point, grid: GridSize): boolean =>
  point.x < 0 || point.x >= grid.cols || point.y < 0 || point.y >= grid.rows;

const wrapPoint = (point: Point, grid: GridSize): Point => ({
  x: (point.x + grid.cols) % grid.cols,
  y: (point.y + grid.rows) % grid.rows,
});

export const resolveBoundary = (
  nextHead: Point,
  grid: GridSize,
  mode: BoundaryMode,
): Point | null => {
  if (!isOutOfBounds(nextHead, grid)) {
    return nextHead;
  }

  if (mode === 'wrap-around') {
    return wrapPoint(nextHead, grid);
  }

  return null;
};
