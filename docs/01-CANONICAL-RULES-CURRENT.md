# صكّة بلوت — Current Canonical Rules

**Status:** Canonical working baseline; pending RD-20 verification.

## Match / Seats
- 4 players: NORTH, EAST, SOUTH, WEST.
- Team A = NORTH + SOUTH; Team B = EAST + WEST.
- Global direction: COUNTER_CLOCKWISE.
- Relative order: NORTH → WEST → SOUTH → EAST.
- Use one relative-seat utility everywhere; never hardcode numeric seat arithmetic.

## Deck
32 cards: 4 suits × 7,8,9,10,J,Q,K,A.

Sun: A > 10 > K > Q > J > 9 > 8 > 7.
Trump: J > 9 > A > 10 > K > Q > 8 > 7.

Sun raw: A11, 10=10, K4, Q3, J2, 9/8/7=0.
Trump raw: J20, 9=14, A11, 10=10, K4, Q3, 8/7=0.

Sun total = 120 + 10 last-trick = 130.
Hokum total = 152 + 10 last-trick = 162.

## Dealing
- Initial 5 cards/player = 20.
- 1 exposed card.
- Buyer gets exposed + 2 hidden completion cards.
- Others get +3 hidden each.
- Final hand size = 8.
- Conservation = 20 + 1 + 11 = 32.
- Ashkal: caller=buyer; partner receives exposed card; caller gets 3 hidden; others +3.
- Natural exposed Ace does not redeal and does not create a phase or third bidding round.

## Bidding / Ashkal
Two bidding rounds. PASS and PASS_FINAL are semantically distinct; wire form is AD-01.

Ashkal:
- eligible first and second rounds: DEALER and DEALER_LEFT
- caller = buyer
- partner = exposed-card recipient
- contract = SUN
- caller and recipient are different players on same team
- PASS_FINAL blocks later Ashkal
- server validates legality.

## Escalation
Hokum: NORMAL → DOUBLE → TRIPLE → FOUR → GAHWA.
Sun: NORMAL → DOUBLE.

Window:
last 3 cards complete → ESCALATION_WINDOW → escalation → buyer raises final cards → window closes → PLAYING.
No escalation after trick starts. One continuous window.

Hokum play mode is independent from multiplier. Locked affects leading only: cannot lead trump while a non-trump exists; may lead trump if hand is all trump. It does not alter follow suit/cutting/must-trump/overtrump. Ika does not bypass locked lead.

## Projects
Lifecycle: DECLARED → REVEALED → COMPARED → AWARDED/DISCARDED.
Normal project declaration: before the player's first card of Trick 1; after PLAY_CARD the announcement window closes. Declaration never directly changes score.

Values:
- Hokum: Sera 20/2, Fifty 50/5, Hundred 100/10, Baloot 20/2 (raw/qaid).
- Sun: Sera 20/4, Fifty 50/10, Hundred 100/20, Four Hundred 200/40.
- Four Hundred is Sun-only.

Project Raw enters contract resolution and is immutable. Project multiplier applies only to Project Qaid.

Ranking is independent from raw/qaid.
Sun: Four Hundred > Hundred Sequence > Hundred Aces > Kings > Queens > Jacks > Tens > Fifty > Sera.
Hokum: Hundred Sequence > Hundred Aces > Kings > Queens > Jacks > Tens > Fifty > Sera.
Sequence rank: A > K > Q > J > 10 > 9 > 8 > 7.
Tie: dealer-relative CCW priority.
Max 2 projects/hand; one card cannot belong to two projects.
Project Winner is independent from Round Winner. All eligible projects of winning team form Project Pool.

## Baloot
Hokum only. Same player owns trump K+Q. Declare when playing the second K/Q before card commit. Optional. Raw 20, qaid 2, multiplier ×1. Independent of Project Winner. If inside Hundred, Baloot is absorbed and not separately scored.

## Contract Resolution
1. Project eligibility
2. Project ownership
3. Baloot resolution
4. awarded Project Raw
5. eligible Baloot Raw
6. Contract Raw
7. buyer success/failure
8. Qaid allocation.

Buyer succeeds at >=65 Sun and >=81 Hokum; exact threshold tie = buyer succeeds.
Buyer failure: opponent receives full contract round value; project history is not erased; resolved project pool may be allocated to opponent.

## Qaid conversion
Use the exact approved contract-specific conversion table in RuleProfile. Do not derive it from a generic divisor. No floating point in persisted scoring.

## Kaboot
Derived; no DECLARE_KABOOT action.
Normal: Hokum 25, Sun 44; one team wins all 8 tricks. Never multiply by contract multiplier.
Reverse: Sun only; buyer is dealer-right under CCW mapping; buyer had Ace in original 8-card hand; buyer team wins 0 tricks; value 88; never doubles. Gahwa overrides Kaboot.

## Ika / Legal Moves
Hokum only. Ika is optional and only valid for the canonical leader/non-trump/highest-remaining-card condition. Wrong Ika rejects the entire PLAY_CARD with no mutation. Represent `ikaDeclared` inside CARD_PLAYED.

Public legality API:
`getLegalMoves(state, playerId): LegalMove[]`
Return actual legal cards/options, not only abstract constraints. Client only enables returned legal options; server recalculates every action.

Trick legality depends on lead suit, trick position, current winner/team, trump presence, Ika, and higher-trump availability. Never reduce it to a global “has trump => must trump” rule.

## Kasho / Bushat
Bushat = any five cards whose ranks are 7/8/9; trump 9 allowed. Any eligible player may explicitly declare Kasho. Multiple eligible players resolve by deterministic CCW action priority.
Kasho window: FIRST_BIDDING until purchase finalized. Actual purchase waives; PASS alone does not. No Kasho after contract finalization.
Kasho cancels hand, score 0–0, no round Raw/Qaid/Project/Baloot/Kaboot, match unchanged, dealer rotates right, idempotent.
Kawesh/Saneen are aliases, not separate mechanisms.

## Termination
No REDEAL GamePhase.
Normal completion → ROUND_RESOLVED → next hand.
All Pass → HAND_CANCELLED → 0–0 → dealer rotates right → DEALING.
Kasho → HAND_CANCELLED → 0–0 → dealer rotates right → DEALING.
Gahwa → MATCH_WIN → MATCH_FINISHED.
Rule incident → INCIDENT_DETECTED → WAIT_FOR_DECISION → CONTINUE or CANCEL_HAND.
Termination is idempotent.

## Match
Target 152 Qaid. Gahwa bypasses the 152 race. If both teams cross 152 in one completed round, higher final match total wins; exact equal final totals cause an extra deal.

## Core invariants
Server authoritative; hidden hands never leak; actions are intents; state/replay deterministic; duplicate actions idempotent; no network timing affects rules; RuleProfile owns configurable rules; domain engine has no React/Expo/Supabase/Redis/WebSocket imports.
