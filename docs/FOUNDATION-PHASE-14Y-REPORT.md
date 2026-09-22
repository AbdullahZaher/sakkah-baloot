# Phase 14.y — Worked Examples & Canonical Scoring Verification Report

**Document:** `docs/FOUNDATION-PHASE-14Y-REPORT.md`
**Phase:** 14.y — Worked Examples & Canonical Scoring Verification
**Date:** 2026-09-22
**Status:** VERIFICATION ONLY — NOT FROZEN. No production code. No rules invented. No Freeze declared.

---

## 1. Executive Status

**RULE RESOLUTION IN PROGRESS** (verification complete; Freeze blocked — see §10).

Thirty worked examples execute end-to-end against the current rule model. The core arithmetic is closed (Sun 120+10=130, Hokum 152+10=162, 20+1+11=32, 152-Qaid target, Gahwa terminal). Every scoring path that touches an unfrozen value is marked PROVISIONAL or OPEN rather than forced. No new mathematical contradiction was found; the verification sharpened five value-gaps (thresholds, rounding, failure values, Kaboot formula, tie-breaks) into five new conflict entries (C-11…C-15) and confirmed all prior OPEN conflicts still open.

---

## 2. Rules Already Canonical (exercised, not just listed)

RD-01 exposed-card distribution (EX-20/21), RD-02 global CCW (all examples; dealer NORTH → first bidder WEST), RD-04 Gahwa terminal (EX-16/MATCH-04), Sun/Hokum arithmetic (EX-01…04/11/12/23/24), 152-Qaid target (MATCH-01/02), Kaboot derived detection (EX-11/12/25), second-round all-pass cancel path (EX-19), RESYNC/stateVersion exclusion (unchanged from 13.5).

---

## 3. Decisions Requiring Rules Owner (after 14.y)

Carry-overs RD-03/05/06/07/08/09/10 (all still OPEN, now with worked-example evidence attached), plus newly sharpened: success threshold (V-01/C-11), conversion rounding (V-02/C-12), failure values (V-03/C-13), Kaboot formula (V-04/C-03), Baloot⊂Hundred selection (V-05/C-02), tie policies (V-06/C-14), allocation confirmation + counting-side term (V-07/V-11/C-15), project raw table (V-08), reversed-Kaboot condition (V-09).

---

## 4. Decisions Resolved by Explicit Foundation Evidence (14.y additions)

Sun/Hokum totals and conservation re-proven through worked totals (§2 above); 152 units = Qaid re-confirmed; profile multiplier-table internal consistency confirmed (projects ×2-cap, Baloot ×1); "right of dealer" derivation rule confirmed as stated (seats derive from RD-02).

---

## 5. Decisions Requiring External Authority

None as primary disposition — same standing as Phase 14 §5. External sources informed baselines (8k.sa Saudi publication, competition PDF, Pagat, BalootAI) and remain labeled research, never canonical, unless the Owner adopts them with recorded provenance.

---

## 6. Rule Profile Parameters (sufficiency verdict)

Sufficient: chains, ownership, open/locked modes, project values + multipliers, Baloot terms, Kaboot values, Kasho baselines, Ashkal shape, 152 target. Insufficient (gaps registered): Kaboot multiplier key, doubling-window key name, declaration close fields, tie policies, conversion/rounding rules, success thresholds, failure values, reversed-Kaboot condition, Ashkal seat matrix. Full register in `FOUNDATION-RULE-PROFILE-GAPS.md`; verification in `FOUNDATION-SCORING-VERIFICATION.md §4`.

---

## 7. Dependencies (confirmed by examples)

RD-02 fan-out exercised (EX-21 bidding order, dealer rotation in EX-19/22); RD-03→RD-04 chain exercised (EX-13→14→15→16); RD-01 + Ashkal-receiver consistency exercised (EX-21); RD-06→RD-07 interplay exercised (EX-25); EC-01→DF-01/DF-02 transcription still pending. No dependency resolved by assumption.

---

## 8. 71-Item Catalogue Disposition (unchanged from Phase 14)

48 must-resolve · 2 profile-parameter · 1 derivable · 3 documentation-only · 7 architecture · 0 product/UX · 0 external-primary · 10 duplicate/resolved = 71. Phase 14.y adds no new catalogue item; it attaches worked-example evidence to the open ones and contributes C-11…C-15 to the conflict register (value-level gaps, not new catalogue scope).

---

## 9. Architecture Dependencies (referenced, not resolved)

AD-01 (PASS wire form; EX-19 semantics unaffected) · AD-02/03/04 (phase naming; examples use descriptive phase labels only) · AD-05 (contract layers; examples use full domain shape). All 5 still blocking protocol Freeze; none blocking rule verification.

---

## 10. Rule Freeze Blockers (complete list)

1. EC-01 confirmation + DF-01/DF-02 transcription.
2. RD-03 doubling window (C-01) · RD-04 Coffee reachability · RD-05 declaration close · RD-06 project values+raw · RD-07 Kaboot values · RD-08 Baloot timing · RD-09 redeal procedure · RD-10 Ashkal matrix.
3. V-01 threshold · V-02 rounding · V-03 failure values · V-04 Kaboot formula (C-03) · V-05 Baloot⊂Hundred selection (C-02) · V-06 ties (C-14) · V-08 raw table · V-09 reversed Kaboot.
4. V-07/V-11 documentation confirmations (counting-side term, ordinary allocation sentence).
5. Wider catalogue Category-1 carry-overs (Ika, cutting/dag, Kawesh/Saneen, exposed-Ace, option sets/priorities, timeout policies, void obligation, bonus uniformity, 400/Aces scope, coexistence, comparison/overlap, escalation projects, Hokm↔Sun edges, Sakkah deviations, first dealer, exposed timing, both-cross rule, negative floor).
6. AD-01…AD-05 (protocol track).

---

## 11. Safe Next Step

**Phase 15 — Rule Freeze Audit** is NOT yet enterable: blockers above are not limited to explicitly identified Owner/Architecture decisions alone — several (V-01/02/03/08) are value-table gaps the Owner must first supply. Recommended: a **Phase 14.z — Owner Decision Capture round** that returns filled values for V-01/02/03/04/06/08/09 + RD-03/05/06/07/08/09/10 + V-05 selection + C-01/C-05/C-06 boundaries, after which Phase 15 (Freeze Audit) verifies and freezes. Until then, `01-game-rules.md §53` remains in force; only previously cleared safe work may proceed.

Final status: **RULE FREEZE BLOCKED**.
