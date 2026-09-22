# Phase 14.Z.10-R — V-08 Project Raw-Value Provenance Audit

**Status:** CLOSED — OWNER DECISION TRANSCRIBED  
**Branch:** `phase-14z10r-canonical-reconciliation`

## Finding

The current profile contains explicit raw project values:

| Contract | Project | Raw |
|---|---|---:|
| Hokum | Sera | 20 |
| Hokum | Fifty | 50 |
| Hokum | Hundred | 100 |
| Hokum | Baloot | 20 |
| Sun | Sera | 20 |
| Sun | Fifty | 50 |
| Sun | Hundred | 100 |
| Sun | Four Hundred | 200 |

The scoring specification correctly says these values must be Rule Profile configuration and must not be inferred from Qaid values.

However, the Owner Decision Register still lists **V-08 project raw table** as an unresolved Freeze dependency. The current evidence establishes the values as profile data, but does not provide an explicit Owner Decision that closes the complete raw-value provenance table.

## Important distinction

Qaid values do not authorize reverse inference of Raw values.

For example:

```text
Sun Sera = 4 Qaid
```

does not by itself authorize deriving:

```text
Raw = 20
```

Likewise, the presence of a value in `02-RULE-PROFILE-SA.md` does not convert a provisional profile field into an Owner-frozen decision.

## Disposition

**V-08 = OPEN / PROVENANCE INCOMPLETE.**

Do not implement a production raw-project lookup as Freeze-authorized until the Owner Decision explicitly closes the table and its contract interaction.

## Related open edges

- project priority;
- project coexistence;
- project ×3/×4 multiplier;
- project interaction with purchaser success/failure;
- exact project-vs-project tie behavior.

**No numeric values were changed by this audit.**


## Phase 14.Z.11 closure

The complete raw-value table is now explicitly Owner-approved and transcribed into the Rule Profile:

| Contract | Sera | Fifty | Hundred | Four Hundred | Baloot |
|---|---:|---:|---:|---:|---:|
| Hokum | 20 | 50 | 100 | — | 20 |
| Sun | 20 | 50 | 100 | 200 | — |

These are Raw values, not Qaid values. Project Raw is immutable and is never multiplied.

