# صكّة بلوت — Phase 18 Human vs 3 AI Architecture

**Packages:** `@sakkah-baloot/game-client`, `@sakkah-baloot/game-ai`, `@sakkah-baloot/game-protocol`  
**Purpose:** Architecture for 1 Human + 3 AI players using authoritative protocol events and client state.

---

## 1. Interaction Flow

The Human vs 3 AI architecture preserves the exact same protocol envelope and state-version boundary used in multiplayer mode:

```text
       Human UI Action                     AI Decision Policy
              │                                    │
              ▼                                    ▼
       Typed Client Action                 Typed Client Action
 (ClientActionEnvelope<T>)           (ClientActionEnvelope<T>)
              │                                    │
              └─────────────────┬──────────────────┘
                                │
                                ▼
                   Local Match Host / Protocol Layer
                   - State version verification
                   - Authoritative Engine legality check
                   - Idempotent event emission
                                │
                                ▼
                       MatchProtocolEvent
                                │
                                ▼
                       Client State Update
                     (Idempotent Snapshot)
```

---

## 2. Key Components

### 2.1 Protocol Action Adapter (`packages/game-ai/src/protocol-action-adapter.ts`)
Converts internal `AIAction` types (`BID`, `PLAY_CARD`, `DECLARE_PROJECT`, `DECLARE_BALOOT`) into protocol-compliant `ClientActionEnvelope` structures carrying:
- `matchId`
- `actionId` (deterministic ID scoped to match, round, state version)
- `playerId`
- `expectedStateVersion`
- `action` payload

### 2.2 Human vs AI Controller (`packages/game-client/src/human-vs-ai.ts`)
Inspects the current match state:
- If `currentPlayerId === humanPlayerId`: yields turn to Human (`kind: "HUMAN"`).
- If `currentPlayerId !== humanPlayerId`: invokes `decideAIAction` with the AI player's configuration and returns the decision (`kind: "AI"`).

### 2.3 Local Playable Session (`packages/game-client/src/local-human-vs-ai.ts`)
A complete local session orchestrator managing the full match lifecycle:
- Automated dealing and bidding progression for AI seats.
- Dispatches human bids, projects, and card plays.
- Automatically prompts AI seats in turn order until human turn or round complete.
- Emits protocol events and produces idempotent `LocalPlayablePreview` snapshots for UI consumption.

---

## 3. Verification

Verified in `packages/game-client/test/human-vs-ai.test.mjs` and `packages/game-client/test/client.test.mjs`:
- Human vs 3 AI session completes full match cycle: Deal → Bid → Project/Baloot → 8 Tricks → Round Score → Next Round.
- Exactly 3 AI players enforced; Human player cannot be configured as AI.
- All state updates guarded by state versions and canonical engine validation.
