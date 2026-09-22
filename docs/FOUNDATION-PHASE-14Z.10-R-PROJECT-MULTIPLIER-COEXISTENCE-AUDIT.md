# Phase 14.Z.10-R — Project Multiplier & Coexistence Audit

**Status:** CLOSED — OWNER + SAUDI BASELINE RECONCILIATION
**Branch:** phase-14z10r-canonical-reconciliation

## Findings

The current Rule Profile contains NORMAL=1, DOUBLE=2, TRIPLE=3, FOUR=4 and BALOOT=1.

The scoring specification separately states that Raw project values are immutable, multiplier applies to Project Qaid rather than Raw, Baloot is ×1, and project eligibility/overlap remains Rule Profile controlled.

The current Owner Decision Register does not explicitly close all of:
1. ordinary project multiplication at Triple;
2. ordinary project multiplication at Four;
3. whether multiplication is capped after Double;
4. project eligibility under each escalation level;
5. project coexistence limits under each escalation;
6. exact project-vs-project comparison for different types;
7. nested sequence/Hundred/Four-Hundred overlap;
8. project interaction with failed-contract allocation.

The profile's numeric fields therefore cannot by themselves be treated as Owner provenance.

## Canonical facts already preserved

- Project Raw is immutable.
- Multiplier never modifies Raw.
- Multiplier applies only to Project Qaid.
- Baloot remains ×1.
- Baloot is independent unless absorbed by Hundred.
- Project Winner is independent from Round Winner.
- Historical project ownership/declarations remain immutable on purchaser failure.

## Disposition

Project multiplier = OPEN.
Project coexistence/comparison edge cases = OPEN.

No generic runtime multiplier behavior beyond explicitly closed decisions is authorized.


## Phase 14.Z.11 closure

The project multiplier ambiguity is closed:

- NORMAL = ×1
- DOUBLE = ×2
- TRIPLE = ×1
- FOUR = ×1
- BALOOT = ×1

Raw values are immutable. Only Project Qaid is multiplier-sensitive.

The Saudi baseline rules explicitly state that projects are not multiplied at Triple/Four. This resolves the previous research-supported/open state. citeturn4search0

Project comparison/coexistence is now canonical at the architecture level:
- up to two independently valid non-overlapping projects per team;
- one-card/one-project consumption;
- sequential Hundred outranks same-value non-sequential Hundred;
- Four Hundred is highest in Sun;
- exact same-value ties use dealer-relative counter-clockwise priority;
- Baloot is independent unless absorbed by Hundred.

