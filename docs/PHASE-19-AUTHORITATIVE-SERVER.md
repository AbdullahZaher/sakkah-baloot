# Phase 19 — Authoritative Multiplayer Server Runtime

## 1. Objective

Establish the production-oriented authoritative multiplayer runtime boundary in `@sakkah-baloot/game-server`. The runtime acts as the match host and orchestration layer for live matches, providing optimistic state version fencing, action idempotency, strict player-scoped information security, deterministic protocol event history, seamless reconnect/resume capabilities, and a unified command boundary shared by human and AI seats.

---

## 2. Architecture

```text
                ┌─────────────────────┐
                │       CLIENT        │
                │ Human UI / AI seat  │
                └──────────┬──────────┘
                           │
                           │ ClientCommand
                           ▼
                ┌─────────────────────┐
                │   GAME SERVER       │
                │                     │
                │ Match Host          │
                │ Seat Routing        │
                │ Version Fencing     │
                │ Idempotency         │
                │ Reconnect/Resume    │
                │ Snapshot/Replay     │
                └──────────┬──────────┘
                           │
                           │ authoritative calls
                           ▼
                ┌─────────────────────┐
                │    GAME ENGINE      │
                │                     │
                │ Rules authority     │
                │ Bidding             │
                │ Projects            │
                │ Baloot              │
                │ Card legality       │
                │ Tricks              │
                │ Scoring             │
                │ Match lifecycle     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  GAME PROTOCOL      │
                │ Events              │
                │ Snapshots           │
                │ stateVersion        │
                │ Commands            │
                └─────────────────────┘
```

The game server orchestrates the match lifecycle while remaining strictly decoupled from rules execution. The server never duplicates rules, scoring, project detection, or Baloot validations; all rules remain uniquely owned by `@sakkah-baloot/game-engine`.

---

## 3. Authority Boundaries

1. **`@sakkah-baloot/game-engine` (Rules Authority)**:
   - Sole authority for cards, dealing, bidding state transitions, project detection and declarations, Baloot RD-08 validations, card play legality, trick winner resolution, scoring breakdown (Qaid/Raw, Kaboot, Reverse Kaboot, Gahwa), and round/match completion.
2. **`@sakkah-baloot/game-protocol` (Protocol Authority)**:
   - Sole authority for protocol event schemas (`MatchProtocolEvent`, `DealEvent`, `BidEvent`, `PlayCardEvent`, `ProjectEvent`, `BalootEvent`, `TrickCompleteEvent`, `RoundCompleteEvent`, `NextRoundEvent`, `MatchCompleteEvent`), envelopes (`ServerEventEnvelope`, `ClientActionEnvelope`), deterministic event ID generation (`deterministicEventId`), and protocol replay verification (`applyProtocolEvent`, `replayProtocol`).
3. **`@sakkah-baloot/game-server` (Orchestration Authority)**:
   - Owns match rooms, seat bindings, command validation at the server boundary, optimistic state version fencing, action ID idempotency, event sequencing and history, player-scoped snapshot isolation (zero hidden-information leakage), reconnect/resume, and transport/persistence abstractions.

---

## 4. Command Flow

Every incoming command passes through the following pipeline:

```text
Client (Human or AI)
  ↓
ClientCommand { matchId, playerId, actionId, expectedStateVersion, payload }
  ↓
1. Idempotency Check (actionId in IdempotencyLedger) -> Return cached CommandResult if present
  ↓
2. Server Identity & Match Validation (matchId, playerId bound to seat, roundId)
  ↓
3. Optimistic State Version Fencing (expectedStateVersion === server.stateVersion)
  ↓
4. Match Phase Validation (reject if MATCH_COMPLETE)
  ↓
5. Delegate to Game Engine (legalBiddingActions, applyBiddingAction, isCardLegal, applyCardPlay, etc.)
  ↓
6. Advance stateVersion and wrap events in ServerEventEnvelope with deterministicEventId
  ↓
7. Append events to EventStore and save snapshot to MatchPersistence
  ↓
8. Cache CommandResult in IdempotencyLedger
  ↓
9. Return CommandResult with updated PlayerScopedSnapshot
```

---

## 5. Match Host

The authoritative match host is created via `createAuthoritativeMatchHost(config)`:

```ts
export interface AuthoritativeMatchHost {
  readonly matchId: string;
  getStateVersion(): number;
  getSnapshot(playerId: PlayerId): PlayerScopedSnapshot;
  submitCommand(command: ClientCommand): Promise<CommandResult>;
  reconnect(playerId: PlayerId, resumeFromVersion?: number): Promise<ResumeResult>;
  disconnect(playerId: PlayerId): void;
  getMatchState(): MatchState;
  getPlayerSeat(playerId: PlayerId): Seat;
  getAllBindings(): Readonly<Record<Seat, PlayerId>>;
}
```

The host encapsulates the authoritative `MatchState`, `SeatRouter`, `IdempotencyLedger`, `EventStore`, and `MatchPersistence`.

---

## 6. State Versioning

- State version is a non-negative monotonically increasing integer starting at `0`.
- Every accepted state-mutating command increments `stateVersion` by the number of emitted protocol events.
- Clients submit `expectedStateVersion` with each mutating command.
- If `expectedStateVersion < server.stateVersion`, the command is rejected with `ServerErrorCode.STALE_STATE_VERSION`.
- If `expectedStateVersion > server.stateVersion`, the command is rejected with `ServerErrorCode.FUTURE_STATE_VERSION`.

---

## 7. Idempotency

- Every command includes a unique client-generated `actionId`.
- The server checks the `IdempotencyLedger` before validating versions or rules.
- If an `actionId` was previously processed, the host returns the exact original `CommandResult` with `cached: true` without mutating `MatchState`, without incrementing `stateVersion`, and without emitting duplicate events.

---

## 8. Player-Scoped Snapshots & Security

`getSnapshot(playerId)` returns a sanitized `PlayerScopedSnapshot` that guarantees complete hidden-information isolation:

- **Included**:
  - Player's own private hand (`ownHand`).
  - Public game state: dealer seat, scores, current trick plays (`publicPlays`), completed trick history (`completedTricks`), selected contract, trump suit, declared projects, declared Baloot.
  - Opponent card counts (`opponentCardCounts` mapping seat to integer count).
  - Legal actions available strictly to the acting player.
  - Seated player bindings and connection statuses.
- **Strictly Redacted**:
  - Opponent private hands are completely absent.
  - Hidden remaining deck cards are completely absent.
  - Private deal transcripts (`initialDeckOrder`, `initialHands`, `completionHands`) are absent.
- Forensic assertions in `test/security-snapshot.test.mjs` verify via `JSON.stringify` that zero opponent card IDs leak into the client snapshot.

---

## 9. Reconnect and Resume

- When a player disconnects, `disconnect(playerId)` marks their connection state as `DISCONNECTED` without altering game rules, skipping turns, or auto-playing.
- When a player reconnects, `reconnect(playerId, resumeFromVersion?)` marks their state as `CONNECTED` and returns:
  - The current `PlayerScopedSnapshot`.
  - All missed `ServerEventEnvelope<MatchProtocolEvent>` with `stateVersion > resumeFromVersion`.
- Reconnecting from a future version is rejected with `FUTURE_STATE_VERSION`.

---

## 10. Persistence Boundary

`MatchPersistence` defines an asynchronous storage contract:

```ts
export interface MatchPersistence {
  saveSnapshot(matchId: string, stateVersion: number, state: MatchState): Promise<void>;
  appendEvents(matchId: string, events: readonly ServerEventEnvelope<MatchProtocolEvent>[]): Promise<void>;
  loadSnapshot(matchId: string): Promise<MatchState | null>;
  loadEventsAfter(matchId: string, stateVersion: number): Promise<readonly ServerEventEnvelope<MatchProtocolEvent>[]>;
}
```

The package provides `InMemoryMatchPersistence` for tests and local runtime, decoupled from specific SQL/NoSQL databases.

---

## 11. Transport Boundary

`@sakkah-baloot/game-server` is entirely transport-neutral. It exposes pure TypeScript interfaces for `submitCommand`, `getSnapshot`, and `reconnect`, allowing WebSocket, Socket.IO, gRPC, HTTP, or direct in-memory adapters to be mounted without coupling the core package to any specific networking library.

---

## 12. Human / AI Unified Command Path

Human players and AI seats share the identical server command boundary:

```text
Human UI ──► ClientCommand ──┐
                             ├──► host.submitCommand(command) ──► Game Engine
AI Seat  ──► ClientCommand ──┘
```

The AI bridge (`executeAITurn`) converts the player's sanitized snapshot to an `AIRoundObservation` (zero opponent hidden cards), evaluates the baseline or IS-MCTS policy, and submits a standard `ClientCommand` with the expected version. There are no bypasses, shortcuts, or alternate execution paths for AI players.

---

## 13. Testing Matrix

The package includes a comprehensive suite of 29 unit and integration tests across 13 test files:

- `test/match-creation.test.mjs`: Initial stateVersion 0, deterministic initial deal, seat router binding validation.
- `test/idempotency-version.test.mjs`: Action idempotency caching, interleaved duplicate actions, stale/future version fencing, envelope validation.
- `test/bidding-lifecycle.test.mjs`: CCW bidding order enforcement, out-of-turn rejection, contract purchase transition, second-round all-pass re-deal.
- `test/projects-baloot.test.mjs`: Project declaration window and detection, Baloot contract and timing validation.
- `test/baloot-rd08.test.mjs`: RD-08 Baloot rules (second K/Q play, Hokum contract, owner independence, hundred absorption).
- `test/card-play-tricks.test.mjs`: Card play legality, turn order, trick resolution, round completion scoring.
- `test/security-snapshot.test.mjs`: Adversarial JSON inspection for opponent hand and deck isolation.
- `test/reconnect-replay.test.mjs`: Disconnect tracking, resume from version, missed events delivery.
- `test/replay-equivalence.test.mjs`: Event store replay equivalence with `game-protocol`.
- `test/ai-unified-path.test.mjs`: End-to-end multi-AI match simulation through unified command interface.
- `test/determinism.test.mjs`: Seeded match determinism across independent hosts.
- `test/invariants.test.mjs`: Strict stateVersion monotonicity and 32-card conservation.
- `test/authority-boundary.test.mjs`: AST/source verification of zero manual scoring or game-rule constants, Baloot delegation, Hundred absorption delegation, and round scoring parity.

---

## 14. Non-Goals

The following items are intentionally excluded from Phase 19:
- PostgreSQL / Redis / Supabase database drivers.
- WebSocket / HTTP transport servers (Fastify, Express, Socket.IO).
- Authentication / OAuth token verification.
- Matchmaking queues and lobby services.
- Turn timeout penalty / auto-play enforcement.

---

## 15. Next Phase 19 Slices

- Network Transport Adapter (WebSocket / Server-Sent Events gateway).
- Durable Persistence Adapter (Redis event stream / PostgreSQL snapshot repository).
- Turn Timer Worker with automated pass / discard timeouts.
