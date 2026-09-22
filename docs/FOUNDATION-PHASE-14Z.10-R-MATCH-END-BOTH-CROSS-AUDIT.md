# Phase 14.Z.10-R — Match-End / Both-Cross Audit

**Status:** CLOSED FOR BOTH-CROSS — EQUAL-TOTAL REMAINS OPEN  
**Branch:** `phase-14z10r-canonical-reconciliation`

## Current canonical facts

- Match target is **152 Qaid**.
- Match-end evaluation is server/domain authoritative.
- The scoring specification explicitly identifies both-teams-crossing-target as a critical unresolved edge.
- The current Rule Profile contains `bothCrossPolicy: "HIGHER_FINAL_TOTAL"` and `equalFinalTotalPolicy: "EXTRA_DEAL"`.

## Provenance finding

The populated Rule Profile fields do not have a corresponding explicit Owner Decision in the current Owner Decision Register closing this exact match-end policy.

Therefore:

```text
bothCrossPolicy = HIGHER_FINAL_TOTAL
equalFinalTotalPolicy = EXTRA_DEAL
```

must be treated as **provisional profile data**, not Rule-Freeze authority.

## Required future Owner Decision

The final decision must explicitly define:

1. what happens when both teams reach/exceed 152 in the same completed round;
2. whether the higher final total wins;
3. what happens when final totals are equal;
4. whether another complete round/deal is required;
5. whether any special result overrides the normal match-end path.

No answer is invented in this audit.

## Important boundary

"First team to reach 152" is not sufficient to resolve this because a single round can move both teams across the target and the round is scored as an atomic result.

**Disposition: OPEN.**


## Phase 14.Z.11 closure

Both-cross behavior is now closed:

- evaluate only after the completed round is scored;
- if both teams are at/above 152, the higher final total wins;
- do not terminate the round mid-trick or mid-scoring.

This matches the Saudi baseline rule that when both teams exceed 152, the team with the higher total wins. citeturn4search0

Equal final totals remain a distinct OPEN edge because the cited baseline does not specify the tie resolution and no Owner Decision has yet closed it.
