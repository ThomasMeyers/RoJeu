# Documentation Maintenance Checklist

Use this checklist after substantial code changes.

## Mandatory

- Update `README.md` if feature scope/user-facing behavior changed.
- Update `START_HERE_FOR_AGENTS.md` if entrypoints, modules, or terminology changed.
- Update `docs/architecture.md` if module responsibilities or core flow changed.

## Conditional

- Update `docs/agent-playbooks.md` when a workflow changes (new pitfalls, new files to touch).
- Add or update an ADR in `docs/adr/` when a non-trivial technical decision is made.
- Update backlog bullets in `README.md` when TODO scope changes.

## Validation

- Ensure paths referenced in docs exist.
- Ensure examples match current naming (`run`, `meta`, `store`, `talent`).
- Run `npm test` and `npm run build` after code + doc updates tied to behavior changes.
- Add or extend unit tests when pure logic changes (`src/game/*.test.ts`).

