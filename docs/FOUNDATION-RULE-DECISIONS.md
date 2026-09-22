# صكّة بلوت — Rule Owner Decisions Required

**Document:** `docs/FOUNDATION-RULE-DECISIONS.md`
**Phase:** 13.5 — Corrected
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. These are decisions for the Rules Owner. Do not invent answers.

---

## Scope

This document contains ONLY items that require explicit Rules Owner input.

Items excluded from this document:
- Architecture decisions (see `FOUNDATION-ARCHITECTURE-DECISIONS.md`)
- Documentation fixes (see `FOUNDATION-DOCUMENTATION-FIXES.md`)
- Mathematical corrections (confirmed by arithmetic from existing card values)

---

## Editorial/Mathematical Confirmation Required (Not Rule Preferences)

### EC-01: Sun Base Card Total

**Status:** MATHEMATICAL CORRECTION — not an open rule preference.

**Evidence:** Card values defined in both documents give 4 × 30 = 120. The correct values are:
```
Sun base card points = 120
Last-trick bonus     = +10
Sun total            = 130
```

The Rules Owner does not need to *choose* between 120 and 130. The arithmetic is determined by the card-value table already documented. What is required is:

**Confirmation:** "The card-value table in `01-game-rules.md §6.1` and `06-scoring.md §7` is correct. The base Sun card points are 120. The total including the last-trick bonus is 130."

After this editorial confirmation, the documentation errors in §6.1 (140 double-count) and §8 (130 before bonus) can be corrected as documentation fixes.

---

## Open Rule Decisions

### RD-01: Exposed Card Fate After Bidding

**Question:** After the contract is selected, what happens to the exposed card?

**Why unresolvable without Rules Owner input:**
Multiple card-conservation models are mathematically valid:
- Model B: Exposed card given to the purchaser as one of their completion cards
- Model C: Exposed card returned to the deck before completion deal
- Model D: Exposed card given to the purchaser's partner

The Foundation does not contain evidence to determine which is the correct Baloot rule.

**What the Rules Owner must provide:**
> "After contract selection, the exposed card is [given to / returned to / goes to]...
> The purchaser receives [...] completion cards from the deck."

**Where to document:** `03-dealing.md §17–18`

---

### RD-02: Play Direction

**Question:** Is Baloot played clockwise or counter-clockwise?

**Why unresolvable without Rules Owner input:**
- `01-game-rules.md §2.2`: counter-clockwise
- `05-playing.md §5`: clockwise
- Both defer to the Rule Profile

**What the Rules Owner must provide:**
> "Play direction is [COUNTER_CLOCKWISE / CLOCKWISE]."

**Note:** Dealing direction, bidding order, play direction, and seat geometry may be independently specified. The Rules Owner must clarify whether all four use the same value or differ.

**Where to document:** Rule Profile; `05-playing.md §5`; `03-dealing.md §5`

---

### RD-03: Doubling Window

**Question:** During which phases may a player call DOUBLE, TRIPLE, QUADRUPLE, or COFFEE?

**Why unresolvable without Rules Owner input:**
`09-state-transitions.md §1650 item 7` explicitly lists this as unresolved. `06-scoring.md §37` defers Coffee's win condition to the Rule Profile.

**What the Rules Owner must provide:**
> "The doubling window opens [when / after ...]. The doubling window closes [when / after ...]. Doubling is permitted during [list of phases]."

**Where to document:** `06-scoring.md §36–37`; Rule Profile `doublingWindowPolicy`

---

### RD-04: COFFEE Terminal Behavior

**Question:** Does COFFEE permanently close the doubling window for the remainder of the round?

**Why unresolvable without Rules Owner input:**
`06-scoring.md §37` explicitly defers this to the Rule Profile.

**What the Rules Owner must provide:**
> "After COFFEE is called: [no further doubling actions are legal / further escalation is possible by ...]."

**Where to document:** `06-scoring.md §37`; Rule Profile

---

### RD-05: Project Declaration Window Close Condition

**Question:** What event closes the PROJECT_DECLARATION phase?

**Why unresolvable without Rules Owner input:**
`09-state-transitions.md §19` defers to "when the project/declaration window closes according to the Rule Profile." `09-state-transitions.md §1650 item 6` lists this as unresolved.

**What the Rules Owner must provide:**
> "The project declaration window closes when [all 4 players have submitted a declaration / a timer expires / the first card is played / ...]."
> "A player who has no project may [explicitly declare NONE / stay silent / ...]."

**Where to document:** `08-actions.md §27`; `09-state-transitions.md §19`; Rule Profile

---

### RD-06: Final Project Qaid Values

**Question:** What are the frozen Qaid values for each project type?

**Why unresolvable without Rules Owner input:**
`06-scoring.md §31–32` marks project values as Draft.

**What the Rules Owner must provide:**
A complete frozen table for:
- سرا (SERA) — Sun and Hokm
- خمسين (FIFTY) — Sun and Hokm
- مية (HUNDRED) — Sun and Hokm
- أربعمية (FOUR_HUNDRED) — Sun only (or both; confirm)

**Where to document:** `06-scoring.md §31–32`

---

### RD-07: Kaboot Qaid Values

**Question:** What are the frozen Qaid values for Kaboot?

**Why unresolvable without Rules Owner input:**
`06-scoring.md §41` states Hokm Kaboot = 25 and Sun Kaboot = 44, marked Draft.

**What the Rules Owner must provide:**
> "Hokm Kaboot Qaid = [N]. Sun Kaboot Qaid = [N]. Status: FROZEN."

**Where to document:** `06-scoring.md §41`

---

### RD-08: Baloot (K+Q Trump) Declaration Timing

**Question:** When must بلوت be declared?

**Why unresolvable without Rules Owner input:**
`06-scoring.md §19` does not specify the declaration window. `09-state-transitions.md §1650 item 6` lists this as unresolved.

**What the Rules Owner must provide:**
> "Baloot must be declared [at the start of TRICK_PLAY / when the K of trump is played / when leading with K or Q of trump / ...]."
> "If the declaration window is missed: [bonus is forfeited / no penalty / ...]."

**Where to document:** `06-scoring.md §19`; Rule Profile

---

### RD-09: Redeal Rules

**Question:** When BIDDING_FAILED occurs, what is the exact redeal procedure?

**Why unresolvable without Rules Owner input:**
`04-bidding.md §19` states redeal occurs "per Rule Profile." No further detail is given.

**What the Rules Owner must provide:**
> "On BIDDING_FAILED: the [same dealer / next dealer / ...] deals again. [Seating resets / stays the same]. [No penalty / N Qaid penalty]. Maximum consecutive redeals: [N / unlimited]."

**Where to document:** `04-bidding.md §19`; Rule Profile

---

### RD-10: Ashkal Eligibility Seats

**Question:** Which seats are eligible to call Ashkal?

**Why unresolvable without Rules Owner input:**
`04-bidding.md §12` uses `ruleProfile.canCallAshkal(seat, dealerSeat)` — correctly parameterized. But the Rule Profile's implementation of this function is unspecified.

**Note:** This depends partly on RD-02 (direction), since "left" and "right" are direction-relative.

**What the Rules Owner must provide:**
> "Ashkal may be called by: [the dealer only / the dealer and one adjacent seat / ...]."

**Where to document:** Rule Profile `canCallAshkal` specification

---

## Decision Count

| ID | Decision | Depends On | Priority |
|---|---|---|---|
| EC-01 | Sun total editorial confirmation | Nothing (arithmetic) | P1 — do first |
| RD-01 | Exposed card fate | Nothing | P1 |
| RD-02 | Play direction | Nothing | P1 |
| RD-03 | Doubling window | RD-02 (direction affects first trick) | P1 |
| RD-04 | COFFEE terminal behavior | RD-03 | P1 |
| RD-05 | Project declaration window | Nothing | P1 |
| RD-06 | Project Qaid values | Nothing | P1 |
| RD-07 | Kaboot Qaid values | Nothing | P1 |
| RD-08 | Baloot timing | Nothing | P1 |
| RD-09 | Redeal rules | RD-02 (direction affects dealer rotation) | P1 |
| RD-10 | Ashkal eligibility seats | RD-02 (direction) | P2 |

---

## Phase 14 Resolution Status

**Phase:** 14 — Canonical Rule Resolution (decision capture only)
**Date:** 2026-09-22
**Policy:** No historical evidence removed or altered above. No item is marked DECIDED unless actually decided by the Rules Owner or an adopted authoritative source. All statuses below are OPEN as of this writing.

| ID | Phase 14 Status | Rationale / Pointer |
|---|---|---|
| EC-01 | OPEN (confirmation pending) | Arithmetic established (120/+10/130); transcription via DF-01/DF-02 awaits Owner confirmation. Not a rule choice. |
| RD-01 | OPEN — BLOCKED BY OWNER | No Foundation fate statement; B/C/D unevidenced. See `FOUNDATION-RULE-OWNER-DECISIONS.md` RD-01. |
| RD-02 | OPEN — BLOCKED BY OWNER | CW/CCW contradiction; frequency is not authority. See decision sheet RD-02. |
| RD-03 | OPEN — BLOCKED BY OWNER | No window specified anywhere. See decision sheet RD-03. |
| RD-04 | OPEN — BLOCKED BY OWNER | Terminal/win condition deferred. See decision sheet RD-04. |
| RD-05 | OPEN — BLOCKED BY OWNER | Close condition unspecified. See decision sheet RD-05. |
| RD-06 | OPEN — BLOCKED BY OWNER | Draft tables must not be promoted without authorization. See decision sheet RD-06. |
| RD-07 | OPEN — BLOCKED BY OWNER | Detection settled (derived outcome); values draft. See decision sheet RD-07. |
| RD-08 | OPEN — BLOCKED BY OWNER | Timing/miss/coexistence deferred. See decision sheet RD-08. |
| RD-09 | OPEN — BLOCKED BY OWNER | Procedure deferred to profile; depends RD-02. See decision sheet RD-09. |
| RD-10 | OPEN — BLOCKED BY OWNER | Hook exists, implementation absent; depends RD-02. See decision sheet RD-10. |

**Status key used:** OPEN · DECIDED · BLOCKED BY OWNER · BLOCKED BY EXTERNAL SOURCE · DERIVED · MOVED TO ARCHITECTURE. No RD currently holds any status other than OPEN — BLOCKED BY OWNER (EC-01: OPEN confirmation).

**Companion Phase 14 documents:** `FOUNDATION-RULE-OWNER-DECISIONS.md` (decision sheets) · `FOUNDATION-CANONICAL-RULE-INVENTORY.md` (canonical vs unresolved) · `FOUNDATION-RULE-PROFILE-GAPS.md` (profile hooks, missing values, dependency graph) · `FOUNDATION-PHASE-14-REPORT.md` (71-item catalogue disposition, freeze blockers, next step).
