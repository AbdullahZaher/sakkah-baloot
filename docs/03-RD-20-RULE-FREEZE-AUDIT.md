# RD-20 — Full Rule Freeze Verification

Rule Freeze passes only if:
- P0 = 0
- P1 = 0
- unresolved rule decisions = 0
- contradictions = 0
- RuleProfile gaps = 0
- every legal action has server validation
- every transition has deterministic output
- every event is replay-verifiable
- every scoring branch has tests
- hidden information is enforced.

## Mandatory traceability
Every canonical rule must map to:
`Rule → RuleProfile → State → Action → Event → Transition → Test`

## Mandatory APIs
```ts
getLegalActions(state, playerId): LegalAction[]
getLegalMoves(state, playerId): LegalMove[]
applyAction(state, action, profile): TransitionResult
resolveRound(completedHand, profile): RoundResolution
resolveHandTermination(state, reason, profile): TerminationResolution
```

## Test families
1. Dealing: conservation, exposed allocation, Ashkal allocation, exposed Ace, duplicates, wrong counts.
2. Bidding: two rounds, PASS/PASS_FINAL, Ashkal, exposed Ace, Kasho.
3. Escalation: Double/Triple/Four/Gahwa, closure, late rejection, Open/Locked.
4. Projects: detection, ranking, ties, dealer priority, max 2, overlap, pool, failed-contract allocation.
5. Trick legality: Follow Suit, Ika, partner exemption, cutting, must-trump, overtrump, locked lead.
6. Scoring: 130/162, 65/81 inclusive, failure transfer, projects, Baloot, Kaboot, Reverse Kaboot, multipliers, Gahwa.
7. Termination: normal, All Pass, Kasho, incident continue/cancel, idempotency, dealer rotation.
8. Replay: identical event stream reproduces identical final state.

## Hard stop
If any blocker remains, report `RULE_FREEZE = BLOCKED` and do not implement production rule behavior.

## PASS certificate
```text
RULE_FREEZE = PASS
P0 = 0
P1 = 0
UNRESOLVED_RULES = 0
CONTRADICTIONS = 0
PROFILE_GAPS = 0
MISSING_ACTIONS = 0
MISSING_EVENTS = 0
MISSING_TRANSITIONS = 0
MISSING_SCORING_TESTS = 0
DETERMINISM = PASS
HIDDEN_INFORMATION = PASS
REPLAY = PASS
```
