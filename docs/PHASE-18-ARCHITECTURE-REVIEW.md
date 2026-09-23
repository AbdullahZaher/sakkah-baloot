# صكّة بلوت — Phase 18 Architecture Review

**Review date:** 2026-09-23  
**Branch:** `phase-18-competitive-ai`  
**Baseline:** Phase 17 main + Phase 18 documentation

## Review Result

**Architecture direction: APPROVED WITH IMPLEMENTATION AMENDMENTS**

The Phase 18 strategy is sound, but implementation must begin with an explicit observation/action boundary before IS-MCTS or advanced evaluation is added.

## Findings

### R18-01 — PlayerView must be a strict projection

The current engine stores complete deal hands by seat and complete game hands by player ID. AI must never receive a complete MatchState or raw RoundState.

**Required:** a pure projection layer that creates a seat/player-specific observation.

### R18-02 — Bidding requires a first-class observation

The current bidding engine already exposes `legalBiddingActions()`, but it requires:

- BiddingState
- dealer seat
- exposed suit
- complete bidding hands

AI must receive only its own five-card hand plus public bidding history and exposed card information. The observation adapter may internally use the authoritative state, but its output must be private-seat scoped.

### R18-03 — Legal action generation already exists for card play

`getLegalMoves()` is authoritative and must remain the only source of card-play legality.

The AI package must not implement a second follow-suit, trump, overtrump or Ika legality system.

### R18-04 — Search requires a simulation boundary

IS-MCTS needs a way to evaluate hypothetical actions without mutating the live match.

**Required:** a pure simulation API built around immutable engine transitions, not direct mutation.

### R18-05 — Hidden-world sampling must preserve conservation

Every sampled information set must satisfy:

- all 32 cards are unique;
- known cards remain fixed;
- each hidden card is assigned exactly once;
- each player's hand size remains valid;
- all public history remains unchanged.

### R18-06 — Deterministic RNG must be shared as an abstraction

The engine already exposes `RandomSource` and seeded dealing. Phase 18 should add a generic AI RNG interface rather than importing a platform RNG directly.

### R18-07 — Search result must be a legal action, not a card ID shortcut

The AI should return typed actions representing the current phase. Card play can contain a card ID and Ika declaration; bidding can contain a typed bidding action.

### R18-08 — Project and Baloot decisions are separate tactical layers

Project detection and Baloot legality remain engine-owned. AI chooses whether to declare among legal options.

### R18-09 — Full-match orchestration belongs in a simulator, not game-ai

`game-ai` should answer decisions. A separate simulator/match-runner should own:

- four player seats;
- turn progression;
- deal/bidding/play lifecycle;
- AI invocation;
- event/replay capture;
- batch execution.

Recommended package:

`packages/game-simulator`

This keeps the AI reusable for mobile, server bots and tests.

### R18-10 — Difficulty is a policy configuration

Difficulty must not fork rules.

Recommended progression:

- Beginner: deterministic heuristic policy.
- Easy: heuristic + shallow sampling.
- Normal: bounded IS-MCTS.
- Hard: larger IS-MCTS budget + stronger belief model.
- Expert: deeper search + stronger opponent/partner inference.
- Master: maximum configured search budget + exact endgame switching.

These are implementation profiles, not separate rule sets.

### R18-11 — No hidden-state evaluation

A hypothetical world may be used inside search only if it is generated from the AI's legal information set. The live AI decision must not read the real hidden hands when constructing the belief model.

### R18-12 — Endgame threshold must be empirical

Do not hard-code a card-count threshold yet. First benchmark exhaustive search against representative small states, then freeze a threshold and budget.

### R18-13 — Diagnostics are first-class QA output

Decision traces should be optional and disabled/minimized in production play. Tests and simulations should be able to capture them.

## Required implementation order

1. `game-ai` package shell.
2. Typed player observation.
3. Typed decision/action interface.
4. Observation redaction tests.
5. Legal action adapters for bidding/project/Baloot/card play.
6. Deterministic AI RNG.
7. Baseline heuristic policy.
8. Immutable simulation adapter.
9. Belief-state representation and constrained world sampler.
10. IS-MCTS.
11. Endgame solver.
12. `game-simulator`.
13. Human-vs-3-AI integration.
14. Large simulation and closure gates.

## Review conclusion

The original architecture is retained.

The implementation is amended so that **Observation -> Action Interface -> Baseline Policy -> Simulation -> Belief/Search** is built before advanced IS-MCTS.

This creates a testable vertical slice early and prevents search code from becoming coupled directly to hidden engine state.
