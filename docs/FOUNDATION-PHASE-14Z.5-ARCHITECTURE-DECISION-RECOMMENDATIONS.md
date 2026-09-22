# صكّة بلوت — Phase 14.Z.5 Architecture Decision Recommendations

**Date:** 2026-09-22  
**Phase:** 14.Z.5 — Architecture Closure Preparation  
**Status:** TECHNICAL RECOMMENDATIONS — NOT YET ARCHITECTURE-FROZEN  
**Scope:** AD-01 through AD-05

## Objective

Translate the existing Foundation constraints into a minimal, deterministic architecture that supports:
- authoritative multiplayer
- immutable/replayable events
- reconnect/resync
- bot/simulation reuse
- hidden-information protection
- deterministic testing
- transport evolution without changing the domain engine

No production engine code is authorized by this document.

## AD-01 — PASS vs PASS_FINAL

### Recommendation

**A — one wire action: `PASS`; derive the semantic round from authoritative `BiddingState.phase`.**

Canonical domain semantics remain distinct:
- FIRST_ROUND pass
- SECOND_ROUND final pass

The transport command remains `{ type: "PASS" }`.
The server derives whether that pass is ordinary or final from authoritative state.

### Why
1. Prevents duplicate wire concepts for the same user intent.
2. Makes replay simpler.
3. Prevents a stale/malicious client from claiming `PASS_FINAL` while the server is in round one.
4. Keeps semantic meaning in domain state rather than client-supplied labels.
5. Aligns with the existing action envelope: client sends intent; server derives consequences.

### Canonical rule
`PASS_FINAL` is a **domain semantic outcome**, not a trusted client wire command.

## AD-02 — Canonical GamePhase

### Recommendation

Use one client-facing canonical enum, owned by `07-game-state.md`.

```ts
type GamePhase =
  | "WAITING_FOR_PLAYERS"
  | "SEATING"
  | "ROUND_STARTING"
  | "DEALING"
  | "BIDDING"
  | "CONTRACT_SELECTED"
  | "PROJECT_DECLARATION"
  | "PLAYING"
  | "SCORING"
  | "ROUND_COMPLETE"
  | "MATCH_COMPLETE"
  | "CANCELLED";
```

Engine-internal transition labels are not GamePhase values:
- `GAME_CREATED`
- `COMPLETE_DEAL`
- `MATCH_END_CHECK`
- `TRICK_RESOLUTION`
- `PROJECT_RESOLUTION`
- `CONTRACT_RESOLUTION`

Decisions:
- `ROUND_STARTING`: client-observable.
- `ROUND_COMPLETE`: client-observable.
- `MATCH_COMPLETE`: canonical terminal client state.
- `GAME_RESULT`: event/result terminology, not GamePhase.
- `WAITING_FOR_PLAYERS` and `CANCELLED`: remain in the same enum because clients must render these authoritative lifecycle states.

## AD-03 — COMPLETE_DEAL

### Recommendation

**A — internal engine transition only.**

The client does not receive a `COMPLETE_DEAL` GamePhase.

```text
CONTRACT_SELECTED
  ↓
internal complete-deal transition
  ↓
PROJECT_DECLARATION
```

If the UI needs to animate the final cards being raised, emit a normal event such as `FINAL_CARDS_DEALT` or expose the authoritative card projection at the relevant event boundary. Do not create a protocol phase solely for animation.

## AD-04 — MATCH_END_CHECK

### Recommendation

**A — internal engine branch only.**

After round scoring:

```text
SCORING
  ↓
internal match-end evaluation
  ├─ continue → ROUND_COMPLETE → DEALING
  └─ finish   → MATCH_COMPLETE
```

The client does not observe `MATCH_END_CHECK`.

## AD-05 — Contract Representation

### Recommendation

Use three explicit layers.

### 1. Domain contract

Canonical internal representation:

```ts
type Contract =
  | {
      readonly type: "SUN";
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
      readonly mode: "NORMAL" | "ASHKAL";
    }
  | {
      readonly type: "TRUMP";
      readonly suit: Suit;
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
      readonly mode: "NORMAL";
    };
```

Ashkal is normalized as a Sun contract with `mode: "ASHKAL"`.
The exposed-card recipient is retained in ContractActors:

```ts
interface ContractActors {
  readonly buyerPlayerId: PlayerId;
  readonly buyerTeamId: TeamId;
  readonly exposedCardRecipientId: PlayerId;
}
```

### 2. Transport contract

Transport uses a stable DTO and never becomes authoritative for derived fields:

```ts
type ContractDTO =
  | {
      readonly type: "SUN";
      readonly mode: "NORMAL" | "ASHKAL";
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
    }
  | {
      readonly type: "TRUMP";
      readonly mode: "NORMAL";
      readonly suit: Suit;
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
    };
```

### 3. UI representation

UI may localize Sun/Hokum/Ashkal and purchase source without changing domain or transport semantics.

## Architecture invariants

1. Client sends intents, not derived outcomes.
2. Server derives semantic phase from authoritative state.
3. Client-facing phases contain only stable user-observable states.
4. Internal branches never become wire protocol accidentally.
5. Contract normalization preserves purchaser/source/Ashkal semantics.
6. Replay uses domain state + immutable events, not UI phase animations.
7. Reconnect consumes authoritative snapshot/event history.
8. No React/Expo/Supabase/Redis/WebSocket dependency enters the core engine.

## Proposed canonical phase flow

```text
WAITING_FOR_PLAYERS
        ↓
SEATING
        ↓
ROUND_STARTING
        ↓
DEALING
        ↓
BIDDING
        ↓
CONTRACT_SELECTED
        ↓
[internal COMPLETE_DEAL]
        ↓
PROJECT_DECLARATION
        ↓
PLAYING
        ↓
SCORING
        ↓
[internal MATCH_END_CHECK]
   ┌────┴────┐
   ↓         ↓
ROUND_COMPLETE  MATCH_COMPLETE
   ↓
ROUND_STARTING
```

Cancellation can terminate from the applicable lifecycle/rule state and is controlled by the Rule Profile/incident policy.

## Freeze impact

If accepted:
1. freeze the action catalog;
2. freeze the event catalog;
3. update the state-transition matrix to use the canonical GamePhase;
4. update Rule → Code traceability;
5. perform a documentation-only architecture consistency audit.

**Production implementation remains unauthorized until the full Rule Freeze Gate passes.**