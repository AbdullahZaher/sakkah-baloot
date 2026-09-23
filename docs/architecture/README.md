# Sakkah Baloot Architecture

## Top-level layout

- `apps/mobile` — React Native / Expo client.
- `apps/server` — reserved for the authoritative server phase.
- `packages/game-engine` — pure deterministic rules engine. No UI, network, database, or platform dependencies.
- `packages/game-client` — client-side adapter/view-model boundary. It can run the engine locally during Phase 16.
- `packages/game-protocol` — transport-neutral action/event/snapshot contracts for the future server.
- `packages/ui` — reusable game-table presentation components.
- `packages/shared` — reserved for cross-platform non-domain utilities.
- `tests/e2e` — future end-to-end coverage.

## Dependency direction

```
apps/mobile
  ├── packages/ui
  └── packages/game-client
             └── packages/game-engine

packages/game-protocol
             ↑
        future server
```

The server is intentionally not implemented in Phase 16. The UI is designed around action/state boundaries so the future server can replace the local adapter without redesigning the table.

## Phase 16 rule

UI code must never implement Baloot rules. It asks the engine/client adapter for state and legal actions and renders the result.
