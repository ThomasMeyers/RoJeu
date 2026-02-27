import type { RunStats } from '../types';

export interface EffectDefinition {
  id: string;
  apply: (stats: RunStats) => void;
}

export const createBaseRunStats = (): RunStats => ({
  runDurationSec: 60,
  baseLives: 1,
  baseVisionRadius: 2,
  orbPointsMultiplier: 1,
  globalPointsMultiplier: 1,
  passiveIncomePointsPerSecond: 0,
  tickMs: 120,
  boundaryMode: 'wall-kill',
  orbRespawnDelayMs: 0,
  pickupSpawnChancePerSecond: {},
});

export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {
  orb_yield_lvl1: {
    id: 'orb_yield_lvl1',
    apply: (stats) => {
      stats.orbPointsMultiplier += 0.1;
    },
  },
  orb_yield_lvl2: {
    id: 'orb_yield_lvl2',
    apply: (stats) => {
      stats.orbPointsMultiplier += 0.1;
    },
  },
  orb_yield_lvl3: {
    id: 'orb_yield_lvl3',
    apply: (stats) => {
      stats.orbPointsMultiplier += 0.1;
    },
  },
  orb_yield_lvl4: {
    id: 'orb_yield_lvl4',
    apply: (stats) => {
      stats.orbPointsMultiplier += 0.1;
    },
  },
  orb_yield_lvl5: {
    id: 'orb_yield_lvl5',
    apply: (stats) => {
      stats.orbPointsMultiplier += 0.1;
    },
  },
  passive_income_lvl1: {
    id: 'passive_income_lvl1',
    apply: (stats) => {
      stats.passiveIncomePointsPerSecond += 1;
    },
  },
  passive_income_lvl2: {
    id: 'passive_income_lvl2',
    apply: (stats) => {
      stats.passiveIncomePointsPerSecond += 1;
    },
  },
  passive_income_lvl3: {
    id: 'passive_income_lvl3',
    apply: (stats) => {
      stats.passiveIncomePointsPerSecond += 1;
    },
  },
  passive_income_lvl4: {
    id: 'passive_income_lvl4',
    apply: (stats) => {
      stats.passiveIncomePointsPerSecond += 1;
    },
  },
  passive_income_lvl5: {
    id: 'passive_income_lvl5',
    apply: (stats) => {
      stats.passiveIncomePointsPerSecond += 1;
    },
  },
  vision_bonus_orb_lvl1: {
    id: 'vision_bonus_orb_lvl1',
    apply: (stats) => {
      stats.pickupSpawnChancePerSecond.vision_clarity_orb =
        (stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0) + 0.03;
    },
  },
  vision_bonus_orb_lvl2: {
    id: 'vision_bonus_orb_lvl2',
    apply: (stats) => {
      stats.pickupSpawnChancePerSecond.vision_clarity_orb =
        (stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0) + 0.03;
    },
  },
  vision_bonus_orb_lvl3: {
    id: 'vision_bonus_orb_lvl3',
    apply: (stats) => {
      stats.pickupSpawnChancePerSecond.vision_clarity_orb =
        (stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0) + 0.03;
    },
  },
  vision_bonus_orb_lvl4: {
    id: 'vision_bonus_orb_lvl4',
    apply: (stats) => {
      stats.pickupSpawnChancePerSecond.vision_clarity_orb =
        (stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0) + 0.03;
    },
  },
  vision_bonus_orb_lvl5: {
    id: 'vision_bonus_orb_lvl5',
    apply: (stats) => {
      stats.pickupSpawnChancePerSecond.vision_clarity_orb =
        (stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0) + 0.03;
    },
  },
  no_walls_lvl1: {
    id: 'no_walls_lvl1',
    apply: (stats) => {
      stats.boundaryMode = 'wrap-around';
    },
  },
};
