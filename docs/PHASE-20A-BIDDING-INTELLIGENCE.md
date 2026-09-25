# Phase 20-A — Bidding Intelligence

## Status

**20-A0 — Forensic Baseline:** COMPLETE  
**20-A1 — Bid Feature Model:** COMPLETE  
**20-A2 — Sun Evaluator:** COMPLETE
**20-A3 — Hokum Evaluator:** COMPLETE
**20-A4 — Contract Ranking + Pass Policy:** COMPLETE
**20-A5 — Difficulty + Context:** COMPLETE
**20-A6 — Bidding Lifecycle Validation:** COMPLETE

Branch: `phase-20a-bidding-intelligence`

Base: `phase-20-playable-experience`

## 1. Forensic Baseline

The authoritative bidding flow remains supplied by `@sakkah-baloot/game-engine`.
The Phase 20-A policy now consumes that authoritative action space and evaluates
Sun/Hokum candidates without duplicating legality rules.

The AI receives only:

- its own hand;
- the exposed card;
- authoritative legal bidding actions;
- bidding state;
- public bidding history.

It must not receive hidden opponent hands or hidden deck information.

The production baseline path is now:

`chooseBaselineAction → rankBiddingContracts → Sun/Hokum evaluator → threshold-qualified selection/PASS`.

Ashkal and Kasho strategy remain outside the current evaluator scope; when no
qualified Sun/Hokum purchase is selected, the policy can PASS and the engine owns
the resulting ALL_PASS/redeal lifecycle. This is intentional and is not a new
engine rule.

## 2. Authority Boundary

The implementation must preserve:

```
game-engine
  -> legal bidding actions
  -> contract legality
  -> state transition

game-ai
  -> hand evaluation
  -> contract evaluation
  -> risk / margin policy
  -> action selection
```

No bidding rule is duplicated in the AI.

The AI may evaluate only actions present in `observation.legalActions`.

## 3. Bid Feature Model

20-A1 introduces a pure feature extraction layer:

```
extractBiddingFeatures(observation)
```

Location:

```
packages/game-ai/src/bidding/bid-features.ts
```

### Hand-level features

- Sun raw value
- Sun control value
- rank counts
- suit lengths
- void suits

### Per-suit Hokum features

For each suit:

- card count
- Hokum raw value
- Hokum control value
- A/K/Q/J/9 presence
- J/9 control count
- side A count
- side 10 count
- void side suits
- K+Q Baloot potential

### Public bidding context

- bidding phase
- acting seat
- turn number
- pass count
- exposed suit
- authoritative legal actions
- public prior pass count
- public prior purchase count

## 4. Important Non-Decisions

20-A1 intentionally does **not** decide:

- how many points a hand must have to buy;
- which contract wins between Sun and Hokum;
- whether a marginal hand should buy;
- difficulty-specific risk tolerance;
- Kasho strategy;
- project weighting;
- Baloot strategic weighting;
- probabilistic trick prediction.

Those belong to the evaluator/policy slices.

This prevents feature extraction from silently becoming an undocumented ruleset.

## 5. Phase 20-A6 Validation Gate

A6 validates the bidding lifecycle rather than claiming statistically optimal bidding.
The validation suite covers:

- 250 deterministic seeded deals;
- the production `chooseBaselineAction` bidding path;
- authoritative legal-action checks before every engine transition;
- SUN/HOKUM/PASS outcomes and terminal `CONTRACT_SELECTED` / `CANCELLED` lifecycle;
- EASY, NORMAL, and HARD deterministic behavior;
- player-scoped observations with no opponent hands or deck state;
- authoritative ALL_PASS cancellation behavior.

The suite proves legality, determinism, information-boundary compliance, and lifecycle
correctness. It does not establish competitive optimality or statistically calibrated
bid frequencies.

## 6. Current Integration Boundary

`packages/game-client/src/local-human-vs-ai.ts` already routes AI turns through
`chooseAuthoritativeAIAction`, which reaches `chooseBaselineAction` during bidding.
Therefore Phase 20-A bidding intelligence is on the playable Human-vs-3-AI runtime path.

The full-match simulator still has a separate historical bidding policy in
`packages/game-simulator/src/index.ts`; it is not counted as A6 evidence. Replacing
that policy and adding redeal-aware simulation coverage is a subsequent integration
slice, not a claim made by the current A6 gate.

## 7. Exit Status

20-A0 through 20-A6 are implemented. The next work should focus on empirical calibration,
full-match simulator integration, and the remaining Phase 20 playable-experience slices.
