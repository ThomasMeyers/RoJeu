import type { GridSize, PickupTypeId, Point, RunState } from './types';
import { getPickupDefinitions } from './pickupCatalog';

const pointKey = (point: Point): string => `${point.x},${point.y}`;

const randomFreePoint = (grid: GridSize, blocked: Point[]): Point | null => {
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

  if (freePoints.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * freePoints.length);
  return freePoints[Math.max(0, index)] ?? null;
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

export const ensureOrbSpawn = (state: RunState, grid: GridSize, nowMs: number): void => {
  const hasOrb = state.entities.some((entity) => entity.kind === 'orb');
  if (hasOrb) {
    return;
  }

  if (state.orbRespawnAtMs !== null && nowMs < state.orbRespawnAtMs) {
    return;
  }

  const blocked = [...state.slug, ...state.entities.map((entity) => entity.position)];
  const spawnPoint = randomFreePoint(grid, blocked);
  if (!spawnPoint) {
    return;
  }
  state.entities.push({
    id: nextEntityId(),
    kind: 'orb',
    position: spawnPoint,
    expiresAtMs: null,
  });
  state.orbRespawnAtMs = null;
};

const countPickupEntities = (state: RunState, pickupTypeId: PickupTypeId): number =>
  state.entities.filter((entity) => entity.kind === 'pickup' && entity.pickupTypeId === pickupTypeId).length;

const tickPickupSpawns = (state: RunState, grid: GridSize, elapsedMs: number): void => {
  if (elapsedMs <= 0) {
    return;
  }

  state.pickupSpawnAccumulatorMs += elapsedMs;
  while (state.pickupSpawnAccumulatorMs >= 1000) {
    state.pickupSpawnAccumulatorMs -= 1000;

    getPickupDefinitions().forEach((pickup) => {
      const spawnChance = Math.max(0, Math.min(1, pickup.getSpawnChancePerSecond(state)));
      if (spawnChance <= 0) {
        return;
      }

      if (countPickupEntities(state, pickup.id) >= pickup.maxConcurrent) {
        return;
      }

      if (Math.random() >= spawnChance) {
        return;
      }

      const blocked = [...state.slug, ...state.entities.map((entity) => entity.position)];
      const spawnPoint = randomFreePoint(grid, blocked);
      if (!spawnPoint) {
        return;
      }

      state.entities.push({
        id: nextEntityId(),
        kind: 'pickup',
        pickupTypeId: pickup.id,
        position: spawnPoint,
        expiresAtMs: null,
      });
    });
  }
};

export const tickSpawns = (state: RunState, grid: GridSize, nowMs: number, elapsedMs: number): void => {
  ensureOrbSpawn(state, grid, nowMs);
  tickPickupSpawns(state, grid, elapsedMs);
};
