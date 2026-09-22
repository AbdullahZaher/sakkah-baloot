# صكّة بلوت — Rule Conflict & Evidence Register

**Phase:** 14.x  
**Date:** 2026-09-22  
**Status:** ACTIVE

## C-01 — Doubling window

Saudi source describes doubling in Hokum as open from the beginning of play through the end. Other references describe a narrower practical window.

**Status:** OPEN  
**Action:** Define the exact engine boundary for PLAY_START.

## C-02 — Baloot inside Hundred

Saudi wording and Pagat differ in how Baloot contained in Hundred is treated.

**Status:** OPEN — MATERIAL  
**Action:** Rules Owner must select the canonical interpretation.

## C-03 — Kaboot with doubling

Sources differ in whether the displayed Kaboot value is already the final doubled value or should be multiplied by the doubling level.

**Status: CLOSED BY OWNER DECISION (Phase 14.Z.1, V-04 = A).**
**Current owner decision:** Flat Saudi Baseline via dedicated table — Hokum 25/25/25/25, Sun 44/44; reverse 88 independent, never doubles; Gahwa overrides.
**Canonical interpretation:** `kabootAward = ruleProfile.kaboot.escalation[contract][level]` (table lookup, never runtime multiplication).
**Superseded interpretation:** multiplied table (Hokum 50/75/100, Sun doubled 88) per RD-09 protocol §21; Pagat 50/88 + 75/100 variant — preserved as historical/source evidence only.
**Action:** Resolved through worked scoring examples and the selected Saudi profile. Profile table added (`02-RULE-PROFILE-SA.md` `kaboot.escalation`).

### C-16 — V-06b doubled-tie transcription (new, Phase 14.Z.1)

Headline decided (C — Initial Doubler Loses); exact tie/score/level semantics pending transcription into canonical docs + profile field added (`match.doubledTiePolicy`). **Status: OPEN — TRANSCRIPTION.**

### C-17 — V-11 allocation sentence transcription (new, Phase 14.Z.1)

Decision CONFIRMED with canonical text recorded in `FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md`; appearance in `01-CANONICAL-RULES-CURRENT.md` scoring section pending. **Status: OPEN — TRANSCRIPTION.**

### C-18 — Kasho dealer transition re-opened (Phase 14.Z.1)

KEEP_CURRENT exists nowhere as a rule (audit stale-target only); all rule docs state ROTATE_RIGHT, but unanimity is not an Owner decision and reaffirmation was explicitly required. **Status: OPEN — OWNER DECISION REQUIRED (REAFFIRM ROTATE_RIGHT or SELECT alternative).**

### C-19 — Ika partner exemption (new, Phase 14.Z.1)

Exemption rule captured canonically in `FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md` (Hokum-only, leader/non-trump/highest-remaining, optional, reject-no-mutation, partner-may-play-any-card-only-when-exempt). **Status: CLOSED (decision); engine transcription pending implementation phase.**

## C-04 — Kasho variants

Saudi source defines core Bushat and violation cases. Other sources document additional local variants.

**Status:** Core Saudi baseline supported; optional variants excluded unless explicitly selected.

## C-05 — Ashkal eligibility

Research gives dealer-relative eligibility and second-round Wala restrictions. Exact seat mapping must be reconciled with the project’s counter-clockwise model.

**Status:** OPEN UNTIL MAPPED

## C-06 — Project coexistence

Sources agree on declaration/reveal phases but leave edge cases around multiple projects and shared cards.

**Status:** OPEN

## C-07 — Project multiplication

Saudi research supports Double multiplication while Triple/Four do not continue multiplying projects.

**Status:** RESEARCH-SUPPORTED; requires canonical worked examples.

## C-08 — Sun arithmetic

120 base card values + 10 last-trick bonus = 130 total raw Sun points.

**Status:** RESOLVED**

## C-09 — Exposed-card conservation

Buyer receives exposed + 2 hidden; others receive 3 hidden.

**Status:** RESOLVED BY RULES OWNER**

## C-10 — Direction

Rules Owner selected global counter-clockwise direction.

**Status:** RESOLVED BY RULES OWNER**

## Evidence sources

Primary Saudi rules publication:
https://8k.sa/ar/القوانين-المعتمدة-للبلوت-في-الاتحاد-السعودي-للرياضات-الذهنية/page-936572790

Saudi competition PDF:
https://enjoy.sa/media/j1ofreng/baloot.pdf

Comparative reference:
https://www.pagat.com/jass/baloot.html

Secondary reference:
https://balootai.com/rules

## Evidence policy

External sources do not silently change project rules.

Required chain:

`Source Evidence -> Conflict -> Rules Owner Decision -> Canonical Rule -> Rule Profile -> Tests`

Only then may a disputed rule become Freeze-ready.

---

## Phase 14.y Verification Appendix (2026-09-22)

Historical entries C-01…C-10 above are preserved unaltered. This appendix records worked-example verification outcomes only. Nothing is marked RESOLVED unless the documentation explicitly supports resolution.

### C-01 — Doubling window: still OPEN (confirmed via EX-13/14/15/16)

Examples execute only with window/timing assumptions flagged OPEN. No mathematical inconsistency found — decision gap, not calculation error. **Status: OPEN (unchanged).**

### C-02 — Baloot inside Hundred: still OPEN, quantified (EX-10)

Identical cards yield 22 (both count) vs 20 (absorbed); Δ = 2 Qaid. Neither interpretation selected. **Status: OPEN — MATERIAL (unchanged).**

### C-03 — Kaboot with doubling: still OPEN (EX-11/12/25)

Profile defines project and Baloot multipliers but no Kaboot multiplier key. Hokum Kaboot 25 at DOUBLE (25 vs 50 vs other) uncomputable. **Status: OPEN FOR EXACT FORMULA (unchanged).**

### C-04 — Kasho variants: baseline exercised, matrix still open (EX-22)

Bushat-cancel/no-score/advance path executes; violation continue-vs-Kasho choice matrix unresolved. **Status: unchanged (core baseline; full matrix open).**

### C-05 — Ashkal eligibility: still OPEN UNTIL MAPPED (EX-21)

Distribution mechanics verify given A2 + partner-receiver rule; caller seat illustrative only; seat matrix unresolved. **Status: OPEN UNTIL MAPPED (unchanged).**

### C-06 — Project coexistence: still OPEN (EX-18/25)

Baseline ordering applied where decisive; subtypes, ties, overlap, dealer-priority unresolved. **Status: OPEN (unchanged).**

### C-07 — Project multiplication: consistency confirmed, acceptance still required

Profile table (×2 at DOUBLE, capped thereafter) is internally consistent with the research and executes cleanly in EX-14/15. Canonical acceptance of the research remains pending. **Status: RESEARCH-SUPPORTED (unchanged).**

### C-08 — Sun arithmetic: confirmed closed (EX-01/02/12/24)

120 + 10 = 130 re-verified through four independent worked totals; 140 appears nowhere. **Status: RESOLVED (unchanged; transcription via DF-01/DF-02 pending EC-01).**

### C-09 — Exposed-card conservation: confirmed closed (EX-20)

20 + 1 + 11 = 32; buyer 5+1+2 = 8; others 5+3 = 8 — exact. **Status: RESOLVED BY RULES OWNER (unchanged).**

### C-10 — Direction: applied globally (all examples)

CCW order N→W→S→E used throughout (e.g. dealer NORTH → first bidder WEST). **Status: RESOLVED BY RULES OWNER (unchanged).**

### C-11 — Purchaser success threshold: OPEN (new, V-01)

No numeric threshold exists in the Foundation. Exact halves (EX-23 81/81, EX-24 65/65) are indeterminate. **Status: OPEN — OWNER DECISION REQUIRED.**

### C-12 — Qaid conversion rounding: OPEN (new, V-02)

Fractions unavoidable (e.g. 62 → 6.2, 81 → 8.1 Hokum). No rounding rule frozen. **Status: OPEN — OWNER DECISION REQUIRED.**

### C-13 — Failed-contract allocation values: OPEN (new, V-03)

Pattern without values; EX-17 branches (forfeit vs retain project) both fit. **Status: OPEN — OWNER DECISION REQUIRED.**

### C-14 — Tie-break policies: OPEN (new, V-06)

Purchaser-wins-tie, initial-doubler-loses, and both-cross-152 rules all suggested but unadopted. **Status: OPEN — OWNER DECISION REQUIRED.**

### C-15 — Normal-success allocation statement: CONFIRMATION REQUESTED (new, V-11)

Each-side-keeps-own-share is implied but never written. Requires one explicit Owner sentence. **Status: OPEN — DOCUMENTATION CONFIRMATION.**


---

## Phase 14.Z.3 Canonicalization Addendum — 2026-09-22

The following entries supersede the stale/open statuses in earlier historical appendices. Historical records remain preserved for audit provenance.

### C-03 — Kaboot with doubling
**Current Status: CLOSED BY OWNER DECISION — V-04 = A.**

Canonical dedicated table:
- Hokum: Normal 25 / Double 25 / Triple 25 / Four 25
- Sun: Normal 44 / Double 44
- Reverse Kaboot: 88, independent special outcome, never doubles
- Gahwa overrides Kaboot

No runtime multiplication is permitted. RD-09 has been reconciled to V-04=A.

### C-16 — V-06b
**Current Status: OPEN — TRANSCRIPTION/LEVEL-SCOPE.**

Headline remains: Initial Doubler Loses an exact doubled-contract tie. Extension to Triple/Four remains explicitly OPEN and is not inferred.

### C-17 — V-11
**Current Status: CLOSED — TRANSCRIBED.**

Canonical sentence is now present in 01-CANONICAL-RULES-CURRENT.md: on a successful contract, each team retains its own eligible card/project/Baloot allocation, converted per the contract-specific conversion table.

### C-18 — Kasho dealer transition
**Current Status: CLOSED BY OWNER DECISION — ROTATE_RIGHT.**

Use the shared relative-seat utility; no numeric seat arithmetic.

### C-19 — Ika partner exemption
**Current Status: CLOSED BY OWNER DECISION.**

Canonical predicate and result are now defined in the owner decision register, Rule Profile, canonical rules, and legal-move specification.

### C-20 — Trick legality G-1
**Current Status: CLOSED BY OWNER DECISION.**

Partner-winning trump cases are position/card-origin dependent. No forced overtrump against a partner's winning trump. Opponent-winning trump requires overtrump only when a higher trump is available.

### C-21 — Trick legality G-2
**Current Status: CLOSED BY OWNER DECISION.**

Ika requires Hokum + leader + non-trump + highest remaining card of that suit.

### C-22 — Trick legality G-2P
**Current Status: CLOSED BY OWNER DECISION.**

Third-player Ika Partner Exemption requires partner-opened trick, partner winning, no lead suit, and partner lead Ace or valid Ika; result is ANY_CARD including trump.

### C-23 — Trick legality G-3
**Current Status: CLOSED AS SPECIFICATION REQUIREMENT.**

The final test specification now includes the partner/trump/Ika/Locked combinations identified by the Phase 14.Z.2 forensic audit.

### Provenance policy
These closures are Owner Decisions recorded on 2026-09-22. Web research remains evidence, not authority. The canonical chain is:

Source Evidence -> Conflict -> Rules Owner Decision -> Canonical Rule -> Rule Profile -> Tests


### Current-status overrides — Phase 14.Z.3

| Conflict | Current status |
|---|---|
| C-03 Kaboot × doubling | CLOSED — V-04=A; flat dedicated table |
| C-05 Ashkal eligibility | CLOSED — RD-10 Saudi baseline; Dealer + Dealer-left in both rounds |
| C-16 V-06b | OPEN — Triple/Four scope still requires explicit owner transcription |
| C-17 V-11 | CLOSED — transcribed into canonical rules |
| C-18 Kasho dealer transition | CLOSED — ROTATE_RIGHT |
| C-19 Ika partner exemption | CLOSED |
| C-20 G-1 partner/trump legality | CLOSED |
| C-21 G-2 Ika predicate | CLOSED |
| C-22 G-2P Ika partner exemption predicate | CLOSED |
| C-23 G-3 test coverage | CLOSED as specification requirement |

Historical Phase 14.y entries C-11–C-15 remain preserved as audit history; current owner decisions supersede their stale OPEN statuses where applicable.


---

## Current-status overrides — Phase 14.Z.10-R

The following entries reconcile historical Phase 14.y records with later Owner Decision records. Historical evidence remains preserved above.

| Conflict | Current status | Authority / disposition |
|---|---|---|
| C-02 Baloot inside Hundred | CLOSED — ABSORBED | Current Rule Profile + V-05/B carried canonical rule |
| C-07 Project multiplication | OPEN / RESEARCH-SUPPORTED | Numeric profile values exist, but canonical acceptance of ×3/×4 remains a Freeze dependency |
| C-11 Purchaser success threshold | CLOSED | V-01: Sun ≥65, Hokum ≥81; equality succeeds for buyer |
| C-12 Qaid conversion rounding | OPEN | Exact conversion table and complement formula not supplied by Owner |
| C-13 Failed-contract allocation | CLOSED SEMANTICS | `FULL_CONTRACT_ROUND_VALUE_TO_OPPONENT`; exact numeric conversion table remains open |
| C-14 Tie policies | PARTIALLY CLOSED | V-06b headline closed: initial doubler loses exact tie; Triple/Four extension remains open; other match-end tie edges require explicit closure |
| C-15 Normal successful allocation | CLOSED | V-11 canonical sentence transcribed into scoring specification |
| C-01 Doubling-window conflict | OPEN / PROJECT-SPECIFIC RULE ALREADY RECORDED | RD-03 defines current Hokum window; broader source disagreement remains provenance context and must not be silently generalized |

### V-02 provenance

C-12 is intentionally **not** closed by common `/5` or `/10` representations. The exact contract-specific lookup/rounding table and any complement/opposing-side formula remain an explicit Owner Decision dependency.

### Freeze implication

This addendum changes historical conflict interpretation only. It does not declare Rule Freeze and does not authorize production implementation.


## Current-status overrides — Phase 14.Z.11

| Conflict | Current status | Authority |
|---|---|---|
| V-02-A Qaid conversion | CLOSED — exact Owner table | Owner Decision V-02-A |
| V-02b complement | OPEN — no separate approval | Owner decision history |
| V-08 project Raw values | CLOSED | Owner Decision / Rule Profile |
| Project ×3/×4 | CLOSED — no multiplication at Triple/Four | Saudi baseline + Owner closure |
| Sun Double window | CLOSED | Project decision + Saudi baseline eligibility |
| Both teams cross 152 | CLOSED — higher final total wins | Saudi baseline |
| Equal final total | OPEN | no authoritative closure |
| First dealer | CLOSED — deterministic match-seed derived and persisted | Project architecture decision |
| Timeouts | CLOSED — 8s bidding PASS; 30s playing AFK/disconnect handling | Project policy |
| Incident authority | CLOSED baseline | Project incident policy |
| Kasho violation matrix | CLOSED | Project authoritative transaction semantics |
| AD-01…AD-05 | CLOSED — Owner approved | Architecture Owner Approval Pack |
| Ace→Sun priority | CLOSED — dealer-right in both rounds | Saudi baseline |
