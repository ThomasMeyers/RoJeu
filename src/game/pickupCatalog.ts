import type { PickupTypeId, RunState, TimedEffectStatModifiers } from './types';

export type PickupSpawnMode = 'per_second_chance';
export type TimedEffectRefreshPolicy = 'reset_duration';

export interface TimedEffectActivation {
  id: string;
  durationMs: number;
  refreshPolicy: TimedEffectRefreshPolicy;
  statModifiers: TimedEffectStatModifiers;
}

export interface PickupCollectResult {
  points: number;
  timedEffects: TimedEffectActivation[];
}

export interface PickupDefinition {
  id: PickupTypeId;
  maxConcurrent: number;
  spawnMode: PickupSpawnMode;
  getSpawnChancePerSecond: (state: RunState) => number;
  onCollect: (state: RunState, nowMs: number) => PickupCollectResult;
  renderToken: string;
  color: number;
}

const VISION_BOOST_EFFECT_ID = 'vision_boost';

const visionClarityOrbPickup: PickupDefinition = {
  id: 'vision_clarity_orb',
  maxConcurrent: 3,
  spawnMode: 'per_second_chance',
  getSpawnChancePerSecond: (state) => state.stats.pickupSpawnChancePerSecond.vision_clarity_orb ?? 0,
  onCollect: () => ({
    points: 0,
    timedEffects: [
      {
        id: VISION_BOOST_EFFECT_ID,
        durationMs: 10_000,
        refreshPolicy: 'reset_duration',
        statModifiers: {
          visionRadiusDelta: 2,
        },
      },
    ],
  }),
  renderToken: 'VO',
  color: 0xffffff,
};

export const PICKUP_CATALOG: PickupDefinition[] = [visionClarityOrbPickup];

const PICKUP_DEFINITIONS_BY_ID: Record<PickupTypeId, PickupDefinition> = {
  vision_clarity_orb: visionClarityOrbPickup,
};

export const getPickupDefinitions = (): PickupDefinition[] => PICKUP_CATALOG;

export const getPickupDefinitionById = (pickupTypeId: PickupTypeId): PickupDefinition | null =>
  PICKUP_DEFINITIONS_BY_ID[pickupTypeId] ?? null;
