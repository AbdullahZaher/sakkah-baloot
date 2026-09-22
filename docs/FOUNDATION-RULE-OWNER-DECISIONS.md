# صكّة بلوت — Rules Owner Decision Sheet (Phase 14)

**Document:** `docs/FOUNDATION-RULE-OWNER-DECISIONS.md`
**Phase:** 14 — Canonical Rule Resolution (decision capture only)
**Date:** 2026-09-22
**Policy:** CAPTURE ONLY. The Agent is NOT the Rules Owner. No decision below is made here. Every sheet reads OPEN until an authorized rule source supplies an answer.

---

## Governance

* Evidence status per item — **A.** EXPLICIT FOUNDATION FACT · **B.** FOUNDATION RULE PROFILE DECISION · **C.** RULE OWNER DECISION REQUIRED · **D.** EXTERNAL AUTHORITATIVE SOURCE REQUIRED · **E.** STILL UNRESOLVED.
* Status model — OPEN → EVIDENCE REVIEW → DECISION REQUIRED → DECIDED → CANONICALIZED. Every sheet below is at **DECISION REQUIRED** (evidence reviewed in Phases 12–13.5; decision not supplied).
* "Existing Options" lists **only** options explicitly supported by Foundation evidence. Public-reference descriptions found in the documents are research inputs, not authoritative options, and are labeled as such.
* No rationale is manufactured. Rationale fields will be filled only from Rules Owner or authoritative-source statements.
* Sun arithmetic (EC-01) is not a decision: 4 × 30 = 120 base, +10 last-trick bonus, 130 total. Only editorial confirmation/transcription is pending.

---

## EC-01 — Sun Base Card Total (Editorial Confirmation)

### Question

Confirm that the card-value tables are correct as documented, so that the base Sun card points are 120, the last-trick bonus is +10, and the Sun total is 130 — allowing DF-01/DF-02 transcription.

### Foundation Evidence

* `01-game-rules.md §6.1` card table: A=11, 10=10, K=4, Q=3, J=2, 9/8/7=0 (per-suit 30; four-suit 120).
* `06-scoring.md §7` identical table; `06-scoring.md §8` (130-before-bonus wording) and `01-game-rules.md §6.1` (130 → +10 → 140) identified as arithmetic errors in Phase 13.5, verified forensically.
* Evidence status: **A** (tables) + documentation task (transcription).

### Existing Options

None — arithmetic admits no options. Confirmation text required: "The card-value table is correct. Base = 120. Bonus = +10. Total = 130."

### Dependencies

None. Blocks DF-01/DF-02 application.

### Rule Freeze Impact

YES — scoring transcription gated on confirmation.

### Decision

OPEN (confirmation pending; not a rule choice).

---

## RD-01 — Exposed Card Fate After Bidding

### Question

After the initial 5-card deal and the exposed card, and once a contract is selected: what happens to the exposed card, and how many completion cards does each seat receive from the deck?

### Foundation Evidence

* `03-dealing.md §13`: 3+2 = 5 cards per player (20 total). `§17`: 20 dealt + 1 exposed → 11 remain. `§18`: completion needs 3 × 4 = 12 from an 11-card deck; the document itself flags that the sequence must be reconciled so 32-card accounting closes (`§18`, `§20` conservation invariant).
* `04-bidding.md §13`: for Ashkal only — caller ≠ receiver; receiver is the caller's partner. No statement for the normal (non-Ashkal) case.
* `04-bidding.md §22`: "Do not confuse purchaser with player who physically receives exposed card" — distinguishes the roles without assigning the card.
* Full-text search confirms: no Foundation sentence assigns the exposed card's post-bidding destination.
* Evidence status: **C**.

### Existing Options

None authoritative. Models B (to purchaser), C (returned to deck), D (to partner) from Phase 13.5 are **mathematically possible but unevidenced** — they are not options to select from; the Owner must state the actual rule.

### Dependencies

Completion-deal card counts; Ashkal receiver interplay (`04-bidding.md §13` must remain consistent with the answer).

### Rule Freeze Impact

YES — dealing engine unfreezable without it.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-02 — Play Direction (Clockwise vs Counter-Clockwise)

### Question

What is the canonical play direction, and does the same value govern dealing direction, bidding order, trick-play order, dealer rotation, and seat-relative positions — or are they independently specified?

### Foundation Evidence

* `01-game-rules.md §2.2`: counter-clockwise («عكس عقارب الساعة»), with Rule Profile deferral; first trick leader = player to dealer's right (`§2.2`, `§15`).
* `03-dealing.md §5`: clockwise (NORTH → EAST → SOUTH → WEST).
* `05-playing.md §5`: clockwise, with Rule Profile deferral; first leader = player to dealer's right (`§6`).
* `09-state-transitions.md §31`: "Typical baseline: clockwise."
* "Player to the dealer's right" is stated consistently (`01-game-rules.md:102`, `04-bidding.md:156`, `05-playing.md:160`) but is direction-relative.
* Evidence status: **C** (contradiction; frequency — 3 CW vs 1 CCW — is not authority).

### Existing Options

None authoritative. Both values exist in the Foundation; neither document designates the other as wrong.

### Dependencies

RD-09 (redeal/dealer rotation), RD-10 (Ashkal seats), bidding start seat, first trick leader, dealer rotation, all "left/right"-relative positions, project tie-break seat priority (`06-scoring.md §56`).

### Rule Freeze Impact

YES — all turn-order computation.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-03 — Doubling Window (Open / Eligible Callers / Close)

### Question

During which phases may DOUBLE / TRIPLE / QUADRUPLE / COFFEE be called, who may initiate each level, when does the window close, does it apply to all contracts, and how does it interact with project declaration and the first trick?

### Foundation Evidence

* Actions exist: `08-actions.md §29–33`. Multiplier model exists: `06-scoring.md §36–37` (×1/×2/×3/×4; Coffee a distinct terminal state).
* `09-state-transitions.md §18`: "initialize doubling state if applicable" (no applicability flag named). `§39`: "DOUBLE before doubling window" rejection example (window referenced, never defined). Open item 7 explicitly unresolved.
* `04-bidding.md §54` item 14 lists bidding↔doubling relation as open.
* No phase, opener rule, or close event is specified anywhere.
* Evidence status: **C**.

### Existing Options

None evidenced.

### Dependencies

RD-04 (Coffee is an escalation level of this window); RD-02 (window edges may reference trick order).

### Rule Freeze Impact

YES — doubling enforcement and scoring.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-04 — Coffee Terminal Behavior

### Question

Does COFFEE permanently close the doubling window? Does it end the round, the hand, the match, or trigger another state? What is the exact Coffee win condition?

### Foundation Evidence

* `01-game-rules.md §25`: COFFEE listed as final escalation level; terminal semantics unspecified.
* `06-scoring.md §37`: Coffee is "a distinct match-result state," "must be modeled separately" from ×5; "exact win condition is a Rule Profile decision."
* `08-actions.md §33`: CoffeePayload defined; conditions deferred to Rule Profile.
* Evidence status: **C**.

### Existing Options

None evidenced.

### Dependencies

RD-03 (window to which Coffee belongs).

### Rule Freeze Impact

YES.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-05 — Project Declaration Window

### Question

What opens the declaration window, who may declare, in what order, how are simultaneous declarations handled, what closes the window, how is an explicit NONE (no project) handled, when does comparison occur, and what transitions the game into trick play?

### Foundation Evidence

* `08-actions.md §27`: DECLARE_PROJECT `{projectType, cardIds?}`; server verifies ownership/eligibility/timing (`§28`).
* `09-state-transitions.md §18–19`: window initialized at COMPLETE_DEAL → PROJECT_DECLARATION; closes "according to the Rule Profile." Open item 6 explicitly unresolved.
* `06-scoring.md §23–24`: lifecycle DETECTED → ANNOUNCED → REVEALED → COMPARED → AWARDED/DISCARDED; timing deferred to Rule Profile.
* `07-game-state.md §22`: ProjectState (candidates/announcements/resolved) without close semantics.
* Evidence status: **C**.

### Existing Options

None evidenced. No timer value, no ordering rule, no NONE-action exists in the Foundation.

### Dependencies

Trick-play entry; Baloot declaration interplay (RD-08) if Baloot shares the window.

### Rule Freeze Impact

YES — round cannot advance deterministically without the close condition.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-06 — Final Project Qaid Values

### Question

What are the frozen Qaid values for SERA (سرا), FIFTY (خمسين), HUNDRED (مية), and FOUR_HUNDRED (أربعمية) in Sun and in Hokm — including whether أربعمية exists outside Sun?

### Foundation Evidence

* `06-scoring.md §14–18`, `§32`: draft tables (SERA 2/4; FIFTY 5/10; HUNDRED 10/20; FOUR_HUNDRED 40 Sun-only), all marked Draft with public-reference citations (research inputs, not authority).
* Open items: four-Aces-in-Hokm classification, 400-in-Hokm existence, raw-vs-Qaid separation (`06-scoring.md §6`, `§31`).
* Evidence status: **C** (Owner may consult an external authority, but adoption is the Owner's act).

### Existing Options

Draft values exist but must NOT be promoted without explicit authorization. No authoritative option set exists.

### Dependencies

Purchaser-success raw contribution table (must be frozen alongside); multiplier eligibility (`06-scoring.md §59`).

### Rule Freeze Impact

YES — all project scoring.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-07 — Kaboot Qaid Values

### Question

What are the frozen Qaid values for Hokm Kaboot and Sun Kaboot (draft: 25 / 44), and how do winning-team projects, losing-team projects, and Baloot interact with a Kaboot result?

### Foundation Evidence

* `06-scoring.md §41`: "Hokm Kaboot = 25, Sun Kaboot = 44," marked Draft. `§42`: project treatment sketched (winner's eligible projects may count; loser's invalidated per profile; do not auto-add both sides).
* Detection is settled: derived outcome from 8–0 trick counts (Phase 13.5; zero claim mechanic in Foundation). No player action is to be created.
* Evidence status: **C** (values + interaction rules).

### Existing Options

None authoritative (draft numbers are not options until frozen).

### Dependencies

RD-06 (project values feed Kaboot interaction); RD-03 (doubling × Kaboot, `06-scoring.md` open item 18).

### Rule Freeze Impact

YES — Kaboot round scoring.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-08 — Baloot Declaration Timing and Missed-Declaration Behavior

### Question

When must بلوت (K+Q of trump) be declared, by whom, at what exact timing point; what happens if the window is missed (forfeit vs simply not counted, any penalty); and how does it interact with trump contracts and coexisting projects?

### Foundation Evidence

* `06-scoring.md §19`: combination defined (K+Q trump = 2 Qaid, multiplier-excluded `§35`); timing unspecified. `§20`: declaration timing, trigger sequence, miss behavior, visibility, coexistence all deferred; public-reference description (second K/Q played) is research input, not authority.
* `01-game-rules.md §24`, `§51`; `02-card-system.md §38` similarly defer.
* Evidence status: **C**.

### Existing Options

None authoritative.

### Dependencies

RD-05 if Baloot shares the declaration window; trump-contract context.

### Rule Freeze Impact

YES — Baloot scoring path.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-09 — Redeal Procedure on BIDDING_FAILED

### Question

When all players pass in the second round (BIDDING_FAILED): does the same dealer or the next dealer deal; does seating reset; is there a Qaid penalty; what is the consecutive-redeal cap; how do bidding and dealing restart; and are there scoring implications?

### Foundation Evidence

* `04-bidding.md §19`: BIDDING_FAILED → "next action determined by the redeal Rule Profile." `§20`: same-vs-rotate dealer, seating, penalty, caps all listed open. `§54` item 11 open.
* `09-state-transitions.md §64`: matrix row missing (documentation gap DF-05 — the row reflects the already-defined path; procedure content stays here).
* Evidence status: **C**.

### Existing Options

None evidenced.

### Dependencies

RD-02 (rotation direction); AD-02-adjacent matrix transcription (DF-05) is documentation-only and independent of procedure content.

### Rule Freeze Impact

YES — round lifecycle completeness.

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## RD-10 — Ashkal Eligibility Seats

### Question

Which seats may call Ashkal, defined how relative to the dealer, and is eligibility affected by the exposed card or contract state?

### Foundation Evidence

* `04-bidding.md §12`: eligibility via `rules.canCallAshkal(seat, dealerSeat)` — correctly parameterized; implementation absent. Public-reference seat descriptions (dealer + adjacent seat) are research inputs, not authority.
* `04-bidding.md §11–13`: Ashkal shape (Sun-style; caller ≠ receiver; receiver = caller's partner) documented as convention shape.
* `02-card-system.md §9` defers Ashkal representation to Bidding/Rules documents.
* Evidence status: **C**.

### Existing Options

None authoritative ("left/right"-relative descriptions cannot be applied until RD-02 fixes direction semantics).

### Dependencies

RD-02 (direction gives "left/right" meaning); RD-01 (exposed-card handling must stay consistent with Ashkal receiver rule).

### Rule Freeze Impact

YES (P2 priority — bidding engine completeness).

### Decision

OPEN.

**RULE OWNER DECISION:**
[OPEN]

---

## Decision Status Summary

| ID | Title | Status | Evidence Status |
|---|---|---|---|
| EC-01 | Sun total editorial confirmation | OPEN (confirmation) | A + doc task |
| RD-01 | Exposed card fate | OPEN | C |
| RD-02 | Play direction | OPEN | C |
| RD-03 | Doubling window | OPEN | C |
| RD-04 | Coffee terminal behavior | OPEN | C |
| RD-05 | Project declaration window | OPEN | C |
| RD-06 | Project Qaid values | OPEN | C |
| RD-07 | Kaboot Qaid values | OPEN | C |
| RD-08 | Baloot timing | OPEN | C |
| RD-09 | Redeal procedure | OPEN | C |
| RD-10 | Ashkal eligibility | OPEN | C |

No sheet above contains a decision, a recommendation, or a manufactured rationale. The first answer entered in any "RULE OWNER DECISION" box must come from the Rules Owner or an adopted authoritative source, with provenance recorded.
