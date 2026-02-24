# ADR 0001 - Run/Meta split with localStorage persistence

## Status

Accepted

## Context

The game needs short run sessions with persistent progression across sessions, while keeping MVP delivery simple and backend-free.

## Decision

- Separate transient `RunState` from persistent `MetaState`.
- Persist `MetaState` in browser local storage only.
- Commit run points once on run end.

## Consequences

- Fast MVP delivery and no backend operational burden.
- Offline-friendly progression.
- No cross-device sync in current scope.
- Future cloud save remains possible without changing run loop architecture.

