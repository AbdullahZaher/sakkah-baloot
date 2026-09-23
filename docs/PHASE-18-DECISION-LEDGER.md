# صكّة بلوت — Phase 18 Decision Ledger

**Status:** Planning baseline  
**Purpose:** Record architectural decisions before implementation.

## D18-01 — AI Is Not an Authority

**Decision:** The AI proposes actions; the game engine remains authoritative.

**Rationale:** Prevents rules duplication and ensures human and AI players use identical legality and scoring.

**Status:** FROZEN

## D18-02 — Player-Specific Information

**Decision:** Every AI instance receives a seat-specific observation and never the complete MatchState.

**Rationale:** Prevents hidden-information leakage and makes single-player AI representative of future multiplayer behavior.

**Status:** FROZEN

## D18-03 — Dedicated game-ai Package

**Decision:** AI logic lives in `packages/game-ai`.

**Rationale:** Keeps decision logic isolated from domain rules, UI and future server transport.

**Status:** FROZEN

## D18-04 — Belief-Based Hidden-Card Reasoning

**Decision:** Hidden cards are represented as uncertain hypotheses/probabilities rather than direct access to hidden hands.

**Rationale:** Baloot is an imperfect-information partnership game.

**Status:** FROZEN

## D18-05 — IS-MCTS Runtime Search

**Decision:** Information Set Monte Carlo Tree Search is the primary runtime search approach for non-trivial card-play decisions.

**Rationale:** It is designed for imperfect-information game states and is more appropriate than full-information MCTS/PIMC as the default architecture.

**Status:** FROZEN FOR ARCHITECTURE; implementation parameters remain configurable.

## D18-06 — Exact Endgame Search

**Decision:** The AI may switch to exact/near-exact search for sufficiently small endgame states.

**Rationale:** Reduced state space makes exhaustive reasoning practical and improves tactical accuracy.

**Status:** FROZEN FOR ARCHITECTURE

## D18-07 — No Neural Training Requirement

**Decision:** Phase 18 must not depend on training a neural model.

**Rationale:** A strong classical imperfect-information architecture can be validated first; neural training remains an optional future research track.

**Status:** FROZEN

## D18-08 — Deterministic Search

**Decision:** Every AI decision must be reproducible from observation + configuration + seed.

**Rationale:** Required for debugging, replay and automated simulation.

**Status:** FROZEN

## D18-09 — Explainable Decisions

**Decision:** The AI exposes optional decision traces for QA.

**Rationale:** The team must be able to understand why a Bot selected an action.

**Status:** FROZEN

## D18-10 — Same Rules, Same Engine

**Decision:** AI must submit actions through the same authoritative engine transitions used by human play.

**Rationale:** Prevents AI-only shortcuts and hidden rule divergence.

**Status:** FROZEN

## D18-11 — Offline CFR/MCCFR Is Research Only

**Decision:** CFR/MCCFR may be evaluated for offline strategy research, but is not required for the Phase 18 runtime.

**Rationale:** Keeps the first production path deterministic, explainable and bounded.

**Status:** FROZEN

## D18-12 — Server Deferred

**Decision:** Authoritative network/server implementation follows successful Phase 18 completion.

**Rationale:** First prove that the game itself can sustain a full Human-vs-3-AI match and large simulation workload.

**Status:** FROZEN
