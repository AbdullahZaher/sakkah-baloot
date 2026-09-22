# صكّة بلوت — Phase 14.x Report

**Phase:** Rule Canonicalization & Decision Integration  
**Date:** 2026-09-22  
**Status:** DRAFT COMPLETE / NOT FROZEN

## Objective

Integrate explicit Rules Owner decisions and external research into a single canonical layer without silently resolving conflicts.

## Explicit decisions captured

- RD-01: exposed card goes to buyer; buyer gets exposed + 2 hidden; others get 3 hidden.
- RD-02: global direction = counter-clockwise for dealing, bidding, play, dealer rotation and relative seat terms.
- RD-04: Gahwa immediately ends the match for the winning side.

## Research integrated

- Doubling.
- Projects and project values.
- Kaboot.
- Baloot.
- Kasho/redeal.
- Ashkal.

Research is clearly labeled and is not treated as an explicit Rules Owner decision unless accepted.

## Major corrections

### Sun arithmetic

`120 base card values + 10 last-trick bonus = 130 total raw points`

### Exposed-card conservation

`20 initial + 1 exposed + 11 hidden = 32`

Buyer:
`5 + exposed + 2 = 8`

Other players:
`5 + 3 = 8`

## Remaining Freeze blockers

1. Exact doubling window boundary.
2. Baloot/Hundred interaction.
3. Exact Kaboot + doubling formula.
4. Project coexistence/tie edge cases.
5. Full Kasho/redeal matrix.
6. Exact Ashkal eligibility after direction integration.
7. Complete scoring conversion edge cases.
8. Canonical GamePhase naming.
9. AD-01..AD-05 architecture decisions.

## Next recommended phase

**Phase 14.y — Worked Examples & Canonical Scoring Verification**

Required scenarios:
- Normal Hokum/Sun.
- Double Hokum/Sun.
- Triple/Four Hokum.
- Gahwa.
- Kaboot Hokum/Sun.
- Kaboot + projects.
- Projects + Double/Triple/Four.
- Baloot alone and with projects.
- Ashkal.
- Kasho.
- 81/81 Hokum.
- 65/65 Sun.
- Buyer success/failure.
- Tie cases.
- Match ending at 152.
- Match ending by Gahwa.

Each example must expose:
raw card points, project raw values, modifiers, Qaid, winning team, and match transition.

Rule Freeze is not authorized by this report.
