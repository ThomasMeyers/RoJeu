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

export type EntityKind = 'rogie';

export interface SpawnEntity {
  id: string;
  kind: EntityKind;
  position: Point;
  expiresAtMs: number | null;
}

export interface RunStats {
  runDurationSec: number;
  baseLives: number;
  baseVisionRadius: number;
  pointsMultiplier: number;
  tickMs: number;
  boundaryMode: BoundaryMode;
  rogieRespawnDelayMs: number;
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
  rogieRespawnAtMs: number | null;
  activeEffectIds: string[];
  stats: RunStats;
  startedAtMs: number | null;
  endedAtMs: number | null;
  deathReason: DeathReason | null;
  runCommitted: boolean;
}
