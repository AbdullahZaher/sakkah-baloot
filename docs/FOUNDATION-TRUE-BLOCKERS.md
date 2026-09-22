# صكّة بلوت — True Blockers

**Document:** `docs/FOUNDATION-TRUE-BLOCKERS.md`
**Phase:** 13.5 — Corrected
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. No fixes. No rule invention.

---

## P0 Blockers

**None.**

After Phase 12 and Phase 13 review, no genuine P0 architectural blockers exist.
All five Phase 12 P0 findings have been reclassified at lower severity.

---

## True P1 Blockers (4)

These four findings must be resolved before Rule Freeze or protocol finalization.
None prevent engine architecture work from beginning.

---

### TB-P1-001: Sun Base Total Is Documented Incorrectly

**Classification:** MATHEMATICAL CORRECTION

**Documents affected:** `01-game-rules.md §6.1`, `06-scoring.md §8`

**Evidence (FACT):**

Card values defined identically in both documents:
```
A=11, 10=10, K=4, Q=3, J=2, 9=0, 8=0, 7=0
Per suit: 30. Four suits: 120.
```

**Errors found:**

| Document | Statement | Status |
|---|---|---|
| `06-scoring.md §8` | "130 card points before the last-trick bonus" | WRONG — should be 120 |
| `01-game-rules.md §6.1` | "Subtotal: 130 → +10 → 140" | DOUBLE-COUNT — should be 120 → +10 → 130 |

**Correct canonical values:**
```
Sun base card points: 120
Last-trick bonus:     +10
Sun total:            130
```

**This is NOT an open rule preference.** The card-value table arithmetically determines the base total. No Rules Owner decision is required — only editorial correction of both documents.

**Blocks Rule Freeze?** YES — wrong base total produces wrong purchaser comparisons for every Sun round.
**Blocks architecture?** No.

---

### TB-P1-002: Exposed Card Fate After Bidding Is Unspecified

**Classification:** OPEN RULE DECISION

**Document affected:** `03-dealing.md §17–18`

**Evidence (FACT):**

```
Initial deal: 5 × 4 = 20 cards
Exposed card: 1 card (set aside during bidding)
Deck remainder: 11 cards
Completion needed per document: 3 × 4 = 12 cards
```

If treated as independent quantities: 20 + 1 + 12 = 33 ≠ 32.

**Mathematically possible models (not confirmed rules):**

| Model | Description | Conservation |
|---|---|---|
| B | Exposed → purchaser | 20 + 1 exposed + 11 from deck = 32 ✓ |
| C | Exposed → returned to deck | 20 + 0 + 12 from deck = 32 ✓ |
| D | Exposed → purchaser's partner | 20 + 1 exposed + 11 from deck = 32 ✓ |

The Foundation contains no evidence specifying which model is the correct Baloot rule.

**Required resolution:** The Rules Owner must specify which model applies. This is a rule decision, not an architectural choice between equivalent options.

**Blocks Rule Freeze?** YES — dealing engine cannot be finalized.
**Blocks architecture?** No — dealing function structure is the same for all models.

---

### TB-P1-003: GamePhase Canonical Names Not Designated

**Classification:** OPEN ARCHITECTURE DECISION

**Documents affected:** `07-game-state.md §8`, `09-state-transitions.md §9`

**Evidence (FACT):**

Confirmed name conflicts between the two documents:

| Semantic phase | `07-game-state.md` | `09-state-transitions.md` |
|---|---|---|
| Trick play | PLAYING | TRICK_PLAY |
| Round scoring | SCORING | ROUND_SCORING |
| Match end state | MATCH_COMPLETE | GAME_RESULT |

Neither document designates the other as canonical for phase name strings.

`07-game-state.md §8` says "The exact transition graph belongs in 09-state-transitions.md" — this defers the *graph*, not the *phase name strings*.

`09-state-transitions.md §1650 item 3` explicitly lists "Whether system transitions are represented as actions or internal transitions" as unresolved before freeze.

**Required resolution:** The engineering team must:
1. Designate one canonical source for GamePhase enum strings
2. Decide whether COMPLETE_DEAL and MATCH_END_CHECK are client-observable phases or internal engine states
3. Define which phases appear in the wire protocol and which are engine-internal

**Blocks Rule Freeze?** YES — phase name strings are embedded in events, replay files, and wire protocol.
**Blocks architecture?** YES — event schema cannot be finalized until phase names are canonical.

---

### TB-P1-004: Play Direction Contradicted Between Two Documents

**Classification:** OPEN RULE DECISION + CONFIRMED CONTRADICTION

**Documents affected:** `01-game-rules.md §2.2`, `05-playing.md §5`

**Evidence (FACT):**

`01-game-rules.md §2.2`:
> "اتجاه اللعب: **عكس عقارب الساعة**" (counter-clockwise per Rule Profile)

`05-playing.md §5`:
> "The playing order is **clockwise** according to the selected Rule Profile."

These are opposite values for the same concern (play turn order).

Both documents correctly defer to the Rule Profile for the final value. The contradiction is in the default/example values embedded in the documents.

**What is NOT concluded:**
- That counter-clockwise is correct
- That clockwise is an editorial error
- That dealing direction and play direction must match

**Required resolution:** The Rule Profile must explicitly state `direction: COUNTER_CLOCKWISE | CLOCKWISE`. The Rules Owner must provide this value. One of the two documents must then be corrected to remove the conflicting default.

**Blocks Rule Freeze?** YES — all turn-order computation depends on direction.
**Blocks architecture?** No — engine correctly parameterizes direction via `getNextSeat(seat, ruleProfile.direction)`.

---

## Non-Blockers Reclassified From Phase 12 P0/P1

| P12 ID | P12 Severity | P13.5 Severity | Reclassification |
|---|---|---|---|
| F-P0-003 (Kaboot action) | P0 | RESOLVED (DERIVED OUTCOME) | Kaboot is server-detected from trick counts; no action needed |
| F-P0-004 (BUY vs CALL) | P0 | P3 — DOCUMENTATION GAP | 08-actions.md self-declared authoritative for wire types; 04-bidding uses domain labels |
| F-P0-005 (PASS_FINAL) | P0 | P2 — OPEN ARCHITECTURE DECISION | Both PASS and PASS+PASS_FINAL are viable; not yet decided |
| F-P1-003 (Bidding start) | P1 | P2 — DEPENDENT | Resolves automatically when direction is frozen |
| F-P1-004 (Contract type) | P1 | P3 — LAYERED MODEL | 02-card-system explicitly defers to 04-bidding; not contradictory |
| F-P1-005 (Project declaration) | P1 | P2 — RULE PROFILE DECISION | Phase structure defined; window policy deferred to rule profile |
| F-P1-006 (Doubling window) | P1 | P2 — RULE PROFILE DECISION | Architecture sketched; timing is rule profile decision |
| F-P1-007 (Ashkal eligibility) | P1 | P3 — RULE DECISION (arch ok) | ruleProfile.canCallAshkal() already in doc; architecture sound |
| F-P1-008 (Redeal trigger) | P1 | P3 — DOCUMENTATION GAP | Path defined in 04-bidding §19; §64 matrix row is missing |
| F-P2-009 (stateVersion) | P2 | RETRACTED | §36 explicitly resolves; false finding |
