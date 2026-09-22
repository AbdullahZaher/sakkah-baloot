# صكّة بلوت — Phase 15 Readiness Certificate

**Date:** 2026-09-22  
**Branch:** `phase-14z10r-canonical-reconciliation`  
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

## 3. Main-Branch Divergence

Current branch comparison against `main`:

- Ahead: 232 commits
- Behind: 1 commit
- Merge base: `2773c69b375377e46f584c3f6ad6e1ccbd925d27`

The one commit currently ahead on `main` is `fd1533b904ea83effb1e6268ddccf75e10ba961e` (`docs: authorize Rule Freeze v1`). Its content is an older/stale version of the Rule Freeze certificate and references superseded filenames.

**Decision:** do not blindly rebase or merge this commit into the canonical branch. The current branch contains the newer reconciled certificate and cleaned documentation set. Main synchronization can be handled deliberately after the Phase 15 implementation boundary is established.

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
- 15.4 Bidding + Ashkal completion
- 15.5 Escalation state
- 15.6 Project declaration/resolution + Baloot declaration
- 15.7 Legal move generation
- 15.8 Trick resolution / authoritative card play
- 15.9 Raw-first scoring + Qaid conversion + match-end evaluation

Remaining Phase 15 gates:

- authoritative bidding edge semantics still requiring explicit state inputs: second-round Ace→Sun priority, PASS_FINAL/Kasho integration, and timeout policy
- authoritative incident/cancellation state machine
- final pure-engine typecheck/build verification after the complete bidding/incident closure

**Latest pure-engine CI:** PASS — `npm run typecheck` + `npm test` on the Phase 15 branch.

The regression suite now covers legal-move edge cases, Ika validation/mutation safety, project overlap/tie/ownership resolution, Sun/Hokum Qaid rounding-edge invariants, Kaboot/Reverse Kaboot, escalation transitions, and replay idempotency/determinism.

**PHASE 15: IMPLEMENTATION ACTIVE.**

Any newly discovered rule ambiguity is not to be solved by implementation guesswork. It must be recorded as an owner decision and, if it changes a frozen rule, requires a new Rule Freeze revision.

Any newly discovered rule ambiguity is not to be solved by implementation guesswork. It must be recorded as an owner decision and, if it changes a frozen rule, requires a new Rule Freeze revision.
