import type { PickupTypeId, RunState, TimedEffectActivation } from './types';

export type PickupSpawnMode = 'per_second_chance';
export type { TimedEffectActivation } from './types';

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
  color: 0xf5d070,
};

const SPEED_BOOST_EFFECT_ID = 'speed_boost';
const SPEED_DEBUFF_EFFECT_ID = 'speed_debuff';

const speedBoostOrbPickup: PickupDefinition = {
  id: 'speed_boost_orb',
  maxConcurrent: 3,
  spawnMode: 'per_second_chance',
  getSpawnChancePerSecond: (state) => state.stats.pickupSpawnChancePerSecond.speed_boost_orb ?? 0,
  onCollect: () => ({
    points: 0,
    timedEffects: [
      {
        id: SPEED_BOOST_EFFECT_ID,
        durationMs: 10_000,
        refreshPolicy: 'reset_duration',
        cancelsEffectIds: [SPEED_DEBUFF_EFFECT_ID],
        statModifiers: { speedMultiplierDelta: 0.5 },
        chainEffect: {
          id: SPEED_DEBUFF_EFFECT_ID,
          durationMs: 5_000,
          refreshPolicy: 'reset_duration',
          statModifiers: { speedMultiplierDelta: -0.5 },
        },
      },
    ],
  }),
  renderToken: 'KW',
  color: 0x4a3520,
};

export const PICKUP_CATALOG: PickupDefinition[] = [visionClarityOrbPickup, speedBoostOrbPickup];

const PICKUP_DEFINITIONS_BY_ID: Record<PickupTypeId, PickupDefinition> = {
  vision_clarity_orb: visionClarityOrbPickup,
  speed_boost_orb: speedBoostOrbPickup,
};

export const getPickupDefinitions = (): PickupDefinition[] => PICKUP_CATALOG;

export const getPickupDefinitionById = (pickupTypeId: PickupTypeId): PickupDefinition | null =>
  PICKUP_DEFINITIONS_BY_ID[pickupTypeId] ?? null;
