# صكّة بلوت — Phase 15 Readiness Certificate

**Date:** 2026-09-22  
**Branch:** `phase-15b-cancellation-kasho`  
**Status:** PHASE 15 IN IMPLEMENTATION — PURE DOMAIN ENGINE

## 1. Repository Integrity Audit

The post-cleanup repository tree was inspected.

- Active documentation set: 26 Markdown documents.
- Canonical Rule Freeze certificate exists: `docs/RD-20-RULE-FREEZE-v1.md`.
- `docs/README.md` points to the current canonical documentation set.
- Superseded proposed catalogs and pre-freeze audit documents are absent from the active tree.
- Searches found no active references to the removed proposed catalog filenames, `FOUNDATION-RULE-DECISION-INTEGRATION`, `FOUNDATION-INDEX`, or the removed Phase-15 freeze-audit document.
- Searches found no remaining `NOT AUTHORIZED` or `DRAFT — NOT FROZEN` markers.
- Historical `OPEN_DECISION` wording was removed from the frozen domain-rule sections where it would contradict Rule Freeze v1. Product/infrastructure discovery decisions may remain open where they are outside the pure domain-engine scope.

## 2. Freeze Authority

`docs/RD-20-RULE-FREEZE-v1.md` is the implementation authority.

Production implementation is authorized, but the first milestone remains strictly:

**Pure TypeScript Domain Engine only.**

No React Native, Expo, Supabase, PostgreSQL, Redis, WebSocket, or UI dependencies are permitted in the engine.

## 3. Main-Branch Synchronization

Phase 15 continuation starts from the already merged `main` baseline after PR #1. This branch is based on current `main`, so the stale Rule Freeze divergence from the previous reconciliation branch is no longer part of the continuation baseline.

## 4. Phase 15 Implementation Order

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

Transport, persistence, Redis, WebSocket, and UI integration are explicitly deferred until the pure engine passes its invariant suite.

## 5. Current Implementation Progress

Implemented in the pure engine:

- 15.1 Rule Profile / constants
- 15.2 Card + deck model
- 15.3 Deal state machine
- 15.4 Bidding + Ashkal completion + second-round Ace→Sun priority
- 15.5 Escalation state
- 15.6 Project declaration/resolution + Baloot declaration
- 15.7 Legal move generation
- 15.8 Trick resolution / authoritative card play
- 15.9 Raw-first scoring + Qaid conversion + match-end evaluation
- 15.10 Kasho/Bushat declaration and cancellation
- 15.11 Integrity incident authority/cancellation state machine

Remaining Phase 15 gates:

- server-authoritative bidding timeout transition (8s → PASS)
- final pure-engine typecheck/build verification after bidding/incident closure

**Latest pure-engine CI:** PASS — `npm run typecheck` + `npm test` on the Phase 15 branch.

The regression suite now covers legal-move edge cases, Ika validation/mutation safety, project overlap/tie/ownership resolution, Sun/Hokum Qaid rounding-edge invariants, Kaboot/Reverse Kaboot, escalation transitions, and replay idempotency/determinism, second-round Ace→Sun priority, Kasho cancellation, and integrity incident cancellation.

**PHASE 15: IMPLEMENTATION ACTIVE.**

Any newly discovered rule ambiguity is not to be solved by implementation guesswork. It must be recorded as an owner decision and, if it changes a frozen rule, requires a new Rule Freeze revision.
