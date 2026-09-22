# صكّة بلوت — Documentation Fixes

**Document:** `docs/FOUNDATION-DOCUMENTATION-FIXES.md`
**Phase:** 13.5
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. Fixes listed but NOT applied. Do not modify Foundation documents.

---

## Scope

This document lists fixes that are editorial or documentation-only: no Rules Owner decision is required, no architecture choice is required. The intended behavior is already sufficiently established by the Foundation documents themselves.

These fixes may be applied directly by the Rules Owner or documentation maintainer once the Phase 13.5 corrections are accepted.

---

## DF-01: Sun Base Card Points — Correct "130" to "120"

**Affected document:** `06-scoring.md §8`

**Current text:**
```
130 card points before the last-trick bonus.
```

**Correct text:**
```
120 card points before the last-trick bonus.
```

**Justification:** Arithmetic from card values defined in `06-scoring.md §7`: 4 × 30 = 120. The "130" figure incorrectly includes the last-trick bonus in the subtotal.

---

## DF-02: Sun Total — Remove Double-Count Error

**Affected document:** `01-game-rules.md §6.1`

**Current text (approximate):**
```
Subtotal: 130
+ 10 for the final trick
= 140
```

**Correct text:**
```
Card points per suit: A=11, 10=10, K=4, Q=3, J=2, 9=0, 8=0, 7=0 → 30
Four suits: 4 × 30 = 120
Last-trick bonus: +10
Total Sun points: 130
```

**Justification:** 130 (subtotal) is wrong; 140 (total) is a double-count. The correct total is 120 + 10 = 130.

---

## DF-03: Kaboot — Explicitly State Server-Detected

**Affected document:** `06-scoring.md §41`

**Addition required:**
> "Kaboot is detected automatically by the scoring subsystem from the completed trick counts. No player action or client declaration is required. If one team has 8 completed tricks and the opposing team has 0, the scoring engine applies the Kaboot outcome."

**Justification:** The Foundation establishes a server-authoritative model throughout. Kaboot has no player action in `08-actions.md`. The scoring system receives `tricks` as input. Explicitly stating this prevents implementors from adding an unnecessary CLAIM_KABOOT action.

---

## DF-04: 04-bidding.md — Clarify BUY_* Are Domain Labels, Not Wire Types

**Affected document:** `04-bidding.md §8` (at or near "Recommended domain action")

**Addition required:**
> "Note: The BUY_* and PASS_FINAL identifiers in this section are domain-level conceptual labels describing bidding options. The canonical wire-format action types are defined in `08-actions.md`. See `08-actions.md §20–24` for wire representations."

**Justification:** `04-bidding.md §8` already uses the word "domain" but the relationship to `08-actions.md` is not cross-referenced. Without this note, an implementor reading `04-bidding.md` in isolation may implement BUY_* as wire action types.

---

## DF-05: Add BIDDING_FAILED → DEALING to Transition Matrix

**Affected document:** `09-state-transitions.md §64`

**Current matrix:** Does not include the BIDDING_FAILED → DEALING (redeal) path.

**Addition required:**
```
| BIDDING | all-pass second-round (BIDDING_FAILED) | DEALING (redeal per Rule Profile) |
```

**Justification:** `04-bidding.md §19` explicitly defines this path. The §64 matrix is incomplete without it.

---

## DF-06: Cross-Reference Contract Definitions

**Affected document:** `02-card-system.md §9`

**Addition required:** After the minimal Contract type definition:
> "This is the minimal representation required for card ranking. The full domain Contract type (including purchaserSeat, source, and exposed card receiver) is defined in `04-bidding.md §24`. The card-system representation intentionally omits provenance fields."

**Justification:** `02-card-system.md §9` already says "The exact Ashkal representation remains an open rule decision and MUST be finalized in the Bidding/Rules documents." Adding a cross-reference prevents implementors from treating the card-system type as the canonical domain type.

---

## DF-07: Clarify RESYNC / stateVersion Semantics

**Affected document:** `09-state-transitions.md §36`

**Current text (approximate):**
```
RESYNC_GAME should normally not increment gameplay stateVersion.
It is a read/synchronization operation.
state mutation ≠ state delivery
```

**No change needed to the content.** The document is already correct.

**What IS needed:** Add a cross-reference in `09-state-transitions.md §6` (stateVersion definition):
> "Note: RESYNC_GAME is explicitly excluded from this increment rule. See §36."

**Justification:** A reader of §6 alone might incorrectly conclude that all actions increment stateVersion. The cross-reference makes the exception immediately visible.

---

## DF-08: Add Dealing Direction Context to 03-dealing.md

**Affected document:** `03-dealing.md §5`

**Current text:** "Dealer → next seat clockwise → next → next"

**Addition required:**
> "Note: This document specifies dealing direction as clockwise. The play direction is separately specified in `05-playing.md §5` (and may differ). The Rule Profile governs both. See also `01-game-rules.md §2.2`."

**Justification:** Dealing direction and play direction are potentially independent. A reader of `03-dealing.md` alone might assume dealing and play directions are always the same.

---

## Fix Priority

| ID | Document | Section | Effort | Prerequisite |
|---|---|---|---|---|
| DF-01 | 06-scoring.md §8 | One line change | Trivial | EC-01 confirmed |
| DF-02 | 01-game-rules.md §6.1 | Rewrite 3 lines | Trivial | EC-01 confirmed |
| DF-03 | 06-scoring.md §41 | Add paragraph | Low | None |
| DF-04 | 04-bidding.md §8 | Add note | Low | None |
| DF-05 | 09-state-transitions.md §64 | Add matrix row | Low | None |
| DF-06 | 02-card-system.md §9 | Add cross-reference | Low | None |
| DF-07 | 09-state-transitions.md §6 | Add cross-reference | Trivial | None |
| DF-08 | 03-dealing.md §5 | Add note | Low | RD-02 direction confirmed (to cite correctly) |

DF-01 and DF-02 should be applied only after EC-01 (Rules Owner editorial confirmation of Sun total).
DF-08 should note that direction remains unresolved until RD-02 is answered.
