import type { RunStats } from '../types';

export interface EffectDefinition {
  id: string;
  apply: (stats: RunStats) => void;
}

export const createBaseRunStats = (): RunStats => ({
  runDurationSec: 60,
  baseLives: 1,
  baseVisionRadius: 2,
  pointsMultiplier: 1,
  tickMs: 120,
  boundaryMode: 'wall-kill',
  rogieRespawnDelayMs: 0,
});

export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {
  bave_baveuse_lvl1: {
    id: 'bave_baveuse_lvl1',
    apply: (stats) => {
      stats.pointsMultiplier *= 1.2;
    },
  },
  casque_lvl1: {
    id: 'casque_lvl1',
    apply: (stats) => {
      stats.baseVisionRadius += 1;
    },
  },
  around_the_world_lvl1: {
    id: 'around_the_world_lvl1',
    apply: (stats) => {
      stats.boundaryMode = 'wrap-around';
    },
  },
  be_like_momo_lvl1: {
    id: 'be_like_momo_lvl1',
    apply: (stats) => {
      stats.baseLives += 1;
    },
  },
  heures_supplementaires_lvl1: {
    id: 'heures_supplementaires_lvl1',
    apply: (stats) => {
      stats.runDurationSec += 15;
    },
  },
};
