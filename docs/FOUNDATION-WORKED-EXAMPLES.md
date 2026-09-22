# صكّة بلوت — Worked Examples (Phase 14.y)

**Document:** `docs/FOUNDATION-WORKED-EXAMPLES.md`
**Phase:** 14.y — Worked Examples & Canonical Scoring Verification
**Date:** 2026-09-22
**Status:** VERIFICATION ONLY — NOT FROZEN. No production code. No rule invented. Every assumption is numbered and every open point is marked.

Conventions: teams are **A = NORTH+SOUTH**, **B = EAST+WEST**. Direction is counter-clockwise per RD-02 (seat order N→W→S→E). "Hokum" spelling follows the 14.x profile documents.

---

## 0. Assumptions Ledger

Every example cites these; nothing else is assumed.

| ID | Content | Standing |
|---|---|---|
| A1 | Sun raw card total = 120; last-trick bonus = +10; round card total = 130. Hokum = 152 + 10 = 162. | LOCKED (arithmetic from documented tables) |
| A2 | Buyer receives exposed card + 2 hidden; each other player +3 hidden; final hands 8; 20+1+11 = 32. | Owner-decided (RD-01) |
| A3 | Global counter-clockwise order N→W→S→E for dealing, bidding, play, rotation. | Owner-decided (RD-02) |
| A4 | Gahwa = immediate MATCH_WIN terminal. | Owner-decided (RD-04) |
| A5 | Doubling chains — Hokum NORMAL→DOUBLE→TRIPLE→FOUR→GAHWA; Sun NORMAL→DOUBLE. Escalation rights: DOUBLE by opponent-of-buyer, TRIPLE by buyer, FOUR by doubler, GAHWA by buyer. Open/locked mode tracked independently. Window boundary OPEN. | PROVISIONAL (research baseline, profile DRAFT) |
| A6 | Project values — Hokum SERA 2 / FIFTY 5 / HUNDRED 10 / BALOOT 2; Sun SERA 4 / FIFTY 10 / HUNDRED 20 / FOUR_HUNDRED 40. Projects ×2 at DOUBLE, capped (no further multiplication at TRIPLE/FOUR); Baloot ×1 always. | PROVISIONAL (research baseline, profile DRAFT) |
| A7 | Kaboot values Hokum 25 / Sun 44; 8–0 trick condition; derived detection, no claim action. | PROVISIONAL (values draft) |
| A8 | Baloot = K+Q of trump, same player, value 2, declared during the second card before it lands, never multiplied. Baloot⊂Hundred interaction OPEN. | PROVISIONAL baseline + OPEN conflict (C-02) |
| A9 | Success evaluation (OPEN — used only for decisiveness analysis): buyer succeeds iff buyer-side countable raw exceeds half the round card total (Sun > 65 of 130; Hokum > 81 of 162). Exact-boundary and tie behavior OPEN. All non-tie examples use decisive margins valid under any half-based rule. | OPEN (assumed for analysis) |
| A10 | Conversion illustration (OPEN): Sun raw ÷ 5, Hokum raw ÷ 10. Rounding of fractions OPEN — fractions demonstrably occur. | OPEN (assumed for illustration) |
| A11 | Allocation reading (PROVISIONAL): on success each side keeps its own converted share ("ordinary conversion" implied by contrast in `06-scoring.md §40`); on failure buyer takes 0 and opponent takes the configured round Qaid (exact value OPEN). | PROVISIONAL reading + OPEN value |
| A12 | Trick compositions below are illustrative point splits; team totals are exact and conserve (Sun 130 / Hokum 162). Any composition yielding the same totals is scoring-equivalent. | Method note |

"Counting side": the term has **no Foundation definition** (verified by full-text search). Examples show both teams' totals symmetrically and evaluate the buyer side per A9; the term itself is recorded OPEN (see V-07 in verification).

---

## Scoring Model (Paper)

```
1. Raw card points      sum of won trick card values per team (A1)
2. Last-trick bonus      +10 raw to winner of trick 8 (once, Scoring-owned)
3. Project raw values    contribution to success comparison (raw table OPEN — V-08)
4. Contract result        SUCCESS / DRAW / FAILURE via evaluateContractResult (thresholds OPEN — V-01)
5. Doubling multiplier    ×1/×2/×3/×4 on eligible components; projects capped at ×2 (A6); Baloot ×1
6. Kaboot                 8–0 → 25 / 44 replaces normal card QD (values PROVISIONAL; ×doubling OPEN — V-04)
7. Baloot                 +2, ×1 always; Hundred overlap CONFLICT (C-02)
8. Round points           per-team raw after 1–7
9. Qaid conversion        ÷5 / ÷10 illustration (rounding OPEN — V-02)
10. Match score           atomic Qaid update per team
11. Match-end condition    152 Qaid (canonical) vs Gahwa terminal (A4); both-cross OPEN
```

---

## EX-01 — Normal Sun, Buyer Succeeds

* Dealer NORTH; CCW bidding starts WEST; WEST passes, SOUTH buys SUN (buyer SOUTH, Team A). Exposed: illustrative (e.g. SPADES_9).
* Completion per A2. No projects, no Baloot, no Kaboot, NORMAL doubling.
* Tricks (card points per trick, winner): T1 A:28 · T2 B:28 · T3 A:11 · T4 B:13 · T5 A:4 · T6 B:4 · T7 A:4 · T8 A:28 (+10 bonus).
* Team trick counts: A 5, B 3. Card points: A 28+11+4+4+28=75; B 28+13+4=45. Check 75+45=120 ✓. Bonus: trick 8 → A +10. Totals: **A 85, B 45**; 85+45=130 ✓.
* Success: 85 > 65 decisive under A9. Kaboot: no (3 tricks lost). Doubling NORMAL.
* Round result: buyer Team A succeeds. Qaid (A10 illustration): A 85/5=17, B 45/5=9.
* Match score after (from 0–0): **A 17 – B 9**. Status: PROVISIONAL (A9/A10/A11 assumed).

## EX-02 — Normal Sun, Buyer Fails

* Dealer EAST; first bidder SOUTH (CCW); buyer NORTH (Team A), Sun. No projects/doubling.
* Tricks: T1 A:28 · T2 B:28 · T3 A:8 · T4 B:28 · T5 B:16 · T6 A:4 · T7 B:4 · T8 B:4 (+10).
* Counts: A 3, B 5. Cards: A 28+8+4=40; B 28+28+16+4+4=80; 40+80=120 ✓. Totals: **A 40, B 90** (90 = 80+10); sum 130 ✓.
* Success: 40 < 65 fails under any half-rule. Allocation per A11: buyer A takes **0**; opponent B takes configured round Qaid — exact value OPEN (illustration: B own-share 90/5=18 PROVISIONAL).
* Match score after (0–0): **A 0 – B 18 (PROVISIONAL)**. Status: PROVISIONAL + OPEN (failure value).

## EX-03 — Normal Hokum, Buyer Succeeds

* Dealer SOUTH; first bidder EAST; buyer EAST (Team B), HOKUM Hearts. No projects/doubling.
* Tricks: T1 B:28 · T2 A:28 · T3 B:28 · T4 B:26 · T5 A:28 · T6 B:4 · T7 A:6 · T8 B:4 (+10).
* Counts: B 5, A 3. Cards: B 28+28+26+4+4=90; A 28+28+6=62; 90+62=152 ✓. Totals: **B 100, A 62**; sum 162 ✓.
* Success: 100 > 81 decisive. Qaid illustration: B 100/10=10; A 62/10=6.2 → **rounding OPEN (V-02)**.
* Match score: **B 10 – A 6.2→OPEN**. Status: PROVISIONAL + OPEN (loser-side rounding).

## EX-04 — Normal Hokum, Buyer Fails

* Dealer WEST; buyer NORTH (Team A), HOKUM Spades. No projects/doubling.
* Tricks: T1 A:28 · T2 B:28 · T3 A:27 · T4 B:28 · T5 B:28 · T6 B:5 · T7 B:4 · T8 B:4 (+10).
* Counts: A 2, B 6. Cards: A 55; B 28+28+28+5+4+4=97; 55+97=152 ✓. Totals: **A 55, B 107**; sum 162 ✓.
* Success: 55 < 81 fails under any half-rule. Allocation: buyer A 0; opponent B configured round Qaid — OPEN (illustration: own-share 107/10=10.7, rounding OPEN).
* Match score: **A 0 – B OPEN(≈10.7)**. Status: PROVISIONAL + OPEN.

## EX-05 — Sun + Sera

* Same deal shape as EX-01 (buyer Team A, Sun). Team A declares SERA, valid, wins comparison (no opposing project).
* Cards as EX-01: A 85 (incl. bonus), B 45. Project-raw-for-threshold OPEN (V-08) but unneeded: 85 > 65 decisive on cards alone.
* Sera Sun +4 Qaid (A6): A Qaid = 17 + 4 = **21**; B 9.
* Match score: **A 21 – B 9**. Status: PROVISIONAL.

## EX-06 — Hokum + Fifty

* Same shape as EX-03 (buyer Team B, Hearts). Team B FIFTY valid, unopposed: +5 (A6).
* Cards B 100, A 62. Buyer Qaid = 10 + 5 = **15**; A 6.2→OPEN rounding.
* Match score: **B 15 – A OPEN**. Status: PROVISIONAL.

## EX-07 — Hokum + Hundred

* Same shape as EX-03. Team B HUNDRED valid, unopposed: +10 (A6).
* Buyer Qaid = 10 + 10 = **20**; A OPEN rounding.
* Match score: **B 20 – A OPEN**. Status: PROVISIONAL.

## EX-08 — Sun + Four Hundred

* Same shape as EX-01 (buyer Team A, Sun). Team A FOUR_HUNDRED (four Aces, Sun-only per baseline): +40 (A6).
* Buyer Qaid = 17 + 40 = **57**; B 9.
* Match score: **A 57 – B 9**. Status: PROVISIONAL.

## EX-09 — Baloot

* Same shape as EX-03 (buyer Team B, Hearts). SOUTH (Team B) holds K♥+Q♥, declares during the second card before it lands (A8).
* Cards B 100, A 62. Baloot +2 (A6, ×1): buyer Qaid = 10 + 2 = **12**.
* Match score: **B 12 – A OPEN**. Status: PROVISIONAL.

## EX-10 — Baloot + Hundred Conflict (UNRESOLVED — C-02)

* Same shape as EX-09, plus Team B also holds a valid HUNDRED containing the Baloot cards.
* Interpretation A (both count): buyer Qaid = 10 (cards) + 10 (Hundred) + 2 (Baloot) = **22**.
* Interpretation B (Baloot absorbed into Hundred): buyer Qaid = 10 + 10 = **20**.
* Numerical consequence of the conflict: **Δ = 2 Qaid**. No interpretation selected. Status: CONFLICT.

## EX-11 — Kaboot Hokum

* Buyer Team B, Hearts. Team B wins all 8 tricks (counts 8–0). Card points won: 152 + 10 bonus = 162 (trick splits illustrative: 30,30,30,30,8,8,8,8).
* Kaboot baseline 25 (A7) replaces normal card Qaid. No projects declared (clean case). Doubling NORMAL → no multiplication applied (C-03: multiplication unauthorized).
* Round Qaid: **B 25 – A 0**. Match score: **B 25 – A 0**. Status: PROVISIONAL (value draft; ×doubling OPEN).

## EX-12 — Kaboot Sun

* Buyer Team A, Sun. 8–0 tricks; card points 120 + 10 = 130 (splits illustrative: 25,25,25,25,5,5,5,5).
* Kaboot baseline 44 (A7). Round Qaid: **A 44 – B 0**. Status: PROVISIONAL + OPEN (as EX-11).

## EX-13 — Doubling (Normal → Double, Hokum)

* Same shape as EX-03 (buyer EAST/Team B). At NORMAL, opponent (Team A) calls DOUBLE (ownership A5). Buyer succeeds (100 vs 62).
* Counting: buyer side evaluated (term "counting side" itself OPEN per A12-note; both totals shown).
* Base buyer 100 → 10 ×2 = **20**. No projects (clean): Round Qaid **B 20 – A 6.2→OPEN**.
* Match score: **B 20 – A OPEN**. Status: PROVISIONAL (window/timing of the DOUBLE call itself OPEN per C-01).

## EX-14 — Triple (Hokum)

* Chain NORMAL→DOUBLE (opponent) →TRIPLE (buyer, A5). Buyer succeeds as EX-03.
* Base 100 → 10 ×3 = **30**. With buyer SERA: Sera 2 ×2 (cap A6) = 4. Baloot (if held) 2 ×1. Example total with Sera, no Baloot: **34**; with Baloot: **36**.
* Status: PROVISIONAL + OPEN (window; Triple project-cap follows profile DRAFT).

## EX-15 — Four (Hokum)

* Chain +FOUR (doubler, A5). Buyer succeeds as EX-03 with SERA.
* Base 100 → 10 ×4 = **40**. Sera 2 ×2 (cap) = 4. Total **44** (46 with Baloot +2).
* Status: PROVISIONAL + OPEN.

## EX-16 — Gahwa Terminal

* Chain reaches FOUR; buyer calls GAHWA (ownership A5). Round in progress (3 tricks played, arbitrary scores — irrelevant).
* Effect per A4: **immediate MATCH_WIN for buyer's team; no further rounds; 152 race bypassed**. Match result state recorded; no additional round played.
* Conditions for reaching Gahwa beyond chain position (window, timing, eligibility) OPEN per C-01. Status: terminal rule LOCKED (Owner-decided); reachability PROVISIONAL/OPEN.

## EX-17 — Failed Contract + Project (BRANCHED)

* Hokum, buyer Team A fails as EX-04 (cards 55) but holds valid SERA (Hokum).
* Branch A (project forfeited with failure): buyer **0**; opponent configured round Qaid (OPEN; illustration opp own-share 107/10 = 10.7, rounding OPEN).
* Branch B (project retained, cards forfeited): buyer **2** (Sera only); opponent own share OPEN as above.
* Foundation gives the failure pattern (06 §40) but not which branch: **OPEN — V-03**. Status: OPEN.

## EX-18 — Project Comparison (Both Teams)

* Hokum, buyer Team A. Tricks: A 5 (cards 88 + bonus 10 = 98), B 3 (cards 64). 88+64=152 ✓; totals 98+64=162 ✓. (Splits: A 28,28,24,4,4; B 28,28,8.)
* Detected: Team A SERA; Team B FIFTY. Both valid, disjoint cards.
* Comparison per baseline ordering (Hundred > Fifty > Sera, `06-scoring.md §26`): **FIFTY wins** → B +5 Qaid (A6); A SERA discarded (+0).
* Ordering subtypes, ties, dealer-priority OPEN (C-06). Buyer success on cards alone decisive (98 > 81); project-raw interplay unneeded here.
* Round Qaid illustration: A 98/10 = 9.8→OPEN rounding; B 64/10 = 6.4→OPEN + 5 = OPEN. Status: PROVISIONAL + OPEN.

## EX-19 — Second-Round All Pass (Hand Cancellation)

* Dealer NORTH. Round 1: W→S→E→N all PASS. Round 2: all PASS_FINAL-equivalent passes (wire form per AD-01 still open; semantics per `04-bidding.md §19`).
* Lifecycle: BIDDING_FAILED → hand cancelled, **score 0–0**, dealing advances with dealer rotated per profile (`rotate_dealer: true`, research baseline PROVISIONAL).
* Score verified unchanged. Status: PROVISIONAL (rotation value from DRAFT profile; path existence LOCKED).

## EX-20 — Exposed Card Conservation

* Initial 5×4 = 20; exposed 1; remaining 11. Completion: buyer +exposed+2 hidden; others +3+3+3 hidden. 1 + (2+3+3+3) = 11 ✓. Final hands 8 each; 20+1+11 = **32** ✓.
* Status: LOCKED (pure arithmetic over Owner-decided RD-01).

## EX-21 — Ashkal (Sun via Partner)

* Dealer NORTH; CCW first bidder WEST. Illustrative caller: SOUTH (Team A, eligibility NOT established by this example — seat matrix OPEN, C-05).
* Caller = buyer (SOUTH/Team A); partner NORTH receives exposed card; contract resolves as Sun.
* Completion: NORTH 5+1(exposed)+2=8; SOUTH 5+3=8; others 5+3=8. Conservation 32 ✓.
* Play/scoring proceeds as Sun (EX-01 shape). Status: distribution LOCKED given A2 + partner-receiver rule; eligibility OPEN.

## EX-22 — Bushat / Kasho Cancellation

* A player's initial five are all from {7,8,9} (documented Bushat condition; 9-trump does not invalidate per cited Saudi source — research baseline).
* Effect (baseline): hand cancelled, no score, dealing advances. Full violation/choice matrix (continue-vs-Kasho options) OPEN (C-04).
* Status: PROVISIONAL (baseline) + OPEN (matrix).

## EX-23 — Tie 81/81 Hokum (Boundary — OPEN)

* Buyer Team B: cards 71 + bonus 10 = **81**; opp Team A: **81**. 71+81=152 ✓; totals 162 ✓. (Splits: B 28,28,11,4; A 28,28,21,4.)
* Exact tie: success indeterminate. "Purchaser wins" is a suggested-but-unadopted config (`06-scoring.md §43`); doubled-tie rule separate and unadopted (`§44`).
* Branches: buyer-win → B ≈8.1 (rounding OPEN); buyer-loss → B 0, A configured (OPEN). Status: OPEN (V-01/V-06).

## EX-24 — Tie 65/65 Sun (Boundary — OPEN)

* Buyer Team A: cards 55 + 10 = **65**; opp **65**. 55+65=120 ✓; totals 130 ✓. (Splits: A 28,19,4,4; B 28,28,5,4.)
* Same indeterminacy as EX-23. Branches: buyer-win → A 13–13 draw on Qaid illustration (65/5=13 each); buyer-loss → A 0. Status: OPEN.

## EX-25 — Kaboot + Projects

* Hokum Kaboot by Team B (as EX-11) holding valid SERA; loser holds no project (clean case).
* Baseline composition: Kaboot 25 + Sera per `06-scoring.md §42` (winner's eligible projects may count; multiplier per profile): illustration 25 + 2 = **27** (27 → +2 more at ×2 cap if doubled — OPEN per C-03).
* Loser-project invalidation rule applied vacuously here; non-vacuous case OPEN. Status: PROVISIONAL + OPEN.

---

## MATCH-01 — Reaches Exactly 152

* Team A 140 + round 12 (e.g. EX-09 shape: 10 cards + 2 Baloot) = **152** → match ends at round end; Team A wins. (Mid-round reaching N/A: scoring commits per round by architecture.)
* Status: PROVISIONAL (round values) + LOCKED (152 target canonical).

## MATCH-02 — Crosses 152

* Team B 148 + round 11 = **159** → ends; Team B wins. Status: as MATCH-01.

## MATCH-03 — Both Cross Same Round (OPEN)

* Team A 148 + 11 = 159; Team B 145 + 9 = 154. Both cross 152 in one round.
* Winner rule OPEN (`06-scoring.md §63`): higher-total-wins vs buyer-priority vs extra-round — no adoption. Branches shown; none selected. Status: OPEN.

## MATCH-04 — Gahwa Before Completion

* Scores A 120 – B 98 mid-match; buyer Team B calls GAHWA at FOUR → immediate MATCH_WIN for B per A4, bypassing the 152 race.
* Status: terminal LOCKED; reachability OPEN (as EX-16).

## MATCH-05 — Tie Round at Match Point (OPEN)

* Scores A 139 – B 130; round ends 65/65 Sun (EX-24). Allocation depends on unadopted tie policy → match delta OPEN (A+13+tie-bonus? vs A+0). Status: OPEN (V-06).
