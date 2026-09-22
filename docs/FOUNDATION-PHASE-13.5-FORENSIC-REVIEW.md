# Phase 13.5 Forensic Review

**Document:** `docs/FOUNDATION-PHASE-13.5-FORENSIC-REVIEW.md`
**Phase:** 13.5 Forensic Verification (audit of the audit)
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. No implementation. No rule invention. No rule selection. No architecture selection. No Rule Freeze declared. No production-readiness claimed.

**Sources read in full before verdict:**

* Foundation: `docs/product/01-product-vision.md`, `docs/product/02-product-scope.md`, `docs/game/01-game-rules.md` through `docs/game/09-state-transitions.md`
* Phase 12: `FOUNDATION-AUDIT.md`, `FOUNDATION-CRITICAL-FINDINGS.md`, `FOUNDATION-CROSS-DOCUMENT-ISSUES.md`, `FOUNDATION-OPEN-DECISIONS.md`, `FOUNDATION-IMPLEMENTATION-READINESS.md`, `FOUNDATION-RISK-REGISTER.md`
* Phase 13/13.5: `FOUNDATION-RESOLUTION-AUDIT.md`, `FOUNDATION-TRUE-BLOCKERS.md`, `FOUNDATION-ARCHITECTURAL-GAPS.md`, `FOUNDATION-RULE-DECISIONS.md`, `FOUNDATION-RESOLUTION-MATRIX.md`, `FOUNDATION-ARCHITECTURE-DECISIONS.md`, `FOUNDATION-DOCUMENTATION-FIXES.md`

**Method:** every Phase 13.5 conclusion was rechecked against the Foundation with independent text search (all line references below were verified by the auditor, not copied from the audit). Arithmetic was recomputed from the documented card-value tables. Absence claims (e.g. "no KABOOT action", "no PASS_FINAL in Actions") were verified by full-text search.

---

## 1. Executive Verdict

**FOUNDATION 13.5 VERIFIED**

Phase 13.5 genuinely corrected Phase 13. All ten Phase 13 overreach corrections (Corrections 1–10 in `FOUNDATION-RESOLUTION-AUDIT.md`) hold up against the Foundation sources. The headline claims verify independently:

* 0 P0 blockers — the five Phase 12 P0s are all soundly reclassified (details in §2); nothing that was a genuine blocker was buried.
* 4 P1 issues (TB-P1-001…004) — each is real, evidenced, and correctly classified.
* 10 Rule Owner decisions (RD-01…RD-10) — count verified item-by-item; all ten are genuinely unresolved and none is derivable, duplicated, architectural, or documentation-only. EC-01 is correctly kept outside the rule count.
* 5 Architecture decisions (AD-01…AD-05) — all genuine, none pre-selected, no material AD missed at Foundation scope.
* 8 documentation-only fixes (DF-01…DF-08) — all verified documentation-only; none smuggles a rule or architecture decision (DF-03 analyzed closely; caveat recorded, conclusion stands).
* No silent rule decisions and no silent architecture decisions were found. Nothing was selected: not direction, not the exposed-card model, not PASS vs PASS_FINAL, not the canonical GamePhase, not COMPLETE_DEAL / MATCH_END_CHECK visibility, not contract normalization.

**Errata and caveats found (none overturns any conclusion — see §9):**

1. `FOUNDATION-RESOLUTION-MATRIX.md` count summary says P2 = 5, but the same document lists 6 P2 rows (R-P2-001…R-P2-006). R-P2-006 is marked dependent; the summary needs a one-line clarification. Trivial erratum in the review document itself.
2. Phase 13.5 omits corroborating witnesses that strengthen (not weaken) its conclusions: `01-game-rules.md §3` uses the `09-state-transitions.md` phase vocabulary, and clockwise direction appears in three documents (`03-dealing.md §5`, `05-playing.md §5`, `09-state-transitions.md §31`), not one. Frequency is not authority — classification is unaffected — but the evidence record is incomplete.
3. The F-P0-004 (BUY_* vs CALL_*) downgrade to P3 is aggressive; P2 would also be defensible. This is a severity-calibration judgment, not a misclassification: the documentation-gap analysis itself is correct.
4. DF-03's supporting evidence is honestly labeled INFERENCE (in AG-01) while the fix is classified documentation-only. The tension is acknowledged in the audit itself; analysis in §7 confirms the fix adds no new behavior and is therefore correctly classified.

No correction to the Foundation documents is made here. The errata above are corrections to the review record, documented here per the modification rule.

---

## 2. Phase 13.5 Claims Verified

| Claim | Classification | Evidence | Verdict |
|---|---|---|---|
| 0 P0 blockers | Reclassification judgment | F-P0-001 → mathematical correction (arithmetic proves 120); F-P0-002 → missing rule, model structure sound; F-P0-003 → derived outcome (zero KABOOT/claim references in `08-actions.md` verified by search); F-P0-004 → doc gap (`08-actions.md:13` self-declares authoritative; `09-state-transitions.md:399-401,1431-1433` uses CALL_*); F-P0-005 → open architecture decision (both designs viable against `07-game-state.md §20` BiddingState.phase) | VERIFIED (with calibration note on F-P0-004 → P3, §9) |
| 4 confirmed P1 issues (TB-P1-001…004) | 1× MATHEMATICAL CORRECTION, 2× OPEN RULE DECISION, 1× OPEN ARCHITECTURE DECISION | Each re-verified against sources in §§3–4 | VERIFIED |
| 10 genuine Rule Owner decisions (RD-01…RD-10) | OPEN RULE DECISION ×10 | Item-by-item verification in §5; EC-01 correctly excluded from count | VERIFIED — count is exactly 10, no duplicates, none derivable |
| 5 Architecture decisions (AD-01…AD-05) | OPEN ARCHITECTURE DECISION ×5 | Item-by-item verification in §6; no option pre-selected in any AD | VERIFIED |
| 8 documentation-only fixes (DF-01…DF-08) | DOCUMENTATION GAP / MATHEMATICAL CORRECTION transcription ×8 | Item-by-item verification in §7; DF-08 identified and quoted | VERIFIED (DF-03 with recorded caveat) |
| No silent rule decisions | Process claim | Direction, exposed-card B/C/D, Kaboot scoring, doubling, project/Baloot/redeal/Ashkal specifics all left open; §4 arithmetic presented as arithmetic, not preference | VERIFIED |
| No silent architecture decisions | Process claim | 09-as-canonical recommendation retracted; single-PASS presented as one option; COMPLETE_DEAL / MATCH_END_CHECK / contract layers left open; DF-03 analyzed — adds no behavior | VERIFIED |
| F-P2-009 retracted (RESYNC/stateVersion) | RETRACTED — false finding | `09-state-transitions.md:846`: "RESYNC_GAME should normally not increment gameplay stateVersion" vs §6 increment rule — explicit exclusion exists | VERIFIED — retraction is correct |
| Phase 13 Corrections 1–10 | Self-corrections | Each rechecked: Sun math, exposed-card menu, PASS_FINAL, COMPLETE_DEAL, MATCH_END_CHECK, GamePhase canonicality, direction neutrality, contract layering, Kaboot split, RESYNC | VERIFIED — all ten hold |

---

## 3. Confirmed Facts

Only facts directly supported by Foundation documents (all independently re-verified):

1. **Sun card values are identical in both documents.** `01-game-rules.md §6.1` and `06-scoring.md §7` define A=11, 10=10, K=4, Q=3, J=2, 9=0, 8=0, 7=0. Per-suit total = 30. Four-suit base = **120**. Last-trick bonus = 10 in both documents. 120 + 10 = **130**. (Recomputed independently; see §4 of the task scope.)
2. **Hokm arithmetic closes.** Trump suit J=20 + 9=14 + A=11 + 10=10 + K=4 + Q=3 = 62; three non-trump suits × 30 = 90; base = **152** (`06-scoring.md:302`); +10 bonus = **162**, matching `01-game-rules.md §6.2` ("162, with earth included"). No Hokm error exists.
3. **The only "130"/"140" occurrences in the Foundation are:** `01-game-rules.md:271` (130 subtotal), `01-game-rules.md:283` (140 total), `06-scoring.md:292` (130 before bonus), `06-scoring.md:309` (Sun total 130 *including* the bonus — consistent with the corrected math). Every occurrence is accounted for; the double-count is confined to `01-game-rules.md §6.1`.
4. **`08-actions.md:13` declares itself "the complete authoritative action/command model."** `04-bidding.md:206` labels BUY_* a "Recommended domain action." The wire-vs-domain distinction claimed by Phase 13.5 is textually grounded.
5. **Zero Kaboot action references exist in `08-actions.md`.** Full-text search for Kaboot/CLAIM_KABOOT/KABOOT_DETECTED returns no hits in that document. No document states any player must declare or claim Kaboot. `06-scoring.md §41` defines Kaboot purely as an outcome ("one team wins all eight tricks"); `09-state-transitions.md §25` feeds `tricks` into ROUND_SCORING.
6. **PASS_FINAL exists only in `04-bidding.md`** (lines 352, 424). `08-actions.md §21` defines only PASS, with validation "pass is legal in current bidding stage." `07-game-state.md §20` tracks `BiddingState.phase` (FIRST_ROUND vs SECOND_ROUND) in authoritative state — so both AD-01 options are implementable. Neither is designated canonical.
7. **BIDDING_FAILED is defined only in `04-bidding.md`** (lines 434, 890, §19 path description) and is **absent from the `09-state-transitions.md §64` matrix** (rows at 1430–1439 contain no BIDDING_FAILED row). The documentation-completeness gap is real.
8. **Ashkal eligibility is already parameterized.** `04-bidding.md:303` uses `rules.canCallAshkal(seat, dealerSeat)`. The architecture needs no change; only the Rule Profile implementation is missing.
9. **All direction statements defer to the Rule Profile.** `01-game-rules.md §2.2` (counter-clockwise) and `05-playing.md §5` (clockwise) both append "according to the selected Rule Profile." The contradiction is in embedded defaults, not in authority claims.
10. **"Player to the dealer's right" is stated consistently** (`01-game-rules.md:102`, `04-bidding.md:156`, `05-playing.md:160`) and is direction-relative — hence correctly classified as dependent on the direction decision, with no independent status.
11. **The match target is already named as Qaid.** `01-game-rules.md:181` states "الوصول إلى 152 نقطة قيد" (152 Qaid points). (Phase 12 F-P3-003 is overstated on this point; Phase 13.5's silence toward it is acceptable — P3 trivia, no action needed.)
12. **The "doubling window" phrase never denotes a specified policy.** It appears only in a rejection example (`09-state-transitions.md:915`) and a validation note (`08-actions.md:670`). No phase, open event, or close event is specified anywhere — RD-03 is genuine.

---

## 4. Confirmed Contradictions

Only genuine contradictions (verified, not inferred):

1. **Play direction.** `01-game-rules.md §2.2` = counter-clockwise («عكس عقارب الساعة»). `05-playing.md §5` = clockwise. Corroborating witnesses Phase 13.5 did not cite: `03-dealing.md:131` ("Dealer → next seat clockwise") and `09-state-transitions.md:744` ("Typical baseline: clockwise"). So the Foundation contains one CCW statement against three CW statements. **Frequency is not authority** — this changes nothing about classification (OPEN RULE DECISION, RD-02), and Phase 13.5 is correct not to count votes. Recorded here for evidence completeness only.
2. **GamePhase names.** `07-game-state.md §8` (PLAYING, SCORING, MATCH_COMPLETE, plus WAITING_FOR_PLAYERS, ROUND_STARTING, ROUND_COMPLETE, CANCELLED) vs `09-state-transitions.md §9` (TRICK_PLAY, ROUND_SCORING, GAME_RESULT, plus GAME_CREATED, COMPLETE_DEAL, MATCH_END_CHECK). Three direct name conflicts over identical semantic phases. Additional witness Phase 13.5 did not cite: **`01-game-rules.md §3` lifecycle uses the 09-vocabulary** (COMPLETE_DEAL, TRICK_PLAY, ROUND_SCORING, MATCH_END_CHECK, GAME_RESULT), making `07-game-state.md` the outlier 1-vs-2. Again, agreement is not designation — neither document designates the other canonical for phase-name strings, and `09-state-transitions.md` explicitly lists the representation question as unresolved — so OPEN ARCHITECTURE DECISION (AD-02/AD-03/AD-04) stands.

**Explicitly NOT contradictions (Phase 13.5 correct):**

* Contract representations (`02-card-system.md §9` minimal vs `04-bidding.md §21/§24` full): `02-card-system.md §9` explicitly defers ("MUST be finalized in the Bidding/Rules documents"). Layered model. (Minor note: `01-game-rules.md §10` carries an even more minimal ASHKAL variant with no fields vs `02-card-system.md §9`'s `suit?: Suit` — see NI-01 in §9. P3, covered by DF-06.)
* BUY_* vs CALL_*: domain labels vs self-declared authoritative wire model. Documentation gap, not contradiction.
* Hokm 162 vs 152: presentational framing (with vs without bonus). Consistent.
* RESYNC/stateVersion: explicit exclusion in §36. No conflict — retraction valid.

---

## 5. Rule Decisions

| ID | Decision | Genuine? | Evidence | Rule Freeze Impact | Dependencies |
|---|---|---|---|---|---|
| EC-01 | Sun total editorial confirmation (120 base / +10 / 130 total) | N/A — correctly EXCLUDED from rule count; arithmetic, not preference | Card-value tables in `01-game-rules.md §6.1`, `06-scoring.md §7`; independent recomputation (30/suit → 120 → 130) | Blocks Freeze until transcribed (DF-01/DF-02), but requires confirmation — not a choice | None |
| RD-01 | Exposed card fate after bidding | YES | No fate statement in `03-dealing.md §17–18` or anywhere else (full-text search verified); 20+1+12=33 under naive reading; models B/C/D all conserve but none evidenced | YES — dealing engine unfreezable | None |
| RD-02 | Play direction (CW vs CCW) | YES | Direct contradiction (§4, item 1); both defer to Rule Profile | YES — all turn order (dealing, bidding, play, dealer rotation) | None (root) |
| RD-03 | Doubling window open/close phases | YES | `09-state-transitions.md` open item 7 unresolved; no phase specified anywhere (§3, item 12) | YES — doubling enforcement | RD-02 (first-trick timing is direction-relative) |
| RD-04 | COFFEE terminal behavior | YES | `06-scoring.md §37` explicitly defers win/terminal conditions to Rule Profile | YES — escalation legality | RD-03 |
| RD-05 | Project declaration window close condition | YES | `09-state-transitions.md §19` defers to Rule Profile; open item 6 unresolved; NONE-declaration, timer, simultaneity all unspecified | YES — phase exit condition | None |
| RD-06 | Final project Qaid values (SERA/FIFTY/HUNDRED/FOUR_HUNDRED) | YES | `06-scoring.md §31–32` values marked Draft; freezing a draft table is a genuine owner act, not derivation | YES — project scoring | None |
| RD-07 | Kaboot Qaid values (25 Hokm / 44 Sun draft) | YES | `06-scoring.md §41` marked Draft | YES — Kaboot scoring (detection needs nothing — §3 item 5) | None |
| RD-08 | Baloot (K+Q trump) declaration timing + missed-window consequence | YES | `06-scoring.md §19–20` defers timing; no window defined | YES — Baloot scoring | None |
| RD-09 | Redeal procedure on BIDDING_FAILED | YES | `04-bidding.md §19` defers to Rule Profile (dealer rotation, seating, penalty, consecutive-redeal cap all absent) | YES — redeal path | RD-02 (rotation is direction-relative) |
| RD-10 | Ashkal eligibility seats | YES | Implementation of `canCallAshkal` absent; "left/right" relative seats depend on direction | YES (P2 — infrequent but integrity-critical) | RD-02 |

**Count verification:** exactly 10 RD rows, no duplicates, none derivable from existing facts, none architectural (all require rule content), none documentation-only. The "10" is independently confirmed, not accepted on authority.

**Coverage boundary (not a miss):** RD-01…RD-10 are the *Freeze-blocking subset*. The wider catalogue (`FOUNDATION-OPEN-DECISIONS.md`, 71 items — e.g. first-round Sun priority, trump-obligation-when-void, first-dealer mechanism, tie-breaks) remains open for Rule Freeze. Phase 14 must work from the full catalogue, not only these ten.

---

## 6. Architecture Decisions

| ID | Decision | Genuine? | Evidence | Implementation Impact |
|---|---|---|---|---|
| AD-01 | PASS vs PASS_FINAL wire representation | YES | `04-bidding.md §18–19` semantically distinct; `08-actions.md §21` single PASS; both implementable via `BiddingState.phase`; neither designated canonical | Wire protocol / bidding validation; does NOT block engine architecture |
| AD-02 | Canonical GamePhase representation | YES | Three direct name conflicts + four-vs-three exclusive phases (§4, item 2); no canonical designation either way; `07-game-state.md §8` defers only the *graph*, not name strings | Event schema, wire protocol, replay format — highest priority |
| AD-03 | COMPLETE_DEAL internal vs observable | YES | In `09-state-transitions.md` lifecycle, absent from `07-game-state.md` enum; open item 3 explicitly unresolved; no player action occurs there | Event schema (whether clients observe a card-distribution phase) |
| AD-04 | MATCH_END_CHECK internal vs observable | YES | Matrix rows exist (`09-state-transitions.md:1437–1438`) but absent from game-state enum; open item 3 explicitly unresolved; presented as conditional branch | Event schema (direct ROUND_SCORING → DEALING/GAME_RESULT vs intermediate state) |
| AD-05 | Contract type layer boundaries (domain vs card-system vs transport) | YES | Minimal (`02-card-system.md §9`) vs full (`04-bidding.md §24`) vs discriminant-use (`05-playing.md §18`); Ashkal normalization (`mode: "ASHKAL"`) suggested but not adopted | Engine internals / wire format; no urgency |

No option is pre-selected in any AD — verified by reading each AD section end-to-end. Phase 13's "probably internal" / "almost certainly" / "designate 09 as canonical" language is fully retracted in the 13.5 text.

**Missed-architecture check:** no material AD missed at Foundation scope. Downstream protocol items (exact event names/ordering, timeout representation, snapshot/outbox strategy) belong to Phase 14+ design and are not Foundation-correctness issues. The "actions vs internal transitions" question (`09-state-transitions.md` open item 3) is fully covered by AD-03/AD-04.

---

## 7. Documentation Fixes

| ID | Fix | Documentation Only? | Evidence |
|---|---|---|---|
| DF-01 | `06-scoring.md §8`: "130 card points before bonus" → "120" | YES | Pure arithmetic transcription of §3, item 1; prerequisite EC-01 correctly noted |
| DF-02 | `01-game-rules.md §6.1`: remove 140 double-count → 120 + 10 = 130 | YES | Same; rewrites 3 lines, changes no rule |
| DF-03 | `06-scoring.md §41`: state Kaboot is server-detected from trick counts, no player action | YES — with caveat | Zero claim-mechanic support anywhere in Foundation (§3, item 5); fix *forbids inventing* CLAIM_KABOOT rather than adding behavior; scoring values stay open in RD-07. Caveat: AG-01 honestly labels the support INFERENCE; the fix wording should stay descriptive ("no claim action is defined; scoring derives Kaboot from completed trick counts"). Does not constitute a silent architecture decision. |
| DF-04 | `04-bidding.md §8`: note BUY_*/PASS_FINAL are domain labels; wire types live in `08-actions.md` | YES | Textually grounded (§3, item 4); adds cross-reference only; wire-name freeze still required |
| DF-05 | `09-state-transitions.md §64`: add BIDDING_FAILED → DEALING (redeal per Rule Profile) row | YES | Path defined in `04-bidding.md §19`, absent from matrix (§3, item 7); rule content of redeal stays in RD-09 |
| DF-06 | `02-card-system.md §9`: cross-reference full Contract in `04-bidding.md §24` | YES | `02-card-system.md §9` already defers; note prevents misuse of minimal type as canonical. Also covers NI-01 (§9). |
| DF-07 | `09-state-transitions.md §6`: cross-reference §36 RESYNC exclusion | YES | Zero content change; visibility-only note |
| DF-08 | `03-dealing.md §5`: dealing-direction context note | YES | See identification below |

**DF-08 identification (as required):** DF-08 requires adding a note at `03-dealing.md §5` stating, briefly: *"This document specifies dealing direction as clockwise; play direction is separately specified in `05-playing.md §5` and may differ; the Rule Profile governs both — see `01-game-rules.md §2.2`."* Classification: genuinely documentation-only — it selects no direction, adds no rule, and its own prerequisite table correctly gates its wording on RD-02. Verified NOT a secret rule or architecture decision.

---

## 8. Retracted Findings

| Finding | Reason | Verification |
|---|---|---|
| F-P2-009 (RESYNC/stateVersion conflict) | False finding. `09-state-transitions.md §6` states the increment rule for *accepted transitions*; `§36` (line 846) explicitly excludes RESYNC_GAME ("should normally not increment… state mutation ≠ state delivery"). | VERIFIED — retraction correct. Minor note: §36 says "normally," a hedge; DF-07's cross-reference resolves the residual ambiguity without content change. No reopening warranted. |

No other Phase 12 finding qualifies for retraction. All other reclassifications are severity/type corrections, not retractions — correctly presented as such in the resolution matrix.

---

## 9. New Issues Discovered

**Material Foundation issues missed by Phase 13.5: NONE.** A full cross-document consistency pass (terminology, state names, action names, card values, scoring, transitions, turn/dealer/bidding ownership, contract/project/doubling representation, match termination, resync) surfaced no new P0/P1/P2 issue. The following are recorded for completeness; none affects the verdict:

* **NI-01 (P3 — observation, already covered):** `01-game-rules.md §10` defines ASHKAL with no fields while `02-card-system.md §9` defines `ASHKAL` with `suit?: Suit`. Phase 13.5 Special Review 9 compares only 02 vs 04. This is a further minimal-type variance at overview level, not a new contradiction: both explicitly defer to the Bidding documents, and DF-06's cross-reference resolves the practical risk. No new decision needed.
* **NI-02 (erratum in the Phase 13.5 review document itself, not the Foundation):** `FOUNDATION-RESOLUTION-MATRIX.md` count summary reports P2 = 5, but the matrix lists 6 P2 rows (R-P2-001…R-P2-006) and the Resolution Audit §"Remaining P2" likewise lists six. R-P2-006 is marked dependent (resolves with direction), which likely explains the "5" — but the exclusion is never stated. Required correction: one clarifying line ("6 tracked rows: 5 independent + 1 dependent"). Documented here per the modification rule; the Foundation is untouched.
* **Audit-completeness notes (not issues):** the omitted corroborating witnesses in §4 (01 §3 phase vocabulary; 03/09 clockwise statements) should be folded into the evidence record in Phase 14. They strengthen, not weaken, TB-P1-003/TB-P1-004.
* **Calibration note (not a misclassification):** F-P0-004 → P3 (documentation gap) is the most aggressive downgrade in the matrix. The gap analysis is correct (`08-actions.md` self-declared authoritative + `09-state-transitions.md` consistent with CALL_*), but a team could defensibly hold it at P2 until DF-04 is applied, since cross-team wire interop is at stake. Judgment call; verdict unaffected.

---

## 10. Remaining Severity

* **P0:** 0 — none. (No genuine blocker was found hidden at lower severity; §2.)
* **P1:** 4 —
  * R-P1-001 / TB-P1-001: Sun base total documented incorrectly (mathematical correction; editorial confirmation EC-01 then DF-01/DF-02).
  * R-P1-002 / TB-P1-002: Exposed card fate unspecified (Rule Decision RD-01).
  * R-P1-003 / TB-P1-003: GamePhase canonical names not designated (Architecture Decisions AD-02/AD-03/AD-04).
  * R-P1-004 / TB-P1-004: Play direction contradicted (Rule Decision RD-02).
* **P2:** 6 tracked rows = 5 independent + 1 dependent —
  * R-P2-001 (AD-01 PASS vs PASS_FINAL), R-P2-002 (AD-03 COMPLETE_DEAL), R-P2-003 (AD-04 MATCH_END_CHECK), R-P2-004 (RD-03 doubling window), R-P2-005 (RD-05 project declaration window), R-P2-006 (bidding start player — dependent on RD-02, no independent status).
* **P3:** 4 —
  * R-P3-001 (AD-05 contract layers + DF-06), R-P3-002 (RD-10 Ashkal eligibility, architecture already parameterized), R-P3-003 (DF-04 BUY/CALL terminology gap), R-P3-004 (DF-05 redeal matrix row).

Severity is not inflated: math stays math, dependent items stay dependent, draft-value freezes stay rule decisions, and wire-representation choices stay architecture.

---

## 11. Safe to Proceed

**SAFE NOW:**

* documentation normalization — DF-01…DF-08 notes and cross-references (DF-01/DF-02 after EC-01 confirmation; DF-08 worded against RD-02)
* terminology normalization — SERA naming, CardId/seat/action-envelope vocabularies, BUY/CALL mapping note
* non-rule infrastructure — action envelope, state-version plumbing, idempotency metadata, snapshot/event-log scaffolding
* rule-profile interfaces — `RuleProfile` shell, `canCallAshkal`, `doublingWindowPolicy` key naming, direction parameter plumbing (`getNextSeat` already parameterized)
* deterministic infrastructure — card catalog, Sun/Trump ranking functions, seeded RNG boundary, replay harness skeleton, simulation harness

**NOT SAFE NOW:**

* gameplay engine implementation — direction (RD-02) gates all turn order
* scoring implementation — Sun transcription (EC-01) + project/Kaboot/Baloot values (RD-06/07/08)
* bidding implementation — wire actions (AD-01) + Ashkal/redeal specifics (RD-09/10)
* dealing behavior — exposed-card fate (RD-01)
* trick direction — RD-02
* project behavior — declaration window + comparison/overlap specifics (RD-05 + open catalogue)
* doubling behavior — window + COFFEE terminality (RD-03/04)
* match completion behavior — GamePhase canonicality (AD-02/03/04) + tie/end specifics

The Engineering Rule (`01-game-rules.md §53`) remains in force: no production Game Engine before Rule Freeze. Nothing in this review lifts it.

---

## 12. Final Gate

**PHASE 13.5 VERIFIED — PROCEED TO PHASE 14**

Phase 14 (canonical rule resolution) may proceed on the basis that: facts, contradictions, rule decisions, architecture decisions, and documentation fixes are correctly separated; nothing unresolved was silently decided; the 10/5/8 counts are independently confirmed; the single retraction is valid; and the only corrections owed are the documented errata in §9, which require no re-audit.
