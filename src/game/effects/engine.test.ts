import { describe, expect, it } from 'vitest';
import { resolveRunStats } from './engine';
import { createBaseRunStats } from './schema';

describe('resolveRunStats', () => {
  it('returns base stats when no effect is active', () => {
    expect(resolveRunStats([])).toEqual(createBaseRunStats());
  });

  it('ignores unknown effect ids instead of throwing', () => {
    expect(resolveRunStats(['does_not_exist'])).toEqual(createBaseRunStats());
  });

  it('returns a fresh object on each call', () => {
    const first = resolveRunStats(['orb_yield_lvl1']);
    const second = resolveRunStats([]);
    expect(second.orbPointsMultiplier).toBe(1);
    expect(first).not.toBe(second);
  });

  it('stacks orb_yield levels additively at +10% each', () => {
    expect(resolveRunStats(['orb_yield_lvl1']).orbPointsMultiplier).toBeCloseTo(1.1, 10);
    expect(
      resolveRunStats(['orb_yield_lvl1', 'orb_yield_lvl2', 'orb_yield_lvl3']).orbPointsMultiplier,
    ).toBeCloseTo(1.3, 10);
  });

  it('stacks passive_income levels at +1 point per second each', () => {
    expect(
      resolveRunStats(['passive_income_lvl1', 'passive_income_lvl2']).passiveIncomePointsPerSecond,
    ).toBe(2);
  });

  it('switches the boundary mode to wrap-around with no_walls', () => {
    expect(createBaseRunStats().boundaryMode).toBe('wall-kill');
    expect(resolveRunStats(['no_walls_lvl1']).boundaryMode).toBe('wrap-around');
  });

  it('accumulates pickup spawn chance per pickup type independently', () => {
    const stats = resolveRunStats([
      'vision_bonus_orb_lvl1',
      'vision_bonus_orb_lvl2',
      'speed_boost_pickup_lvl1',
    ]);
    expect(stats.pickupSpawnChancePerSecond.vision_clarity_orb).toBeCloseTo(0.06, 10);
    expect(stats.pickupSpawnChancePerSecond.speed_boost_orb).toBeCloseTo(0.03, 10);
  });
});
