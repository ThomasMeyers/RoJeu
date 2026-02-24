import type { RunStats } from '../types';

export interface EffectDefinition {
  id: string;
  apply: (stats: RunStats) => void;
}

export const createBaseRunStats = (): RunStats => ({
  runDurationSec: 60,
  baseLives: 1,
  baseVisionRadius: 2,
  orbScoreMultiplier: 1,
  tickMs: 120,
  boundaryMode: 'wall-kill',
  orbRespawnDelayMs: 0,
});

export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {
  bave_baveuse_lvl1: {
    id: 'bave_baveuse_lvl1',
    apply: (stats) => {
      stats.orbScoreMultiplier += 0.1;
    },
  },
  bave_baveuse_lvl2: {
    id: 'bave_baveuse_lvl2',
    apply: (stats) => {
      stats.orbScoreMultiplier += 0.1;
    },
  },
  bave_baveuse_lvl3: {
    id: 'bave_baveuse_lvl3',
    apply: (stats) => {
      stats.orbScoreMultiplier += 0.1;
    },
  },
  bave_baveuse_lvl4: {
    id: 'bave_baveuse_lvl4',
    apply: (stats) => {
      stats.orbScoreMultiplier += 0.1;
    },
  },
  bave_baveuse_lvl5: {
    id: 'bave_baveuse_lvl5',
    apply: (stats) => {
      stats.orbScoreMultiplier += 0.1;
    },
  },
};
