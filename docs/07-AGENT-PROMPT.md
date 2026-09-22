# صكّة بلوت — Production Agent Prompt

You are the senior domain/game-engine engineer for صكّة بلوت / Sakkah Baloot.

Execute the final RD-20 Rule Freeze Verification first. Only after it passes may you implement the deterministic core engine.

## Governance
1. Current canonical docs are the source of truth.
2. Never invent or silently infer a rule.
3. Never replace a canonical decision with a community rule.
4. Preserve historical evidence.
5. If a contradiction appears, STOP and report it before changing behavior.
6. Domain engine must not import React/Expo/Supabase/Redis/WebSocket.
7. Client is never authoritative.
8. Never expose hidden cards.
9. Never use network arrival order as a tie-breaker.
10. No wall-clock time or unseeded randomness in domain decisions.

## Read first
Read existing 01–09 Foundation docs plus all files in this documentation pack, then inspect the repository for stale implementations/tests.

## Audit targets
Find and report stale:
- clockwise direction
- exposed-card ownership
- Sun=140 arithmetic
- generic Kaboot multiplication
- Baloot multiplier
- Baloot+Hundred double scoring
- Kasho KEEP_CURRENT dealer behavior
- hardcoded seat arithmetic
- project ranking by Raw/Qaid
- DECLARE_KABOOT
- REDEAL GamePhase
- client-side legality inference
- network-order tie breaks
- floating-point persisted Qaid.

## Freeze gate
Produce a rule-to-code matrix:
`Rule → RuleProfile → State → Action → Event → Transition → Test`.

Run/create tests for dealing, bidding, Ashkal, escalation, projects, Baloot, Ika, cutting, legal moves, scoring, Kaboot, Reverse Kaboot, Gahwa, Kasho, termination, idempotency, hidden information, and replay.

If blocked, stop and output:
```text
RULE_FREEZE = BLOCKED
P0:
P1:
UNRESOLVED:
CONTRADICTIONS:
PROFILE_GAPS:
MISSING_ACTIONS:
MISSING_EVENTS:
MISSING_TRANSITIONS:
MISSING_TESTS:
```

## Only after PASS
Implement pure domain engine under `packages/game-engine/src/` with modules for cards, dealing, bidding, contracts, projects, tricks, legal-moves, scoring, termination, match, replay, rules, state, actions, events.

Required APIs:
```ts
getLegalActions(state, playerId): LegalAction[]
getLegalMoves(state, playerId): LegalMove[]
applyAction(state, action, profile): TransitionResult
resolveRound(completedHand, profile): RoundResolution
resolveHandTermination(state, reason, profile): TerminationResolution
```

Use immutable deterministic events and reducers. Use an explicit seeded RNG for dealing if randomness is required.

## Legal moves
`getLegalMoves()` is the single public legality API. Return actual legal card IDs/options. Client only enables those options. Server recalculates and validates every action.

## Scoring order
```text
card raw
→ project eligibility
→ project ownership
→ awarded project raw
→ Baloot raw
→ contract raw
→ success/failure
→ project qaid
→ Baloot qaid
→ contract conversion
→ Kaboot/Reverse Kaboot
→ final Qaid
→ match update
```

## Termination
Use one idempotent termination resolver. Never create REDEAL as a phase. Gahwa ends the match immediately. Kasho and All Pass cancel at 0–0 and rotate dealer right.

## Final deliverables
Create:
- RULE-FREEZE-REPORT.md
- DOMAIN-ENGINE-AUDIT.md
- RULE-TO-CODE-MATRIX.md
- ENGINE-TEST-REPORT.md
- REMAINING-ISSUES.md

Final status must be exactly `RULE_FREEZE = PASS` or `RULE_FREEZE = BLOCKED`.
Do not claim PASS without evidence from tests and repository inspection.
