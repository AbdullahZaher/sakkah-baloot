# صكّة بلوت — Open Decisions

**Document:** `docs/FOUNDATION-OPEN-DECISIONS.md`
**Audit Phase:** 12
**Date:** 2026-09-21
**Policy:** DISCOVERY ONLY — Items listed here are NOT resolved. They require Product/Rules Owner decision before Rule Freeze.

---

## How to Read This Document

Each open decision has:
- An ID
- The documents where the gap appears
- A description of what must be decided
- Whether it is blocking (P0/P1) or non-blocking

DO NOT invent answers to these. DO NOT assume. Mark implementation against any of these as OPEN_DECISION.

---

## Category 1: Card System (from 02-card-system.md §52)

| ID | Decision | Blocking? |
|---|---|---|
| OD-CS-01 | Final official Rule Profile source/adoption | P0 |
| OD-CS-02 | Exact Ashkal contract representation | P1 |
| OD-CS-03 | Any card-level scoring exceptions not in tables | P2 |
| OD-CS-04 | Project card-combination edge cases | P2 |
| OD-CS-05 | Baloot declaration details | P1 |
| OD-CS-06 | Whether integer card IDs are used on the wire | P3 |
| OD-CS-07 | Replay: store seed, shuffle transcript, or both | P3 |

---

## Category 2: Dealing (from 03-dealing.md + audit)

| ID | Decision | Blocking? |
|---|---|---|
| OD-DL-01 | **Exact fate of the exposed card after bidding** — does it go to purchaser, partner, or back to deck? | P0 |
| OD-DL-02 | First dealer selection mechanism for a new match | P3 |
| OD-DL-03 | Exact 3+2 vs other initial deal split if not 3+2 | P2 |
| OD-DL-04 | Exact position of exposed card in dealing sequence (before or after 3+2 split) | P1 |
| OD-DL-05 | Play direction: counter-clockwise (Game Rules) vs clockwise (Dealing doc) | P0 |

---

## Category 3: Bidding (from 04-bidding.md §54)

| ID | Decision | Blocking? |
|---|---|---|
| OD-BD-01 | Exact official Saudi Rule Profile source/adoption | P0 |
| OD-BD-02 | Exact first-round option set | P1 |
| OD-BD-03 | Exact first-round Sun priority/override behavior | P1 |
| OD-BD-04 | Exact second-round option set | P1 |
| OD-BD-05 | Exact second-round Sun/Hokm priority | P1 |
| OD-BD-06 | Exact Ashkal eligibility seats | P1 |
| OD-BD-07 | Exact Ashkal behavior and contract outcome | P1 |
| OD-BD-08 | Exact Ashkal timing restrictions | P1 |
| OD-BD-09 | Exposed Ace or special-case bidding rules | P2 |
| OD-BD-10 | Exact pass semantics: single PASS type vs PASS/PASS_FINAL | P0 |
| OD-BD-11 | Exact redeal behavior after all-pass in round 2 | P1 |
| OD-BD-12 | Kawesh/Saneen variant (include or not) | P2 |
| OD-BD-13 | Exact bidding timeout behavior | P2 |
| OD-BD-14 | Relation between bidding completion and doubling availability | P1 |
| OD-BD-15 | Canonical action name: BUY_* or CALL_* | P0 |

---

## Category 4: Playing (from 05-playing.md + audit)

| ID | Decision | Blocking? |
|---|---|---|
| OD-PL-01 | Exact first trick leader rule (right of dealer — but direction is unresolved) | P0 |
| OD-PL-02 | Trump obligation when void: must play trump or optional? | P1 |
| OD-PL-03 | Timeout action: auto-play, lowest card, random, forfeit, or bot | P2 |
| OD-PL-04 | Last trick bonus: is it 10 for all contracts or contract-specific? | P1 |

---

## Category 5: Scoring (from 06-scoring.md + audit)

| ID | Decision | Blocking? |
|---|---|---|
| OD-SC-01 | **Sun base card total: 120 (calculated) or 130 (documented)?** | P0 |
| OD-SC-02 | **Does the Sun 130 total include or exclude the last-trick bonus?** | P0 |
| OD-SC-03 | Final Qaid values for سرا in Hokm and Sun | P1 |
| OD-SC-04 | Final Qaid values for خمسين in Hokm and Sun | P1 |
| OD-SC-05 | Final Qaid values for مية in Hokm and Sun | P1 |
| OD-SC-06 | Four Aces in Hokm: is it مية or a different project? | P1 |
| OD-SC-07 | أربعمية in Hokm: allowed or Sun-only? | P1 |
| OD-SC-08 | بلوت declaration window: when exactly? | P1 |
| OD-SC-09 | بلوت: missed declaration — does it forfeit or simply not count? | P1 |
| OD-SC-10 | بلوت: can it coexist with another project? | P2 |
| OD-SC-11 | Project comparison tie-breaking exact algorithm | P1 |
| OD-SC-12 | Project non-overlap rule: which combinations can coexist | P2 |
| OD-SC-13 | Kaboot: server-detected auto or player-claimed? | P0 |
| OD-SC-14 | Exact Kaboot Qaid values (25 Hokm / 44 Sun — currently draft) | P1 |
| OD-SC-15 | Kaboot: does it override project scores or add to them? | P1 |
| OD-SC-16 | Doubling window: exactly which game phases allow DOUBLE? | P1 |
| OD-SC-17 | COFFEE: terminal doubling — does it end the doubling window? | P2 |
| OD-SC-18 | Doubling interaction with KABOOT | P1 |
| OD-SC-19 | Exact tie-after-double behavior | P2 |
| OD-SC-20 | Match win threshold: is 152 Qaid points or raw card points? | P1 |
| OD-SC-21 | What happens if both teams reach 152 in the same round? | P1 |
| OD-SC-22 | Negative score: is it possible? What is the floor? | P2 |

---

## Category 6: Game State & Actions (from 07-game-state.md, 08-actions.md)

| ID | Decision | Blocking? |
|---|---|---|
| OD-GS-01 | Canonical GamePhase names — unified with transitions | P0 |
| OD-GS-02 | COMPLETE_DEAL phase: is it a distinct enum value or internal transition? | P1 |
| OD-GS-03 | MATCH_END_CHECK: is it a distinct enum value or internal check? | P1 |
| OD-GS-04 | Spectator visibility rules: what information do spectators see? | P3 |
| OD-GS-05 | RESYNC_GAME stateVersion: does it increment or not? | P2 |

---

## Category 7: General / Game Rules (from 01-game-rules.md §51)

| ID | Decision | Blocking? |
|---|---|---|
| OD-GR-01 | Final bidding formula for all Ika cases | P1 |
| OD-GR-02 | Ashkal details by seat and exposed card | P1 |
| OD-GR-03 | Details of doubling and cutting edge cases | P1 |
| OD-GR-04 | Takkwish (التكويش) and redeal rules | P1 |
| OD-GR-05 | Project precedence on conflict | P1 |
| OD-GR-06 | Project declaration and reveal details | P1 |
| OD-GR-07 | Baloot timing and cancellation cases | P1 |
| OD-GR-08 | Doubling levels and escalation (Dabl, Three, Four, Coffee) | P1 |
| OD-GR-09 | Project doubling at escalation levels | P2 |
| OD-GR-10 | Kaboot and reverse Kaboot | P1 |
| OD-GR-11 | Some tie cases | P2 |
| OD-GR-12 | Transition between Hokm and Sun in edge cases | P2 |
| OD-GR-13 | Any Sakkah-specific deviation from the reference rule profile | P1 |

---

## Summary

| Category | Total ODs | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| Card System | 7 | 1 | 2 | 2 | 2 |
| Dealing | 5 | 2 | 1 | 1 | 1 |
| Bidding | 15 | 4 | 9 | 2 | 0 |
| Playing | 4 | 1 | 2 | 1 | 0 |
| Scoring | 22 | 4 | 11 | 5 | 0 |
| Game State & Actions | 5 | 1 | 2 | 1 | 1 |
| General / Game Rules | 13 | 0 | 9 | 3 | 1 |
| **TOTAL** | **71** | **13** | **36** | **15** | **5** |

> Note: This list expands on the previously stated count of 47 because the cross-document audit surfaced additional items not listed in document-level open-decision sections.

---

## Resolution Protocol

Per `01-game-rules.md §50`:

```
DO NOT GUESS
→ OPEN_DECISION
→ 1. Identify conflict
→ 2. Identify sources
→ 3. Select Rule Profile
→ 4. Update document
→ 5. Add regression tests
→ 6. Update replay/version policy
```

No implementation may begin for any feature touching an unresolved P0 or P1 open decision.
