# صكّة بلوت — Phase 18 Acceptance Criteria

**Phase:** 18 — Competitive AI & Single-Player Match

## A. Observation Integrity

- [ ] AI sees only its own private hand.
- [ ] AI sees all public information available to the seat.
- [ ] Opponent hands cannot influence an AI decision except through observable history and belief inference.
- [ ] Hidden-information redaction tests pass.

## B. Bidding

- [ ] AI produces a legal bidding action.
- [ ] AI respects the canonical bidding state machine.
- [ ] AI uses deterministic evaluation under a fixed seed.
- [ ] Bidding diagnostics are available.

## C. Projects

- [ ] AI only declares projects accepted by the canonical detector/validator.
- [ ] Overlap rules are enforced by the engine.
- [ ] Project precedence and tie rules remain engine-owned.

## D. Baloot

- [ ] AI recognizes legal Baloot opportunities.
- [ ] AI respects RD-08 declaration timing.
- [ ] AI cannot declare Baloot without the canonical K+Q ownership/played-card conditions.
- [ ] Baloot scoring remains engine-owned.

## E. Card Play

- [ ] AI never submits an illegal card.
- [ ] AI can reason over all legal moves.
- [ ] Search is bounded.
- [ ] Search is deterministic with a fixed seed.
- [ ] Partner/opponent modeling does not use hidden information.

## F. Endgame

- [ ] Exact/near-exact solver is used only within a defined state/budget boundary.
- [ ] Solver output is verified against exhaustive small-state engine search.

## G. Full Match

- [ ] One human + three AI can complete a round.
- [ ] One human + three AI can complete a full match.
- [ ] Dealer rotation remains canonical.
- [ ] Scoring remains canonical.
- [ ] Match completion remains canonical.
- [ ] Replay reproduces the same event sequence.

## H. Simulation

Minimum required pre-release validation:

- [ ] 1,000 AI-vs-AI matches.
- [ ] 10,000 AI-vs-AI matches before final Phase 18 closure.
- [ ] Zero illegal AI actions.
- [ ] Zero impossible engine states.
- [ ] Zero score/replay divergences.
- [ ] Zero hidden-information leaks.

## I. Reliability

- [ ] AI decision timeout/fallback behavior is defined.
- [ ] A failed search never bypasses engine legality.
- [ ] A search budget exhaustion still produces a legal action.
- [ ] Deterministic seeds reproduce reported failures.

## J. Documentation

- [ ] AI architecture is documented.
- [ ] All frozen AI architecture decisions are recorded.
- [ ] Simulation methodology is documented.
- [ ] Known limitations are documented.
- [ ] Phase readiness and closure certificates are updated.

## Final Exit Condition

Phase 18 cannot close on the existence of an AI package alone.

It closes only after:

**Human vs 3 AI -> complete match -> deterministic replay -> large simulation -> zero authoritative-rule violations.**
