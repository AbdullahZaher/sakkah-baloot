# صكّة بلوت — Phase 14.Z.4 Remaining Rules Owner Decision Sheet

**Date:** 2026-09-22  
**Phase:** 14.Z.4 — Remaining Rule Closure  
**Status:** OWNER DECISIONS RECORDED — RULE FREEZE STILL BLOCKED  
**Policy:** Approved decisions below are canonical owner decisions. No implementation is authorized yet.

## Owner approval

The Rules Owner approved the research-backed recommendations from the Phase 14.Z.4 review.

## A. Already CLOSED — DO NOT RE-ANSWER

- Direction = COUNTER_CLOCKWISE, N → W → S → E.
- Exposed card = buyer; buyer +2 hidden; others +3.
- Gahwa = immediate MATCH_WIN.
- V-01 = buyer succeeds at >=65 Sun / >=81 Hokum; threshold tie succeeds.
- V-03a = buyer failure gives opponent full contract round value.
- V-03b = project remains awarded/resolved into failure allocation.
- V-04 = flat Kaboot table: Hokum 25/25/25/25; Sun 44/44; Reverse 88 independent.
- V-05 = Baloot absorbed inside Hundred.
- V-06a = buyer wins exact contract tie.
- V-06c = higher final match total wins; exact equal totals → extra deal.
- V-07 = remove generic countingSide.
- V-08 raw project table is frozen.
- V-09 reverse Kaboot predicate/value/doubling behavior is frozen.
- V-11 successful round allocation is frozen.
- RD-01/RD-02/RD-04/RD-05/RD-06/RD-07/RD-08/RD-09/RD-10 baseline decisions are already recorded.
- G-1/G-2/G-2P/G-3 trick legality decisions are closed.
- Kasho dealer transition = ROTATE_RIGHT.
- Ika predicate and partner exemption are closed.
- Natural exposed Ace: no redeal and no third bidding round.

## B. V-02b — CLOSED

**Decision: B — fixed-total complement against the contract canonical total.**

Conversion remains:

- Hokum: nearest 10; 1–5 down, 6–9 up; then /10.
- Sun: nearest 5; 1–4 down, 5 stays, 6–9 up; then /5.
- Integer-only; no floating point.

The opposing side receives the fixed contract-total complement after conversion:

- Hokum: converted totals resolve against canonical total 16.
- Sun: converted totals resolve against canonical total 26.

Required invariant:

`convertedA + convertedB === contractQaidTotal`

This is a scoring-resolution rule only and never constrains legal card choice.

## C. V-06b — CLOSED

**Decision: A — INITIAL_DOUBLER_LOSES applies at DOUBLE, TRIPLE, and FOUR.**

The initial doubler team is immutable for the escalation lifecycle and is the reference for exact raw ties.

Do not infer tie ownership from the last escalation actor.

## D. RD-03 — Sun Double Window — CLOSED

Sun has a single pre-play Double window:

`CONTRACT_FINALIZED → SUN_DOUBLE_WINDOW_OPEN → FINAL_CARDS_RAISED → SUN_DOUBLE_WINDOW_CLOSED → PLAYING`

Canonical boundaries:

- `SUN_DOUBLE_OPEN = CONTRACT_FINALIZED`
- `SUN_DOUBLE_CLOSE = FINAL_CARDS_RAISED`
- `SUN_DOUBLE_BEFORE_CARD_PLACEMENT = YES`
- `SUN_DOUBLE_AFTER_CARD_PLACEMENT = NO`
- `SUN_DOUBLE_AFTER_TRICK_START = NO`

No Sun Double action is legal after the first card is placed.

## E. Incident Policy — CLOSED

Separate ordinary rule violations from technical/deal-integrity incidents.

### General architecture

`INCIDENT_DETECTED → WAIT_FOR_DECISION → CONTINUE or CANCEL_HAND`

Recoverable rule incidents use opponent-choice where the Saudi rules baseline gives the opposing side a choice.

Unrecoverable integrity failures are automatically cancelled.

Malformed/invalid client requests that can be rejected before state mutation are simply rejected and cause **NO STATE MUTATION**; they are not automatically treated as table penalties.

### Canonical matrix

| Incident | Detector | Choice owner | Options | Penalty | Cancel score | Dealer rotation |
|---|---|---|---|---|---:|---|
| Accidental exposure after initial deal | authoritative deal/event validator | affected opposing team | CONTINUE / CANCEL | per selected resolution | 0–0 on cancel | ROTATE_RIGHT |
| Wrong card count | authoritative deal validator | affected opposing team if recoverable; server if impossible | CONTINUE / CANCEL where recoverable; AUTO_CANCEL if impossible | per selected resolution | 0–0 | ROTATE_RIGHT |
| Duplicate/impossible deck | authoritative deck invariant validator | server | AUTO_CANCEL | no ordinary table penalty | 0–0 | ROTATE_RIGHT |
| Purchase before completion | authoritative action validator | affected opposing team when action became a committed table incident | CONTINUE / CANCEL | per selected resolution | 0–0 on cancel | ROTATE_RIGHT |
| Purchase out of turn | authoritative action validator | affected opposing team when committed | CONTINUE / CANCEL | per selected resolution | 0–0 on cancel | ROTATE_RIGHT |
| Illegal Double | authoritative action validator | server if pre-commit; incident flow only if a committed state anomaly exists | REJECT / incident resolution | invalid request = none | 0–0 if cancelled | ROTATE_RIGHT |
| Illegal Ashkal | authoritative bidding validator | server if pre-commit; incident flow only if committed anomaly exists | REJECT / incident resolution | invalid request = none | 0–0 if cancelled | ROTATE_RIGHT |
| Other unrecoverable deal/integrity violation | authoritative invariant validator | server | AUTO_CANCEL | none beyond cancellation | 0–0 | ROTATE_RIGHT |

**Technical invariant:** invalid action rejection is not the same as a gameplay penalty.

## F. First Dealer — CLOSED

**Decision: D — deterministic seed-derived seat.**

Saudi semantic baseline is preserved as a random selection; digital implementation is deterministic for replayability.

Canonical sources:

- `MatchCreated` stores the authoritative match seed.
- `firstDealerPlayerId` is derived once from that seed and persisted in authoritative match state/event history.
- Replay reads the persisted match-start result/seed and reproduces the same first dealer.
- Reconnect reads authoritative match state; it never recomputes from client state.

No room-creator advantage is introduced.

## G. Timeout Policy — CLOSED

### Bidding

- `BIDDING_TIMEOUT_SECONDS = 8`
- On timeout: automatic PASS.
- Repeated timeout: automatic PASS plus inactivity tracking; repeated inactivity enters the existing AFK/disconnect policy.
- Match action: the hand/match continues; timeout is not itself a gameplay penalty.

### Playing

- `PLAYING_TIMEOUT_SECONDS = 30`
- On timeout: enter AFK/disconnect handling; do not randomly choose a card.
- Repeated timeout: escalate through AFK/disconnect policy.
- Match action: use the existing reconnect/grace/forfeit policy when triggered; never mutate a hidden hand by random play merely because a timer expired.

## H. RD-09 EXT — CLOSED

Baseline:

- Five cards whose ranks are all in `{7,8,9}`.
- Trump 9 is allowed.
- Explicit declaration; never automatic cancellation.
- Any eligible player may declare.
- Multiple eligible players are resolved by canonical CCW action priority.
- Kasho window ends at `PURCHASE_FINALIZED`.
- A PASS alone does not waive Kasho; an actual purchase finalization waives it.
- Cancellation score = 0–0.
- Dealer rotation = ROTATE_RIGHT.

Violation matrix:

1. **Illegal Kasho after purchase:** reject; no state mutation.
2. **Ineligible player declaration:** reject; no state mutation.
3. **Declaration after window closes:** reject; no state mutation.
4. **Multiple eligible declarations:** first valid declaration by canonical CCW action priority wins; later duplicate/competing requests are rejected.
5. **Duplicate Kasho request:** idempotent/replay-safe rejection; no second cancellation.
6. **False Bushat claim:** reject; no state mutation; repeated abuse is handled by generic anti-abuse/AFK policy, not by inventing a new score rule.
7. **Malformed deal discovered after Kasho:** authoritative integrity incident; automatic cancellation if the deal is impossible to validate; no Kasho-derived score.
8. **Duplicate/replayed Kasho request:** idempotent; same command identity/event key produces no second effect.
9. **Invalid-Kasho penalty:** no gameplay score penalty for a rejected client action; server-authoritative rejection only.

## I. Bidding Residue — CLOSED

- `BID_ORDER = DEALER_RIGHT → PARTNER → DEALER_LEFT → DEALER` using shared CCW relative-seat utilities.
- `SUN_PRIORITY = canonical bidding turn/order priority from the same dealer-relative CCW order; no hardcoded seat indexes.`
- `ASHKAL_PRIORITY = DEALER → DEALER_LEFT` in both first and second bidding rounds.
- `SECOND_ROUND_PRIORITY = DEALER_RIGHT → PARTNER → DEALER_LEFT → DEALER`.
- `SAME_EVENT_TIE = earliest valid action in canonical CCW action order wins.`
- `PURCHASE_FINALIZATION_EVENT = PURCHASE_FINALIZED`.

Purchase finalization is the authoritative boundary that closes further bidding and the Kasho window.

## J. RD-05 EXT — Project Edge Cases — CLOSED

1. **Exact project tie:** resolve by canonical dealer-relative CCW priority; the earlier eligible player in that order wins the tie.
2. **Dealer-relative priority scope:** use it for project comparison/tie resolution wherever the rules require a deterministic tie-break; do not use it as a universal replacement for project ranking.
3. **Multiple projects by one team:** up to two normal projects may coexist for a team if independently valid.
4. **Project coexistence:** valid non-overlapping projects may coexist; Baloot is independent and is not a normal Project.
5. **Invalid declaration:** reject; no state mutation and no score.
6. **Late declaration:** reject; no state mutation and no score.
7. **Declaration after PLAY_CARD:** reject; no state mutation and no score.
8. **Overlapping cards:** reject the declaration if the same physical card would be used by two incompatible normal projects.
9. **Project × Double/Triple/Four timing:** declaration/reveal eligibility is determined by the project lifecycle; project Raw remains immutable. Project Qaid uses the canonical project multiplier already selected for the contract state.
10. **Project × Gahwa:** Gahwa is an immediate MATCH_WIN and bypasses normal round scoring.
11. **Project × Kaboot:** resolve project eligibility/ownership and Kaboot independently, then combine through the canonical round-resolution pipeline; Kaboot uses its dedicated flat table.
12. **Project × failed contract:** resolve project eligibility/ownership first; eligible winning-team project pool participates in the failed-contract round allocation without mutating historical project ownership/declarations.

## K. Provenance / Research Closure

The following provenance is recorded from the Phase 14.Z.4 Saudi research review:

- **Triple/Four project multipliers:** CONFLICT REMAINS OPEN. Saudi organized-play source reviewed states that projects do not multiply through Triple/Four in Hokum, while some digital references apply the multiplier. Existing RD-07 owner decision remains unchanged until explicitly reopened.
- **Locked Hokum mode:** adopted canonical from the existing owner decision; Saudi baseline/digital rule references were used as supporting research.
- **Max 2 projects:** adopted canonical; supported by digital Saudi/Arabic Baloot references.
- **Exposed Ace:** adopted canonical; Saudi organized-play source reviewed supports no third bidding round and no redeal.
- **Incident path:** adopted canonical; Saudi rules research supports opponent-choice handling for recoverable violations and cancellation/continuation patterns.
- **Kasho:** adopted canonical; Saudi organized-play source supports five 7/8/9 cards, including trump 9, and cancellation semantics.
- **Ika:** adopted canonical from the explicit owner decision; research used as supporting context.
- **Reverse Kaboot:** adopted canonical from explicit owner decision and Saudi rules research; predicate remains frozen.
- **Baloot/Hundred:** adopted canonical from explicit owner decision; Saudi rules research supports the special treatment.
- **Ashkal:** adopted canonical from explicit owner decision; Saudi research supports dealer/dealer-left eligibility including the second round in the selected baseline.

### Explicit research conflict still open

1. **Hokum Double Window:** Saudi organized-play source reviewed describes a broader Double window than the current project-specific RD-03 window. The current project decision remains canonical and is not silently replaced by research.
2. **Triple/Four Project Multiplier:** see above.

## L. Freeze Status

The approved decisions above close the Phase 14.Z.4 owner inputs that were directly answered by the research recommendation.

However:

`RULE_FREEZE = BLOCKED`

Remaining blockers are:

- The two explicit research conflicts above require an explicit decision if they are to be closed.
- Architecture decisions AD-01…AD-05 remain unresolved.
- Action/event catalog and implementation/test evidence remain pending.

Production engine code and behavioral tests remain unauthorized until Rule Freeze passes.
