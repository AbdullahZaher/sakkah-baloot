# صكّة بلوت — Foundation Forensic Audit

**Audit Phase:** 12
**Document:** `docs/FOUNDATION-AUDIT.md`
**Audit Type:** Cross-Document Forensic Audit — DISCOVERY ONLY
**Status:** COMPLETE — NOT YET RESOLVED
**Auditor Role:** Principal Game Engineer + Game Systems Architect + Rules Engineer + Distributed Systems Reviewer
**Date:** 2026-09-21

---

## Audit Policy

- NO implementation
- NO rule invention
- NO silent correction of documents
- NO resolution of OPEN_DECISION items
- DISCOVERY only — findings are catalogued, not fixed

---

## Scope

Documents audited:

| Doc | File |
|---|---|
| 01 | `docs/game/01-game-rules.md` (1547 lines) |
| 02 | `docs/game/02-card-system.md` (1736 lines) |
| 03 | `docs/game/03-dealing.md` (1305 lines) |
| 04 | `docs/game/04-bidding.md` |
| 05 | `docs/game/05-playing.md` |
| 06 | `docs/game/06-scoring.md` |
| 07 | `docs/game/07-game-state.md` |
| 08 | `docs/game/08-actions.md` |
| 09 | `docs/game/09-state-transitions.md` |
| P1 | `docs/product/01-product-vision.md` |
| P2 | `docs/product/02-product-scope.md` |

---

## Finding Summary by Severity

| Severity | Count |
|---|---|
| P0 — Blocker | 5 |
| P1 — Critical | 8 |
| P2 — Major | 9 |
| P3 — Moderate | 7 |
| P4 — Low | 5 |
| **Total** | **34** |

See `FOUNDATION-CRITICAL-FINDINGS.md` for P0/P1 details.
See `FOUNDATION-CROSS-DOCUMENT-ISSUES.md` for full cross-referenced list.
See `FOUNDATION-OPEN-DECISIONS.md` for open decisions catalogue.
See `FOUNDATION-RISK-REGISTER.md` for risk assessment.
See `FOUNDATION-IMPLEMENTATION-READINESS.md` for readiness verdict.

---

## Stage 1 — Repository Integrity

**Result: PASS (with notes)**

- 11 Foundation documents present and accounted for.
- Consolidation report verifies MD5 integrity.
- All documents marked "Draft for Review — NOT FROZEN".
- No production code exists (correct per `01-game-rules.md §53`).
- No Rule Freeze Gate has been executed.

---

## Stage 2 — Document Coverage Completeness

**Result: PARTIAL**

- 9/11 game-domain documents cover required areas.
- Project declaration lifecycle is spread across 3 documents with no unified state model.
- KABOOT has no action defined in `08-actions.md`.
- `07-game-state.md` GamePhase enum diverges materially from `09-state-transitions.md` state machine.

---

## Stage 3 — Mathematical Integrity

**Result: FAIL — Two confirmed arithmetic discrepancies**

### A. Sun Card-Point Total (F-P0-001)

`01-game-rules.md §6.1` and `06-scoring.md §8` both state Sun card total = **130** before last-trick bonus.

Manual calculation from the documented card values:
```
4 suits × (A=11 + 10=10 + K=4 + Q=3 + J=2 + 9=0 + 8=0 + 7=0)
= 4 × 30 = 120
```

Discrepancy: documented 130 vs calculated 120.

Additionally, `01-game-rules.md §6.1` then states "+10 for the final trick → 140 total". If 130 already includes the last trick, adding 10 again would be double-counting.

### B. Dealing Card Conservation (F-P0-002)

`03-dealing.md §17–18` states:
```
Initial deal: 5 × 4 = 20 cards
Exposed card: 1 card
Deck remainder: 11 cards
Completion deal: 3 × 4 = 12 cards needed
```

Cards accounted: 20 + 1 + 12 = **33 ≠ 32**.

The exposed card fate is undefined. The document says the exposed card is not part of any player's hand and not part of the deck, but the completion deal does not account for it, creating a 1-card deficit.

---

## Stage 4 — Terminology Consistency

**Result: FAIL — Critical naming conflict (F-P1-002)**

Bidding action names differ between `04-bidding.md` and `08-actions.md`:

| 04-bidding.md | 08-actions.md |
|---|---|
| BUY_HOKM_EXPOSED_SUIT | CALL_TRUMP |
| BUY_SUN | CALL_SUN |
| BUY_ASHKAL | CALL_ASHKAL |
| BUY_HOKM (2nd round) | CALL_TRUMP |
| PASS_FINAL | PASS |

`09-state-transitions.md` uses the `CALL_*` naming from `08-actions.md`. There is no canonical resolution between `BUY_*` and `CALL_*`.

---

## Stage 5 — Phase Naming Consistency

**Result: FAIL — Material divergence (F-P1-001)**

`07-game-state.md` GamePhase enum vs `09-state-transitions.md` state machine:

| Phase | In game-state | In transitions |
|---|---|---|
| WAITING_FOR_PLAYERS | YES | NO |
| ROUND_STARTING | YES | NO |
| PLAYING | YES | NO (uses TRICK_PLAY) |
| SCORING | YES | NO (uses ROUND_SCORING) |
| ROUND_COMPLETE | YES | NO |
| MATCH_COMPLETE | YES | NO (uses GAME_RESULT) |
| CANCELLED | YES | NO |
| GAME_CREATED | NO | YES |
| COMPLETE_DEAL | NO | YES |
| MATCH_END_CHECK | NO | YES |
| GAME_RESULT | NO | YES |

7 phases exist only in game-state; 4 phases exist only in transitions.

---

## Stage 6 — Play Direction Consistency

**Result: FAIL (F-P1-003)**

`01-game-rules.md §2.2`: Play direction is **counter-clockwise**.

`03-dealing.md §5`: Baseline direction is **clockwise** (NORTH → EAST → SOUTH → WEST).

NORTH → EAST → SOUTH → WEST is clockwise in standard top-down card game layout. This directly contradicts the Game Rules.

`05-playing.md §6` states "player to the dealer's right" as first trick leader — consistent with counter-clockwise play, but contradicts the dealing direction stated in `03-dealing.md`.

---

## Stage 7 — Contract Representation Consistency

**Result: INCONSISTENT (F-P2-001)**

`02-card-system.md §9`:
```
{ type: "ASHKAL"; suit?: Suit }
```

`04-bidding.md §11`:
```
AshkalContract { type: "ASHKAL"; purchaserSeat: Seat; exposedCardReceiverSeat: Seat }
```

No unified canonical Contract type exists across documents.

---

## Stage 8 — Scoring Architecture

**Result: PARTIALLY SPECIFIED**

### Hokm Total

`01-game-rules.md §6.2`: 162 (with last trick included in sum)
`06-scoring.md §8`: 152 before last trick bonus

Math: 152 + 10 = 162. These are consistent. The difference is presentational framing only. Finding: F-P3-001.

### Kaboot (F-P0-003)

Kaboot is defined in `06-scoring.md §41` as a game outcome (Hokm Kaboot=25, Sun Kaboot=44 — both draft).
No KABOOT or CLAIM_KABOOT action is defined in `08-actions.md`.
Whether Kaboot is server-detected (no client action needed) or client-claimed is not specified.

---

## Stage 9 — Action Coverage

**Result: FAIL**

Missing or ambiguous actions:
1. No KABOOT action (F-P0-003)
2. No PASS_FINAL vs PASS distinction (F-P1-004)
3. Doubling window not specified (F-P2-003)

---

## Stage 10 — Bidding Flow

**Result: PARTIALLY CONSISTENT (F-P1-004)**

`04-bidding.md` defines two bidding rounds with PASS_FINAL in round 2.
`08-actions.md` defines only PASS — no PASS_FINAL.
Transition matrix does not distinguish first-round PASS from second-round PASS.

---

## Stage 11 — Project Declaration Lifecycle

**Result: INCOMPLETE (F-P2-002)**

`06-scoring.md §23` lifecycle: DETECTED → ANNOUNCED → REVEALED → COMPARED → AWARDED/DISCARDED

`07-game-state.md §22` defines ProjectState but not this full lifecycle as typed fields.

`09-state-transitions.md` shows PROJECT_DECLARATION phase but no internal transitions for DECLARE_PROJECT actions within it.

---

## Stage 12 — Doubling Lifecycle

**Result: PARTIALLY SPECIFIED (F-P2-003)**

DOUBLE / TRIPLE / QUADRUPLE / COFFEE defined across `06-scoring.md` and `08-actions.md`.

Not specified anywhere:
- Exact game lifecycle phase when doubling is legal
- Whether COFFEE terminates the doubling window
- Doubling interaction with KABOOT

---

## Stage 13 — Server Authority

**Result: CONSISTENT**

All documents correctly position the server as sole authority. No contradiction found.

---

## Stage 14 — Invariant Coverage

**Result: INCOMPLETE (F-P2-004)**

`01-game-rules.md §41` defines core invariants.
The 32-card conservation invariant is stated but fails under current dealing arithmetic (F-P0-002).
No invariants cover: project declaration window state, doubling state machine, or negative score results.

---

## Stage 15 — Open Decisions Catalogue

**Result: CATALOGUED**

See `docs/FOUNDATION-OPEN-DECISIONS.md`.
Total open decisions: 47

---

## Stage 16 — Final Risk Assessment

**Verdict: NOT READY FOR RULE FREEZE**

- 5 P0 blockers: incorrect game outcomes if implemented as-is
- 8 P1 critical issues: cross-component failures at integration
- 47 open decisions: require Product/Rules Owner resolution

Engineering Rule from `01-game-rules.md §53` remains in force:
> No production Game Engine may be written before Rule Freeze Gate is passed.

---

## Audit Sign-Off

| Stage | Status |
|---|---|
| 1. Repository Integrity | PASS |
| 2. Document Coverage | PARTIAL |
| 3. Mathematical Integrity | FAIL |
| 4. Terminology Consistency | FAIL |
| 5. Phase Naming Consistency | FAIL |
| 6. Play Direction Consistency | FAIL |
| 7. Contract Representation | INCONSISTENT |
| 8. Scoring Architecture | PARTIAL |
| 9. Action Coverage | FAIL |
| 10. Bidding Flow | PARTIAL |
| 11. Project Declaration Lifecycle | INCOMPLETE |
| 12. Doubling Lifecycle | PARTIAL |
| 13. Server Authority | CONSISTENT |
| 14. Invariant Coverage | INCOMPLETE |
| 15. Open Decisions | CATALOGUED |
| 16. Final Risk Assessment | NOT READY |
