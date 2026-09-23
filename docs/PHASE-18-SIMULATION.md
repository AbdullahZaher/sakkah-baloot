# صكّة بلوت — Phase 18 Full-Match Simulation Architecture

**Package:** `@sakkah-baloot/game-simulator`  
**Purpose:** Deterministic, invariant-guarded full-match simulation environment for competitive AI validation.

---

## 1. Simulation Modes and Terminology

The simulation environment distinguishes two primary execution modes:

### 1.1 Validation Simulation (Deterministic Match Harness)
- **Bidding Lifecycle:** Controlled by the deterministic engine state machine (`chooseBiddingAction`, `chooseHokumSuit`) adhering to canonical bidding rules and exposed card acceptance.
- **Projects & Baloot:** Authoritatively evaluated and declared via engine detectors (`detectProjects`, `canDeclareBaloot`).
- **Card Play:** Controlled by the configured policy under evaluation (e.g. `firstLegalCard`, `createBaselineCardPolicy("NORMAL")`).
- **Purpose:** Used for high-throughput invariant stress testing (1,000-match CI gate and 10,000-match stress benchmark) to prove rule integrity, card conservation, and replay stability.

### 1.2 Competitive Matchup Simulation
- **Seat-Specific Policy Routing:** Maps distinct policy instances to individual seats (`NORTH_PLAYER`, `EAST_PLAYER`, `SOUTH_PLAYER`, `WEST_PLAYER`).
- **Card-Play Evaluation:** Policies evaluate decisions using player-scoped observations (`AIRoundObservation`), belief modeling (`createBeliefState`), search (`chooseISMCTSCard`), or bounded exact search (`solveEndgame`).
- **Purpose:** Head-to-head empirical evaluation of strategy differentials (e.g. IS-MCTS vs Baseline Normal).

---

## 2. Architecture Overview

The simulation environment in `@sakkah-baloot/game-simulator` executes complete Baloot matches from Deal through Match End:

```text
Match Initialization
        ↓
Seeded Deal (32 cards)
        ↓
Bidding State Machine (First & Second Rounds)
        ↓
Exposed Card Assignment & Deal Completion (8 cards per player)
        ↓
Authoritative Project Detection & Validation
        ↓
Authoritative Baloot Declaration Window
        ↓
8-Trick Card Play Lifecycle (with Engine Legal Moves)
        ↓
Authoritative Round Scoring & Qaid Conversion
        ↓
Match Score Accumulation & Dealer Rotation
        ↓
Match Completion / Extra Deal Evaluation
```

---

## 3. Invariant Enforcement

Every single simulation round and batch enforces strict safety gates:

1. **32-Card Conservation Invariant**:
   At every step, `hands + currentTrick + completedTricks` must equal exactly 32 unique cards partitioning the canonical deck.
2. **Trick Integrity Invariant**:
   Every completed trick must contain exactly 4 plays.
3. **Round Completion Invariant**:
   Every completed round must finish with exactly 8 completed tricks.
4. **Authoritative Legality Invariant**:
   Every card played by any policy must belong to `getLegalMoves(state, playerId)`.
5. **Full Canonical Replay Equivalence**:
   Replaying the recorded card-play sequence through the engine reproduces the exact final game state across all canonical fields (`phase`, `currentPlayerId`, `dealerSeat`, `contract`, `trumpSuit`, `hokumPlayMode`, `trickNumber`, `hands`, `currentTrick`, `completedTricks`). Verified via `assertReplayEquivalent()`.
6. **Deterministic Digests**:
   Given the same seed and policy configuration, the simulation produces identical match progression, scores, and hash digest.

---

## 4. Pluggable Policy Adapters

The simulator supports seat-by-seat policy assignment:

- `randomCardPolicy`: Selects randomly among authoritative legal moves.
- `firstLegalCard`: Deterministic baseline selecting the first legal move.
- `createBaselineCardPolicy(difficulty)`: Evaluates tactical and strategic factors (`EASY`, `NORMAL`, `HARD`).
- `createISMCTSCardPolicy(config)`: Information Set Monte Carlo Tree Search over belief-sampled worlds.
- `createEndgameEnhancedCardPolicy(config)`: Exact minimax solving in terminal tricks with heuristic fallback.

---

## 5. Verification Evidence

- **1,000 Matches Gate:** 1,000 finished (100%), 0 illegal actions, 0 invalid states, 0 replay failures, deterministic digest `70199b8b`.
- **10,000 Matches Stress:** 10,000 finished (100%), 0 illegal actions, 0 invalid states, 0 replay failures, deterministic digest `c49b880f`.
- **Replay Regression Test:** Proved that any mutation to replayed state (`currentPlayerId`, `trickNumber`, `contract`, `completedTricks`) triggers a replay divergence error.

