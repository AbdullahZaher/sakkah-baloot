# صكّة بلوت — Canonical Rules Inventory

**Phase:** 14.x  
**Date:** 2026-09-22  
**Status:** CANONICAL WORKING INVENTORY — RULE_FREEZE BLOCKED

> Explicit Rules Owner decisions are distinguished from research-supported rules.

## 1. Players, teams and direction

- 4 players.
- 2 teams: NORTH+SOUTH and EAST+WEST.
- Global direction: **counter-clockwise**.
- Direction applies to dealing, bidding, play, dealer rotation and relative seat terminology.

## 2. Deck

32 cards:
`A K Q J 10 9 8 7 × 4 suits`

## 3. Ranking

Sun:
`A > 10 > K > Q > J > 9 > 8 > 7`

Trump:
`J > 9 > A > 10 > K > Q > 8 > 7`

## 4. Raw card values

Sun:
A=11, 10=10, K=4, Q=3, J=2, 9/8/7=0.

Trump:
J=20, 9=14, A=11, 10=10, K=4, Q=3, 8/7=0.

## 5. Dealing

Initial deal: 3+2 = 5 each.

Then one exposed card is revealed.

Remaining hidden cards: 11.

Rules Owner decision:
- Buyer receives exposed card + 2 hidden.
- Every other player receives 3 hidden.
- Final hand size = 8 each.

## 6. Contracts

- SUN
- HOKUM

Ashkal resolves as SUN but has special buyer/exposed-card semantics.

## 7. Doubling

Research-supported baseline:

HOKUM:
`NORMAL -> DOUBLE -> TRIPLE -> FOUR -> GAHWA`

SUN:
`NORMAL -> DOUBLE`

Ownership:
`Opponent -> Buyer -> Doubler -> Buyer`

Open/locked state is independent:
- Double: open by default; may be locked.
- Triple: open.
- Four: open or locked.
- Gahwa: terminal/open.

Exact window boundary remains OPEN.

## 8. Gahwa

Rules Owner decision:
`GAHWA -> MATCH_COMPLETE`

No ordinary 152-Qaid continuation after Gahwa.

## 9. Projects

Lifecycle:
`DETECTED -> ANNOUNCED -> REVEALED -> COMPARED -> AWARDED / DISCARDED`

Research-supported timing:
- announce/type in first trick;
- reveal/compare in second trick.

## 10. Project values

| Contract | Sera | Fifty | Hundred | Four Hundred | Baloot |
|---|---:|---:|---:|---:|---:|
| Hokum | 2 | 5 | 10 | — | 2 |
| Sun | 4 | 10 | 20 | 40 | — |

Research indicates projects multiply with Double, but do not continue multiplying by Triple/Four. Final canonical acceptance remains required.

## 11. Baloot

- K + Q of trump.
- Value = 2.
- Declared during the second card, before it lands.
- Does not multiply with doubling.
- Special project interactions remain under canonical verification.

## 12. Trick Legality — G-1 / G-2 / G-2P

### Ika
Hokum only. The trick leader may optionally declare Ika when leading a non-trump card that is the highest remaining card of its suit. Invalid Ika rejects the entire PLAY_CARD with zero state mutation.

### Ika Partner Exemption
The exemption applies only to the third player when:
- the player lacks the lead suit;
- the partner opened the trick;
- the partner is the current winner; and
- the partner's lead card is an Ace or the partner declared valid Ika.

The exempt player may play any card, including trump.

### Partner-winning trump
For third or fourth player, when the partner's trump is the current winning trump, there is no forced overtrump against the partner; any trump is legal.

### Opponent-winning trump
If an opponent's trump is winning and a higher trump is available, MUST_OVERTRUMP applies. If no higher trump exists but the player has trump, any trump is legal.

For a non-trump lead with no lead suit:
- third + opponent winning on non-trump + trump available → MUST_TRUMP;
- third + opponent winning on trump + higher trump → MUST_OVERTRUMP;
- third + opponent winning on trump + no higher trump + trump → any trump;
- fourth + partner winning → ANY_CARD;
- fourth + opponent winning follows the same current-winner-card trump obligations.

Locked Hokum affects leading only; valid Ika does not bypass the Locked lead restriction.

## 13. Kaboot

Derived outcome; no claim action.

Dedicated Rule Profile table:
- Hokum: Normal 25, Double 50, Triple 75, Four 100.
- Sun: Normal 44, Double 88.
- Reverse Kaboot: Sun only, 88, independent special outcome, never doubles.
- Gahwa overrides Kaboot.

The table is explicit and must not be reconstructed from the generic contract multiplier at runtime.

## 14. Scoring architecture

`Raw Card Points`
-> `Last-Trick Handling`
-> `Qaid Conversion`
-> `Project Resolution`
-> `Baloot Resolution`
-> `Kaboot Resolution`
-> `Contract Success/Failure`
-> `Doubling Resolution`
-> `Match Qaid Update`

## 15. Sun arithmetic correction

Sun base card values = 120.

Last-trick bonus = +10.

Total raw Sun points including the bonus = **130**.

Do not count 130 as a base and add another +10.

## 16. Match

Target = 152 Qaid.

Gahwa is a separate terminal outcome.

## 17. Kasho / redeal

Research-supported:
- Five initial cards all from 9/8/7 qualify for the documented Bushat condition.
- 9-trump does not invalidate it under the cited Saudi source.
- Second-round all-pass cancels the hand without score and advances dealing.
- Certain dealing violations give the opposing side a continue/redeal choice.

Full matrix remains open.

## 18. Ashkal

Research-supported:
- Caller = buyer.
- Partner receives exposed card.
- Contract = Sun.
- Eligibility depends on seat and bidding history.
- Relevant prior Wala behavior can remove eligibility.

Exact seat matrix remains open until canonicalized against counter-clockwise direction.

## 19. Hidden information and determinism

- Server never sends hidden cards to clients.
- Core engine is deterministic/replayable from initial state/seed, ordered actions and Rule Profile.
- Rule Profile is immutable for a match.
