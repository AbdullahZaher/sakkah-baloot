# صكّة بلوت — Implementation Readiness Assessment

**Document:** `docs/FOUNDATION-IMPLEMENTATION-READINESS.md`
**Audit Phase:** 12
**Date:** 2026-09-21
**Policy:** DISCOVERY ONLY

---

## Overall Verdict

# NOT READY FOR RULE FREEZE

The Foundation contains 5 P0 blockers and 8 P1 critical cross-document issues.
The Rule Freeze Gate defined in `01-game-rules.md §52` CANNOT be passed in the current state.

---

## Rule Freeze Gate Checklist

From `01-game-rules.md §52`:

| Item | Status | Blocking Issue |
|---|---|---|
| Player count | READY | None |
| Teams | READY | None |
| Deck | READY | None |
| Card ranking | READY | None |
| Card values | BLOCKED | F-P0-001: Sun total discrepancy |
| Dealing | BLOCKED | F-P0-002: Card conservation failure; OD-DL-05: Direction |
| Dealer rotation | PARTIAL | OD-DL-02: First dealer undefined |
| Bidding | BLOCKED | F-P0-004, F-P0-005, F-P1-002, F-P1-003 |
| Sun | BLOCKED | F-P0-001: Sun total unclear |
| Hokm | PARTIAL | Mostly specified |
| Ashkal | BLOCKED | F-P1-004, F-P1-007, OD-BD-06, OD-BD-07 |
| Follow suit | PARTIAL | OD-PL-02: Trump obligation unresolved |
| Cutting | NOT READY | OD-GR-03 |
| Raising | NOT READY | OD-SC-17, OD-SC-18 |
| Projects | BLOCKED | OD-SC-03 through OD-SC-12, F-P1-005 |
| Baloot | BLOCKED | OD-SC-08, OD-SC-09 |
| Doubling | BLOCKED | F-P1-006, OD-SC-16, OD-SC-17, OD-SC-18 |
| Scoring | BLOCKED | F-P0-001, F-P0-002, OD-SC-01 through OD-SC-22 |
| Winning threshold | PARTIAL | OD-SC-20, OD-SC-21 |
| Tie handling | NOT READY | OD-SC-19, OD-GR-11 |
| Redeal | NOT READY | F-P1-008, OD-DL-01, OD-GR-04 |
| Forfeit | PARTIAL | Partially described in game-rules |
| Timeout behavior | PARTIAL | OD-PL-03 |

**Frozen items: 3 of 22 (14%)**
**Blocked items: 14 of 22 (64%)**
**Partial items: 5 of 22 (23%)**

---

## Component Readiness

### Game Engine Core
**Status: NOT READY**

Cannot begin until:
- Card point totals are verified (F-P0-001)
- Card dealing model closes on 32 cards (F-P0-002)
- Phase names are unified between game-state and transitions (F-P1-001)
- Play direction is resolved (F-P1-002)
- Action names are unified (F-P0-004)

### Card System Module
**Status: MOSTLY READY**

Can proceed with:
- Deck creation (32 cards, 4 suits, 8 ranks)
- Card identity (SUIT_RANK)
- Sun ranking (A > 10 > K > Q > J > 9 > 8 > 7)
- Trump ranking (J > 9 > A > 10 > K > Q > 8 > 7)
- Card object model

Blocked on:
- Final point values (F-P0-001)
- Ashkal contract representation (OD-CS-02)

### Dealing Module
**Status: BLOCKED**

Blocked on:
- Card conservation (F-P0-002)
- Play direction (F-P1-002)
- Exposed card fate (OD-DL-01)

### Bidding Module
**Status: BLOCKED**

Blocked on:
- Action naming (F-P0-004, F-P0-005)
- PASS vs PASS_FINAL (F-P0-005)
- Ashkal eligibility (F-P1-007)
- Redeal trigger (F-P1-008)

### Playing Module
**Status: PARTIALLY READY**

Can proceed with basic structures:
- Trick model (4 cards, winner tracking)
- Follow suit validation framework
- Card conservation during play

Blocked on:
- First trick leader (OD-PL-01 — depends on direction resolution)
- Trump obligation when void (OD-PL-02)
- Timeout policy (OD-PL-03)

### Scoring Module
**Status: BLOCKED**

Blocked on:
- Sun base total (F-P0-001)
- Kaboot action (F-P0-003)
- All project Qaid values (OD-SC-03 through OD-SC-07)
- Doubling window (F-P1-006)
- Baloot timing (OD-SC-08)

### State Machine
**Status: BLOCKED**

Blocked on:
- Phase name unification (F-P1-001)
- Redeal path (F-P1-008)
- Doubling transitions (F-P1-006)
- Project declaration phase transitions (F-P1-005)

### Actions Module
**Status: BLOCKED**

Blocked on:
- Action name unification (F-P0-004)
- PASS_FINAL definition (F-P0-005)
- Kaboot action definition (F-P0-003)

---

## What CAN Be Done Now

The Engineering Rule (`01-game-rules.md §53`) permits before Rule Freeze:
- Prototypes
- Rule simulations
- Tests
- Documentation
- UI exploration

The following work is safe to begin:

| Work | Safe? |
|---|---|
| Card identity system | YES |
| Deck creation function | YES |
| Sun/Trump ranking | YES |
| Card serialization | YES |
| Dealing structure/types | YES (structure only) |
| Unit tests for ranking | YES |
| UI exploration (non-authoritative) | YES |
| Bot skeleton (using getLegalActions framework) | YES |
| Simulation harness (inject rules) | YES |

| Work | Safe? |
|---|---|
| Scoring engine | NO — point totals unresolved |
| Bidding engine | NO — action names unresolved |
| State machine | NO — phase names unresolved |
| Dealing engine | NO — card conservation broken |
| Project system | NO — Qaid values unresolved |
| Doubling system | NO — window undefined |

---

## Recommended Next Steps

1. **Resolve F-P0-001** (Sun total) — Requires Rules Owner to confirm whether 130 includes last-trick bonus.
2. **Resolve F-P0-002** (Dealing accounting) — Requires Rules Owner to define exposed card fate.
3. **Resolve F-P0-004 + F-P0-005** (Action naming) — Engineering decision: adopt CALL_* or BUY_*; define PASS_FINAL.
4. **Resolve F-P1-001** (Phase names) — Engineering decision: adopt one canonical set.
5. **Resolve F-P1-002** (Play direction) — Rules Owner must confirm counter-clockwise.
6. **Resolve F-P0-003** (Kaboot action) — Engineering + Rules decision.

These 6 resolutions unblock the majority of the engine.

After those 6, the next priority is:
7. Ashkal full specification (OD-BD-06, OD-BD-07, F-P1-007)
8. Project Qaid values frozen (OD-SC-03 through OD-SC-07)
9. Doubling window specified (F-P1-006)
10. Baloot timing frozen (OD-SC-08, OD-SC-09)
