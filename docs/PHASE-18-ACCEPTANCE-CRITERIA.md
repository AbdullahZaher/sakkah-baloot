# صكّة بلوت — Phase 18 Acceptance Criteria

**Phase:** 18 — Competitive AI & Single-Player Match  
**Status:** CLOSED & VERIFIED  

---

## A. Observation Integrity

- [x] **AI sees only its own private hand.**
  - *Evidence:* `packages/game-ai/src/index.ts` (`createAIObservation`), verified in `packages/game-ai/test/observation.test.mjs`.
- [x] **AI sees all public information available to the seat.**
  - *Evidence:* Public bidding history, trick plays, exposed card, match score, state version included in `AIRoundObservation`.
- [x] **Opponent hands cannot influence an AI decision except through observable history and belief inference.**
  - *Evidence:* Hidden hands stripped in `createAIObservation`; belief model infers void suits and bidding signals only from public logs (`packages/game-ai/src/belief-state.ts`).
- [x] **Hidden-information redaction tests pass.**
  - *Evidence:* `packages/game-ai/test/observation.test.mjs` ("adversarial security test: no hidden opponent cards exist in serialized or inspectable AI observation").

## B. Bidding

- [x] **AI produces a legal bidding action.**
  - *Evidence:* `packages/game-ai/src/baseline-policy.ts` (`chooseBid`), verified in `packages/game-ai/test/baseline-policy.test.mjs`.
- [x] **AI respects the canonical bidding state machine.**
  - *Evidence:* Legal action candidates provided by engine `legalBiddingActions()`.
- [x] **AI uses deterministic evaluation under a fixed seed.**
  - *Evidence:* Verified in `packages/game-ai/test/ai-controller.test.mjs`.
- [x] **Bidding diagnostics are available.**
  - *Evidence:* `AIDecisionTrace` returns `candidates`, `heuristicScore`, and `reasonCodes`.

## C. Projects

- [x] **AI only declares projects accepted by the canonical detector/validator.**
  - *Evidence:* `packages/game-ai/src/ai-match-controller.ts` consumes `detectProjects()` from engine; verified in `packages/game-protocol/test/protocol.test.mjs`.
- [x] **Overlap rules are enforced by the engine.**
  - *Evidence:* Canonical resolution via `resolveProjects()` in `@sakkah-baloot/game-engine`.
- [x] **Project precedence and tie rules remain engine-owned.**
  - *Evidence:* Handled by `resolveProjects()` in `packages/game-engine/src/rules/projects.ts`.

## D. Baloot

- [x] **AI recognizes legal Baloot opportunities.**
  - *Evidence:* `packages/game-ai/src/ai-match-controller.ts` calls `canDeclareBaloot()`.
- [x] **AI respects RD-08 declaration timing.**
  - *Evidence:* Verified in `packages/game-protocol/test/protocol.test.mjs` and `packages/game-client/test/client.test.mjs`.
- [x] **AI cannot declare Baloot without the canonical K+Q ownership/played-card conditions.**
  - *Evidence:* Engine validates conditions before card commit.
- [x] **Baloot scoring remains engine-owned.**
  - *Evidence:* `scoreRound()` in `packages/game-engine/src/rules/scoring.ts` applies canonical 20 raw / 2 Qaid award.

## E. Card Play

- [x] **AI never submits an illegal card.**
  - *Evidence:* 0 illegal actions across 10,000 matches in `packages/game-simulator/test/index.test.mjs` and `packages/game-simulator/scripts/benchmark-suite.mjs`.
- [x] **AI can reason over all legal moves.**
  - *Evidence:* `getLegalMoves()` provides authoritative candidate list.
- [x] **Search is bounded.**
  - *Evidence:* IS-MCTS has configurable `iterations`; endgame solver has `maxRemainingCards` and `maxNodes`.
- [x] **Search is deterministic with a fixed seed.**
  - *Evidence:* Verified in `packages/game-ai/test/is-mcts.test.mjs` and `packages/game-simulator/test/index.test.mjs`.
- [x] **Partner/opponent modeling does not use hidden information.**
  - *Evidence:* Belief state samples hidden worlds from public history and void-suit inferences only (`packages/game-ai/src/belief-state.ts`).

## F. Endgame

- [x] **Exact/near-exact solver is used only within a defined state/budget boundary.**
  - *Evidence:* `packages/game-ai/src/endgame-solver.ts` (`solveEndgame`), verified in `packages/game-ai/test/endgame-solver.test.mjs`.
- [x] **Solver output is verified against exhaustive small-state engine search.**
  - *Evidence:* Evaluated with 100% exact solve rate and 100% optimal minimax payoff agreement across synthetic legal engine state sweeps in `packages/game-simulator/scripts/benchmark-suite.mjs`.

## G. Full Match

- [x] **One human + three AI can complete a round.**
  - *Evidence:* `packages/game-client/test/human-vs-ai.test.mjs` and `packages/game-client/test/client.test.mjs`.
- [x] **One human + three AI can complete a full match.**
  - *Evidence:* `packages/game-client/src/local-human-vs-ai.ts` orchestrates full match progression.
- [x] **Dealer rotation remains canonical.**
  - *Evidence:* Counter-clockwise dealer rotation via `rotateDealer()`.
- [x] **Scoring remains canonical.**
  - *Evidence:* All round points and Qaid calculated by engine `scoreRound()`.
- [x] **Match completion remains canonical.**
  - *Evidence:* Target crossing evaluated by `evaluateMatchEnd()`, handling `EXTRA_DEAL` on tie.
- [x] **Replay reproduces the same event sequence.**
  - *Evidence:* Verified in `packages/game-simulator/test/index.test.mjs` (`assertReplayEquivalent`).

## H. Simulation

Minimum required pre-release validation:

- [x] **1,000 deterministic full-match validation simulations.**
  - *Evidence:* 1,000 completed, 0 illegal actions, digest `70199b8b`.
- [x] **10,000 deterministic full-match validation simulations before final Phase 18 closure.**
  - *Evidence:* 10,000 completed, 0 illegal actions, digest `c49b880f`.
- [x] **Zero illegal AI actions.**
  - *Evidence:* `illegalActions === 0` recorded across all 11,000+ simulation matches.
- [x] **Zero impossible engine states.**
  - *Evidence:* Card conservation assertions (`assertGameConservation`) passed for every trick and round.
- [x] **Zero score/replay divergences.**
  - *Evidence:* `assertReplayEquivalent` passed for all card-play sequences.
- [x] **Zero hidden-information leaks.**
  - *Evidence:* Observation isolation test passed in `packages/game-ai/test/observation.test.mjs`.

## I. Reliability

- [x] **AI decision timeout/fallback behavior is defined.**
  - *Evidence:* Baseline fallback configured when endgame/MCTS budgets exhaust.
- [x] **A failed search never bypasses engine legality.**
  - *Evidence:* Actions strictly filtered to `legalCardIds`.
- [x] **A search budget exhaustion still produces a legal action.**
  - *Evidence:* IS-MCTS and endgame solver fall back to baseline heuristic rankings.
- [x] **Deterministic seeds reproduce reported failures.**
  - *Evidence:* Seed-based execution guarantees identical traces.

## J. Documentation

- [x] **AI architecture is documented.**
  - *Evidence:* `docs/PHASE-18-AI-ARCHITECTURE.md`
- [x] **All frozen AI architecture decisions are recorded.**
  - *Evidence:* `docs/PHASE-18-DECISION-LEDGER.md`
- [x] **Simulation methodology is documented.**
  - *Evidence:* `docs/PHASE-18-SIMULATION.md` and `docs/PHASE-18-BENCHMARKS.md`
- [x] **Known limitations are documented.**
  - *Evidence:* `docs/PHASE-18-READINESS.md`
- [x] **Phase readiness and closure certificates are updated.**
  - *Evidence:* `docs/PHASE-18-READINESS.md` and `docs/PHASE-18-ARCHITECTURE-REVIEW.md`

---

## Final Exit Condition

All acceptance criteria are met and backed by reproducible automated tests and empirical benchmark data:

**Human vs 3 AI -> complete match -> deterministic replay -> large validation simulation (1,000 & 10,000 matches) -> zero authoritative-rule violations.**
