# صكّة بلوت — Phase 14.Z.4 Remaining Rules Owner Decision Sheet

**Date:** 2026-09-22
**Phase:** 14.Z.4 — Remaining Rule Closure
**Status:** AWAITING RULES OWNER INPUT
**Policy:** No implementation. No inferred answers. Existing closed decisions are not reopened.

## Objective
Close the remaining rule-level blockers after Phase 14.Z.3.

Current status:

    RULE_FREEZE = BLOCKED
    P0 = 0

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

## B. V-02b — Complement / Opposing-Side Formula

The Rules Owner already selected the conversion behavior:

- Hokum: nearest 10; 1–5 down, 6–9 up; then /10.
- Sun: nearest 5; 1–4 down, 5 stays, 6–9 up; then /5.
- Integer-only; no floating point.

Only the complement formula remains open.

Choose:
- A — independently convert the opponent Raw share using the same contract-specific conversion.
- B — fixed-total complement against the contract canonical total.
- C — another exact formula.

Answer:

    V-02b =

Do not infer this from arithmetic convenience.

## C. V-06b — Exact Tie at Triple/Four

Closed headline: at DOUBLE, Initial Doubler Loses an exact raw tie.

Choose:
- A — same INITIAL_DOUBLER_LOSES policy applies at DOUBLE, TRIPLE, and FOUR.
- B — it applies only at DOUBLE; define exact Triple/Four tie handling.
- C — another exact rule.

Answer:

    V-06b =

## D. RD-03 — Sun Double Window

Hokum window is already canonicalized as:

    last 3 cards complete → ESCALATION_WINDOW → escalation
    → buyer raises final cards → window closes → PLAYING

Sun requires explicit boundaries.

Answer all:

    SUN_DOUBLE_OPEN =
    SUN_DOUBLE_CLOSE =
    SUN_DOUBLE_BEFORE_CARD_PLACEMENT = YES / NO
    SUN_DOUBLE_AFTER_CARD_PLACEMENT = YES / NO
    SUN_DOUBLE_AFTER_TRICK_START = YES / NO

Use exact events, not approximate phrases.

## E. Incident Policy

Existing lifecycle:

    INCIDENT_DETECTED → WAIT_FOR_DECISION → CONTINUE or CANCEL_HAND

Define policy for:
1. accidental exposure after initial deal
2. wrong card count
3. duplicate card / impossible deck state
4. purchase before completion
5. purchase out of turn
6. illegal Double
7. illegal Ashkal
8. other deal-integrity violation

For each:

    INCIDENT =
    DETECTOR =
    CHOICE_OWNER =
    OPTIONS =
    PENALTY =
    SCORE_ON_CANCEL =
    DEALER_ROTATION_ON_CANCEL =

Do not merge technical integrity failures with ordinary Kasho/Bushat cancellation unless explicitly intended.

## F. First Dealer

Choose:
- A — random server-seeded selection
- B — explicit room creator / host
- C — player-selection flow before match
- D — deterministic seed-derived seat
- E — another exact mechanism

Also define:

    FIRST_DEALER =
    REPLAY_SOURCE =
    RECONNECT_SOURCE =

The match-start mechanism must remain deterministic for replay.

## G. Timeout Policy

Define independently for bidding and playing:

    BIDDING_TIMEOUT_SECONDS =
    BIDDING_ON_TIMEOUT =
    BIDDING_REPEATED_TIMEOUT =
    BIDDING_MATCH_ACTION =

    PLAYING_TIMEOUT_SECONDS =
    PLAYING_ON_TIMEOUT =
    PLAYING_REPEATED_TIMEOUT =
    PLAYING_MATCH_ACTION =

Do not infer timeout behavior from server architecture.

## H. Kasho / Bushat Violation Matrix

Baseline is closed: five cards from 7/8/9; trump 9 allowed; explicit declaration; any eligible player; CCW priority; first bidding until purchase finalization; purchase waives; PASS does not; cancellation 0; ROTATE_RIGHT.

Still unresolved:
1. illegal Kasho after purchase
2. ineligible player declaration
3. declaration after window closes
4. multiple eligible declarations
5. duplicate Kasho request
6. false Bushat claim
7. malformed deal discovered after Kasho
8. duplicate/replayed Kasho request
9. invalid-Kasho penalty

Answer:

    RD-09-EXT =
    1 =
    2 =
    3 =
    4 =
    5 =
    6 =
    7 =
    8 =
    9 =

## I. Bidding Residue

Define exact Sun priority / override behavior and purchase finalization:

    BID_ORDER =
    SUN_PRIORITY =
    ASHKAL_PRIORITY =
    SECOND_ROUND_PRIORITY =
    SAME_EVENT_TIE =
    PURCHASE_FINALIZATION_EVENT =

Purchase finalization must define when Kasho and further bidding close.

## J. Project Edge Cases

Define:
1. exact project tie resolution
2. scope of dealer-relative priority
3. multiple projects by one team
4. project coexistence
5. invalid declaration
6. late declaration
7. declaration after PLAY_CARD
8. overlapping cards
9. project × Double/Triple/Four timing
10. project × Gahwa
11. project × Kaboot
12. project × failed contract

Answer:

    RD-05-EXT =
    1 =
    2 =
    3 =
    4 =
    5 =
    6 =
    7 =
    8 =
    9 =
    10 =
    11 =
    12 =

## K. Provenance Closure

For each item, provide the Owner Decision source or explicitly mark it as adopted canonical:

- Triple/Four project multipliers
- Locked Hokum mode
- Max 2 projects
- Exposed Ace no-third-round/no-redeal
- Incident path
- Kasho cancellation
- Ika partner exemption
- Reverse Kaboot predicate
- Baloot inside Hundred
- Ashkal second-round eligibility

Answer:

    PROVENANCE =
    Triple/Four projects =
    Locked Hokum =
    Max 2 projects =
    Exposed Ace =
    Incident path =
    Kasho =
    Ika =
    Reverse Kaboot =
    Baloot/Hundred =
    Ashkal =

## L. Required Response Template

Return:

    V-02b =
    V-06b =
    RD-03-SUN =
    SUN_DOUBLE_OPEN =
    SUN_DOUBLE_CLOSE =
    SUN_DOUBLE_BEFORE_CARD_PLACEMENT =
    SUN_DOUBLE_AFTER_CARD_PLACEMENT =
    SUN_DOUBLE_AFTER_TRICK_START =
    INCIDENT-POLICY =
    FIRST-DEALER =
    BIDDING-TIMEOUT =
    PLAYING-TIMEOUT =
    RD-09-EXT =
    BIDDING-RESIDUE =
    RD-05-EXT =
    PROVENANCE =

## Freeze Rule

After Owner answers, the agent may only transcribe explicit answers, update canonical docs/profile/conflicts/traceability, and run a documentation-only consistency audit.

Production engine code and behavioral tests remain unauthorized until Rule Freeze passes.