# Sakkah Baloot — Final Rules Owner Decisions (Phase 14.Z.1)

**Document:** `docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md`
**Phase:** 14.Z.1 — Rules Owner Resolution & Rule Freeze Completion (documentation only)
**Date:** 2026-09-22
**Owner instrument:** Phase 14.Z.1 brief (owner selections stated therein) + prior approved protocols (RD-01 amendment, RD-09, RD-10) + Phase 15 audit records.
**Policy:** every entry below is an explicit Owner Decision Record. Nothing is inferred. Undecided items are marked OPEN, never guessed.

---

# Status

```text
RULE_FREEZE: BLOCKED (pending §9 gate — see FOUNDATION-PHASE-14Z.1-REPORT.md)
```

---

# Decision Register

## V-04 — Kaboot Escalation

**Status:** CLOSED.
**Previous status:** P0 contradiction F-01 (three incompatible representations: flat-A, mechanism-E, multiplied-B).
**Owner Decision:** A — Saudi Baseline / Flat Dedicated Table.
**Canonical Rule:**
```text
Kaboot uses a dedicated escalation table (never baseKaboot × contractMultiplier at runtime):
Hokum: Normal = 25, Double = 25, Triple = 25, Four = 25
Sun:   Normal = 44, Double = 44
Reverse Kaboot = 88, independent special outcome, never doubles.
Gahwa overrides Kaboot (MATCH_WIN, no numeric award).
```
**Rationale / evidence:** Owner selection (§3); Saudi-source baseline (conflict register sources); ElBlot corroboration of flat 25/44 under doubling (RD-09 protocol §2).
**Superseded (HISTORICAL_SUPERSEDED, preserved in audit trail only):** RD-09 protocol §21 multiplied table (50/75/100/88-doubled); Pagat 50/88 + 75/100 variant; any runtime-multiplication reading. RD-09 §3 mechanism-E retained as implementation constraint (table lookup), §14 "Open" cells now CLOSED with flat values.
**Rule Profile impact:** `kaboot.escalation` table added to `02-RULE-PROFILE-SA.md`; conflicting text in RD-09 §21 marked SUPERSEDED (see conflict register C-03).
**Implementation impact:** `kabootAward = ruleProfile.kaboot.escalation[contract][level]`; reverse path separate constant.
**Test implications:** flat awards at every level; reverse-88 independence; Gahwa-overrides; no-multiplication guard tests.
**Provenance:** OWNER_DECISION.

## V-06b — Doubled Tie

**Status:** CLOSED (headline) + P1 transcription task (exact tie/score/level semantics must be written into canonical docs).
**Previous status:** OPEN (V-06/C-14).
**Owner Decision:** C — Initial Doubler Loses an exact tie.
**Canonical Rule:** On a doubled contract ending in an exact raw tie, the round is awarded against the initial doubler (identified via `initialDoublerTeamId`, not the last escalator); the non-doubling side receives the round. Applies at DOUBLE; extension to TRIPLE/FOUR escalation levels must be stated explicitly during transcription (no evidence for distinct behavior — do not invent; record the open point).
**Rationale / evidence:** Phase 15 audit §A3 record of prior approval; transcribed here, not created here.
**Superseded:** none (no prior adopted rule).
**Rule Profile impact:** `match.doubledTiePolicy: "INITIAL_DOUBLER_LOSES"` added.
**Implementation impact:** tie path in contract evaluation after V-01 threshold-tie check.
**Test implications:** doubled exact-tie fixtures at each level; doubler-identification tests.
**Provenance:** OWNER_DECISION (headline); transcription detail OPEN.

## V-11 — Normal Successful Round Allocation

**Status:** CLOSED (decision) + P1 transcription task (sentence must appear in canonical scoring docs).
**Previous status:** OPEN (V-11/C-15; previously implied only).
**Owner Decision:** CONFIRM the following canonical sentence (recorded here verbatim; transcription into `01-CANONICAL-RULES-CURRENT.md` scoring section pending as a doc task, not a rule change):
```text
On a successful contract, each team retains its own eligible card/project/Baloot allocation, converted per the contract-specific conversion table.
```
**Rationale / evidence:** Phase 15 audit §A4 requirement; ends reliance on implication.
**Superseded:** none.
**Rule Profile impact:** none (prose rule; allocation code reads existing tables).
**Implementation impact:** success path keeps per-team shares; no transfer logic on success.
**Test implications:** success-allocation fixtures (both teams retain shares).
**Provenance:** OWNER_DECISION.

## V-07 — Counting-Side Terminology

**Status:** OPEN — OWNER DECISION REQUIRED.
**Previous status:** OPEN (V-07). Verified: zero Foundation usages (term appears only in audit docs discussing its absence).
**Owner Decision:** none supplied (phase brief gives vocabulary direction only, not a selection among A/B/C/D).
**What is required:** owner picks A (responsible-for-contract team) / B (round-recipient team) / C (remove term; use buyer team / opponent team / doubler / round recipient) / D (specify). Precise concept names available: `conversionSide`, `awardedTo`, `projectOwner`, `roundWinner`.
**Provenance:** n/a (awaiting OWNER_DECISION).

## Ika (BATCH C carry)

**Status:** CLOSED as documented below; partner-exemption now canonical (was audit-only).
**Owner Decision:** preserve all listed Ika rules (phase brief BATCH C).
**Canonical Rule:**
```text
Hokum only. Trick leader only. Non-trump lead only with the valid
highest-remaining-card condition. Declaration optional. Invalid declaration
rejects the entire PLAY_CARD with zero state mutation. Represented as
ikaDeclared: boolean inside CARD_PLAYED. Affects ONLY the specific partner
exemption: when the exemption applies, the partner may play any card
including trump; never generalized to every partner/no-suit situation.
Server authoritative; event history is source of truth; remainingCards is
derived/cache state.
```
**Provenance:** OWNER_DECISION (via this brief; prior trail gap noted — Phase 15 §5 listed Ika as needing a decision, now supplied).

## Kasho / Bushat Baseline (BATCH E carry)

**Status:** CARRIED (reaffirmed, unchanged): ranks {7,8,9} any five; trump 9 allowed; explicit declaration; any eligible player; CCW action priority; PASS does not waive; purchase waives; window FIRST_BIDDING until purchase finalization; no post-contract Kasho; cancel 0–0 with no Raw/Qaid/Projects/Baloot/Kaboot; match unchanged; idempotent.
**Provenance:** CANONICAL_RULE (`01`/`02`) + owner preserve-order.
**Dealer transition: OPEN — OWNER DECISION REQUIRED.** Search result: KEEP_CURRENT appears nowhere as a rule (only as an audit stale-target). All rule docs state ROTATE_RIGHT, but unanimity is not an Owner decision and the brief explicitly re-opens the item. Owner must REAFFIRM ROTATE_RIGHT or SELECT an alternative (KEEP_CURRENT / EXPLICIT_PLAYER). Policy-driven `DealerTransition` enum (ROTATE_RIGHT / KEEP_CURRENT / EXPLICIT_PLAYER) recorded as schema.

## Termination / Redeal (BATCH F carry)

**Status:** CARRIED: categories NORMAL_COMPLETION / RULE_BASED_CANCELLATION (All Pass, Kasho/Bushat) / RULE_DEAL_INTEGRITY_INCIDENT; INCIDENT_DETECTED → WAIT_FOR_DECISION → CONTINUE or CANCEL_HAND; no REDEAL GamePhase. Opposing-side decision protocol: OPEN (prompt forbids invention).
**Provenance:** CANONICAL_RULE (`01`/`04`).

## Project Invariants (BATCH G carry)

**Status:** CARRIED all 11 (declaration never scores; Raw immutable; multiplier never touches Raw; multiplier only on Project Qaid; Baloot ×1; Baloot independent of Project Winner; Project Winner independent of Round Winner; Gahwa ends scoring; Kaboot derived; history immutable on failure; no double award).
**Provenance:** CANONICAL_RULE (`01`/`05`) + OWNER_DECISION (V-05/B absorption already in `01`).

## Bidding Residue (BATCH D)

**Status:** CARRIED: two rounds; PASS vs PASS_FINAL semantic split; Ashkal eligibility + PASS_FINAL block (RD-10); exposed-Ace no-redeal/no-third-round (`01`/`02`); purchase-finalization waives Kasho; escalation window = doubling window (RD-03). **OPEN:** Sun-priority/override rules (OD-BD-03/05); exact purchase-finalization event definition beyond Kasho interaction.
**Provenance:** mixed CANONICAL_RULE + OPEN items flagged.

## Still OPEN (no owner input in this phase)

V-01? No — V-01 closed earlier (≥65/≥81, tie buyer succeeds; in `01`+profile). OPEN: exact conversion table values; complement/opposing-side formula; trick-legality matrix beyond canonical cores (cutting, must-trump definition, must-overtrump, void-obligation closure, timeout policy); first-dealer mechanism; V-07 pick; V-09? No — V-09 closed (reverse predicate + 88 in profile/RD-09). OPEN: V-06b semantic transcription; V-11 `01`-transcription; Sun-double window fields; incident policy block; full Kasho violation matrix beyond baseline; RD-11…RD-18 areas (Ika-Ace/bidding-formula conflation, cutting/dag, Kawesh/Saneen, exposed-Ace specials beyond no-redeal, Sakkah deviations, Hokum↔Sun edges, negative floor, escalation-project interplay).
