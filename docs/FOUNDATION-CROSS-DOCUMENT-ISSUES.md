# صكّة بلوت — Cross-Document Issues

**Document:** `docs/FOUNDATION-CROSS-DOCUMENT-ISSUES.md`
**Audit Phase:** 12
**Date:** 2026-09-21
**Policy:** DISCOVERY ONLY

---

## P0 Issues

See `FOUNDATION-CRITICAL-FINDINGS.md` for full P0/P1 detail.

| ID | Issue | Source A | Source B |
|---|---|---|---|
| F-P0-001 | Sun card total: stated 130, calculated 120 | 01-game-rules §6.1 | 06-scoring §8 |
| F-P0-002 | Dealing: 33 cards accounted, not 32 | 03-dealing §17-18 | 01-game-rules §41 |
| F-P0-003 | No Kaboot action defined | 06-scoring §41 | 08-actions (absent) |
| F-P0-004 | BUY_* vs CALL_* naming split | 04-bidding | 08-actions, 09-transitions |
| F-P0-005 | PASS_FINAL not in Actions | 04-bidding §15 | 08-actions §21 |

---

## P1 Issues

| ID | Issue | Source A | Source B |
|---|---|---|---|
| F-P1-001 | GamePhase enum diverges from state machine | 07-game-state §8 | 09-transitions §9 |
| F-P1-002 | Play direction: counter-clockwise vs clockwise | 01-game-rules §2.2 | 03-dealing §5 |
| F-P1-003 | Bidding start player ambiguity (direction-dependent) | 04-bidding §8 | 01-game-rules §2.2, 03-dealing §5 |
| F-P1-004 | Contract type has no canonical definition | 02-card-system §9 | 04-bidding §11 |
| F-P1-005 | PROJECT_DECLARATION phase has no internal transitions | 09-transitions §18-19 | 08-actions §27 |
| F-P1-006 | Doubling window undefined (phase, trigger, close) | 08-actions §29 | 09-transitions (absent) |
| F-P1-007 | Ashkal eligibility seat is direction-dependent | 04-bidding §12 | 01-game-rules §2.2 |
| F-P1-008 | Redeal path undefined in state transitions | 04-bidding §54 | 09-transitions (absent) |

---

## P2 Issues

| ID | Issue | Source |
|---|---|---|
| F-P2-001 | Ashkal contract: suit?:Suit vs purchaserSeat+receiverSeat | 02-card-system §9, 04-bidding §11 |
| F-P2-002 | Project declaration: 5-step lifecycle not modeled in state | 06-scoring §23, 07-game-state §22 |
| F-P2-003 | Doubling window: COFFEE terminal behavior not specified | 08-actions §33, 06-scoring |
| F-P2-004 | No invariants for project window, doubling, or negative score | 01-game-rules §41 |
| F-P2-005 | Hokm total framing: 162 in rules includes last trick, 152 in scoring excludes it | 01-game-rules §6.2, 06-scoring §8 |
| F-P2-006 | Baloot (K+Q trump) timing/declaration/cancellation unresolved | 06-scoring §20 |
| F-P2-007 | Project comparison tie-breaking algorithm not specified | 06-scoring §27 |
| F-P2-008 | Completion deal exposed-card receiver not specified in dealing doc | 03-dealing §18, 04-bidding §13 |
| F-P2-009 | RESYNC_GAME stateVersion behavior conflicts with monotonicity rule | 09-transitions §36, §6 |

---

## P3 Issues

| ID | Issue | Source |
|---|---|---|
| F-P3-001 | Hokm total presentation: 162 in rules (with bonus), 152 in scoring (without) — confusing but consistent | 01-game-rules §6.2, 06-scoring §8 |
| F-P3-002 | Kaboot values (25 Hokm, 44 Sun) are draft — not frozen | 06-scoring §41 |
| F-P3-003 | Winning threshold 152 not named as Qaid vs raw card points | 01-game-rules §4 |
| F-P3-004 | First dealer mechanism entirely undefined | 03-dealing §8 |
| F-P3-005 | Bot legal action API not cross-referenced between playing and actions docs | 05-playing §50, 08-actions |
| F-P3-006 | Simulation requirements in §49 reference 100,000 hands but this is not tied to a test framework | 01-game-rules §49 |
| F-P3-007 | clientSequence vs actionId: two idempotency mechanisms with overlapping purpose | 08-actions §4, §6 |

---

## P4 Issues

| ID | Issue | Source |
|---|---|---|
| F-P4-001 | Arabic suit labels in card-system §3.1 use colloquial names not yet approved | 02-card-system §3.1 |
| F-P4-002 | BUY_HOKM_EXPOSED_SUIT name is verbose and may not survive freeze | 04-bidding |
| F-P4-003 | citeturn0searchN citation markers embedded in markdown are not usable references | 04-bidding, 06-scoring |
| F-P4-004 | Dealing doc lists REVEALED_CARD as a zone but card-system does not | 03-dealing §20, 02-card-system §20 |
| F-P4-005 | Timestamp/date in product-vision.md (2026-09-21) — verify this is intended | 01-product-vision |

---

## Cross-Document Reference Map

Which documents depend on which:

```
01-game-rules
    └── Referenced by: ALL

02-card-system
    └── Depends on: 01-game-rules
    └── Provides to: 03-dealing, 04-bidding, 05-playing, 06-scoring, 07-game-state, 08-actions, 09-transitions

03-dealing
    └── Depends on: 01-game-rules, 02-card-system
    └── Provides to: 04-bidding, 07-game-state, 09-transitions

04-bidding
    └── Depends on: 01-game-rules, 02-card-system, 03-dealing
    └── Provides to: 05-playing, 06-scoring, 07-game-state, 08-actions, 09-transitions

05-playing
    └── Depends on: 01-game-rules, 02-card-system, 04-bidding
    └── Provides to: 06-scoring, 07-game-state, 08-actions, 09-transitions

06-scoring
    └── Depends on: 01-game-rules, 02-card-system, 04-bidding, 05-playing
    └── Provides to: 07-game-state, 09-transitions

07-game-state
    └── Depends on: ALL game docs
    └── Provides to: 08-actions, 09-transitions

08-actions
    └── Depends on: ALL game docs
    └── Should be canonical source for action types

09-transitions
    └── Depends on: ALL game docs
    └── Should be canonical source for phase names
```

**Conflict zones:** Anywhere 04-bidding and 08-actions overlap (action names). Anywhere 07-game-state and 09-transitions overlap (phase names). Anywhere 01-game-rules and 03-dealing overlap (direction).
