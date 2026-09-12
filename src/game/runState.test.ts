import { describe, expect, it } from 'vitest';
import {
  commitSudoku,
  createInitialRunState,
  getCurrentTickMs,
  getCurrentVisionRadius,
  queueDirection,
  stepRun,
} from './runState';
import type { GridSize, RunState } from './types';

const GRID: GridSize = { cols: 10, rows: 10 };

/**
 * Spawns are random, so tests park an orb in a harmless cell: `ensureOrbSpawn`
 * bails out as soon as an orb exists, which keeps `stepRun` deterministic.
 */
const parkOrb = (state: RunState, x = 0, y = 0): void => {
  state.entities.push({ id: 'parked-orb', kind: 'orb', position: { x, y }, expiresAtMs: null });
};

const runningState = (effectIds: string[] = []): RunState => {
  const state = createInitialRunState(GRID, effectIds, 0);
  queueDirection(state, 'right', 0);
  parkOrb(state);
  return state;
};

describe('createInitialRunState', () => {
  it('starts waiting for the first direction, centered, with base stats applied', () => {
    const state = createInitialRunState(GRID, [], 0);

    expect(state.phase).toBe('waiting_start');
    expect(state.startedAtMs).toBeNull();
    expect(state.slug).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    expect(state.direction).toBe('right');
    expect(state.score).toBe(0);
    expect(state.lives).toBe(1);
    expect(state.remainingMs).toBe(60_000);
    expect(state.boundaryMode).toBe('wall-kill');
    expect(state.runCommitted).toBe(false);
  });

  it('takes its boundary mode from the active effects', () => {
    expect(createInitialRunState(GRID, ['no_walls_lvl1'], 0).boundaryMode).toBe('wrap-around');
  });
});

describe('queueDirection', () => {
  it('starts the run on the first accepted direction', () => {
    const state = createInitialRunState(GRID, [], 0);
    queueDirection(state, 'up', 1234);

    expect(state.phase).toBe('running');
    expect(state.startedAtMs).toBe(1234);
    expect(state.pendingDirection).toBe('up');
  });

  it('ignores a reversal, and does not start the run with it', () => {
    const state = createInitialRunState(GRID, [], 0);
    queueDirection(state, 'left', 1234);

    expect(state.pendingDirection).toBe('right');
    expect(state.phase).toBe('waiting_start');
    expect(state.startedAtMs).toBeNull();
  });
});

describe('stepRun movement', () => {
  it('does nothing while the run is not running', () => {
    const state = createInitialRunState(GRID, [], 0);
    const slugBefore = structuredClone(state.slug);

    stepRun(state, GRID, 0, 100);

    expect(state.slug).toEqual(slugBefore);
    expect(state.remainingMs).toBe(60_000);
  });

  it('advances the head by one cell and keeps the length without food', () => {
    const state = runningState();

    stepRun(state, GRID, 0, 100);

    expect(state.slug[0]).toEqual({ x: 6, y: 5 });
    expect(state.slug).toHaveLength(3);
  });
});

describe('stepRun collisions', () => {
  it('ends the run on a wall with the last life', () => {
    const state = runningState();
    state.slug = [
      { x: 9, y: 5 },
      { x: 8, y: 5 },
      { x: 7, y: 5 },
    ];

    stepRun(state, GRID, 500, 100);

    expect(state.phase).toBe('ended');
    expect(state.deathReason).toBe('wall_collision');
    expect(state.endedAtMs).toBe(500);
  });

  it('wraps instead of dying when no_walls is active', () => {
    const state = runningState(['no_walls_lvl1']);
    state.slug = [
      { x: 9, y: 5 },
      { x: 8, y: 5 },
      { x: 7, y: 5 },
    ];

    stepRun(state, GRID, 500, 100);

    expect(state.phase).toBe('running');
    expect(state.slug[0]).toEqual({ x: 0, y: 5 });
  });

  it('ends the run when the head enters its own body', () => {
    const state = runningState();
    state.slug = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ];
    state.direction = 'down';
    state.pendingDirection = 'down';

    stepRun(state, GRID, 0, 100);

    expect(state.phase).toBe('ended');
    expect(state.deathReason).toBe('self_collision');
  });

  it('allows the head to follow the tail cell it is about to free', () => {
    const state = runningState();
    state.slug = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
    ];
    state.direction = 'down';
    state.pendingDirection = 'down';

    stepRun(state, GRID, 0, 100);

    expect(state.phase).toBe('running');
    expect(state.slug[0]).toEqual({ x: 5, y: 6 });
  });

  it('consumes a life and respawns instead of ending when lives remain', () => {
    const state = runningState();
    state.lives = 2;
    state.slug = [
      { x: 9, y: 5 },
      { x: 8, y: 5 },
      { x: 7, y: 5 },
    ];

    stepRun(state, GRID, 0, 100);

    expect(state.phase).toBe('running');
    expect(state.lives).toBe(1);
    expect(state.deathReason).toBeNull();
    expect(state.slug).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ]);
    expect(state.direction).toBe('right');
  });
});

describe('stepRun timer', () => {
  it('ends the run when the remaining time runs out, without moving', () => {
    const state = runningState();
    state.remainingMs = 50;
    const slugBefore = structuredClone(state.slug);

    stepRun(state, GRID, 900, 100);

    expect(state.remainingMs).toBe(0);
    expect(state.phase).toBe('ended');
    expect(state.deathReason).toBe('timer_end');
    expect(state.slug).toEqual(slugBefore);
  });
});

describe('stepRun scoring', () => {
  it('grants 100 points and grows the slug when an orb is eaten', () => {
    const state = runningState();
    state.entities.push({ id: 'target', kind: 'orb', position: { x: 6, y: 5 }, expiresAtMs: null });

    stepRun(state, GRID, 0, 100);

    expect(state.score).toBe(100);
    expect(state.slug).toHaveLength(4);
    expect(state.slug[0]).toEqual({ x: 6, y: 5 });
  });

  it('applies the orb multiplier from active effects', () => {
    const state = runningState(['orb_yield_lvl1']);
    state.entities.push({ id: 'target', kind: 'orb', position: { x: 6, y: 5 }, expiresAtMs: null });

    stepRun(state, GRID, 0, 100);

    expect(state.score).toBe(110);
  });

  it('pays passive income once per elapsed second', () => {
    const state = runningState(['passive_income_lvl1']);

    stepRun(state, GRID, 0, 400);
    expect(state.score).toBe(0);

    stepRun(state, GRID, 0, 600);
    expect(state.score).toBe(1);
  });

  it('carries the fractional part of a gain instead of losing it', () => {
    const state = runningState();
    state.stats.passiveIncomePointsPerSecond = 0.5;

    stepRun(state, GRID, 0, 1000);
    expect(state.score).toBe(0);

    stepRun(state, GRID, 0, 1000);
    expect(state.score).toBe(1);
  });
});

describe('timed effect stats', () => {
  it('adds the vision delta of active effects only', () => {
    const state = runningState();
    state.activeTimedEffects.push({
      id: 'vision_boost',
      expiresAtMs: 1000,
      statModifiers: { visionRadiusDelta: 3 },
    });

    expect(getCurrentVisionRadius(state, 500)).toBe(5);
    expect(getCurrentVisionRadius(state, 1000)).toBe(2);
  });

  it('never returns a negative vision radius', () => {
    const state = runningState();
    state.activeTimedEffects.push({
      id: 'blind',
      expiresAtMs: 1000,
      statModifiers: { visionRadiusDelta: -99 },
    });

    expect(getCurrentVisionRadius(state, 0)).toBe(0);
  });

  it('speeds the tick up with a positive speed delta, and floors it at 40ms', () => {
    const state = runningState();
    expect(getCurrentTickMs(state, 0)).toBe(120);

    state.activeTimedEffects.push({
      id: 'speed_boost',
      expiresAtMs: 1000,
      statModifiers: { speedMultiplierDelta: 1 },
    });
    expect(getCurrentTickMs(state, 0)).toBe(60);

    state.activeTimedEffects[0].statModifiers.speedMultiplierDelta = 5;
    expect(getCurrentTickMs(state, 0)).toBe(40);
  });
});

describe('commitSudoku', () => {
  it('ends the run with the suicide reason', () => {
    const state = runningState();

    commitSudoku(state, 777);

    expect(state.phase).toBe('ended');
    expect(state.deathReason).toBe('suicide');
    expect(state.endedAtMs).toBe(777);
  });
});
