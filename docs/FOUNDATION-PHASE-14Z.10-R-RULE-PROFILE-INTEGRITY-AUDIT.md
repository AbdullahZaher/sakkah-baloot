# Phase 14.Z.10-R — Rule Profile Integrity Audit

**Status:** COMPLETE — findings recorded, no production implementation  
**Branch:** `phase-14z10r-canonical-reconciliation`  
**Rule Freeze:** BLOCKED

## Purpose

Audit `docs/02-RULE-PROFILE-SA.md` against the current Owner Decision Register and the Foundation conflict/gap records.

The objective is to distinguish:

1. values explicitly closed by Owner Decision;
2. values carried as canonical rules;
3. values that remain OPEN but are currently represented in the profile;
4. profile fields that are only structural placeholders.

## CLOSED / SUPPORTED PROFILE DATA

The following profile entries have current support in the Owner Decision Register or carried canonical rules:

- direction = COUNTER_CLOCKWISE;
- match target = 152 Qaid;
- success thresholds = Sun 65 / Hokum 81, inclusive;
- buyer failure allocation = FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT;
- Kaboot flat escalation table:
  - Hokum 25 / 25 / 25 / 25;
  - Sun 44 / 44;
  - Reverse Kaboot 88;
  - Reverse never doubles;
  - Gahwa overrides Kaboot;
- doubled exact-tie headline = INITIAL_DOUBLER_LOSES;
- Ashkal caller/buyer + partner exposed-card recipient shape;
- exposed-Ace does not create a third round/redeal;
- Kasho baseline and ROTATE_RIGHT carry;
- Ika/G-1/G-2/G-2P predicates;
- Baloot as Hokum-only, same-player K+Q, independent declaration, Qaid 2, non-multiplied;
- Baloot absorption by Hundred as the current canonical carried rule;
- contract-specific conversion mode with exact table required and no floating point.

## OPEN / UNSUPPORTED VALUES THAT MUST NOT BE TREATED AS FROZEN

### 1. Both teams crossing 152

The profile currently contains:

```ts
bothCrossPolicy: "HIGHER_FINAL_TOTAL",
equalFinalTotalPolicy: "EXTRA_DEAL",
```

The current Owner Decision Register does **not** provide an explicit Owner Decision closing this edge case. The scoring specification previously posed the edge case without a canonical resolution.

**Disposition:** OPEN. These two values must not be treated as Rule-Freeze authority.

### 2. Project multiplier ×3 / ×4

The profile currently contains:

```ts
multiplier: {
  NORMAL: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  FOUR: 4,
}
```

The conflict register records project multiplication beyond Double as a research-supported area requiring canonical acceptance/closure.

**Disposition:** OPEN for Rule Freeze. Do not claim ×3/×4 project scoring is Owner-frozen merely because the profile currently contains numeric values.

### 3. Exact Qaid conversion

The profile correctly requires:

```ts
conversion: {
  mode: "CONTRACT_SPECIFIC_TABLE",
  floatingPoint: false,
  exactTableRequired: true,
}
```

but contains no actual table.

**Disposition:** OPEN.

### 4. Sun doubling window

The profile defines the Hokum escalation window but does not provide the equivalent canonical Sun window fields.

The current decision trail identifies the Sun-double window as a remaining transcription/open-detail item.

**Disposition:** OPEN until canonical fields are explicitly transcribed.

### 5. First dealer

The profile does not contain a frozen first-dealer mechanism.

The dealing specification explicitly leaves first dealer as a Rule Profile decision.

**Disposition:** OPEN.

### 6. Timeout behavior

The profile does not freeze bidding/play timeout outcomes.

**Disposition:** OPEN.

### 7. Full Kasho violation matrix

The profile captures the baseline cancellation semantics, but the Owner Decision Register explicitly leaves the broader violation/continue-vs-cancel matrix open.

**Disposition:** OPEN.

### 8. Project raw-value provenance

The profile contains project raw values:

```text
Sera 20
Fifty 50
Hundred 100
Four Hundred 200
Baloot 20
```

The owner register/gap register still identifies the exact raw success-comparison table as a Rule Freeze dependency.

**Disposition:** OPEN unless each value receives explicit provenance/Owner closure.

### 9. Project coexistence / overlap edge cases

The profile has `maxPerHand: 2` and `oneCardOneProject: true`, but project comparison, coexistence, overlap, and subtype edge cases remain partly open in the conflict/gap registers.

**Disposition:** PARTIALLY DEFINED / NOT FULLY FREEZE-READY.

## Recommended canonical handling

Until the remaining Owner decisions are captured, the profile should be treated as a **mixed-state Rule Profile**:

```text
CLOSED / CARRIED
        +
OPEN / PROVISIONAL
        +
STRUCTURAL HOOKS
```

It must not be interpreted as meaning that every populated field is production-authorized.

## Audit conclusion

No production code should consume the disputed profile fields as frozen behavior until their provenance is closed.

The highest-impact remaining profile blockers are:

1. exact Qaid conversion table + complement formula;
2. project raw-value provenance;
3. project ×3/×4 multiplier closure;
4. both-cross-152/equal-final handling;
5. Sun doubling window;
6. first dealer;
7. timeout policy;
8. Kasho full violation matrix;
9. remaining project coexistence/comparison boundaries;
10. architecture AD-01…AD-05.

**Profile Integrity Audit: COMPLETE**  
**Rule Freeze: BLOCKED**
