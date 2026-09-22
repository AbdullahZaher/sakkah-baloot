# صكّة بلوت — Rule Freeze v1

**Date:** 2026-09-22  
**Branch:** phase-14z10r-canonical-reconciliation  
**Status:** AUTHORIZED FOR PRODUCTION ENGINE IMPLEMENTATION

## 1. Freeze Authority

Rule Freeze v1 is authorized by the Owner instruction to complete the remaining closure steps and the explicit Phase 14.Z.12 closure record.

The canonical implementation set is:

- docs/02-RULE-PROFILE-SA.md
- docs/game/01-game-rules.md through docs/game/10-legal-move-specification.md
- docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md
- docs/FOUNDATION-RULE-CONFLICT-REGISTER.md
- docs/FOUNDATION-RULE-TO-CODE-MATRIX.md
- docs/FOUNDATION-PHASE-14Z.6-PROPOSED-ACTION-CATALOG.md
- docs/FOUNDATION-PHASE-14Z.6-PROPOSED-EVENT-CATALOG.md
- docs/FOUNDATION-PHASE-14Z.11-FINAL-RULE-CLOSURE-AUDIT.md

## 2. Final Closed Decisions

- Direction: counter-clockwise.
- Match target: 152.
- Both teams crossing 152: higher final total wins.
- Equal final totals at target: EXTRA_DEAL.
- V-02-A: exact contract-specific integer conversion.
- V-02b: fixed-total complement is a validation invariant only; independent conversion is authoritative.
- Contract thresholds: Sun ≥65, Hokum ≥81.
- Failed contract: full contract round value to opponent.
- Successful contract: each team retains its own eligible allocation.
- Kaboot: flat dedicated values; Reverse Kaboot = 88; Gahwa overrides.
- Projects: Raw immutable; DOUBLE ×2; TRIPLE/FOUR ×1; Baloot ×1.
- Project comparison/coexistence: frozen profile.
- Sun Double: CONTRACT_FINALIZED → FINAL_CARDS_RAISED; no post-card/post-trick Double.
- Hokum escalation: project-specific frozen window.
- First dealer: deterministic match-seed derived and persisted.
- Bidding timeout: 8 seconds → PASS.
- Playing timeout: 30 seconds → AFK/disconnect handling; no random card.
- Incident recovery: affected opposing team decides on recoverable incidents; unrecoverable integrity violations auto-cancel.
- Kasho: explicit declaration, CCW priority, purchase closes window, cancellation 0–0, dealer rotates right.
- Ace→Sun: dealer-right priority.
- Second-round purchase: first valid purchase commits; PASS cannot be reversed.
- Purchase finalization atomically fixes purchaser/contract and waives Kasho.
- AD-01…AD-05: accepted.
- PASS: one wire action; semantic final-pass meaning is server-derived.
- GamePhase: canonical client-facing lifecycle only; internal transitions remain internal.
- Event ordering: frozen in the Event Catalog and State Transition specification.

## 3. Frozen Architecture Invariants

1. Core engine is pure TypeScript.
2. No React Native, Expo, Supabase, Redis, PostgreSQL, or WebSocket imports in the engine.
3. Client sends intents, never derived outcomes.
4. Server is authoritative.
5. Accepted transitions are deterministic.
6. Rejected actions do not mutate gameplay state.
7. Duplicate action IDs execute at most once.
8. State version increments exactly once per committed gameplay mutation.
9. State + events + processed-action/outbox persistence is atomic.
10. Hidden cards and RNG seed never enter unauthorized player projections.
11. Replay uses authoritative state/events and the frozen Rule Profile.
12. Legal-move generation returns legal cards only; scoring does not constrain card legality.

## 4. Event Invariants

Events are immutable facts, not commands.

Every event has authoritative:
- eventId
- gameId
- roundId
- sequence
- stateVersion
- type
- payload
- occurredAt

Representative ordering:
- CARD_PLAYED → TRICK_COMPLETED → TURN_CHANGED
- KABOOT/REVERSE_KABOOT → ROUND_SCORED → MATCH_END_EVALUATED → ROUND_COMPLETED or MATCH_COMPLETED
- CONTRACT_SELECTED → FINAL_CARDS_DEALT
- INCIDENT_DETECTED → DECISION_REQUIRED → INCIDENT_CANCELLED → HAND_CANCELLED → DEALER_ROTATED

## 5. Implementation Gate

Production implementation is now authorized.

The first implementation milestone must remain:

**Pure Domain Engine only.**

Order:
1. Rule Profile types/constants.
2. Card/deck/conservation model.
3. Deal state machine.
4. Bidding state machine.
5. Contract normalization.
6. Escalation.
7. Project declaration/resolution.
8. Legal move generation.
9. Trick resolution.
10. Scoring.
11. Match-end resolution.
12. Replay/event reducer.
13. Exhaustive invariant tests.

Transport, database, Redis, and UI integration follow only after domain-engine tests pass.

## 6. Explicit Non-Goals

Rule Freeze v1 does not authorize:
- undocumented variants;
- heuristic bot rules outside legal-move API;
- client-side authority;
- hidden-information leakage;
- implicit generic scoring formulas;
- changing the frozen Rule Profile without a new Rule Freeze revision.

**Rule Freeze v1 = CLOSED / IMPLEMENTATION AUTHORIZED.**
