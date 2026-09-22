# صكّة بلوت — Risk Register

**Document:** `docs/FOUNDATION-RISK-REGISTER.md`
**Audit Phase:** 12
**Date:** 2026-09-21
**Policy:** DISCOVERY ONLY

---

## Risk Classification

| Likelihood | Impact | Risk Level |
|---|---|---|
| High | High | CRITICAL |
| High | Medium | HIGH |
| Medium | High | HIGH |
| Medium | Medium | MEDIUM |
| Low | High | MEDIUM |
| Low | Medium | LOW |

---

## CRITICAL Risks

---

### RR-001: Incorrect Score Computation Due to Sun Total Discrepancy

**Source:** F-P0-001
**Likelihood:** High (any implementation will use the documented 130)
**Impact:** High (every Sun round result will be wrong by 10 points)

**Description:**
If the engine implements Sun card total as 130 (as documented) but the correct value is 120, then:
- Purchaser success/failure evaluations will be wrong
- Qaid conversions will be wrong
- Match winners may be incorrectly determined
- Kaboot thresholds will be wrong

**Mitigation:** Resolve F-P0-001 before any scoring implementation.

---

### RR-002: Dealing Engine Produces Invalid State

**Source:** F-P0-002
**Likelihood:** High (math cannot close under current spec)
**Impact:** High (every game will fail the 32-card invariant)

**Description:**
The dealing sequence as documented produces 33 virtual cards, not 32. Any implementation following the spec will either:
- Fail the 32-card invariant check and throw an error
- Have an unaccounted card
- Silently corrupt game state

**Mitigation:** Resolve F-P0-002 (exposed card fate) before any dealing implementation.

---

### RR-003: Incompatible Action Types Between Bidding and Actions Systems

**Source:** F-P0-004
**Likelihood:** High (two teams will read two documents)
**Impact:** High (bidding engine and action handler will not interoperate)

**Description:**
If the bidding engine is implemented from `04-bidding.md` (BUY_*) and the action handler is implemented from `08-actions.md` (CALL_*), they will never match. The server will reject all bidding actions or accept the wrong ones.

**Mitigation:** Resolve F-P0-004 before any bidding implementation.

---

### RR-004: Phase State Mismatch at Integration

**Source:** F-P1-001
**Likelihood:** High (two documents define different phase enums)
**Impact:** High (game state, transitions, and events will use different strings)

**Description:**
The game state module and the state transitions module use different names for the same phases. If implemented from their respective documents, the engine will emit `PLAYING` phase events that the transition validator does not recognize (it expects `TRICK_PLAY`).

**Mitigation:** Resolve F-P1-001 before implementing state machine.

---

### RR-005: Turn Order Reversed Due to Direction Conflict

**Source:** F-P1-002
**Likelihood:** High (one document says clockwise, one says counter-clockwise)
**Impact:** High (all dealing, bidding, and playing order will be reversed)

**Description:**
If dealing is implemented as clockwise (as stated in `03-dealing.md`) but play is implemented as counter-clockwise (as stated in `01-game-rules.md`), cards will be dealt in the opposite direction from play. The first trick leader, bidding start player, and all turn-order calculations will be reversed.

**Mitigation:** Resolve F-P1-002 before any dealing or turn-order implementation.

---

## HIGH Risks

---

### RR-006: Kaboot Outcome Has No Code Path

**Source:** F-P0-003
**Likelihood:** High (Kaboot occurs in normal gameplay)
**Impact:** High (engine has no path to resolve the round when Kaboot occurs)

**Description:**
Kaboot (one team wins all 8 tricks) is a defined outcome with specific scoring. No action or event handles it. Without a Kaboot detection and scoring path, the engine will either:
- Attempt normal scoring and produce an incorrect result
- Fail to complete the round

---

### RR-007: PASS_FINAL Treated as Round-1 PASS

**Source:** F-P0-005
**Likelihood:** High (second round always ends with all-pass scenario)
**Impact:** High (redeal will never trigger; bidding will loop or fail)

---

### RR-008: Ashkal Eligibility Wrong Due to Direction

**Source:** F-P1-007
**Likelihood:** Medium (Ashkal is called infrequently)
**Impact:** High (wrong players can call Ashkal; game integrity compromised)

---

### RR-009: Project Declaration Phase Deadlocks

**Source:** F-P1-005
**Likelihood:** Medium (happens every round with projects)
**Impact:** High (game cannot proceed past PROJECT_DECLARATION)

**Description:**
The PROJECT_DECLARATION phase has no defined exit condition from within. Without defined transitions for DECLARE_PROJECT actions, the engine may never advance to TRICK_PLAY.

---

### RR-010: Doubling Can Be Called at Any Time

**Source:** F-P1-006
**Likelihood:** Medium (doubling is a common action)
**Impact:** High (doubling during an illegal phase corrupts scoring)

---

## MEDIUM Risks

---

### RR-011: Contract Type Mismatch at Ashkal

**Source:** F-P1-004
**Likelihood:** Medium
**Impact:** High (Ashkal contract will not carry exposed card receiver)

---

### RR-012: Replay Files Break If Phase Names Change

**Source:** F-P1-001
**Likelihood:** High (phase names are embedded in replay files)
**Impact:** Medium (old replays cannot be read with new phase names)

**Description:** If phase names are unified after any replay files are stored, old files will reference invalid phase strings.

**Mitigation:** Resolve phase names before any replay data is produced.

---

### RR-013: Scoring Produces Wrong Match Winner

**Source:** F-P0-001 (cascades)
**Likelihood:** High
**Impact:** High (players dispute results; trust lost)

---

### RR-014: Bot Has Wrong Turn Order

**Source:** F-P1-002
**Likelihood:** High (bot uses same turn-order logic as engine)
**Impact:** Medium (bot plays out of turn)

---

### RR-015: Test Suite Validates Wrong Values

**Source:** F-P0-001
**Likelihood:** High (tests will be written against documented values)
**Impact:** Medium (test suite will pass but validate wrong behavior)

---

## Risk Summary

| ID | Title | Level |
|---|---|---|
| RR-001 | Sun total — wrong scoring | CRITICAL |
| RR-002 | Dealing conservation — invalid state | CRITICAL |
| RR-003 | BUY vs CALL — integration failure | CRITICAL |
| RR-004 | Phase name mismatch — integration failure | CRITICAL |
| RR-005 | Play direction reversed | CRITICAL |
| RR-006 | Kaboot has no code path | HIGH |
| RR-007 | PASS_FINAL missing — redeal never triggers | HIGH |
| RR-008 | Ashkal eligibility wrong | HIGH |
| RR-009 | PROJECT_DECLARATION deadlock | HIGH |
| RR-010 | Doubling called at any phase | HIGH |
| RR-011 | Ashkal contract missing receiver | MEDIUM |
| RR-012 | Replay breaks on phase name change | MEDIUM |
| RR-013 | Wrong match winner | MEDIUM |
| RR-014 | Bot plays wrong turn order | MEDIUM |
| RR-015 | Test suite validates wrong values | MEDIUM |

**5 CRITICAL risks** — All must be resolved before any production implementation.
**5 HIGH risks** — All must be resolved before Rule Freeze.
**5 MEDIUM risks** — Must be resolved before production deployment.
