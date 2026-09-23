# صكّة بلوت — Phase 18 AI Architecture

**Status:** Architecture baseline — implementation not authorized  
**Branch:** `phase-18-competitive-ai`

## 1. Design Principle

The AI is an external consumer of the authoritative game engine.

```
Player Observation
       |
       v
  Belief Model
       |
       v
Candidate Legal Actions
       |
       v
Decision Policy
       |
       v
Information-Set Search
       |
       +----> Endgame Solver
       |
       v
Selected Action
       |
       v
Authoritative Game Engine
       |
       v
New State / Observation
```

No AI subsystem may become a second rules engine.

## 2. AI Package Boundary

Create a dedicated package:

`packages/game-ai`

The package may depend on:

- `@sakkah/game-engine`
- deterministic utility code;
- pure TypeScript data structures.

It must not depend on:

- React;
- React Native;
- Expo;
- Supabase;
- PostgreSQL;
- WebSocket;
- Redis;
- server framework.

## 3. Player Observation

The AI receives a seat-specific observation.

Conceptually:

```ts
interface PlayerObservation {
  matchId: MatchId;
  roundId: RoundId;
  playerId: PlayerId;
  seat: Seat;
  teamId: TeamId;

  hand: readonly Card[];
  contract: Contract | null;
  trumpSuit: Suit | null;

  biddingHistory: readonly unknown[];
  currentTrick: readonly TrickPlay[];
  completedTricks: readonly CompletedTrick[];

  visibleProjects: readonly ProjectDeclaration[];
  visibleBaloot: readonly BalootDeclaration[];

  score: MatchScore;
  stateVersion: number;
}
```

The exact type must be derived from existing engine/protocol types during implementation rather than duplicated blindly.

## 4. Hidden Information

The AI must not receive:

- opponent hands;
- unexposed deck order;
- hidden server state;
- another seat's private observation;
- future events;
- authoritative state that the human client would not receive.

A dedicated redaction test suite is mandatory.

## 5. Belief Model

The AI maintains probabilities or weighted hypotheses about hidden cards.

Inputs include:

- current hand;
- exposed card;
- all known played cards;
- bidding history;
- contract;
- trump;
- trick history;
- partner actions;
- opponent actions;
- legal constraints.

The belief layer may produce multiple plausible worlds, but every generated world must preserve deck conservation and all known observations.

## 6. Bidding Policy

Bidding should combine:

- hand strength;
- contract-specific strength;
- trump control;
- control cards;
- voids;
- project potential;
- Baloot potential;
- partner/position information;
- previous bids;
- risk;
- expected round value.

The first implementation should be deterministic and explainable.

## 7. Project Policy

Project decisions must use the canonical project detector and declaration validator.

The AI may choose among valid declarations but must never independently redefine:

- project eligibility;
- overlap rules;
- precedence;
- tie resolution;
- lifecycle;
- award rules.

## 8. Baloot Policy

Baloot is a tactical decision layer on top of RD-08.

The AI must use the canonical Baloot legality and declaration timing.

The AI may decide whether to declare when the canonical declaration window exists, but it may not modify the Baloot rules.

## 9. Card-Play Policy

For every turn:

1. Ask the engine for legal moves.
2. Generate candidate actions only from that set.
3. Evaluate each candidate.
4. Search when the configured budget allows.
5. Select one legal action.
6. Submit it to the engine.
7. Re-observe the resulting state.

## 10. Search Strategy

The runtime search architecture is:

### Normal / Midgame

Information Set Monte Carlo Tree Search (IS-MCTS) over plausible hidden-information states.

### High-certainty endgame

Exact or near-exact search when the remaining information/state space is sufficiently small.

### Offline strategy research

CFR/MCCFR or other extensive-form methods may be evaluated later for policy tuning, but they are not a Phase 18 runtime dependency.

## 11. Search Budget

Search must be bounded by explicit configuration:

```ts
interface AISearchBudget {
  maxIterations: number;
  maxDepth: number;
  maxTimeMs: number;
  randomSeed: string;
}
```

The AI must remain deterministic for the same:

- observation;
- configuration;
- seed.

## 12. Partner / Opponent Modeling

The AI maintains beliefs about:

- partner suit ownership;
- opponent suit ownership;
- likely trump distribution;
- likely remaining control cards;
- observed strategic intent.

Models must represent uncertainty, not convert guesses into facts.

## 13. Evaluation

The evaluation function should consider:

- expected trick value;
- team expected card points;
- contract success probability;
- future control;
- trump preservation;
- partner benefit;
- opponent threat;
- project/Baloot implications;
- endgame position;
- risk.

The authoritative score remains the engine's responsibility.

## 14. Explainability

Every selected action should optionally expose diagnostics:

```ts
interface AIDecisionTrace {
  actionId: string;
  candidates: readonly {
    action: unknown;
    heuristicScore: number;
    searchValue?: number;
    simulations?: number;
  }[];
  selectedAction: unknown;
  reasonCodes: readonly string[];
}
```

This is a debugging and QA facility, not player-facing truth.

## 15. Deterministic Simulation

All simulations must support a deterministic seed.

The simulator must be able to reproduce:

- deal;
- AI decisions;
- search sampling;
- match outcome;
- event sequence.

This is required for debugging rare AI failures.
