# صكّة بلوت — Scoring Verification (Phase 14.y)

**Document:** `docs/FOUNDATION-SCORING-VERIFICATION.md`
**Phase:** 14.y — Worked Examples & Canonical Scoring Verification
**Date:** 2026-09-22
**Status:** VERIFICATION ONLY — NOT FROZEN. No code. No rules invented. No Freeze declared.

---

## 1. Card-Point Arithmetic Proofs

### Sun (LOCKED)

Per-suit: 11 + 10 + 4 + 3 + 2 + 0 + 0 + 0 = **30**. Four suits: 30 × 4 = **120** raw card points. Last-trick bonus **+10** → round card total **130**.

> Sun raw card total = 120, and final trick bonus = 10, therefore round card-point total = 130.

Verified consequences: EX-01 (75+45=120 cards; 85+45=130 totals), EX-02 (40+80=120; 40+90=130), EX-12 (120+10=130), EX-24 (55+65=120; 65+65=130). The 140 figure survives nowhere: it was a double-count (C-08 RESOLVED; transcription via DF-01/DF-02 pending EC-01).

### Hokum (LOCKED)

Trump suit: 20 + 14 + 11 + 10 + 4 + 3 + 0 + 0 = **62**. Three non-trump suits × 30 = **90**. Base = **152**; +10 bonus → round total **162**.

Verified: EX-03 (90+62=152; 100+62=162), EX-04 (55+97=152; 55+107=162), EX-11 (152+10=162), EX-23 (71+81=152; 81+81=162). No documented total differs — no discrepancy to record.

### Conservation (LOCKED)

EX-20: 20 + 1 + 11 = 32; buyer 5+1+2 = 8; others 5+3 = 8 (C-09 RESOLVED; arithmetic holds exactly).

### Profile multiplier-table consistency (no contradiction)

Rule Profile projects multiplier (NORMAL 1 / DOUBLE 2 / TRIPLE 2 / FOUR 2) is internally consistent with C-07 research ("multiply with Double, do not continue multiplying"). Baloot multiplier 1 at all levels is consistent with "does not multiply" (A8). The profile defines **no Kaboot multiplier key** — recorded as gap V-04, not contradiction. Observation (not interpretation): reversed-Kaboot 88 = 2 × Sun Kaboot 44 exactly; condition unresolved.

---

## 2. Verification Findings

Each finding carries: ID · Severity · Source · Current rule · Observed problem · Numerical example · Impact · Required decision. Severities: P1 (blocks correct scoring), P2 (blocks edge-case determinism), P3 (documentation).

### V-01 — Purchaser success threshold unfrozen (P1)

* Source: `01-game-rules.md §27–29`, `06-scoring.md §38–40`; threshold values in `01-game-rules.md §55` freeze list, never frozen.
* Current rule: success evaluated from raw + bonus + projects + Baloot + contract + doubling via `evaluateContractResult` — framework only, no numeric threshold.
* Observed problem: at exact halves the outcome is indeterminate. No document states whether the buyer needs strict majority (>81 / >65) or tie-inclusive (≥81 / ≥65).
* Numerical example: EX-23 (81/81 Hokum), EX-24 (65/65 Sun) — both consistent halves of verified totals (71+81=152; 55+65=120).
* Impact: any round landing exactly on half cannot be scored deterministically.
* Required decision: Owner freezes the majority rule (strict vs inclusive) for each contract.

### V-02 — Qaid conversion rounding missing (P1)

* Source: `06-scoring.md §45–48` (integer arithmetic mandated; ÷5/÷10 "commonly used simplified" representations, exact rule open).
* Current rule: conversion must be integer-exact, but no rounding/threshold rule is frozen.
* Observed problem: fractions are unavoidable — 162 is not divisible by 10. EX-03 loser share 62 → 6.2; EX-23 tie share 81 → 8.1.
* Numerical example: any Hokum split with a side total ≢ 0 (mod 10), e.g. 100/62.
* Impact: Qaid deltas indeterminate in the general case, not just edge cases.
* Required decision: Owner freezes exact conversion + rounding per contract.

### V-03 — Failed-contract allocation values open (P1)

* Source: `06-scoring.md §40` (pattern: purchaser 0, opponent takes configured round Qaid); `01-game-rules.md §28`.
* Current rule: pattern without values — "configured" value never configured.
* Observed problem: EX-17 branches (forfeit project vs retain project) both fit the pattern; EX-02/EX-04 opponent shares shown only as A10 illustrations.
* Numerical example: EX-17 Branch A buyer 0 vs Branch B buyer 2 (Sera retained).
* Impact: every failed round's delta is indeterminate.
* Required decision: Owner freezes failure values + project treatment on failure.

### V-04 — Kaboot × doubling formula missing (P1; confirms C-03 OPEN)

* Source: conflict register C-03; profile has multiplier tables for projects and Baloot but no Kaboot key.
* Current rule: none — sources differ whether displayed Kaboot value is pre- or post-multiplication.
* Observed problem: EX-11/EX-12/EX-25 computable only at NORMAL; any doubled Kaboot is unscorable.
* Numerical example: Hokum Kaboot 25 at DOUBLE → 25 vs 50 vs other — no selection made here.
* Impact: doubled-Kaboot rounds indeterminate.
* Required decision: Owner freezes Kaboot × doubling formula.

### V-05 — Baloot ⊂ Hundred conflict quantified (P1; confirms C-02 OPEN, MATERIAL)

* Source: conflict register C-02 (Saudi wording vs Pagat on Baloot contained in Hundred).
* Current rule: none — both readings fit the Foundation.
* Observed problem: EX-10 — Interpretation A (both count) = 22 vs Interpretation B (absorbed) = 20, Δ = 2 Qaid on identical cards.
* Impact: any Hundred containing K+Q trump is unscorable at 2-Qaid granularity (often match-decisive near 152).
* Required decision: Owner selects interpretation A or B (recorded, not selected here).

### V-06 — Tie-break policies unadopted (P2)

* Source: `06-scoring.md §43` (purchaser-wins-tie suggested "if adopted"), `§44` (initial-doubler-loses), `§63` (both-cross-152 posed, no rule).
* Current rule: suggestions only; nothing adopted.
* Observed problem: EX-23/EX-24/MATCH-03/MATCH-05 branch with no canonical branch.
* Impact: ties and joint-crossings indeterminate (rare but match-decisive).
* Required decision: Owner adopts or replaces each tie policy.

### V-07 — "Counting side" term undefined (P2, documentation)

* Source: full-text search — zero Foundation definitions.
* Current rule: none.
* Observed problem: verification prompt asks "who is the counting side"; examples evaluate both totals symmetrically per A9 instead.
* Impact: terminology risk for engine/protocol specs.
* Required decision: Owner defines the term or strikes it (documentation task, not a rule).

### V-08 — Project raw-vs-Qaid table for success evaluation missing (P2)

* Source: `06-scoring.md §6`, `§31` (raw table must be frozen; must not be inferred from Qaid).
* Current rule: Qaid tables draft; raw table absent.
* Observed problem: project contribution to A9-style evaluation uncomputable; examples sidestep via decisive card margins (EX-05/06/07/18) — legitimate only because margins are decisive.
* Impact: close rounds with projects indeterminate.
* Required decision: Owner freezes the raw contribution table with RD-06.

### V-09 — Reversed-Kaboot condition unresolved (P2)

* Source: Rule Profile `reversed_kaboot: {enabled: true, value: 88, condition: UNRESOLVED_CANONICAL_DETAILS}`; `06-scoring.md` open item 10 in catalogue (OD-GR-10).
* Current rule: value without trigger condition.
* Impact: reversed-Kaboot rounds unimplementable.
* Required decision: Owner freezes trigger + handling.

### V-10 — Window/boundary items confirmed still open (P3, no new math issue)

* C-01 doubling window, C-05 Ashkal seat matrix, C-06 project coexistence, C-04 Kasho full matrix, C-07 project multiplication (research-supported, examples consistent): EX-13/14/15/16/18/21/22 execute only with window/timing assumptions flagged OPEN. No mathematical inconsistency found in any — these are decision gaps, not calculation errors.

### V-11 — Normal-success allocation is implied, never stated (P2, documentation)

* Source: `06-scoring.md §39–40` ("ordinary conversion" referenced by contrast with failure handling).
* Current rule: each-side-keeps-own-share is the natural reading but never written as a rule.
* Observed problem: every EX success allocation (A11) rests on this reading.
* Impact: engine allocation logic technically ungrounded.
* Required decision: Owner confirms the ordinary-allocation rule explicitly (one sentence).

---

## 3. Mathematical vs Documentation vs Owner-Decision Triage

* Mathematical (LOCKED, no Owner choice): Sun 120/+10/130; Hokum 152/+10/162; 20+1+11=32; Kaboot 8–0 replacement shape; Gahwa bypasses 152 (Owner-decided terminal, arithmetic consequence).
* Documentation-only: DF-01/DF-02 transcription (pending EC-01); V-07 term definition; V-11 one-sentence confirmation; V-02/V-03/V-08 value tables once Owner supplies values.
* Genuine Owner decisions: V-01, V-02 (values), V-03, V-04, V-05, V-06, V-09, plus C-01/C-05/C-06/C-04 boundaries and RD-01…RD-10 carry-overs.

---

## 4. Rule Profile Sufficiency

The profile represents chains, ownership, open/locked modes, project values + multipliers, Baloot terms, Kaboot values, Kasho baselines, Ashkal shape, and the 152 target. **Insufficient as-is for:** Kaboot multiplier key (V-04), doubling-window key (C-01, `window_boundary: UNRESOLVED` flag exists — key must still be named), declaration close-condition fields (RD-05), Baloot-trigger fields beyond the ambiguous "second card" wording, tie policies, conversion/rounding rules, success thresholds (V-01), failure values (V-03), reversed-Kaboot condition (flagged), Ashkal seat matrix (flagged). The `open:` block lists these honestly; no silent closure occurs anywhere.

---

## 5. Freeze-Gate Answer (no Freeze declared)

Rule Freeze cannot happen now: V-01/02/03 (every round's core numbers), V-04/05 (Kaboot/Baloot edge values), V-06 (ties), V-08/09, C-01/C-02/C-05/C-06/C-04 boundaries, AD-01…AD-05, and RD-01…RD-10 carry-overs (RD-01/02/04 decided in 14.x; the rest open) remain. Full blocker list in the Phase 14.y report.
