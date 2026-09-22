# صكّة بلوت — Architectural Gaps

**Document:** `docs/FOUNDATION-ARCHITECTURAL-GAPS.md`
**Phase:** 13.5 — Corrected
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. No decisions made.

---

## Definition

An architectural gap is an area where:
1. The architecture is correctly designed (or appears to be)
2. But the Foundation fails to communicate whether a construct is engine-internal or client-observable, or fails to cross-reference related definitions across documents

Architectural gaps are not rule decisions. They are not arithmetic errors. They do not require Rules Owner input — only engineering team clarification.

**Important:** Where the engineering team must *choose* between options, the item belongs in `FOUNDATION-ARCHITECTURE-DECISIONS.md`, not here. This document lists gaps where no design choice is needed — only a documentation clarification of what is already intended.

---

## AG-01: Kaboot Not Stated as Server-Detected

**Gap:** `06-scoring.md §41` defines Kaboot as a scoring outcome computed from trick counts. No document explicitly states that Kaboot is detected automatically without a player action.

**Evidence supporting server-detection (INFERENCE, not FACT):**
- No KABOOT action in `08-actions.md`
- No player-declaration mechanic in any document
- `09-state-transitions.md §25` lists `tricks` as input to ROUND_SCORING
- Server-authoritative model is universal throughout the Foundation

**What is missing:** A one-sentence statement in `06-scoring.md §41` or `08-actions.md` confirming that Kaboot is derived from state, not player-declared.

**Fix:** See `FOUNDATION-DOCUMENTATION-FIXES.md DF-03`

---

## AG-02: BUY_* vs CALL_* Terminology Disconnected

**Gap:** `04-bidding.md §8` uses BUY_* domain labels. `08-actions.md §1` declares itself the authoritative action model and uses CALL_*. No cross-reference connects them.

**What is missing:** A note in `04-bidding.md` explicitly mapping domain labels to wire-format types.

**Note:** `08-actions.md §1` self-declares as authoritative. This is a FACT, not an inference. The gap is that `04-bidding.md` does not cross-reference this.

**Fix:** See `FOUNDATION-DOCUMENTATION-FIXES.md DF-04`

---

## AG-03: COMPLETE_DEAL — No Internal/Observable Classification

**Gap:** The Foundation includes COMPLETE_DEAL in the transition lifecycle but does not classify it as internal or client-observable. `09-state-transitions.md §1650 item 3` explicitly lists this as unresolved.

**This is an OPEN ARCHITECTURE DECISION** — see `FOUNDATION-ARCHITECTURE-DECISIONS.md AD-03`.

This gap cannot be resolved by documentation alone; the engineering team must choose.

---

## AG-04: MATCH_END_CHECK — No Internal/Observable Classification

**Gap:** Same as AG-03. MATCH_END_CHECK appears in the transition matrix without a classification of internal vs observable. `09-state-transitions.md §1650 item 3` explicitly lists this as unresolved.

**This is an OPEN ARCHITECTURE DECISION** — see `FOUNDATION-ARCHITECTURE-DECISIONS.md AD-04`.

---

## AG-05: Doubling Window Policy Key Not Named

**Gap:** `08-actions.md §30` says "server determines whether doubling is currently legal" without naming the Rule Profile key that provides this determination. `09-state-transitions.md §18` says "initialize doubling state if applicable" without specifying which Rule Profile flag controls applicability.

**What is missing:** The Rule Profile interface should name a `doublingWindowPolicy` (or equivalent) key that specifies:
- Which phases allow doubling
- The open event
- The close event

**This is a DOCUMENTATION GAP** — the architecture is correctly delegated to the Rule Profile; the interface key is unnamed.

**Fix:** Add explicit naming of the Rule Profile key to `06-scoring.md §36` and `08-actions.md §30`.

---

## AG-06: Redeal Path Absent From Transition Matrix §64

**Gap:** `09-state-transitions.md §64` transition matrix does not include the BIDDING_FAILED → DEALING row. The path IS defined in `04-bidding.md §19`. This is a documentation completeness gap, not a missing rule.

**Fix:** See `FOUNDATION-DOCUMENTATION-FIXES.md DF-05`

---

## AG-07: Contract Type Cross-Reference Missing

**Gap:** `02-card-system.md §9` defines a minimal Contract type and explicitly defers to the Bidding document. `04-bidding.md §24` defines the full domain Contract. No cross-reference connects them.

**Fix:** See `FOUNDATION-DOCUMENTATION-FIXES.md DF-06`

---

## Gap Summary

| ID | Gap | Type | Fix Available? |
|---|---|---|---|
| AG-01 | Kaboot not stated server-detected | DOCUMENTATION GAP | YES — DF-03 |
| AG-02 | BUY_* / CALL_* disconnected | DOCUMENTATION GAP | YES — DF-04 |
| AG-03 | COMPLETE_DEAL not classified | OPEN ARCHITECTURE DECISION | NO — decision needed (AD-03) |
| AG-04 | MATCH_END_CHECK not classified | OPEN ARCHITECTURE DECISION | NO — decision needed (AD-04) |
| AG-05 | Doubling window policy key unnamed | DOCUMENTATION GAP | YES — name the key |
| AG-06 | Redeal path missing from matrix | DOCUMENTATION GAP | YES — DF-05 |
| AG-07 | Contract cross-reference missing | DOCUMENTATION GAP | YES — DF-06 |
