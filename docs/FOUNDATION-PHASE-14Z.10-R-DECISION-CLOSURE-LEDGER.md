# Phase 14.Z.10-R — Decision Closure Ledger

**Status:** ACTIVE / OWNER INPUT REQUIRED  
**Branch:** `phase-14z10r-canonical-reconciliation`

This ledger separates values already supported by explicit Owner Decision Records from profile candidates and unresolved decision gaps. It is not itself an approval mechanism.

## A. Closed and safe to carry into Rule Freeze

| Area | Current closed basis |
|---|---|
| V-01 purchaser threshold | Sun ≥65, Hokum ≥81; equality succeeds for buyer |
| V-03 failure semantics | FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT |
| V-04 Kaboot | Dedicated flat table: Hokum 25/25/25/25, Sun 44/44, Reverse 88, Gahwa override |
| V-05 Baloot/Hundred | Baloot absorbed when contained in Hundred |
| V-09 Reverse Kaboot | Canonical predicate + 88 special award |
| V-11 successful allocation | Each team retains its own eligible allocation |
| Ika G-2/G-2P | Closed canonical predicates |
| Trick legality G-1 | Closed partner/opponent trump behavior |
| Kasho baseline | 7/8/9 five-card declaration, purchase waives, cancellation 0–0 |
| Kasho/All Pass dealer rotation | ROTATE_RIGHT |
| Ashkal core seat eligibility | Dealer + Dealer-left in both rounds |
| Lifecycle vocabulary | Observable GamePhase separated from internal transitions |

## B. Closed headline, incomplete scope

### V-06b — doubled exact tie

Closed:
- DOUBLE exact raw tie is awarded against the initial doubler.
- identity source is `initialDoublerTeamId`.

Still open:
- whether the same policy explicitly applies at TRIPLE and FOUR.

No behavior is inferred for those levels.

## C. Profile values that must not be mistaken for frozen decisions

The Saudi Rule Profile currently contains candidate values for:

- `bothCrossPolicy`
- `equalFinalTotalPolicy`
- project `TRIPLE` / `FOUR` multipliers
- project comparison tie-break behavior
- Sun Double timing fields

These values are retained for architecture continuity, but the profile itself remains **DRAFT — NOT FROZEN**. The latest annotations explicitly mark unresolved fields.

## D. Remaining Owner Decision dependencies

1. Exact contract-specific Qaid conversion table.
2. Complement/opposing-side conversion formula, if any.
3. Complete project raw-value provenance and acceptance.
4. Project coexistence and exact comparison matrix.
5. Project ×3/×4 behavior.
6. V-06b Triple/Four scope.
7. Sun bidding priority/override.
8. Exact purchase-finalization event boundary.
9. Sun Double open/close fields.
10. First-dealer selection mechanism.
11. Bidding and playing timeout behavior.
12. Incident continue/cancel authority.
13. Full Kasho violation/concurrency matrix.
14. Both-teams-cross-152 behavior.
15. Equal-final-total behavior.
16. AD-01 through AD-05 architecture approval.
17. Final action/event payload and ordering freeze.

## E. Important provenance rule

A value appearing in `02-RULE-PROFILE-SA.md` is not automatically an Owner Decision.

Authority order remains:

`Owner Decision → Canonical Rule → Rule Profile → Tests`

Research is evidence, not authority.

## Gate

**Rule Freeze: BLOCKED until the remaining Owner Decision dependencies are explicitly closed.**

**Production engine implementation: NOT AUTHORIZED.**
