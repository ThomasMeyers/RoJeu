# ADR 0002 - Declarative talent effects

## Status

Accepted

## Context

Talent count and interactions are expected to grow. A hardcoded if/else approach in the main run loop would become brittle quickly.

## Decision

- Define effects in `src/game/effects/schema.ts`.
- Resolve run stats via aggregation in `src/game/effects/engine.ts`.
- Reference effect IDs by level from `src/game/talentCatalog.ts`.

## Consequences

- Better scalability for adding talents and balancing.
- Lower refactor risk when introducing new effects.
- Slight upfront modeling cost compared to ad-hoc logic.

