export type BoundaryMode = 'wall-kill' | 'wrap-around';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type RunPhase = 'waiting_start' | 'running' | 'ended';
export type DeathReason = 'wall_collision' | 'self_collision' | 'timer_end' | 'no_lives';

export interface Point {
  x: number;
  y: number;
}

export interface GridSize {
  cols: number;
  rows: number;
}

export type PickupTypeId = 'vision_clarity_orb';

export type EntityKind = 'orb' | 'pickup';

export interface OrbSpawnEntity {
  id: string;
  kind: 'orb';
  position: Point;
  expiresAtMs: number | null;
}

export interface PickupSpawnEntity {
  id: string;
  kind: 'pickup';
  pickupTypeId: PickupTypeId;
  position: Point;
  expiresAtMs: number | null;
}

export type SpawnEntity = OrbSpawnEntity | PickupSpawnEntity;

export interface TimedEffectStatModifiers {
  visionRadiusDelta?: number;
}

export interface ActiveTimedEffect {
  id: string;
  expiresAtMs: number;
  statModifiers: TimedEffectStatModifiers;
}

export interface RunStats {
  runDurationSec: number;
  baseLives: number;
  baseVisionRadius: number;
  orbPointsMultiplier: number;
  globalPointsMultiplier: number;
  passiveIncomePointsPerSecond: number;
  tickMs: number;
  boundaryMode: BoundaryMode;
  orbRespawnDelayMs: number;
  pickupSpawnChancePerSecond: Partial<Record<PickupTypeId, number>>;
}

export interface MetaState {
  totalPoints: number;
  runCount: number;
  talentLevels: Record<string, number>;
}

export interface RunState {
  slug: Point[];
  direction: Direction;
  pendingDirection: Direction;
  score: number;
  lives: number;
  remainingMs: number;
  phase: RunPhase;
  boundaryMode: BoundaryMode;
  entities: SpawnEntity[];
  orbRespawnAtMs: number | null;
  activeEffectIds: string[];
  stats: RunStats;
  startedAtMs: number | null;
  endedAtMs: number | null;
  deathReason: DeathReason | null;
  passiveIncomeAccumulatorMs: number;
  pickupSpawnAccumulatorMs: number;
  activeTimedEffects: ActiveTimedEffect[];
  pointsFractionRemainder: number;
  runCommitted: boolean;
}
