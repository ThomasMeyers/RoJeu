import { resolveRunStats } from './effects/engine';
import { resolveBoundary } from './boundary';
import { consumeEntityAtPoint, ensureOrbSpawn, tickSpawns } from './spawnSystem';
import type { DeathReason, Direction, GridSize, Point, RunState } from './types';

type ScoreGainSource = 'orb' | 'passive_income';

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

const resolveSourceMultiplier = (state: RunState, source: ScoreGainSource): number => {
  switch (source) {
    case 'orb':
      return state.stats.orbPointsMultiplier;
    case 'passive_income':
      return 1;
    default:
      return 1;
  }
};

const applyPointsGain = (state: RunState, source: ScoreGainSource, baseValue: number): void => {
  const safeBaseValue = Math.max(0, baseValue);
  const rawGain = safeBaseValue * resolveSourceMultiplier(state, source) * state.stats.globalPointsMultiplier;
  const gainWithRemainder = Math.max(0, rawGain + state.pointsFractionRemainder);
  const gained = Math.floor(gainWithRemainder);
  state.pointsFractionRemainder = gainWithRemainder - gained;
  state.score += gained;
};

const applyPassiveIncome = (state: RunState, elapsedMs: number): void => {
  if (state.stats.passiveIncomePointsPerSecond <= 0 || elapsedMs <= 0) {
    return;
  }

  state.passiveIncomeAccumulatorMs += elapsedMs;
  while (state.passiveIncomeAccumulatorMs >= 1000) {
    state.passiveIncomeAccumulatorMs -= 1000;
    applyPointsGain(state, 'passive_income', state.stats.passiveIncomePointsPerSecond);
  }
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
    passiveIncomeAccumulatorMs: 0,
    pointsFractionRemainder: 0,
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

  const elapsedMs = Math.max(0, Math.min(deltaMs, state.remainingMs));
  applyPassiveIncome(state, elapsedMs);

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
      applyPointsGain(state, 'orb', 100);
      state.orbRespawnAtMs = nowMs + state.stats.orbRespawnDelayMs;
      ensureOrbSpawn(state, grid, nowMs);
      break;
    default:
      break;
  }
};
