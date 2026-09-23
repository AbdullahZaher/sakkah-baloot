# Phase 19 — Authoritative Multiplayer Runtime

## Objective

Move from the completed competitive-AI foundation to a production-oriented authoritative runtime boundary.

### Frozen constraints

- `game-engine` remains the only rules authority.
- `game-protocol` remains the event/state-version authority.
- Clients submit commands; they never author authoritative state.
- Every accepted command advances exactly one state version.
- Duplicate action IDs are idempotent.
- Stale state versions are rejected.
- Round/match identity mismatches are rejected.
- AI and human seats use the same authoritative command/event boundary.
- Reconnect uses snapshots plus replayable events.
- Network transport is deliberately outside the domain packages.

## Phase 19 slices

1. Authoritative event store and command deduplication.
2. Server-side match host that applies engine/protocol bridges.
3. Reconnect/snapshot/resume.
4. Human + AI seat routing through one command path.
5. Persistence adapter contract.
6. WebSocket/HTTP transport adapter.
7. Multiplayer integration tests and fault injection.
8. Load/stress verification.

## Current slice

`@sakkah-baloot/game-server` establishes the in-memory event-store boundary.

It intentionally does not duplicate game rules. It stores protocol events, enforces state-version sequencing, deduplicates action IDs, and exposes replay-friendly snapshots.

The next implementation slice is the authoritative match host that owns `MatchState`/`RoundState` and delegates every rule decision to `@sakkah-baloot/game-engine`.
