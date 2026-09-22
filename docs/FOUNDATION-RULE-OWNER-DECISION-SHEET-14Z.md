# Phase 14.z — Rules Owner Decision Sheet

**Document:** `docs/FOUNDATION-RULE-OWNER-DECISION-SHEET-14Z.md`
**Phase:** 14.z — Rules Owner Decision Capture
**Date:** 2026-09-22
**Status:** AWAITING RULES OWNER DECISIONS — nothing here is decided, recommended, or frozen.

## How to answer

For each decision, reply with the exact answer format shown (e.g. `V-01 = A`). A compact machine-readable template is provided at the end. No option is marked "recommended": options are listed neutrally. Items labeled EXTERNAL EVIDENCE are research inputs and are NOT CANONICAL unless you explicitly adopt them.

---

## A. Locked decisions (do not re-answer)

* **RD-01:** Buyer receives exposed card + 2 hidden; each other player +3 hidden; final hands 8; 20+1+11 = 32.
* **RD-02:** Global counter-clockwise N → W → S → E for dealing, bidding, play, dealer rotation, seat terminology.
* **RD-04:** Gahwa = immediate MATCH_WIN; 152 race bypassed.
* **Mathematics (closed):** Sun 120 + 10 = 130. Hokum 152 + 10 = 162. Deal conservation 20+1+11 = 32. 152-Qaid target canonical.

---

## B. V-01 — Contract success threshold

**Question:** What exact totals make the buyer succeed, and what happens on an exact tie?
**Why it matters:** Every round's SUCCESS/FAILURE verdict depends on it; EX-23 (81–81 Hokum) and EX-24 (65–65 Sun) are currently unscorable.
**Foundation evidence:** `01-game-rules.md §27–29`, `06-scoring.md §38–40` define the evaluation framework with no numeric threshold. No option below is stated anywhere in the Foundation.
**Numerical example:** Sun buyer 65 vs 65 → A fails / succeeds / special-handling depending on choice. Hokum buyer 81 vs 81 → same.
**Affected documents:** `01-game-rules.md §27–29`, `06-scoring.md §38–40`, Rule Profile (threshold fields).
**Affected engine behavior:** `evaluateContractResult`, round allocation path.
**Dependencies:** None (root). Gates V-06a boundary interpretation.

* Option A — Strict majority: Sun buyer needs >65; Hokum buyer needs >81; exact tie = buyer fails.
* Option B — Tie-inclusive: Sun buyer succeeds at ≥65; Hokum buyer succeeds at ≥81.
* Option C — Different rule (specify exact totals and tie handling).

**Answer format:** `V-01 = A / B / C` (if C, write the exact rule).

---

## C. V-02 — Qaid conversion / rounding

**Question:** What is the exact canonical integer conversion from raw points to Qaid?
**Why it matters:** Hokum raw totals routinely produce fractions (62 → 6.2; 81 → 8.1); without a rounding rule most Hokum rounds are unscorable.
**Foundation evidence:** `06-scoring.md §45–48` mandates integer arithmetic; ÷5 (Sun) / ÷10 (Hokum) are documented only as commonly used simplified representations, never frozen. No option below is stated in the Foundation.
**Numerical example:** EX-03 loser share 62 Hokum raw → 6.2 → must resolve to an integer.
**Affected documents:** `06-scoring.md §45–48`, Rule Profile (conversion rules).
**Affected engine behavior:** `convertRawToQaid`, all Qaid deltas.
**Dependencies:** None (root; interacts with every scoring example).

* Option A — Mathematical rounding (specify .5 behavior if chosen).
* Option B — Floor.
* Option C — Ceiling.
* Option D — Contract-specific conversion table (supply table).
* Option E — Explicit integer lookup table (supply table).
* Option F — Other (supply exact formula).

**Answer format:** `V-02 = A / B / C / D / E / F` (if D/E/F, attach the exact table/formula).

---

## D. V-03a — Opponent award on buyer failure

**Question:** When the buyer fails (buyer takes 0), what exactly does the opponent receive?
**Why it matters:** Every failed round's match delta depends on it (EX-02, EX-04).
**Foundation evidence:** `06-scoring.md §40` / `01-game-rules.md §28` give the pattern (buyer 0, opponent takes configured round value) with the value never configured.
**Numerical example:** EX-04: buyer 55 fails; opponent holds 107 raw — award = full-round value vs own-share conversion vs fixed value.
**Affected documents:** `06-scoring.md §40`, `01-game-rules.md §28`, Rule Profile.
**Affected engine behavior:** failure allocation path.
**Dependencies:** V-02 (if the award uses conversion).

* Option A — Full contract round value.
* Option B — Opponent's own converted card share.
* Option C — Fixed contract-specific value (supply values).
* Option D — Other (specify).

**Answer format:** `V-03a = A / B / C / D` (if C/D, supply values/rule).

## E. V-03b — Buyer projects on failure

**Question:** If the buyer fails but held a valid project, what happens to it?
**Why it matters:** EX-17 branches (buyer 0 vs buyer 2) both fit the current pattern.
**Foundation evidence:** Same as V-03a; project-on-failure treatment never specified.
**Numerical example:** EX-17: buyer 55 + valid Sera → 0 (forfeited) vs 2 (retained).
**Affected documents:** `06-scoring.md §40–42`, Rule Profile.
**Affected engine behavior:** failure allocation + project resolution.
**Dependencies:** V-03a, RD-06 values.

* Option A — Project forfeited.
* Option B — Project remains awarded.
* Option C — Depends on project type (supply per-type rule).
* Option D — Other (specify).

**Answer format:** `V-03b = A / B / C / D` (if C/D, supply rule).

---

## F. V-04 — Kaboot × doubling (+ Gahwa interaction)

**Question:** How does the Kaboot value (Hokum 25 / Sun 44, provisional) interact with doubling levels, and does Gahwa interact with Kaboot?
**Why it matters:** Any doubled Kaboot round is currently unscorable (C-03); profile has project and Baloot multiplier tables but no Kaboot key.
**Foundation evidence:** `06-scoring.md §41–42`, Rule Profile multiplier tables (projects ×2-cap, Baloot ×1), conflict register C-03 (sources differ). No option below is canonical.
**Numerical example:** Hokum Kaboot 25 at DOUBLE → 25 vs 50 vs table value.
**Affected documents:** `06-scoring.md §41–42`, `§59`, Rule Profile (new Kaboot-multiplier key).
**Affected engine behavior:** Kaboot resolution under doubling.
**Dependencies:** RD-03 (window), RD-07 values.

* Option A — Kaboot never multiplies.
* Option B — Kaboot ×2 at Double (higher levels specify or inherit — state which).
* Option C — Kaboot ×3 at Triple (state Double/Four behavior).
* Option D — Kaboot ×4 at Four (state Double/Triple behavior).
* Option E — Special contract-specific table (supply exact values).
* Option F — Other (specify).
* Gahwa interaction (answer alongside): G1 = none; G2 = Gahwa overrides any Kaboot computation; G3 = other (specify).

**Answer format:** `V-04 = A / B / C / D / E / F` (+ `Gahwa–Kaboot = G1 / G2 / G3`).

---

## G. V-05 — Baloot inside Hundred

**Question:** When a Hundred contains the Baloot K+Q, do both score?
**Why it matters:** 2-Qaid swing on identical cards (EX-10: 22 vs 20), often match-decisive near 152. Conflict C-02 is MATERIAL.
**Foundation evidence:** Both readings fit the Foundation; Saudi wording vs Pagat differ — EXTERNAL EVIDENCE — NOT CANONICAL either way.
**Numerical example:** EX-10: A = Hundred + Baloot both count (22); B = Baloot absorbed (20).
**Affected documents:** `06-scoring.md §19–20`, `§32`, Rule Profile.
**Affected engine behavior:** project resolution overlap logic.
**Dependencies:** RD-06 values, RD-08 timing.

* Option A — Both count (Hundred + Baloot).
* Option B — Baloot absorbed into Hundred, not scored separately.

**Answer format:** `V-05 = A / B` (a third interpretation only if you explicitly define it).

---

## H. V-06a — Contract tie (65–65 Sun / 81–81 Hokum)

**Question:** Who wins an exact raw tie?
**Why it matters:** EX-23/EX-24/MATCH-05 branch with no canonical branch.
**Foundation evidence:** `06-scoring.md §43` suggests purchaser-wins-tie only as an unadopted example config. Interacts with V-01 boundary.
**Numerical example:** EX-24: A65–B65 → buyer-win gives A13–B13; buyer-loss gives A0.
**Affected documents:** `06-scoring.md §43`, Rule Profile (`tiePolicy` — unadopted).
**Affected engine behavior:** tie path in contract evaluation.
**Dependencies:** V-01, V-02.

* Option A — Buyer wins tie. * Option B — Buyer loses tie. * Option C — Special rule (specify). * Option D — Other (specify).

**Answer format:** `V-06a = A / B / C / D`.

## I. V-06b — Doubled contract tie

**Question:** Who wins an exact tie on a doubled contract?
**Why it matters:** Suggested "initial doubler loses" rule (`06-scoring.md §44`) is unadopted research input, not canonical.
**Foundation evidence:** `06-scoring.md §44` + `initialDoublerTeamId` field shape; nothing adopted.
**Affected documents / engine:** same as V-06a + doubling history.
**Dependencies:** V-06a, RD-03.

* Option A — Original buyer wins. * Option B — Initial doubler wins. * Option C — Initial doubler loses. * Option D — Special rule (specify). * Option E — Other (specify).

**Answer format:** `V-06b = A / B / C / D / E`.

## J. V-06c — Both teams cross 152 in the same round

**Question:** How is the match winner determined when both cross 152 in one round (e.g. A159–B154)?
**Why it matters:** MATCH-03 is unscorable; `06-scoring.md §63` poses the case with no rule.
**Foundation evidence:** `06-scoring.md §61–63`; 152 target itself canonical.
**Affected documents:** `06-scoring.md §61–63`, match-end logic.
**Affected engine behavior:** `evaluateMatchEnd` joint-crossing path.
**Dependencies:** V-02 (crossing totals must first be computable).

* Option A — Higher final match total wins. * Option B — Buyer-priority rule (specify). * Option C — Extra round is played (specify conditions). * Option D — Other (specify).

**Answer format:** `V-06c = A / B / C / D`.

---

## K. V-07 — Counting-side terminology

**Question:** Define, or remove, the term "counting side" (verification V-07: zero Foundation definitions).
**Why it matters:** Terminology risk for engine/protocol specs; primarily documentation/architecture, not scoring math.
**Foundation evidence:** None — term absent from all Foundation documents.
**Affected documents:** glossary, engine specs, protocol specs.
**Affected engine behavior:** naming only.
**Dependencies:** None.

* Option A — Counting side = team currently responsible for contract success/failure.
* Option B — Counting side = team receiving the round allocation.
* Option C — Remove the term; use buyer team / opponent team / doubler / round recipient.
* Option D — Other (specify).

**Answer format:** `V-07 = A / B / C / D`.

---

## L. V-08 — Project raw contribution table

**Question:** Fill the success-evaluation raw contribution of each project (do NOT infer from Qaid — `06-scoring.md §31` forbids it).
**Why it matters:** Close rounds with projects are indeterminate without it (V-08); provisional Qaid baselines: Hokum Sera 2 / Fifty 5 / Hundred 10 / Baloot 2; Sun Sera 4 / Fifty 10 / Hundred 20 / Four Hundred 40.
**Foundation evidence:** `06-scoring.md §6`, `§31` (raw table must be frozen; absent).
**Affected documents:** `06-scoring.md §31`, `§38–39`, Rule Profile.
**Affected engine behavior:** purchaser-evaluation inputs.
**Dependencies:** RD-06 (Qaid freeze should land together).

**Answer format:** fill every cell —
`V-08: SUN_SERA = ? / SUN_FIFTY = ? / SUN_HUNDRED = ? / SUN_FOUR_HUNDRED = ? / HOKUM_SERA = ? / HOKUM_FIFTY = ? / HOKUM_HUNDRED = ? / HOKUM_BALOOT = ?`

---

## M. V-09a — Reversed Kaboot trigger

**Question:** What exactly triggers reversed Kaboot (profile value 88, condition UNRESOLVED)?
**Why it matters:** Value without trigger is unimplementable (V-09).
**Foundation evidence:** Rule Profile `reversed_kaboot` block; catalogue OD-GR-10. No option below is canonical.
**Affected documents:** Rule Profile, `06-scoring.md §41–42`.
**Affected engine behavior:** Kaboot variant detection.
**Dependencies:** RD-07.

* Option A — Opponent wins all 8 tricks. * Option B — Contract buyer loses all 8 tricks. * Option C — Special Hokum condition (specify). * Option D — Special Sun condition (specify). * Option E — Other (specify) — including "feature does not exist" if that is the decision.

**Answer format:** `V-09a = A / B / C / D / E` (if C/D/E, specify exact trigger).

## N. V-09b — Reversed Kaboot value

**Question:** Confirm 88 Qaid.
**Answer format:** `V-09b = YES / NO` (if NO, supply value).

## O. V-09c — Reversed Kaboot × doubling

* Option A — Never doubles. * Option B — Doubles (specify formula). * Option C — Special table (supply).
**Answer format:** `V-09c = A / B / C`.

---

## P. RD-03 — Doubling window

**Question:** For each level (Double / Triple / Four / Gahwa, Hokum; Double, Sun), state the exact opening boundary, closing boundary, whether the current trick/card counts as inside, and whether a call is valid before/after card placement.
**Why it matters:** Doubling calls are unenforceable without a window (C-01); EX-13/14/15/16 all flag timing OPEN.
**Foundation evidence:** Actions exist (`08-actions.md §29–33`); `09-state-transitions.md §18` ("if applicable"), `§39` (pre-window rejection example), open item 7. Sun Double window equally unspecified (completeness item — same questions apply to the Sun chain).
**Affected documents:** `08-actions.md §29–33`, `06-scoring.md §36–37`, `09-state-transitions.md`, Rule Profile (`doublingWindowPolicy` key must be named).
**Affected engine behavior:** doubling legality checks, window state machine.
**Dependencies:** RD-02 (order-relative edges).

* Per level options: A — from contract selection until first card is played; B — from contract selection until first trick ends; C — from start of play until a defined point (define it); D — entire play phase; E — other (define exact boundaries).

**Answer format:** `RD-03 =` per-level letters + exact boundary definitions, e.g. `HOKUM_DOUBLE = A …; HOKUM_TRIPLE = …; HOKUM_FOUR = …; GAHWA = …; SUN_DOUBLE = …` plus: current-trick-inside? (YES/NO), call-before-placement valid? (YES/NO), call-after-placement valid? (YES/NO).

---

## Q. RD-05 — Project declaration window

**Question:** Fix announcement opening/closing, reveal timing, comparison timing, pre/during/after-first-trick permissions, simultaneous and multiple-project handling, one-card-one-project rule, and overlap rules.
**Why it matters:** The round cannot advance deterministically without the close condition (C-06 partially); research baseline (announce ≈ trick 1, reveal/compare ≈ trick 2) is provisional only.
**Foundation evidence:** `08-actions.md §27–28`, `09-state-transitions.md §18–19` + open item 6, `06-scoring.md §23–24`, `07-game-state.md §22`.
**Affected documents / engine:** declaration state machine, trick-play entry gate.
**Dependencies:** RD-08 interplay if Baloot shares the window.

* Announcement opening: A — before first trick; B — during first trick up to a defined point (define); C — other.
* Announcement closing: A — end of first trick; B — start of second trick; C — other (define exact event).
* Reveal/comparison: A — second trick (define point); B — other (define).
* Simultaneous declarations: A — allowed, resolved by comparison; B — ordered by seat (define order); C — other.
* Multiple projects per team: A — allowed (define stacking); B — highest only; C — other.
* One-card-one-project: A — enforced; B — exceptions exist (list them); C — other.
* Overlap (shared cards across projects): A — forbidden; B — allowed with rule (specify).

**Answer format:** `RD-05 =` one letter per bullet + definitions where required.

---

## R. RD-06 — Project values

**Question:** Accept or modify the provisional table (Hokum Sera 2 / Fifty 5 / Hundred 10 / Baloot 2; Sun Sera 4 / Fifty 10 / Hundred 20 / Four Hundred 40). Confirm whether Four Hundred is Sun-only.
**Why it matters:** All project scoring; drafts must not be promoted silently.
**Foundation evidence:** `06-scoring.md §14–18`, `§32` (all Draft).
**Affected documents / engine:** project scoring tables.
**Dependencies:** V-08 (raw table should land together).

**Answer format:** `RD-06 = ACCEPT / MODIFY` (if MODIFY, supply exact table) + `FOUR_HUNDRED_SUN_ONLY = YES / NO`.

---

## S. RD-07 — Kaboot values and interactions

**Question:** Accept/modify Hokum 25 / Sun 44, then resolve: interaction with projects, interaction with Baloot, interaction with doubling (→V-04), whether Kaboot replaces card Qaid or adds to it, whether winner takes all round value, whether loser receives 0, any special variants.
**Why it matters:** Kaboot rounds fully specified only with these answers.
**Foundation evidence:** `06-scoring.md §41–42` (draft values; winner/loser project sketch).
**Affected documents / engine:** Kaboot resolution.
**Dependencies:** RD-06, V-04.

**Answer format:** `RD-07a = ACCEPT / MODIFY` (values) + per-item answers: `projects = ? / baloot = ? / replaces-or-adds = REPLACE / ADD / ___ / winner-takes-all = YES / NO / loser-zero = YES / NO / variants = ?`.

---

## T. RD-08 — Baloot confirmation and residual rules

**Question:** Confirm baseline (K+Q trump, same player, value 2, declared during second card before it lands, no multiplication), then resolve: verbal-declaration mandatory? auto-detection allowed? Hundred interaction (→V-05)? other-project interaction? late-declaration consequence? either team eligible? independence from project comparison?
**Why it matters:** Baloot scoring path completeness.
**Foundation evidence:** `06-scoring.md §19–20`, `01-game-rules.md §24`, `02-card-system.md §38`; timing details deferred everywhere.
**Affected documents / engine:** Baloot detection/declaration path.
**Dependencies:** V-05.

**Answer format:** `RD-08 = CONFIRM-BASELINE YES / NO (+ corrections)` + `verbal-mandatory = YES / NO / ___ / auto-detect = YES / NO / ___ / late = ? / either-team = YES / NO / independent-of-comparison = YES / NO / ___`.

---

## U. RD-09 — Kasho / Bushat / redeal matrix

**Question:** Decide all 14 items. Nothing here is canonical beyond the second-round all-pass cancel path (`04-bidding.md §19`; profile `cancel_hand/score 0/rotate_dealer` research baseline, PROVISIONAL).
**Why it matters:** Full violation matrix open (C-04); illegal-deal handling otherwise unimplementable.
**Foundation evidence:** `04-bidding.md §19–20`, Rule Profile `kasho` block (DRAFT), `01-game-rules.md §51`.
**Affected documents / engine:** deal-validation, redeal path, penalty logic.
**Dependencies:** RD-02 (rotation frame).

Answer each (A = as-stated confirmation, B/C = modification/alternative, or write the rule):

1. Bushat trigger (first five all from 7/8/9): CONFIRM / MODIFY → ?
2. 9-trump treatment (does not invalidate): CONFIRM / MODIFY → ?
3. Second-round all-pass (cancel, score 0, rotate dealer): CONFIRM / MODIFY → ?
4. Illegal deal definition: ?
5. Wrong number of cards: ?
6. Exposed-card violation: ?
7. Buying before complete deal: ?
8. Buying out of turn: ?
9. Late Double: ?
10. Illegal Ashkal: ?
11. Choice owner (continue vs Kasho/redeal): ?
12. Penalty existence/amount: ?
13. Dealer rotation after Kasho: ?
14. Score impact: ?

**Answer format:** `RD-09 =` numbered answers 1–14.

---

## V. RD-10 — Ashkal seat matrix (N→W→S→E)

**Question:** Fix exact eligibility under the locked CCW order: first-round eligible seats; second-round eligible seats; Wala/history restrictions; caller, buyer, and exposed-recipient identities (baseline: caller = buyer, partner receives exposed, contract = Sun — confirm or modify); illegal-Ashkal penalty; continue vs Kasho on violation.
**Why it matters:** Seat matrix open (C-05); "left/right" now has CCW meaning but seat mapping still unchosen.
**Foundation evidence:** `04-bidding.md §11–13` (shape + `canCallAshkal` hook), Rule Profile `ashkal` block (DRAFT; `prior_wala_effect: true` research input — NOT CANONICAL unless adopted).
**Affected documents / engine:** bidding eligibility, Ashkal path.
**Dependencies:** RD-02 (locked — apply it, do not revisit).

**Answer format:** `RD-10 =` explicit matrix, e.g. `FIRST_ROUND = {seats…} / SECOND_ROUND = {seats…} / WALA_RESTRICTION = … / CALLER = … / BUYER = … / RECIPIENT = … / CONTRACT = … / ILLEGAL_PENALTY = … / VIOLATION_PATH = CONTINUE / KASHO / …`.

---

## W. C-01 / C-05 / C-06 closure

**Question:** After answering the RDs above, may these conflicts be marked resolved?
**Why it matters:** Conflicts close only via the evidence chain (Source → Conflict → Owner Decision → Canonical Rule → Profile → Tests), never merely because an RD exists.
**Answer format:** `C-01 = CLOSE (cite RD-03 answer) / KEEP-OPEN (state what is missing)`; same pattern for `C-05` (cite RD-10) and `C-06` (cite RD-05 answers).

---

## X. V-11 + documentation confirmations

**V-11 — normal successful round allocation:** "Each team keeps its own converted score share, with project/bonus treatment applied according to the canonical scoring model."
**Answer format:** `V-11 = CONFIRM / MODIFY` (if MODIFY, write the exact rule).
**V-07** answered in section K above.

---

## Y. Architecture decisions still open (separate track — do not answer here)

AD-01 (PASS vs PASS_FINAL wire form) · AD-02 (canonical GamePhase naming) · AD-03 (COMPLETE_DEAL visibility) · AD-04 (MATCH_END_CHECK visibility) · AD-05 (contract transport representation). These require a separate architecture decision pass and are listed here only so rule answers are not mistaken for architecture closure.

---

## Z. Final response template

```text
V-01 =


V-02 =


V-03a =
V-03b =


V-04 =
Gahwa-Kaboot =


V-05 =


V-06a =
V-06b =
V-06c =


V-07 =


V-08:
SUN_SERA =
SUN_FIFTY =
SUN_HUNDRED =
SUN_FOUR_HUNDRED =
HOKUM_SERA =
HOKUM_FIFTY =
HOKUM_HUNDRED =
HOKUM_BALOOT =


V-09a =
V-09b =
V-09c =


RD-03 =
(HOKUM_DOUBLE = / HOKUM_TRIPLE = / HOKUM_FOUR = / GAHWA = / SUN_DOUBLE = /
 current-trick-inside = / call-before-placement = / call-after-placement =)


RD-05 =
(announcement-opening = / announcement-closing = / reveal-compare = /
 simultaneous = / multiple-projects = / one-card-one-project = / overlap =)


RD-06 =
FOUR_HUNDRED_SUN_ONLY =


RD-07a =
(RD-07 details: projects = / baloot = / replaces-or-adds = /
 winner-takes-all = / loser-zero = / variants =)


RD-08 =
(RD-08 details: verbal-mandatory = / auto-detect = / late = /
 either-team = / independent-of-comparison =)


RD-09 =
(1 = / 2 = / 3 = / 4 = / 5 = / 6 = / 7 = /
 8 = / 9 = / 10 = / 11 = / 12 = / 13 = / 14 =)


RD-10 =
(FIRST_ROUND = / SECOND_ROUND = / WALA_RESTRICTION = /
 CALLER = / BUYER = / RECIPIENT = / CONTRACT = /
 ILLEGAL_PENALTY = / VIOLATION_PATH =)


V-11 =


C-01 =
C-05 =
C-06 =


AD-01 =
AD-02 =
AD-03 =
AD-04 =
AD-05 =

For decisions requiring detailed tables, use:


[DECISION ID]
Decision:
Answer:
Notes:
```

**Final status: PHASE 14.Z — AWAITING RULES OWNER DECISIONS.** No implementation, no engine changes, no protocol changes, no Freeze. The next step occurs only after the Rules Owner fills this sheet.

---

## Phase 14.Z.3 Owner Decision Addendum — 2026-09-22

The following decisions are now explicit Rules Owner decisions. The historical decision sheet above remains preserved.

### G-1
**CLOSED — Position/Card-Origin Matrix.**

Partner-winning trump:
- Third player → ANY_TRUMP; no forced overtrump.
- Fourth player → ANY_TRUMP; no forced overtrump.

Opponent-winning trump:
- Higher trump available → MUST_OVERTRUMP.
- No higher trump + player has trump → ANY_TRUMP.
- No trump → ANY_NON_TRUMP_CARD.

Non-trump lead with no lead suit:
- Third + opponent winning on non-trump + trump → MUST_TRUMP.
- Third + opponent winning on trump + higher trump → MUST_OVERTRUMP.
- Third + opponent winning on trump + no higher trump + trump → ANY_TRUMP.
- Fourth + partner winning → ANY_CARD.
- Fourth + opponent winning follows current-winning-card trump obligations.

### G-2
**CLOSED — Ika Predicate.**

Ika requires HOKUM + LEADER + NON_TRUMP + HIGHEST_REMAINING_CARD_OF_SUIT.

Declaration is optional. Invalid declaration rejects the complete PLAY_CARD with zero state mutation.

### G-2P
**CLOSED — Ika Partner Exemption.**

All conditions:
HOKUM + THIRD + NO_LEAD_SUIT + PARTNER_OPENED_TRICK + PARTNER_CURRENT_WINNER + (PARTNER_LEAD_IS_ACE OR PARTNER_DECLARED_VALID_IKA).

Result: ANY_CARD, including trump.

### G-3
**CLOSED AS SPECIFICATION REQUIREMENT.**

The legal-move test matrix must include all G-1/G-2/G-2P combinations and Locked-Hokum interaction.

### V-07
**CLOSED — C.**

Remove generic countingSide; use precise allocation/ownership terms.

### Kasho dealer transition
**CLOSED — ROTATE_RIGHT.**

Use the shared relative-seat utility.

### Freeze
These decisions do not authorize production implementation. Rule Freeze remains BLOCKED until the remaining independent blockers are resolved.
