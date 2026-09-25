# Phase 20-A — Bidding Intelligence

## Status

**20-A0 — Forensic Baseline:** COMPLETE  
**20-A1 — Bid Feature Model:** COMPLETE  
**20-A2 — Sun Evaluator:** COMPLETE
**20-A3 — Hokum Evaluator:** COMPLETE
**20-A4 — Contract Ranking + Pass Policy:** COMPLETE
**20-A5 — Difficulty + Context:** COMPLETE
**20-A6 — Full-match Validation:** COMPLETE  
**20-A3 — Hokum Evaluator:** PLANNED

Branch: `phase-20a-bidding-intelligence`

Base: `phase-20-playable-experience`

## 1. Forensic Baseline

The current authoritative bidding flow is already supplied by
`@sakkah-baloot/game-engine`.

The AI receives:

- its own hand;
- the exposed card;
- the authoritative legal bidding actions;
- the bidding state;
- public bidding history.

The AI must not receive hidden opponent hands or hidden deck information.

The current baseline bidding policy in `baseline-policy.ts` ranks legal actions using
a small heuristic:

- Sun uses the hand's Sun raw card value;
- exposed Hokum uses trump-suit length plus a fraction of Sun value;
- generic Hokum currently reuses the exposed suit when available;
- Ashkal uses a fraction of Sun value;
- PASS has a fixed score of zero;
- Kasho is deliberately left to a separate risk policy.

This is sufficient for legality coverage but is not a dedicated contract evaluator.
In particular, the baseline does not yet model a complete per-suit Hokum profile,
contract margin, or a real PASS threshold.

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

## 5. Next Slice — 20-A2

Build a dedicated Sun evaluator that consumes the feature model and returns:

```
strength
threshold
margin
confidence
reasonCodes
```

The evaluator must remain deterministic and must not alter authoritative engine state.

The existing Rule Profile contract threshold is an engine configuration input;
it must not be replaced with a second hard-coded ruleset in game-AI.

## 6. Acceptance Gate

Before moving beyond 20-A1:

- feature extraction is deterministic;
- no hidden opponent information is consumed;
- legal action vocabulary is unchanged;
- per-suit Hokum features are independent;
- feature tests cover Sun, Hokum, void suits, Baloot potential, and public bid history;
- existing bidding behavior is unchanged until the evaluator is explicitly integrated.
