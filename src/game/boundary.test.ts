import { describe, expect, it } from 'vitest';
import { resolveBoundary } from './boundary';
import type { GridSize } from './types';

const GRID: GridSize = { cols: 10, rows: 8 };

describe('resolveBoundary', () => {
  it('returns the point unchanged when it stays inside the grid', () => {
    expect(resolveBoundary({ x: 3, y: 4 }, GRID, 'wall-kill')).toEqual({ x: 3, y: 4 });
    expect(resolveBoundary({ x: 0, y: 0 }, GRID, 'wrap-around')).toEqual({ x: 0, y: 0 });
    expect(resolveBoundary({ x: 9, y: 7 }, GRID, 'wall-kill')).toEqual({ x: 9, y: 7 });
  });

  describe('wall-kill mode', () => {
    it('returns null on every out-of-bounds side', () => {
      expect(resolveBoundary({ x: -1, y: 4 }, GRID, 'wall-kill')).toBeNull();
      expect(resolveBoundary({ x: 10, y: 4 }, GRID, 'wall-kill')).toBeNull();
      expect(resolveBoundary({ x: 3, y: -1 }, GRID, 'wall-kill')).toBeNull();
      expect(resolveBoundary({ x: 3, y: 8 }, GRID, 'wall-kill')).toBeNull();
    });
  });

  describe('wrap-around mode', () => {
    it('wraps horizontally', () => {
      expect(resolveBoundary({ x: -1, y: 4 }, GRID, 'wrap-around')).toEqual({ x: 9, y: 4 });
      expect(resolveBoundary({ x: 10, y: 4 }, GRID, 'wrap-around')).toEqual({ x: 0, y: 4 });
    });

    it('wraps vertically', () => {
      expect(resolveBoundary({ x: 3, y: -1 }, GRID, 'wrap-around')).toEqual({ x: 3, y: 7 });
      expect(resolveBoundary({ x: 3, y: 8 }, GRID, 'wrap-around')).toEqual({ x: 3, y: 0 });
    });

    it('never returns null', () => {
      expect(resolveBoundary({ x: -1, y: -1 }, GRID, 'wrap-around')).toEqual({ x: 9, y: 7 });
    });
  });
});
