# صكّة بلوت — Phase 18 Full-Match Simulation Architecture

**Package:** `@sakkah-baloot/game-simulator`  
**Purpose:** Deterministic, invariant-guarded full-match simulation environment for competitive AI validation.

---

## 1. Architecture Overview

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

## 2. Invariant Enforcement

Every single simulation round and batch enforces strict safety gates:

1. **32-Card Conservation Invariant**:
   At every step, `hands + currentTrick + completedTricks` must equal exactly 32 unique cards partitioning the canonical deck.
2. **Trick Integrity Invariant**:
   Every completed trick must contain exactly 4 plays.
3. **Round Completion Invariant**:
   Every completed round must finish with exactly 8 completed tricks.
4. **Authoritative Legality Invariant**:
   Every card played by any policy must belong to `getLegalMoves(state, playerId)`.
5. **Replay Equivalence**:
   Replaying the recorded card-play sequence through the engine reproduces the exact final game state.
6. **Deterministic Digests**:
   Given the same seed and policy configuration, the simulation produces identical match progression, scores, and hash digest.

---

## 3. Pluggable Policy Adapters

The simulator supports seat-by-seat policy assignment:

- `randomCardPolicy`: Selects randomly among authoritative legal moves.
- `firstLegalCard`: Deterministic baseline selecting the first legal move.
- `createBaselineCardPolicy(difficulty)`: Evaluates tactical and strategic factors (`EASY`, `NORMAL`, `HARD`).
- `createISMCTSCardPolicy(config)`: Information Set Monte Carlo Tree Search over belief-sampled worlds.
- `createEndgameEnhancedCardPolicy(config)`: Exact minimax solving in terminal tricks with heuristic fallback.

---

## 4. Verification Evidence

- 1,000 matches: 1,000 finished, 0 illegal actions, deterministic digest `70199b8b`.
- 10,000 matches: 10,000 finished, 0 illegal actions, deterministic digest `c49b880f`.
