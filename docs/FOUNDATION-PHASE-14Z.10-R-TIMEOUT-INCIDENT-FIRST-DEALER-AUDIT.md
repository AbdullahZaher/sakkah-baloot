# Phase 14.Z.10-R — Timeout / Incident / First-Dealer Audit

**Status:** CLOSED FOR PROJECT POLICY — INCIDENT RECOVERY DETAIL TRANSCRIBED  
**Branch:** `phase-14z10r-canonical-reconciliation`

## First dealer

The dealing specification intentionally leaves first-dealer selection as a Rule Profile decision.

The project requirement is deterministic and persisted, but the actual mechanism is not Owner-frozen in the current decision register.

**Status: OPEN.**

No random mechanism, seat, host-selection rule, or hash formula is invented here.

## Bidding timeout

The bidding specification documents:

```text
timeout → PASS
```

but the Owner Decision Register still lists timeout policy as OPEN.

**Status: OPEN.**

Therefore the documented behavior is treated as a candidate implementation contract, not a Rule-Freeze decision.

## Playing timeout

The playing specification discusses server-authoritative automatic legal-card selection and explicitly forbids the client from choosing a timeout result.

However, the exact automatic-card policy and deterministic selection rule remain OPEN.

**Status: OPEN.**

No "lowest legal card", random card, or heuristic is promoted to canonical behavior.

## Incidents

Current canonical incident categories include:

- normal completion;
- rule-based cancellation (All Pass / Kasho);
- rule-deal-integrity incident.

The lifecycle is:

```text
INCIDENT_DETECTED
→ WAIT_FOR_DECISION
→ CONTINUE or CANCEL_HAND
```

The opposing-side decision protocol remains OPEN.

Cancellation semantics already carried in the Owner Decision Register are:

```text
0–0
no normal round score
dealer transition per canonical cancellation rule
```

The exact continue/cancel authority and recoverability matrix remain OPEN.

## Disposition

- First dealer: **OPEN**
- Bidding timeout: **OPEN**
- Playing timeout: **OPEN**
- Incident authority/recovery matrix: **OPEN**

No policy was invented.


## Phase 14.Z.11 closure

### First dealer
First dealer is derived deterministically from the persisted match seed and persisted as authoritative match state.

### Timeouts
- Bidding: 8 seconds → PASS.
- Playing: 30 seconds → AFK/disconnect handling.
- No random or lowest-card timeout selection.
- Server clock is authoritative.

### Incidents
Recoverable incident → affected opposing team chooses CONTINUE/CANCEL.
Unrecoverable integrity violation → server auto-cancels.
Cancellation remains 0–0 with no normal scoring and dealer ROTATE_RIGHT.

Rejected pre-commit client requests are not gameplay incidents and receive no gameplay penalty.
