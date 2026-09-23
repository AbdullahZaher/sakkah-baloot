# صكّة بلوت — Phase 18 Readiness Certificate

**Phase:** 18 — Competitive AI & Single-Player Match  
**Branch:** `phase-18-competitive-ai-v2`  
**Baseline:** `main` after Phase 17  
**Status:** IMPLEMENTED, VERIFIED, AND CERTIFIED COMPLETE

## 1. Purpose

Phase 18 proves that the complete game is playable by one human player against three computer-controlled players without violating the canonical game rules or leaking hidden information.

The phase is deliberately positioned before the authoritative network/server phase.

The target runtime is:

`Human Player + AI + AI + AI -> complete match`

The AI uses the same authoritative game engine as the human player and does not introduce a second rules implementation.

## 2. Primary Goal

Produce a production-oriented competitive AI foundation capable of:

- observing only information available to its seat;
- making bidding decisions;
- evaluating and declaring eligible projects;
- evaluating and declaring Baloot when legal;
- selecting legal card plays;
- reasoning about partner and opponents;
- reasoning under hidden information;
- searching plausible information sets;
- solving sufficiently small endgames exactly;
- completing full matches deterministically when supplied with deterministic seeds;
- running large AI-vs-AI simulation batches (1,000 matches blocking, 10,000 matches stress benchmark).

## 3. Non-Goals

Phase 18 does not implement:

- WebSocket networking;
- Supabase/PostgreSQL persistence;
- Redis;
- matchmaking;
- authentication;
- production server hosting;
- client-server transport;
- online multiplayer;
- neural-network training as a prerequisite;
- changing canonical Baloot rules.

## 4. Architectural Authority

The following remain authoritative:

1. `packages/game-engine` — game rules, state transitions, legality, scoring and replay.
2. `packages/game-protocol` — protocol-level transition semantics.
3. Rule Freeze v1 and subsequent approved rule revisions.
4. RD-08 Baloot Declaration & Resolution Protocol.
5. Existing project, scoring, bidding, timeout, replay and match lifecycle rules.

The AI is a decision-maker only. It does not own truth.

## 5. Core Invariant

The AI follows:

**Observe -> Generate legal actions -> Evaluate/search -> Select action -> Submit action to engine -> Observe resulting state.**

It never:

- mutates hidden state;
- invents a legal move;
- calculates authoritative score independently;
- declares a winner independently;
- bypasses project/Baloot legality;
- inspects another player's hidden hand;
- uses future information.

## 6. Phase Gates Verification Matrix

| Gate | Requirement | Test Suite / Script | Empirical Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Gate A — Observation Model** | Seat-scoped projection, zero hidden leakage | `game-ai/test/observation.test.mjs` | PASS (Includes adversarial red-team check) | **PASSED** |
| **Gate B — Action Generation** | Actions derived from engine `getLegalMoves()` | `game-ai/test/authoritative-action-space.test.mjs` | PASS (100% legal moves matched) | **PASSED** |
| **Gate C — Decision Quality** | Baseline heuristic + strategy evaluation | `game-ai/test/baseline-policy.test.mjs` | PASS | **PASSED** |
| **Gate D — Hidden Info Integrity** | Sampler satisfies 32-card conservation | `game-ai/test/belief-state.test.mjs` | PASS (Conservation, void compliance) | **PASSED** |
| **Gate E — IS-MCTS Search** | Deterministic search under seeded RNG | `game-ai/test/is-mcts.test.mjs` | PASS (Reproducible decisions, no leakage) | **PASSED** |
| **Gate F — Endgame Solver** | Bounded exact search for small endgames | `game-ai/test/endgame-solver.test.mjs` | PASS (100% solve rate on 4–12 cards) | **PASSED** |
| **Gate G — Full Match** | Human vs 3 AI session lifecycle | `game-client/test/human-vs-ai.test.mjs` | PASS (Complete match, protocol envelope) | **PASSED** |
| **Gate H — Simulation Batch** | 1,000 match gate + 10,000 match stress | `game-simulator/test/match-simulator.test.mjs` | PASS (0 illegal actions, 0 invalid states) | **PASSED** |

## 7. Exit Criterion Confirmation

Phase 18 is certified complete with empirical evidence:

- Human vs 3 AI completes complete matches via `@sakkah-baloot/game-client`;
- AI uses no privileged hidden information (verified via JSON inspection & automated security tests);
- All submitted actions pass authoritative engine validation;
- Deterministic replay succeeds across all simulations;
- 1,000-match gate passes with 0 illegal actions and 0 invalid states;
- 10,000-match stress benchmark passes with deterministic digest `c49b880f`;
- AI diagnostics provide explainable decision traces;
- All monorepo packages build, typecheck, and pass tests cleanly;
- CI workflows updated with topological build dependencies.
