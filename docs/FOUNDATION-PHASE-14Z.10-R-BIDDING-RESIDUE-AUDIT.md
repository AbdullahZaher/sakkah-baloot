# Phase 14.Z.10-R — Bidding Residue Audit

**Status:** COMPLETE — PARTIALLY CLOSED  
**Branch:** `phase-14z10r-canonical-reconciliation`

## Closed / already canonical

- two bidding rounds;
- counter-clockwise action order;
- first actor is dealer-right under the canonical direction;
- exposed-suit Hokum / Sun / eligible Ashkal option shape;
- Ashkal eligibility = Dealer + Dealer-left in both rounds;
- Ashkal caller is buyer;
- Ashkal exposed-card recipient is partner;
- exposed Ace does not create a third bidding round or natural redeal;
- PASS is the single wire action;
- final-pass semantics are derived from bidding state;
- purchase waives Kasho;
- PASS does not waive Kasho;
- Kasho window closes at purchase finalization;
- purchaser is the player whose valid purchase action selects the contract.

## Still OPEN

### First-round Sun priority

The bidding specification explicitly states that the exact interaction between a prior Hokm call and a subsequent Sun purchase remains a Rule Profile decision.

No new priority rule is invented here.

### Second-round priority

The specification explicitly leaves open:

- whether Sun can be overridden;
- whether later Hokm can override Sun;
- whether a previous pass can be reversed;
- whether the first eligible purchaser immediately owns the contract.

These remain Owner Decisions.

### Purchase-finalization event

The project currently has the semantic rule that an actual purchase waives Kasho and closes the relevant bidding window, but the exact authoritative event boundary/payload is not fully frozen.

The engine should not infer this from UI state.

## Timeout

The bidding document describes:

```text
timeout → PASS
```

but the Owner Decision Register still lists timeout policy as open. Therefore the timeout-to-PASS behavior remains a **candidate/documented behavior**, not a final Rule-Freeze authorization.

## Disposition

**Bidding residue = PARTIALLY CLOSED.**

No new priority or timeout behavior is invented by this audit.
