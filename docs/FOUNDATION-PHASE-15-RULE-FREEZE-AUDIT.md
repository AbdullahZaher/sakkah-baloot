# صكّة بلوت — Phase 15 Rule Freeze Audit

**Date:** 2026-09-22  
**Status:** FREEZE BLOCKED — AUDIT COMPLETE / OWNER DECISIONS REMAIN  
**Purpose:** Verify the current rule-resolution chain after RD-01…RD-10 work and identify only the remaining blockers.  
**Policy:** No new rules are invented in this audit.

---

## 1. Executive Verdict

The project is **not yet ready for Rule Freeze**.

RD-01 through RD-10 have now been resolved in the current conversation and their decisions have been documented. However, the original Foundation audit explicitly lists additional Category-1 rule decisions and architecture gates beyond RD-01…RD-10.

The next work must therefore be:

1. close the remaining scoring/allocation decisions,
2. close the redeal/violation matrix,
3. close the remaining play-rule edge cases,
4. close architecture/event-schema gates,
5. update the Foundation documents,
6. run a final traceability + worked-example audit,
7. only then execute Rule Freeze.

---

# 2. Decisions Now Treated as CLOSED

## Foundation / Core

- Sun arithmetic: 120 raw + 10 last-trick = 130 total.
- Hokum arithmetic: 152 raw + 10 last-trick = 162 total.
- Deck conservation: 20 + 1 exposed + 11 completion = 32.
- Match target: 152 Qaid.
- Direction: counter-clockwise.
- Gahwa: immediate MATCH_WIN.

## RD-01 — Exposed Card

Normal purchase:

```text
Buyer = exposed-card recipient
Buyer receives exposed + 2 hidden
Others receive 3 hidden
```

Ashkal exception:

```text
Ashkal caller = buyer
Caller partner = exposed-card recipient
Partner receives exposed + 2 hidden
Caller receives 3 hidden
```

## RD-03 — Doubling Window

```text
last 3 cards dealt
→ escalation window
→ Double / Triple / Four / Gahwa
→ buyer raises final cards
→ window closes
→ PLAYING
```

No escalation after a trick begins.

## RD-04 — Gahwa

Terminal match win.

## RD-05 — Projects

Normal projects:

```text
Trick 1: declare before card placement
Trick 2: reveal / compare
```

Baloot remains separate.

## RD-06 — Project Values

Hokum:

```text
Sera   = 20 raw / 2 Qaid
Fifty  = 50 raw / 5 Qaid
Hundred = 100 raw / 10 Qaid
Baloot = 20 raw / 2 Qaid
```

Sun:

```text
Sera       = 20 raw / 4 Qaid
Fifty      = 50 raw / 10 Qaid
Hundred    = 100 raw / 20 Qaid
Four Hundred = 200 raw / 40 Qaid
```

## RD-07 — Project Interaction

Canonical pipeline:

```text
Project eligibility
→ Project ownership
→ Baloot independently
→ awarded Project Raw
→ Baloot Raw
→ Contract Resolution
→ Success / Failure
→ Qaid Allocation
```

Project multipliers:

```text
Normal = ×1
Double = ×2
Triple = ×3
Four   = ×4
```

Baloot:

```text
always ×1
```

Project multiplier applies to Project Qaid, never Project Raw.

## RD-08 — Baloot

```text
Hokum only
K + Q trump in one player's hand
declared at second card before commit
independent from Projects
2 Qaid
never multiplied
```

Hundred containing K+Q absorbs Baloot under the approved project rule.

## RD-09 — Kaboot

Normal:

```text
Hokum = 25
Sun = 44
```

V-04 = A Saudi Baseline:

```text
Hokum: 25 / 25 / 25 / 25
Sun:   44 / 44
```

Reverse Kaboot:

```text
Sun
dealer-right buyer
buyer originally held Ace
buyer team wins 0 tricks
→ Reverse Kaboot = 88
```

Gahwa overrides Kaboot.

Kaboot is derived, never an Action.

## RD-10 — Ashkal

Saudi-source baseline:

```text
First round: Dealer + Dealer-left eligible
Second round: Dealer + Dealer-left eligible
Caller = Buyer
Contract = Sun
Partner = exposed-card recipient
PASS_FINAL blocks later Ashkal
```

---

# 3. Remaining Rule-Freeze Blockers

The previous Foundation audit explicitly identified additional Category-1 items beyond RD-01…RD-10. These remain the real work.

## A. Scoring / Allocation

### A1 — V-02 conversion exactness

The contract-specific conversion table was adopted, but the final canonical implementation must be transcribed into the Rule Profile and verified against all worked examples.

Required:

```text
Sun conversion
Hokum conversion
rounding behavior
complement calculation
```

No hidden mathematical inference.

### A2 — V-03 failure allocation

Approved:

```text
Buyer failure
→ opponent receives full contract round value
→ awarded projects remain part of the round allocation
```

Still required: exact canonical allocation pseudocode and tests for every contract/escalation/project combination.

### A3 — V-06 tie policy

Already approved conceptually:

```text
V-06a = buyer succeeds on threshold tie
V-06b = initial doubler loses an exact tie
V-06c = higher final match total wins;
         exact equal total → extra deal
```

Required: integrate into the scoring resolver and match-end state machine.

### A4 — V-11 normal-success allocation

The Foundation audit identified this as previously implicit.

It must now be stated explicitly:

```text
On successful contract:
each team retains its own eligible card/project/Baloot allocation.
```

This sentence must appear in canonical scoring documentation.

---

# 4. Bidding / Dealing Remaining Work

## B1 — RD-09: Kasho / Bushat / Redeal Matrix

This remains a major freeze blocker.

The existing decision sheet requires all 14 items:

1. Bushat trigger
2. 9-trump treatment
3. second-round all-pass
4. illegal deal definition
5. wrong card count
6. exposed-card violation
7. buying before deal completion
8. buying out of turn
9. late Double
10. illegal Ashkal
11. choice owner: continue vs Kasho
12. penalty existence / amount
13. dealer rotation
14. score impact

The second-round all-pass cancel path is already established:

```text
cancel hand
score = 0
rotate dealer
```

The remaining illegal-state matrix is still open.

---

# 5. Playing Rules Remaining

The original audit identified these Category-1 areas:

- Ika / Ace declaration
- Cutting / Dag
- Kawesh / Saneen
- exposed Ace
- option sets and bidding priorities
- timeout policies
- void obligation
- bonus uniformity
- Four Hundred / Aces scope
- Hokum ↔ Sun edge cases
- Sakkah-specific deviations

These must not be implemented from convention.

Each needs either:

```text
OWNER DECISION
```

or:

```text
ADOPTED SAUDI SOURCE + explicit provenance
```

---

# 6. Project Edge Cases Remaining

The Foundation audit also listed:

- project coexistence edge cases
- project comparison / overlap
- escalation timing interaction
- project declaration/reveal failure handling
- project multiplier edge cases

RD-05 through RD-07 resolve the core lifecycle, but the complete legality matrix still needs tests.

---

# 7. Architecture Gates

Rule Freeze is also blocked by the separate architecture track.

Previously identified:

```text
AD-01
AD-02
AD-03
AD-04
AD-05
```

At minimum, the final event/state architecture must verify:

- canonical GamePhase vocabulary
- action vs derived-event distinction
- deterministic event ordering
- replay event schema
- idempotent round resolution
- reconnect/resync semantics
- no hidden-card leakage
- authoritative server ownership of all rule decisions

These are not rule-owner decisions, but they are Freeze Gate requirements.

---

# 8. Current Rule Profile Readiness

The Rule Profile now has enough information for the major closed systems:

```text
cards
direction
dealing
contracts
projects
Baloot
Kaboot
Ashkal
doubling
Gahwa
match target
```

But it is still incomplete until it explicitly contains:

```text
conversion table
tie policy
failure allocation
normal-success allocation
Kasho/redeal matrix
violation matrix
remaining play-rule edge cases
architecture event constraints
```

---

# 9. Freeze Gate

Current result:

```text
RULE_FREEZE = BLOCKED
```

Reason:

```text
Remaining owner decisions
+
remaining rule edge cases
+
redeal/violation matrix
+
architecture gates
+
canonical document transcription
+
final test verification
```

This is consistent with the earlier Foundation audit's conclusion that Phase 15 must be a Freeze Audit rather than implementation.

---

# 10. Recommended Next Decision Batch

The next Rule Owner batch should be:

## RD-09 — Kasho / Bushat / Redeal Matrix

This is the highest-impact remaining bidding/dealing decision because it defines what happens when the authoritative state becomes invalid or intentionally cancelled.

After RD-09:

```text
RD-11 — Ika / Ace rule
RD-12 — Cutting / Dag
RD-13 — Kawesh / Saneen
RD-14 — Void / follow-suit obligations
RD-15 — Exposed-Ace / special-deal edge cases
```

Then:

```text
Scoring Integration Audit
→ Architecture Gate Audit
→ Final Worked Examples
→ Rule Freeze Gate
```

---

## Final Status

```text
RD-01  CLOSED
RD-02  CLOSED
RD-03  CLOSED
RD-04  CLOSED
RD-05  CLOSED
RD-06  CLOSED
RD-07  CLOSED
RD-08  CLOSED
RD-09  CLOSED  ← Kaboot protocol
RD-10  CLOSED  ← Ashkal protocol

RD-09 (Kasho/Redeal) = OPEN
Remaining Category-1 rules = OPEN
Architecture gates = OPEN

RULE FREEZE = BLOCKED
```

**Important:** The two different uses of `RD-09` in the historical Foundation documents are now a naming collision: the old decision sheet used RD-09 for **Kasho/Redeal**, while the current workflow used RD-09 for **Kaboot**. This must be normalized before Freeze so the identifiers are unique. The safest canonical naming is:

```text
RD-09 = Kaboot & Reverse Kaboot
RD-11 = Kasho / Bushat / Redeal Matrix
```

rather than reusing `RD-09`.
