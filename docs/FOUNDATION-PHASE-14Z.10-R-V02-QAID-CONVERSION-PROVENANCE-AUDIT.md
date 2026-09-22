# Phase 14.Z.10-R — V-02 Qaid Conversion Provenance Audit

**Status:** CLOSED FOR V-02-A — V-02b COMPLEMENT REMAINS OPEN  
**Branch:** `phase-14z10r-canonical-reconciliation`  
**Production code:** NOT AUTHORIZED  
**Rule Freeze:** BLOCKED

## Objective

Determine whether the repository contains an authoritative Rules Owner decision that freezes the exact Hokum/Sun raw-to-Qaid conversion table, including rounding and complement/opposing-side behavior.

## Sources reviewed

The audit reviewed the current branch versions of:

- `docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md`
- `docs/FOUNDATION-RULE-CONFLICT-REGISTER.md`
- `docs/FOUNDATION-PHASE-14Y-REPORT.md`
- `docs/FOUNDATION-PHASE-14Z.1-REPORT.md`
- `docs/game/06-scoring.md`
- `docs/02-RULE-PROFILE-SA.md`

## Findings

### 1. Owner decision status

The current owner decision register explicitly states that the **exact conversion table values remain OPEN**.

The same register also identifies the **complement/opposing-side formula** as OPEN.

Therefore no exact table may be promoted from examples, external references, or model knowledge into the canonical Rule Profile.

### 2. Rule Profile status

The Saudi Rule Profile currently contains:

```ts
conversion: {
  mode: "CONTRACT_SPECIFIC_TABLE",
  floatingPoint: false,
  exactTableRequired: true,
}
```

This is an architectural/configuration requirement, not an actual conversion table.

It correctly prevents generic division or floating-point rounding from becoming an accidental implementation.

### 3. Scoring specification status

`docs/game/06-scoring.md` describes:

- Sun as commonly represented by raw ÷ 5;
- Hokum as commonly represented by raw ÷ 10;
- integer/table-based conversion as the implementation direction.

Those passages are explicitly framed as common/reference representations and do **not** constitute an Owner-frozen conversion table.

The scoring document therefore must not be treated as authority for exact boundary rounding.

### 4. Historical worked examples

Earlier verification material records unresolved examples such as fractional conversions and explicitly classifies the conversion/rounding decision as OPEN.

Worked examples therefore provide evidence of the missing decision; they do not close it.

## What is NOT authorized by this audit

The following must not be frozen or implemented merely from common Baloot practice:

- `Math.floor(raw / 5)`
- `Math.floor(raw / 10)`
- nearest-integer rounding
- half-up rounding
- ceiling/floor variants
- complement arithmetic
- opponent-side derivation
- any lookup table reconstructed from external websites

## Required Owner Decision

The Rules Owner must provide an explicit table for both contracts.

At minimum:

```text
HOKUM:
raw input → Qaid output
for every boundary required by the canonical scoring model

SUN:
raw input → Qaid output
for every boundary required by the canonical scoring model
```

The decision must also specify:

1. rounding direction at every boundary;
2. treatment of exact half/boundary values;
3. whether the opposing team's Qaid is independently converted or derived by a fixed-total complement;
4. the canonical total used by that complement, if applicable;
5. interaction with purchaser success/failure;
6. interaction with project Qaid and special outcomes;
7. whether any negative-floor behavior exists;
8. whether the table is exhaustive or generated from an explicitly frozen finite mapping.

## Result

```text
V-02 provenance audit: COMPLETE
Exact conversion table: NOT FOUND / OPEN
Complement formula: NOT FOUND / OPEN
Generic /5 or /10 implementation: NOT AUTHORIZED
Rule Freeze: BLOCKED
```

This is a provenance closure result, not a new rules decision.


## Phase 14.Z.11 closure

V-02-A is now explicitly transcribed from the Owner Decision:
- Hokum: remainder 0–5 down, 6–9 up, /10.
- Sun: remainder 1–4 down, 5 preserved, 6–9 up, /5.
- exact examples are part of the Owner Decision.

V-02b remains open: no fixed-total complement formula has been separately approved.
