# Phase 14.Z.10-R — V-09 Reverse Kaboot Canonical Audit

**Status:** COMPLETE — CLOSED  
**Branch:** `phase-14z10r-canonical-reconciliation`

## Canonical predicate

The current RD-09 protocol and Rule Profile agree on:

```text
contract = SUN
AND
buyer is dealer-right relative to canonical seat direction
AND
buyer held an Ace in the original final eight-card hand
AND
buyer team won 0 tricks
→ Reverse Kaboot
```

The Ace predicate must inspect the **original final eight-card hand**, not the hand remaining after cards have been played.

## Award

```text
Reverse Kaboot = 88 Qaid
```

It is a separate special outcome.

It does not derive from:

```text
normalKaboot × 2
```

and it does not participate in ordinary doubling.

## Separation from ordinary Sun Kaboot

The current profile also defines:

```text
Sun Normal = 44
Sun Double = 44
Reverse Sun = 88
```

Therefore the same numeric value can occur through different domain outcomes. The resolver must retain the outcome type for replay, analytics, validation, and audit semantics.

## Disposition

**V-09 = CLOSED in current project protocol/profile.**

No implementation change is authorized merely by this audit; this is provenance/transcription validation.

## Guard tests required before Freeze

- normal Sun Kaboot must not become Reverse Kaboot;
- Reverse requires original Ace;
- Reverse requires buyer team = 0 tricks;
- Reverse requires buyer-relative dealer-right seat;
- Reverse never doubles;
- Gahwa overrides Kaboot outcomes.
