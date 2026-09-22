# صكّة بلوت — Phase 14.Z.10-R Scoring Transcription Audit

**Date:** 2026-09-22  
**Phase:** 14.Z.10-R — Controlled Documentation Mutation  
**Status:** COMPLETE — BRANCH ONLY / NOT MERGED  
**Branch:** `phase-14z10r-canonical-reconciliation`

## Purpose

Close documentation-only scoring transcription tasks that are already explicitly recorded as owner decisions, without inventing or silently closing unresolved scoring rules.

## Source reconciliation

The repository's `FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md` records:

- **V-11 — Normal Successful Round Allocation:** CLOSED.
- **V-06b — Doubled Tie:** CLOSED at the headline-rule level, with an explicit remaining transcription/detail boundary for TRIPLE/FOUR.
- **V-02 — Qaid conversion:** still listed as requiring the exact contract-specific conversion table; no new rounding rule is invented by this phase.

## Changes made

### V-11

`docs/game/06-scoring.md` now explicitly states:

> On a successful contract, each team retains its own eligible card/project/Baloot allocation, converted per the contract-specific conversion table.

This converts the previously implied success-allocation behavior into explicit scoring documentation.

### V-06b

`docs/game/06-scoring.md` now explicitly records:

- an exact raw tie at DOUBLE is awarded against the initial doubler;
- `initialDoublerTeamId` identifies the initial doubler;
- the last multiplier caller must not be used;
- no distinct TRIPLE/FOUR behavior is invented while the owner decision leaves that transcription detail open.

## Deliberately not closed

This phase does **not** freeze:

- exact Sun Qaid conversion/rounding;
- exact Hokum Qaid conversion/rounding;
- any other owner-decision item not explicitly closed in the source decision record.

The existing `06-scoring.md` conversion sections therefore remain a Rule Freeze blocker until the exact contract-specific table is explicitly frozen and transcribed.

## Gate status

- Documentation transcription: **PROGRESS**
- Qaid conversion table: **BLOCKED / OWNER DECISION OR EXISTING AUTHORITATIVE DECISION RECORD REQUIRED**
- Production code: **NOT AUTHORIZED**
- Rule Freeze: **NOT DECLARED**
