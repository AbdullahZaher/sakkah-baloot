# Phase 14.Z.10-R — Sun Double Window Audit

**Status:** COMPLETE — OPEN
**Branch:** phase-14z10r-canonical-reconciliation

## Current profile

The Rule Profile currently declares only a Sun chain of NORMAL → DOUBLE. It does not carry the complete open/close/eligible-phase fields present for Hokum.

## Current decision trail

The project-level canonical decision defines the Sun double window as:
- OPEN = CONTRACT_FINALIZED
- CLOSE = FINAL_CARDS_RAISED
- no doubling after card placement
- no doubling after a trick starts

The current Owner Decision Register still lists the Sun-double window fields as an open transcription item.

## Safe disposition

The semantic candidate is documented, but the Rule Profile schema is incomplete.

Sun Double semantic window = documented candidate / not Freeze-authorized.

No production behavior is promoted by this audit.
