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

export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {};
