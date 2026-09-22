# RD-20 — Rule Freeze Report

**Document:** `docs/RD-20-RULE-FREEZE-REPORT.md`
**Date:** 2026-09-22
**Evidence:** repository inspection (no code, no tests), canonical pack (`01, 02, 04, 05, 06`), RD-01/RD-09/RD-10 protocols, Phase 15 audit, inline arithmetic verification.
**Historical evidence preserved.** No Foundation document altered. No rule invented. No code written.

---

## Verdict

```text
RULE_FREEZE = BLOCKED
```

## Gate certificate (per `03-RD-20-RULE-FREEZE-AUDIT.md`)

```text
RULE_FREEZE = BLOCKED
P0 = 1 (contradiction cluster F-01)
P1 = 17 (missing artifacts, undefined rule content, provenance gaps — see below)
UNRESOLVED_RULES = 9+ (cutting, overtrump, must-trump definition, Ika trail, V-06b/V-11 transcription, incident policy, first dealer, timeout policy, Sun-double window fields)
CONTRADICTIONS = 1 cluster (3 sub-parts)
PROFILE_GAPS = 8
MISSING_ACTIONS = yes (no frozen catalog; AD-01 open)
MISSING_EVENTS = yes (no frozen catalog; AD-02/03/04 open)
MISSING_TRANSITIONS = partial (spec exists, code missing, schema unfrozen)
MISSING_SCORING_TESTS = all
DETERMINISM = BLOCKED (no engine to verify)
HIDDEN_INFORMATION = BLOCKED (no engine to verify)
REPLAY = BLOCKED (no engine, schema unfrozen)
```

## P0 — Contradiction cluster F-01: Kaboot × doubling (STOP-class)

Three mutually incompatible V-04 answers exist in approved/current documents:

1. **Phase 15 audit §2:** V-04 = A — flat table (Hokum 25/25/25/25, Sun 44/44).
2. **RD-09 protocol §3:** V-04a = E — dedicated-table mechanism, Kaboot never inherits the contract multiplier.
3. **RD-09 protocol §21:** V-04 = B — multiplied table (Hokum 25/50/75/100, Sun 44/88), declared CLOSED.
4. Aggravating: RD-09 §14 still lists Double/Triple/Four Kaboot as **Open** ("must not be inferred") while §21 declares the same cells **CLOSED**.
5. Aggravating: `02-RULE-PROFILE-SA.md` contains **no Kaboot escalation table at all**, so neither B nor E is implementable from the profile.
6. Aggravating: task gate + `01-CANONICAL-RULES-CURRENT.md` forbid `baseKaboot * multiplier`, which §21's values are numerically indistinguishable from — mechanism and values point opposite ways with no reconciling Owner statement on file (14.z sheet unfilled).

Per governance rule 6, this contradiction is reported, not resolved. **Freeze requires exactly one adopted V-04 answer transcribed into `02-RULE-PROFILE-SA.md` (add `kaboot.escalation` table) with the other two superseded on record.**

## P1 — Missing canonical artifacts (each blocks scoring/termination)

1. **Exact conversion table absent.** `02` declares `mode: CONTRACT_SPECIFIC_TABLE, exactTableRequired: true` but stores no table; "complement calculation" (Phase 15 A1) undefined. Scoring pipeline step "contract conversion" unimplementable.
2. **V-06b (doubled-tie) transcription absent.** Claimed approved in Phase 15 A3; present in neither `01` nor `02`.
3. **V-11 sentence absent.** Required by Phase 15 A4 ("each team retains its own eligible card/project/Baloot allocation"); present nowhere canonical.
4. **V-07 counting-side term undefined.** Zero definitions anywhere.
5. **Incident policy absent.** `01`+`04` define the INCIDENT path with "policy-defined" dealer/score; profile has no incident block.
6. **First-dealer mechanism absent.** No field in `02.dealing`; OD-DL-02 never closed.
7. **Timeout policy absent.** No bidding/playing timeout rule anywhere canonical.
8. **Sun Double window fields absent.** `02.escalation.sun` has chain only.
9. **Frozen action catalog absent** (AD-01 open; RD-10 §5 mixes BUY_HOKUM with CALL_ASHKAL — P2 terminology inconsistency).
10. **Frozen event catalog absent** (AD-02/03/04 open).
11. **Cutting/Dag rule content absent** (open variant; gate criterion ungrounded).
12. **Must-Overtrump rule content absent** (`01` references the term only).
13. **Must-Trump definition absent** (OD-PL-02 never closed; 05-playing void rules pre-canonical).
14. **Ika decision trail absent + partner-exemption content absent** (`01` states Ika rules while Phase 15 §5 still lists Ika as needing a decision; gate's "partner exemption" appears only in the gate doc itself).
15. **Provenance gaps (no Owner-answer record on file):** project Triple/Four multipliers ×3/×4 (contradicts prior C-07 research cap with no visible adoption record), Hokum locked-lead mode, natural-exposed-Ace rule, max-2-projects number, incident path, V-06b, V-11.
16. **Bidding option sets/priorities still open** (OD-BD-02…05; Sun-priority override).
17. **Full Kasho/violation matrix beyond baseline open** (14 RD-09 items; only all-pass path + baseline closed) — plus project coexistence/tie edges, declaration-failure handling.

## Verification results by gate family

* **Dealing:** math verified (32 unique, 8×4, RD-01 splits, 20+1+11=32, Ashkal splits, Ace no-redeal stated). No engine/tests → behaves BLOCKED pending implementation.
* **Direction:** N→W→S→E verified in text (dealer N → W first; E = dealer-left per RD-10). Consistent.
* **Bidding:** structure verified; wire form + priorities open.
* **Escalation:** chains/window/ownership verified in text; Sun window fields + implementation missing.
* **Projects:** lifecycle/values/ranking/pool verified in text (05 table internally consistent; Sun/Hokum orders consistent with each other).
* **Baloot:** raw 20/qaid 2/×1/absorbed/Hokum-only/optional/second-card-timing verified consistent across 01+02.
* **Ika:** content present but trailless; partner-exemption missing → BLOCKED.
* **Legal moves:** `getLegalMoves` contract verified in text (actual cards, server recalculation); no implementation.
* **Scoring:** 130/162/thresholds/failure-transfer verified in text; conversion table missing → BLOCKED.
* **Kaboot:** normal values + derived-only + reverse predicate + Gahwa precedence verified; escalation formula contradicted (F-01) → BLOCKED.
* **Kasho:** baseline verified; full matrix open → BLOCKED.
* **Termination:** 7-path matrix verified consistent (01/04); no REDEAL phase anywhere — verified absent; incident policy missing; idempotency unproven (no code).

## STOP condition

Do not implement production behavior while blocked. Do not "fix" F-01 by editing any document — the Owner must select one V-04 answer and supersede the rest on record.

## Addendum — game/10 legal-move specification (14.Z.2; history above preserved)

`docs/game/10-legal-move-specification.md` (CANONICAL / FREEZE-READY CORE, documentation only) was accepted into the repo after forensic verification: consistent with the `01`/`02` pack, governance-clean, freeze-honest. Partially addresses P1 items #12 (Must-Overtrump content), #13 (Must-Trump definition/OD-PL-02 content), #14 (partner-exemption content) — each downgraded to P2 pending trail cleanup, which game/10 §33 itself lists as outstanding. New P2 edge gaps G-1/G-2/G-3 recorded in `REMAINING-ISSUES.md`. Overall verdict unchanged: `RULE_FREEZE = BLOCKED`.

---

## Phase 14.Z.3 Addendum — Canonicalization Complete

**Date:** 2026-09-22
**Scope:** G-1 / G-2 / G-2P / G-3 trick-legality edge gaps; V-07 terminology; Kasho dealer transition; V-04 stale Kaboot transcription.

### Resolved documentation conflicts

- **G-1 CLOSED:** partner-winning + trump-on-table is position/card-origin dependent. No forced overtrump against a partner's winning trump. Opponent-winning trump requires a higher trump for MUST_OVERTRUMP.
- **G-2 CLOSED:** Ika = Hokum + leader + non-trump + highest remaining card of that suit.
- **G-2P CLOSED:** third-player partner exemption requires partner-opened trick, partner winning, no lead suit, and partner lead Ace or valid Ika; result ANY_CARD including trump.
- **G-3 CLOSED:** legal-move verification matrix expanded to cover the canonical edge combinations.
- **V-07 CLOSED:** generic counting-side terminology removed in favor of precise allocation/ownership terminology.
- **Kasho dealer transition CLOSED:** ROTATE_RIGHT.
- **V-04 transcription reconciled:** canonical owner decision remains V-04=A, with explicit flat table Hokum 25/25/25/25 and Sun 44/44. Historical conflicting RD-09 text was superseded and the current RD-09 protocol was reconciled.

### Freeze impact

The Phase 14.Z.3 work does not authorize production implementation and does not change:

```text
RULE_FREEZE = BLOCKED
```

Remaining blockers are outside these trick-legality edge gaps, including exact conversion/complement rules, remaining bidding/incident/timeout decisions, architecture gates, frozen action/event catalogs, and implementation/test evidence.

The historical Phase 14.Z.1 and Phase 14.Z.2 findings remain preserved above; this addendum is the current canonical disposition.
