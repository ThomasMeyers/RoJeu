import { resolveRunStats } from './effects/engine';
import { resolveBoundary } from './boundary';
import { consumeEntityAtPoint, ensureOrbSpawn, tickSpawns } from './spawnSystem';
import type { DeathReason, Direction, GridSize, Point, RunState } from './types';

const isOppositeDirection = (a: Direction, b: Direction): boolean =>
  (a === 'up' && b === 'down') ||
  (a === 'down' && b === 'up') ||
  (a === 'left' && b === 'right') ||
  (a === 'right' && b === 'left');

const pointsEqual = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

const movePoint = (origin: Point, direction: Direction): Point => {
  switch (direction) {
    case 'up':
      return { x: origin.x, y: origin.y - 1 };
    case 'down':
      return { x: origin.x, y: origin.y + 1 };
    case 'left':
      return { x: origin.x - 1, y: origin.y };
    case 'right':
      return { x: origin.x + 1, y: origin.y };
    default:
      return origin;
  }
};

const buildStartingSlug = (grid: GridSize): Point[] => {
  const center = {
    x: Math.floor(grid.cols / 2),
    y: Math.floor(grid.rows / 2),
  };

  return [
    center,
    { x: center.x - 1, y: center.y },
    { x: center.x - 2, y: center.y },
  ];
};

const endRun = (state: RunState, nowMs: number, deathReason: DeathReason): void => {
  state.phase = 'ended';
  state.endedAtMs = nowMs;
  state.deathReason = deathReason;
};

const loseLife = (state: RunState, grid: GridSize, nowMs: number, cause: DeathReason): void => {
  state.lives -= 1;
  if (state.lives <= 0) {
    endRun(state, nowMs, cause);
    return;
  }

  state.slug = buildStartingSlug(grid);
  state.direction = 'right';
  state.pendingDirection = 'right';
};

const addScore = (state: RunState, baseValue: number): void => {
  const gained = Math.max(0, Math.round(baseValue * state.stats.orbScoreMultiplier));
  state.score += gained;
};

export const createInitialRunState = (
  grid: GridSize,
  activeEffectIds: string[],
  nowMs: number,
): RunState => {
  const stats = resolveRunStats(activeEffectIds);

  return {
    slug: buildStartingSlug(grid),
    direction: 'right',
    pendingDirection: 'right',
    score: 0,
    lives: stats.baseLives,
    remainingMs: stats.runDurationSec * 1000,
    phase: 'waiting_start',
    boundaryMode: stats.boundaryMode,
    entities: [],
    orbRespawnAtMs: nowMs,
    activeEffectIds,
    stats,
    startedAtMs: null,
    endedAtMs: null,
    deathReason: null,
    runCommitted: false,
  };
};

export const queueDirection = (state: RunState, nextDirection: Direction, nowMs: number): void => {
  if (isOppositeDirection(state.direction, nextDirection)) {
    return;
  }

  if (state.phase === 'waiting_start') {
    state.phase = 'running';
    state.startedAtMs = nowMs;
  }

  state.pendingDirection = nextDirection;
};

export const stepRun = (state: RunState, grid: GridSize, nowMs: number, deltaMs: number): void => {
  if (state.phase !== 'running') {
    return;
  }

  state.remainingMs -= deltaMs;
  if (state.remainingMs <= 0) {
    state.remainingMs = 0;
    endRun(state, nowMs, 'timer_end');
    return;
  }

  tickSpawns(state, grid, nowMs);

  if (!isOppositeDirection(state.direction, state.pendingDirection)) {
    state.direction = state.pendingDirection;
  }

  const currentHead = state.slug[0];
  const projectedHead = movePoint(currentHead, state.direction);
  const nextHead = resolveBoundary(projectedHead, grid, state.boundaryMode);
  if (nextHead === null) {
    loseLife(state, grid, nowMs, 'wall_collision');
    return;
  }

  const entityAtHead = state.entities.find((entity) => pointsEqual(entity.position, nextHead)) ?? null;
  const shouldGrow = entityAtHead !== null;
  const bodyToCheck = shouldGrow ? state.slug : state.slug.slice(0, -1);
  const collidesWithBody = bodyToCheck.some((segment) => pointsEqual(segment, nextHead));
  if (collidesWithBody) {
    loseLife(state, grid, nowMs, 'self_collision');
    return;
  }

  state.slug.unshift(nextHead);
  if (!shouldGrow) {
    state.slug.pop();
  }

  if (!entityAtHead) {
    return;
  }

  const consumed = consumeEntityAtPoint(state, nextHead);
  if (!consumed) {
    return;
  }

  switch (consumed.kind) {
    case 'orb':
      addScore(state, 100);
      state.orbRespawnAtMs = nowMs + state.stats.orbRespawnDelayMs;
      ensureOrbSpawn(state, grid, nowMs);
      break;
    default:
      break;
  }
};
