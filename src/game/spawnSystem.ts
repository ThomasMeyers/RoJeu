import type { GridSize, Point, RunState } from './types';

const pointKey = (point: Point): string => `${point.x},${point.y}`;

const randomFreePoint = (grid: GridSize, blocked: Point[]): Point => {
  const blockedSet = new Set(blocked.map(pointKey));
  const freePoints: Point[] = [];

  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      const point = { x, y };
      if (!blockedSet.has(pointKey(point))) {
        freePoints.push(point);
      }
    }
  }

  const index = Math.floor(Math.random() * freePoints.length);
  return freePoints[Math.max(0, index)] ?? { x: 0, y: 0 };
};

const nextEntityId = (): string =>
  `${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-5)}`;

export const consumeEntityAtPoint = (state: RunState, point: Point) => {
  const index = state.entities.findIndex((entity) => entity.position.x === point.x && entity.position.y === point.y);
  if (index < 0) {
    return null;
  }

  const [entity] = state.entities.splice(index, 1);
  return entity;
};

export const ensureRogieSpawn = (state: RunState, grid: GridSize, nowMs: number): void => {
  const hasRogie = state.entities.some((entity) => entity.kind === 'rogie');
  if (hasRogie) {
    return;
  }

  if (state.rogieRespawnAtMs !== null && nowMs < state.rogieRespawnAtMs) {
    return;
  }

  const blocked = [...state.slug, ...state.entities.map((entity) => entity.position)];
  state.entities.push({
    id: nextEntityId(),
    kind: 'rogie',
    position: randomFreePoint(grid, blocked),
    expiresAtMs: null,
  });
  state.rogieRespawnAtMs = null;
};

export const tickSpawns = (state: RunState, grid: GridSize, nowMs: number): void => {
  ensureRogieSpawn(state, grid, nowMs);
};
