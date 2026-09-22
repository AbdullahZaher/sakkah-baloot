# Phase 14.Z.10-R — Kasho / Bushat Violation Matrix Audit

**Status:** CLOSED — BASELINE + VIOLATION MATRIX
**Branch:** phase-14z10r-canonical-reconciliation

## Closed baseline

Kasho/Bushat currently has:
- any five cards of ranks 7/8/9;
- trump 9 eligible;
- explicit declaration;
- any eligible player;
- counter-clockwise action priority;
- window = FIRST_BIDDING until purchase finalization;
- PASS does not waive;
- actual purchase waives;
- no post-contract Kasho;
- cancellation = 0–0;
- no Raw/Qaid/Projects/Baloot/Kaboot;
- match unchanged;
- idempotent;
- dealer rotates right after cancellation.

## Matrix still required

The Owner Decision Register leaves the broader violation/continue-cancel matrix open.

| Situation | Status |
|---|---|
| Invalid five-card Bushat declaration | OPEN |
| Declaration after bidding window | OPEN |
| Simultaneous valid declarations | Baseline CCW priority; exact transaction race semantics OPEN |
| Declaration after purchase commit | OPEN boundary |
| Declaration after contract selection | No post-contract Kasho; invalid-action vs incident semantics OPEN |
| Duplicate declaration | Idempotency closed; response envelope is transport detail |
| Declaration vs timeout concurrency | OPEN ordering policy |
| Malformed card list | OPEN validation/error semantics |
| Ownership changed by authoritative transition | OPEN transaction/incident boundary |

## Safe implementation boundary

Validate the baseline predicate server-side. Invalid client requests must not receive gameplay penalties merely because the client sent malformed or late data. A committed valid Kasho result follows the already-closed 0–0 cancellation path.

Full violation matrix remains OPEN.


## Phase 14.Z.11 closure

Authoritative handling:

| Situation | Canonical result |
|---|---|
| Invalid five-card declaration | Reject, no mutation |
| Declaration after window | Reject, no mutation |
| Simultaneous valid declarations | Authoritative CCW action order decides |
| Declaration after purchase commit | Reject, no mutation |
| Declaration after contract selection | Reject, no post-contract Kasho |
| Duplicate declaration | Idempotent; no second cancellation |
| Declaration vs timeout race | Authoritative committed transition wins; stale declaration is rejected |
| Malformed card list | Reject, no mutation |
| Ownership changed by authoritative transition | Reject stale request, no gameplay penalty |

A committed valid Kasho still cancels the hand 0–0 and rotates dealer right.
