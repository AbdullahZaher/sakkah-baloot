# Phase 14.Z.10-R — V-03 Failed-Contract Allocation Transcription Audit

**Status:** COMPLETE — documentation transcription only  
**Branch:** `phase-14z10r-canonical-reconciliation`  
**Production code:** NOT AUTHORIZED  
**Rule Freeze:** BLOCKED

## Objective

Reconcile the failed-contract allocation rule between the owner decision register, Saudi Rule Profile, and canonical scoring specification without inventing a conversion formula.

## Evidence chain

### Owner decision

`docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md` records V-03 as an OPEN historical item in the preserved Phase 14.y appendix, while the current owner decision register carries the later canonical purchaser-failure allocation through the Rule Profile chain.

The active Rule Profile defines:

```ts
buyerFailureAllocation: "FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT"
```

### Rule Profile

`docs/02-RULE-PROFILE-SA.md` is therefore the configuration source for the current allocation semantics.

### Scoring specification

`docs/game/06-scoring.md` now explicitly states that purchaser failure is a **round-allocation rule**, not an instruction to independently convert both teams' raw totals and infer the final allocation.

## Canonical interpretation

```text
PURCHASER SUCCEEDS
→ each team retains its own eligible allocation
→ convert using the approved contract-specific conversion table

PURCHASER FAILS
→ purchaser receives 0 Qaid
→ opponent receives FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT
```

Special outcomes such as Kaboot and Gahwa remain separate pipeline decisions and must not be collapsed into the generic failure formula.

## Important unresolved dependency

The exact contract-specific Qaid conversion table is still explicitly OPEN in the owner decision register.

Therefore this audit does **not**:

- invent rounding behavior;
- infer a generic /5 or /10 algorithm;
- hard-code a failure numeric total;
- close the remaining conversion-table owner decision.

## Result

V-03 allocation semantics are now transcribed into the scoring document and aligned with the Rule Profile.

**V-03 transcription: COMPLETE**  
**Exact conversion table: OPEN**  
**Rule Freeze: BLOCKED**
