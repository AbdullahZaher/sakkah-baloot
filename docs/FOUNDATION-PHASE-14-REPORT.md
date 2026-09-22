# Phase 14 — Canonical Rule Resolution Report

**Document:** `docs/FOUNDATION-PHASE-14-REPORT.md`
**Phase:** 14 — Canonical Rule Resolution (decision capture only)
**Date:** 2026-09-22
**Policy:** CAPTURE ONLY. No Baloot rule invented. No architecture decision resolved. No Rule Freeze declared.

---

## 1. Executive Status

**RULE RESOLUTION IN PROGRESS**

Phase 14 established the canonical decision-capture layer: what is already canonical is inventoried, every open rule has a decision sheet addressed to the Rules Owner, every Rule Profile gap is registered, and all 71 catalogue items have a disposition. No decision was supplied in this phase — all RD sheets read OPEN — so Freeze remains blocked by Owner input, not by analysis.

---

## 2. Rules Already Canonical

Evidence status **A** (explicit Foundation fact), inventoried in `FOUNDATION-CANONICAL-RULE-INVENTORY.md`:

* Players, seats, teams and fixed partnerships.
* 32-card deck, suits, ranks, canonical `SUIT_RANK` identity.
* Sun ranking (A>10>K>Q>J>9>8>7) and Trump ranking (J>9>A>10>K>Q>8>7).
* Sun and Trump card-value tables; Sun arithmetic 120/+10/130 (transcription via DF-01/DF-02 pending EC-01 confirmation); Hokm 152/+10/162.
* Dealing structure (3+2=5, exposed card, completion to 8, 32-card conservation invariant) — minus fate/timing/direction/first-dealer.
* Bidding two-round structure and BIDDING_FAILED path existence — minus option sets, priorities, wire form.
* Ashkal convention shape (Sun-style; caller ≠ receiver; receiver = partner's seat).
* Follow-suit core, 8-trick lifecycle, trick-winner logic, winner-leads-next.
* Last-trick bonus (+10, once, Scoring-owned).
* Project types, sequence ranking, non-overlap principle; DECLARE_PROJECT action shape; lifecycle phase framing.
* Baloot combination (K+Q trump, 2 Qaid, multiplier-excluded).
* Kaboot outcome definition (8–0) and server-derived detection (no player action).
* Doubling model (levels, ×1–×4, Coffee-as-distinct-state, Baloot/Kaboot-base exclusions).
* Scoring architecture (raw vs Qaid, pipeline order, SUCCESS/DRAW/FAILURE shape, integer arithmetic).
* Match target 152 Qaid points («152 نقطة قيد», `01-game-rules.md §4`).
* Match-end flow, redeal-path existence, state mechanics (versioning, idempotency, RESYNC exclusion, atomic commit).
* Universal server authority, hidden-information projection, determinism.

---

## 3. Decisions Requiring Rules Owner

All OPEN — BLOCKED BY OWNER. Full sheets in `FOUNDATION-RULE-OWNER-DECISIONS.md`:

| ID | Decision | Freeze-blocking |
|---|---|---|
| EC-01 | Sun total editorial confirmation (not a choice) | YES (transcription) |
| RD-01 | Exposed card fate after bidding | YES |
| RD-02 | Play direction (root; CW vs CCW + per-subsystem scope) | YES |
| RD-03 | Doubling window (open / callers / close / contract scope) | YES |
| RD-04 | Coffee terminal behavior + win condition | YES |
| RD-05 | Project declaration window (open / order / NONE / close) | YES |
| RD-06 | Project Qaid (+ raw) values incl. 400 scope | YES |
| RD-07 | Kaboot Qaid values + project interaction | YES |
| RD-08 | Baloot timing + miss behavior + coexistence | YES |
| RD-09 | Redeal procedure (dealer / seating / penalty / cap) | YES |
| RD-10 | Ashkal eligibility seats | YES |

Plus wider-catalogue Owner items from §8 (Ika formula, cutting/dag, Kawesh/Saneen, tie-breaks, conversion exactness, first dealer, timeout policy, void-trump obligation, project edge cases).

---

## 4. Decisions Resolved by Explicit Foundation Evidence

* **Sun arithmetic** — resolved by the card-value tables (120/+10/130); transcription only.
* **152 threshold units** — resolved: Qaid (`01-game-rules.md §4`).
* **Kaboot detection mode** — resolved: server-derived outcome (no claim mechanic exists; scoring consumes trick counts). Values remain RD-07.
* **RESYNC/stateVersion** — resolved: read operation, no increment (`09-state-transitions.md §36`; F-P2-009 stays retracted).
* **Bidding-start / first-leader seat derivation rule** — the "right of dealer" rule is stated; only its seat mapping awaits RD-02 (derivation, not a new decision).
* **Hokm totals framing** — resolved: 152 base / 162 with bonus are consistent presentations.

---

## 5. Decisions Requiring External Authority

**None as primary disposition.** Every open item can be decided by the Rules Owner as a house rule for `saudi-standard-v1`. External Baloot sources (e.g. Saudi federation references, published rule descriptions already cited as research inputs) may *inform* RD-02, RD-06, RD-07, RD-10 and OD-CS-01/OD-BD-01 (Rule Profile source adoption) — but adoption is the Owner's act, and no internet consensus, forum opinion, or popularity vote is authoritative. If the Owner adopts an external source, its identity and version must be recorded in the Rule Profile (`ruleProfileId`) per `01-game-rules.md §1.3`.

---

## 6. Rule Profile Parameters

Full table in `FOUNDATION-RULE-PROFILE-GAPS.md` (§8 map). Parameter hooks that exist vs are missing:

* Exist: `direction` (value contradicted), `canCallAshkal` (implementation missing), draft project/Kaboot tables (values missing), `winningScore: 152` (canonical), RuleProfile shell (`01-game-rules.md §43`).
* Missing and must be named: `doublingWindowPolicy` key, first-dealer mechanism + hook, Coffee win/terminal fields, redeal procedure fields, declaration close-condition fields, Baloot window fields, tie policies, conversion/rounding rules, exposed-card fate rule (rule must precede any hook).

---

## 7. Dependencies

```
RD-02 → bidding-start seat · first-leader seat · dealer rotation ·
        RD-09 (redeal rotation) · RD-10 (Ashkal seats) ·
        project seat-priority · order-relative timeout/doubling edges
RD-03 → RD-04 (Coffee inside the window)
RD-01 → completion counts · Ashkal-receiver consistency
RD-05 → trick-play entry; RD-08 interplay if window shared
EC-01 → DF-01/DF-02 → scoring freeze
RD-06 → RD-07 interaction · conversion interplay
```

Architecture dependencies (referenced, NOT resolved): AD-01 needs RD-09/RD-10 content for completeness; AD-02/03/04 gate the event schema independently of rule content; AD-05 needs RD-10 representation content. Full graph in `FOUNDATION-RULE-PROFILE-GAPS.md`.

---

## 8. 71-Item Catalogue Disposition

Complete accounting of `FOUNDATION-OPEN-DECISIONS.md` (71 items; none deleted). Categories: **1** MUST RESOLVE BEFORE RULE FREEZE · **2** CAN BE RULE PROFILE PARAMETER · **3** CAN BE DERIVED FROM EXISTING RULES · **4** DOCUMENTATION-ONLY · **5** ARCHITECTURE DECISION · **6** PRODUCT/UX (outside game rules) · **7** EXTERNAL SOURCE REQUIRED · **8** DUPLICATE / ALREADY RESOLVED.

### Card System (7)

| ID | Disposition | Note |
|---|---|---|
| OD-CS-01 | 1 | Owner adopts the authoritative source (may cite external authority; adoption is Owner's act) |
| OD-CS-02 | 1 | → RD-10 representation content |
| OD-CS-03 | 2 | Confirm none exist, or parameterize explicitly |
| OD-CS-04 | 1 | Project combination edge cases |
| OD-CS-05 | 1 | → RD-08 |
| OD-CS-06 | 5 | Wire-format concern |
| OD-CS-07 | 5 | Replay storage design |

### Dealing (5)

| ID | Disposition | Note |
|---|---|---|
| OD-DL-01 | 1 | → RD-01 |
| OD-DL-02 | 1 | First-dealer mechanism (+ hook name) |
| OD-DL-03 | 2 | 3+2 split confirmation / parameterization |
| OD-DL-04 | 1 | Exposed-card timing (conservation-relevant) |
| OD-DL-05 | 1 | → RD-02 |

### Bidding (15)

| ID | Disposition | Note |
|---|---|---|
| OD-BD-01 | 1 | Same authority as OD-CS-01 |
| OD-BD-02 | 1 | First-round option set |
| OD-BD-03 | 1 | First-round Sun priority/override |
| OD-BD-04 | 1 | Second-round option set |
| OD-BD-05 | 1 | Second-round Sun/Hokm priority |
| OD-BD-06 | 1 | → RD-10 |
| OD-BD-07 | 1 | → RD-10 (behavior/outcome) |
| OD-BD-08 | 1 | Ashkal timing restrictions |
| OD-BD-09 | 1 | Exposed Ace / special-case bidding |
| OD-BD-10 | 5 | → AD-01 (wire representation; rule semantics stay in RD-09) |
| OD-BD-11 | 1 | → RD-09 |
| OD-BD-12 | 1 | Kawesh/Saneen include-or-not |
| OD-BD-13 | 1 | Bidding timeout behavior |
| OD-BD-14 | 1 | Bidding↔doubling relation → RD-03 |
| OD-BD-15 | 4 | → DF-04 cross-reference note |

### Playing (4)

| ID | Disposition | Note |
|---|---|---|
| OD-PL-01 | 3 | "Right of dealer" stated; seat derives from RD-02 |
| OD-PL-02 | 1 | Void-trump obligation vs option |
| OD-PL-03 | 1 | Timeout auto-action policy |
| OD-PL-04 | 1 | Last-trick bonus uniformity across contracts |

### Scoring (22)

| ID | Disposition | Note |
|---|---|---|
| OD-SC-01 | 4 | Arithmetic; EC-01 confirmation only |
| OD-SC-02 | 4 | Arithmetic; 120 base / 130 total |
| OD-SC-03 | 1 | → RD-06 |
| OD-SC-04 | 1 | → RD-06 |
| OD-SC-05 | 1 | → RD-06 |
| OD-SC-06 | 1 | Four Aces in Hokm |
| OD-SC-07 | 1 | 400 in Hokm |
| OD-SC-08 | 1 | → RD-08 |
| OD-SC-09 | 1 | → RD-08 (miss behavior) |
| OD-SC-10 | 1 | Baloot coexistence |
| OD-SC-11 | 1 | Project tie-break algorithm |
| OD-SC-12 | 1 | Non-overlap/coexistence rules |
| OD-SC-13 | 8 | Detection settled (derived outcome); values → RD-07 |
| OD-SC-14 | 1 | → RD-07 |
| OD-SC-15 | 1 | Kaboot × project interaction → RD-07 |
| OD-SC-16 | 1 | → RD-03 |
| OD-SC-17 | 1 | → RD-04 |
| OD-SC-18 | 1 | Doubling × Kaboot → RD-03/RD-07 |
| OD-SC-19 | 1 | Tie-after-double rule |
| OD-SC-20 | 8 | Resolved: 152 Qaid (`01-game-rules.md §4`) |
| OD-SC-21 | 1 | Both-teams-cross rule |
| OD-SC-22 | 1 | Negative-score floor |

### Game State & Actions (5)

| ID | Disposition | Note |
|---|---|---|
| OD-GS-01 | 5 | → AD-02 |
| OD-GS-02 | 5 | → AD-03 |
| OD-GS-03 | 5 | → AD-04 |
| OD-GS-04 | 5 | Spectator projection design |
| OD-GS-05 | 8 | Retracted false finding (F-P2-009) |

### General / Game Rules (13)

| ID | Disposition | Note |
|---|---|---|
| OD-GR-01 | 1 | Ika bidding formula |
| OD-GR-02 | 8 | Duplicate of RD-10 scope |
| OD-GR-03 | 1 | Cutting/dag edge cases |
| OD-GR-04 | 8 | Duplicate of RD-09 scope (Takkwish/redeal) |
| OD-GR-05 | 8 | Duplicate of OD-SC-11 scope |
| OD-GR-06 | 8 | Duplicate of RD-05 scope |
| OD-GR-07 | 8 | Duplicate of RD-08 scope |
| OD-GR-08 | 8 | Duplicate of RD-03/RD-04 scope |
| OD-GR-09 | 1 | Project doubling at escalation levels |
| OD-GR-10 | 8 | Duplicate of RD-07 scope (Kaboot; reverse-Kaboot content folds into RD-07 interaction) |
| OD-GR-11 | 1 | Residual tie cases (beyond OD-SC-19) |
| OD-GR-12 | 1 | Hokm↔Sun edge transitions |
| OD-GR-13 | 1 | Sakkah-specific deviations register |

### Tally

| Category | Count |
|---|---|
| 1 — MUST RESOLVE BEFORE RULE FREEZE | 48 |
| 2 — CAN BE RULE PROFILE PARAMETER | 2 |
| 3 — CAN BE DERIVED FROM EXISTING RULES | 1 |
| 4 — DOCUMENTATION-ONLY | 3 |
| 5 — ARCHITECTURE DECISION | 7 |
| 6 — PRODUCT/UX (outside game rules) | 0 |
| 7 — EXTERNAL SOURCE REQUIRED (primary) | 0 (external sources may inform per §5; Owner decides) |
| 8 — DUPLICATE / ALREADY RESOLVED | 10 |
| **TOTAL** | **71** |

---

## 9. Architecture Dependencies

Referenced without resolution (AD-01…AD-05 owned by `FOUNDATION-ARCHITECTURE-DECISIONS.md`):

* **AD-01** (PASS vs PASS_FINAL) — waits only on RD-09/RD-10 content for completeness; wire choice is engineering's.
* **AD-02** (canonical GamePhase) — gates event schema / wire protocol / replay format; independent of rule content; highest architecture priority.
* **AD-03 / AD-04** (COMPLETE_DEAL / MATCH_END_CHECK visibility) — same schema impact, narrower scope.
* **AD-05** (contract layers) — waits on RD-10 representation content; no urgency.

Rule resolution does not pre-select any AD option. Phase 15 (Freeze Audit) must confirm AD-02/03/04 closure for protocol finalization, separately from rule content.

---

## 10. Rule Freeze Blockers

Exactly what still prevents Freeze (no more, no less):

1. EC-01 confirmation + DF-01/DF-02 transcription (Sun totals in text).
2. RD-01 exposed-card fate (dealing).
3. RD-02 direction (all order).
4. RD-03/04 doubling + Coffee.
5. RD-05 declaration window.
6. RD-06/07 project + Kaboot values (drafts unpromotable).
7. RD-08 Baloot timing.
8. RD-09 redeal procedure.
9. RD-10 Ashkal seats.
10. Wider catalogue Category-1 items: Ika (GR-01), cutting/dag (GR-03), Kawesh/Saneen (BD-12), exposed-Ace (BD-09), option sets + priorities (BD-02…05, BD-08), timeout policies (BD-13, PL-03), void obligation (PL-02), bonus uniformity (PL-04), 400/Aces scope (SC-06/07), Baloot coexistence (SC-10), comparison/overlap (SC-11/12), Kaboot interactions (SC-15/18), ties (SC-19/21, GR-11), negative floor (SC-22), conversion exactness, first dealer (DL-02), exposed timing (DL-04), escalation projects (GR-09), Hokm↔Sun edges (GR-12), Sakkah deviations (GR-13).
11. Architecture-side protocol gates AD-02/03/04 (+ AD-01/05 for completeness) — separate track, not rule content.

---

## 11. Safe Next Step

**Phase 15 must be a Freeze Audit, not implementation.** Entry criteria: every §10 blocker answered by the Rules Owner (or adopted authority with recorded provenance), DF-01…DF-08 transcribed into the Foundation documents, AD-02/03/04 closed for the event schema. The Freeze Audit then verifies: each answer traced to its sheet, each transcription exact, replay/version policy updated per `01-game-rules.md §50`, and the Rule Freeze Gate (`01-game-rules.md §52`) re-checked item by item. Until then, only Phase-13.5-cleared safe work (card identity, ranking, deterministic infrastructure, UI exploration, simulation harness) may proceed — `01-game-rules.md §53` remains in force.

**Phase 14 output:** decision capture complete. Rules explicit, none invented. DISCOVER → EVIDENCE → DECISION CAPTURE done; CANONICALIZATION awaits the Owner.
