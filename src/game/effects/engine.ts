import { EFFECT_DEFINITIONS, createBaseRunStats } from './schema';
import type { RunStats } from '../types';

export const resolveRunStats = (effectIds: string[]): RunStats => {
  const stats = createBaseRunStats();

  effectIds.forEach((effectId) => {
    const definition = EFFECT_DEFINITIONS[effectId];
    if (!definition) {
      return;
    }
    definition.apply(stats);
  });

  return stats;
};
