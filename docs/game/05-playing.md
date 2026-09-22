# صكّة بلوت — Playing System Specification

**Document:** `docs/game/05-playing.md`  
**Status:** Draft for Review — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`, `02-card-system.md`, `03-dealing.md`, `04-bidding.md`  
**Next dependent documents:** Scoring, Game State, Actions, State Transitions

---

# 1. Purpose

This document defines the authoritative card-playing system for صكّة بلوت after the contract has been selected and the final hands have been completed.

It specifies:

- trick lifecycle
- trick leader
- turn order
- led suit
- legal-card calculation
- following suit
- Trump behavior
- trick winner calculation
- card placement
- trick completion
- next-trick leadership
- final trick
- illegal move rejection
- timeout behavior
- reconnect behavior
- duplicate action protection
- replay determinism
- bot compatibility
- testing requirements

The purpose is to make every played card a deterministic, server-authoritative state transition.

---

# 2. Core Principle

**A player submits intent; the Game Engine decides whether the card is legal and what happens next.**

The client MUST NOT be trusted to determine:

- whether a card can be played
- whether the player must follow suit
- whether a card is Trump
- whether a card wins
- whose turn it is
- who won the trick
- when the next trick begins

The authoritative server owns all of these decisions.

---

# 3. Domain Independence

Playing belongs in the pure game engine.

It MUST NOT import:

- React
- React Native
- Expo
- Skia
- Reanimated
- Supabase
- PostgreSQL
- Redis
- WebSocket libraries
- UI modules
- localization packages

Recommended location:

```text
packages/
└── game-engine/
    └── src/
        └── playing/
            ├── playing-types.ts
            ├── legal-cards.ts
            ├── trick-engine.ts
            ├── play-card.ts
            ├── trick-winner.ts
            └── playing-validation.ts
```

---

# 4. Playing Lifecycle

After bidding and completion of the deal:

```text
PLAYING_READY
      ↓
TRICK_STARTED
      ↓
PLAYER_TURN
      ↓
CARD_PLAYED
      ↓
PLAYER_TURN
      ↓
FOUR_CARDS_PLAYED
      ↓
TRICK_RESOLVED
      ↓
NEXT_TRICK / ROUND_COMPLETE
```

A round contains exactly:

```text
8 tricks
```

because every player starts the playing phase with:

```text
8 cards
```

---

# 5. Four Players

Canonical seats:

```text
NORTH
EAST
SOUTH
WEST
```

The playing order is counter-clockwise according to the selected Rule Profile.

Recommended helper:

```ts
getNextSeat(seat, direction)
```

Do not calculate next player using database ordering.

---

# 6. First Trick Leader

The first trick leader must be determined by the selected Rule Profile.

The baseline project rule currently describes:

```text
player to the dealer's right
```

as the first leader.

This MUST be frozen in the Rule Profile before production implementation.

The playing engine should receive:

```ts
firstTrickLeader: Seat
```

from the authoritative game state rather than guessing it from UI.

---

# 7. Trick Model

A trick consists of up to four played cards.

Recommended:

```ts
interface TrickPlay {
  readonly seat: Seat;
  readonly cardId: CardId;
  readonly playedAt?: number;
}
```

and:

```ts
interface TrickState {
  readonly trickNumber: number;
  readonly leaderSeat: Seat;
  readonly ledSuit?: Suit;
  readonly plays: readonly TrickPlay[];
  readonly winnerSeat?: Seat;
}
```

`ledSuit` is undefined before the first card is played.

---

# 8. Trick Numbering

Tricks are numbered:

```text
1
2
3
4
5
6
7
8
```

The domain should use an integer:

```ts
type TrickNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
```

If implementation simplicity requires `number`, runtime validation MUST enforce:

```text
1 <= trickNumber <= 8
```

---

# 9. Card Ownership

Before a card is played:

```text
cardId ∈ player's authoritative hand
```

After the card is played:

```text
cardId ∉ player's hand
cardId ∈ current trick
```

A card cannot simultaneously remain in the player's hand and appear on the table.

This is a hard invariant.

---

# 10. Play Action

Recommended client intent:

```ts
interface PlayCardAction {
  readonly type: "PLAY_CARD";
  readonly cardId: CardId;
}
```

The client should not submit:

```text
winnerSeat
ledSuit
isTrump
trickNumber
```

Those are derived by the server.

---

# 11. Play Validation Pipeline

When a player submits:

```text
PLAY_CARD(cardId)
```

the server validates in this order:

```text
1. Game exists
2. Player authenticated
3. Player belongs to game
4. Game is in PLAYING phase
5. Player occupies a valid seat
6. Player is current turn
7. Card ID is valid
8. Card belongs to player's hand
9. Card is legal under trick rules
10. Action ID/state version is valid
11. Apply transition
12. Recalculate trick state
13. Resolve trick if four cards exist
14. Persist atomically
15. Publish resulting state/event
```

---

# 12. Current Turn

Exactly one seat is actionable at any moment.

Recommended:

```ts
interface TurnState {
  readonly activeSeat: Seat;
  readonly startedAt: number;
  readonly expiresAt: number;
}
```

The client renders the timer but does not own it.

---

# 13. First Card of a Trick

The first card played establishes:

```text
ledSuit = playedCard.suit
```

The first card does NOT automatically establish:

```text
winner = player who played it
```

It becomes the current winner candidate.

Subsequent cards may defeat it.

---

# 14. Led Suit

The led suit is the suit of the first card played in the trick.

Example:

```text
First card = HEARTS_A

ledSuit = HEARTS
```

The led suit remains fixed for the entire trick.

It must never change because a Trump card was later played.

---

# 15. Following Suit — Core Rule

Unless the selected Rule Profile explicitly defines an exception:

> If a player has one or more cards of the led suit, the player must play a card of that suit.

This is one of the most important legality rules in the engine.

The UI may visually suggest legal cards, but the server must validate it.

---

# 16. Legal Card Set

Recommended:

```ts
getLegalCards(
  hand: readonly Card[],
  trick: TrickState,
  contract: Contract
): readonly CardId[];
```

Algorithm:

```text
if first card:
    every card in hand is potentially legal

else:
    ledSuitCards = cards matching ledSuit

    if ledSuitCards.length > 0:
        legalCards = ledSuitCards
    else:
        legalCards = cards allowed by contract/rule profile
```

The final branch must be rule-profile aware.

---

# 17. Void in Led Suit

If a player has no card matching the led suit, the player is:

```text
VOID_IN_LED_SUIT
```

The player may then play according to the Trump/discard rules.

This is not automatically equivalent to:

```text
must play Trump
```

unless the Rule Profile says so.

---

# 18. Trump Play

When a Trump contract is active:

```ts
contract.type === "TRUMP"
```

and:

```text
card.suit === contract.suit
```

the card is Trump.

Trump cards have the Trump ranking defined in the Card System.

A player who is void in the led suit may normally play Trump, subject to the selected Rule Profile.

---

# 19. When Trump Is Led

If the first card is Trump:

```text
ledSuit = trumpSuit
```

Therefore all players who have Trump cards must follow Trump.

This follows the normal follow-suit invariant.

---

# 20. Sun Contract

Under Sun:

```text
contract.type === "SUN"
```

there is no Trump suit.

The winning card is determined by the led suit.

A card from another suit cannot win merely because it has a higher static rank.

---

# 21. Trump Contract — Winner Logic

Under Trump:

A trick winner is determined conceptually as:

```text
If one or more Trump cards were played:
    strongest Trump wins

Else:
    strongest card of led suit wins
```

Cards from unrelated non-led suits cannot win.

---

# 22. Winner Comparison

Recommended:

```ts
compareForTrick(
  candidate: Card,
  currentWinner: Card,
  context: TrickComparisonContext
): number
```

Context:

```ts
interface TrickComparisonContext {
  readonly contract: Contract;
  readonly ledSuit: Suit;
}
```

The comparison must be deterministic.

---

# 23. Example — Sun

Contract:

```text
SUN
```

Led suit:

```text
CLUBS
```

Cards:

```text
A♣
K♣
10♣
Q♥
```

Winner:

```text
A♣
```

Reason:

- A♣ follows led suit.
- K♣ and 10♣ also follow.
- Q♥ is off-suit and cannot win.

---

# 24. Example — Trump

Contract:

```text
HEARTS TRUMP
```

Led suit:

```text
CLUBS
```

Cards:

```text
A♣
K♣
9♥
Q♣
```

Winner:

```text
9♥
```

because a Trump card was played and Trump outranks non-Trump cards.

---

# 25. Multiple Trump Cards

If multiple Trump cards are played:

```text
J♥
9♥
A♥
10♥
```

the Trump ranking applies:

```text
J♥ > 9♥ > A♥ > 10♥
```

The winner is:

```text
J♥
```

---

# 26. Multiple Non-Trump Cards

If no Trump is played:

```text
A♣
10♣
K♣
Q♣
```

the Sun/non-Trump ranking applies:

```text
A > 10 > K > Q
```

Winner:

```text
A♣
```

---

# 27. Trick Resolution

A trick resolves only after:

```text
plays.length === 4
```

Resolution steps:

```text
1. Determine winning play
2. Set winnerSeat
3. Move all four cards to completed trick
4. Record trick result
5. Update team/trick counters
6. Determine next leader
7. Start next trick or finish round
```

Scoring of card points belongs to the Scoring document.

---

# 28. Winner Leads Next Trick

The winner of the current trick becomes the leader of the next trick.

Example:

```text
Trick 1 winner = SOUTH
```

Then:

```text
Trick 2 leader = SOUTH
```

This is a domain state transition, not a UI behavior.

---

# 29. Next Trick Turn Order

After the leader plays:

```text
leader
→ next seat
→ next seat
→ next seat
```

The exact direction comes from the Rule Profile.

Do not use:

```text
array index + 1
```

unless the seat ordering is formally defined by the domain.

---

# 30. Hand Size During Play

At the start:

```text
each player = 8 cards
```

After each trick:

```text
each player loses exactly 1 card
```

Therefore:

| Trick | Cards per player remaining |
|---:|---:|
| Start | 8 |
| After 1 | 7 |
| After 2 | 6 |
| After 3 | 5 |
| After 4 | 4 |
| After 5 | 3 |
| After 6 | 2 |
| After 7 | 1 |
| After 8 | 0 |

This is a critical invariant.

---

# 31. Total Played Cards

At trick N:

```text
playedCards = N × 4
```

Before trick resolution:

```text
0 ≤ plays ≤ 4
```

At round completion:

```text
8 × 4 = 32 cards
```

All cards must have been accounted for.

---

# 32. Card Conservation During Play

At every state:

```text
deck
+
hands
+
current trick
+
completed tricks
+
other public zones
=
32
```

No card may disappear.

No card may be duplicated.

---

# 33. Illegal Card — Not in Hand

If a player submits:

```text
HEARTS_A
```

but does not own it:

```text
CARD_NOT_IN_HAND
```

The state must remain unchanged.

---

# 34. Illegal Card — Wrong Suit

Example:

```text
ledSuit = CLUBS
player hand contains:
A♣
7♥
```

If the player tries:

```text
7♥
```

the server rejects it because:

```text
A♣
```

is available and the player must follow Clubs.

Recommended error:

```text
MUST_FOLLOW_LED_SUIT
```

---

# 35. Illegal Card — Wrong Turn

If EAST is active and NORTH submits:

```text
PLAY_CARD(...)
```

reject:

```text
INVALID_TURN
```

Do not modify:

- hand
- trick
- timer
- state version

---

# 36. Illegal Card — Wrong Phase

If the game is:

```text
BIDDING
```

and a player submits:

```text
PLAY_CARD
```

reject:

```text
PLAYING_NOT_ACTIVE
```

The action must not leak into future phases.

---

# 37. Duplicate Play Action

Every action should have a unique action ID.

Example:

```json
{
  "actionId": "a9f...",
  "type": "PLAY_CARD",
  "cardId": "HEARTS_A",
  "expectedStateVersion": 105
}
```

If the same action arrives twice:

```text
only one state transition occurs
```

---

# 38. State Versioning

Recommended:

```text
expectedStateVersion
```

For example:

```text
Server = 105
Client sends = 105
→ accepted
→ Server = 106
```

A stale action:

```text
Client sends = 105
Server = 106
```

must be rejected or resolved according to an explicit idempotency policy.

---

# 39. Atomic Play Transition

A valid play should be applied atomically:

```text
validate
  ↓
remove card from hand
  ↓
add card to trick
  ↓
update led suit if first card
  ↓
resolve winner if fourth card
  ↓
update leader/turn
  ↓
validate invariants
  ↓
persist
  ↓
publish event
```

No partial state should be externally visible.

---

# 40. Event Model

Possible events:

```text
TRICK_STARTED
CARD_PLAYED
TRICK_COMPLETED
TURN_CHANGED
ROUND_COMPLETED
```

These are conceptual names.

The final protocol document should define exact schemas.

---

# 41. Card Played Event

Conceptually:

```ts
interface CardPlayedEvent {
  readonly trickNumber: number;
  readonly seat: Seat;
  readonly cardId: CardId;
  readonly stateVersion: number;
}
```

Do not include hidden information unrelated to the public play.

A played card is public once it is played.

---

# 42. Trick Completed Event

Conceptually:

```ts
interface TrickCompletedEvent {
  readonly trickNumber: number;
  readonly plays: readonly TrickPlay[];
  readonly winnerSeat: Seat;
  readonly nextLeaderSeat?: Seat;
}
```

Scoring details are intentionally excluded.

---

# 43. Timer

The server controls the turn timer.

The client receives:

```text
startedAt
expiresAt
```

or an equivalent authoritative deadline.

The client may animate a countdown.

It must not decide when a timeout has happened.

---

# 44. Timeout Policy

The Rule Profile must define what happens when a player does not play before the deadline.

Possible policies include:

```text
automatic legal card selection
automatic lowest legal card
random legal card
forfeit/penalty
bot takeover
```

The project MUST select exactly one production behavior.

Do not implement a silent fallback.

---

# 45. Timeout and Fairness

If automatic card selection is used:

- it must be deterministic where possible
- it must be recorded in replay
- it must be marked as server-generated
- it must be visible in audit data
- it must not allow the client to choose the timeout result

Recommended action source:

```text
PLAYER
SERVER_TIMEOUT
BOT
```

---

# 46. Reconnect

On reconnect:

```text
load authoritative game state
→ create player-specific view
→ send current trick
→ send own hand
→ send public cards
→ send active seat
→ send remaining timer
```

Do not replay missing gameplay as new actions.

---

# 47. Reconnect During Four-Card Trick

If a player reconnects after three cards have been played:

```text
plays = 3
activeSeat = fourth player
```

The server resumes from exactly that state.

It must not:

- reset the trick
- choose a winner early
- re-deal cards
- discard the partial trick

---

# 48. Reconnect After Trick Completion

If the server has already committed:

```text
TRICK_COMPLETED
```

then reconnect returns the resolved state.

The client may animate the transition, but the animation is not authoritative.

---

# 49. Replay

A complete replay should be able to reconstruct:

```text
contract
initial hands
turn sequence
every card play
every trick winner
round completion
```

Replay execution should use the same Game Engine.

Do not implement a second winner algorithm specifically for replay.

---

# 50. Bot Compatibility

Bots must select cards using:

```ts
getLegalCards(...)
```

and submit:

```text
PLAY_CARD
```

through the same engine boundary.

The bot must not mutate:

```text
hand
trick
winner
turn
```

directly.

---

# 51. Simulation

The engine should support:

```text
1000s / 100000s of simulated tricks
```

without network or UI.

Simulation can validate:

- no illegal plays
- card conservation
- 8 tricks per round
- correct winner logic
- no duplicate cards
- deterministic replay

Large-scale simulation should be used before production release.

---

# 52. Project Interaction

Projects may affect scoring or other round semantics, but card legality remains governed by:

```text
contract
led suit
hand
Rule Profile
```

Project declarations MUST NOT silently change the basic card identity model.

Any project-specific play exception must be explicitly specified.

---

# 53. Doubling Interaction

Doubling/triple/four/coffee rules may affect scoring.

They should not alter basic:

```text
card identity
hand ownership
turn order
follow-suit
trick winner
```

unless the final Rule Profile explicitly defines a special gameplay exception.

---

# 54. Final Trick

The eighth trick is resolved normally.

After the fourth card of the eighth trick:

```text
winner determined
all 32 cards accounted for
round becomes COMPLETE
```

The Playing Engine then hands control to:

```text
Scoring Engine
```

---

# 55. Last Trick Bonus Boundary

If the rules award a last-trick/earth bonus:

```text
+10 raw points
```

that bonus belongs to Scoring.

The Playing Engine should only expose:

```text
trickNumber === 8
winnerSeat
```

and allow Scoring to apply the configured bonus.

Do not embed scoring arithmetic in trick resolution.

---

# 56. Round Completion

Recommended transition:

```text
TRICK 8 COMPLETE
      ↓
PLAYING_COMPLETE
      ↓
SCORING_PENDING
```

The exact global state names belong to the State Transition document.

---

# 57. Legal Card Algorithm — Detailed

Recommended conceptual algorithm:

```text
Input:
  hand
  contract
  current trick
  rule profile

If hand is empty:
    invalid game state

If trick has zero plays:
    all hand cards are legal

Otherwise:
    ledSuit = trick.ledSuit

    matching = hand.filter(card.suit === ledSuit)

    If matching is not empty:
        return matching

    Otherwise:
        return resolveVoidSuitLegalCards(
            hand,
            contract,
            ruleProfile,
            trick
        )
```

The `resolveVoidSuitLegalCards` function must be Rule Profile aware.

---

# 58. Winner Algorithm — Detailed

Conceptually:

```text
currentWinner = first play

for each subsequent play:
    if candidate beats currentWinner:
        currentWinner = candidate

return currentWinner
```

The comparison function determines whether the candidate beats the current winner.

It must consider:

```text
contract
trump suit
led suit
card rank
```

---

# 59. Candidate Beats Winner

For Trump contract:

```text
Trump beats non-Trump
Trump beats lower Trump
Non-Trump led suit beats non-led suit
Non-Trump led suit does not beat Trump
```

For Sun:

```text
led suit beats non-led suit
higher led-suit rank beats lower led-suit rank
```

This is a domain comparison function, not a UI rule.

---

# 60. Important Separation

Keep these functions separate:

```ts
isTrump(card, contract)
```

```ts
mustFollowSuit(hand, ledSuit)
```

```ts
getLegalCards(hand, trick, contract)
```

```ts
compareForTrick(a, b, context)
```

```ts
resolveTrickWinner(trick, contract)
```

This prevents a single oversized function from becoming the only source of gameplay behavior.

---

# 61. State Invariants

At every valid playing state:

### Turn

```text
exactly one active seat
```

### Hand

```text
every card belongs to at most one hand
```

### Trick

```text
0 <= plays <= 4
```

### Led suit

```text
undefined iff plays.length = 0
```

Otherwise:

```text
ledSuit = first card's suit
```

### Winner

```text
winnerSeat undefined while trick incomplete
winnerSeat defined when trick complete
```

### Cards

```text
all cards remain conserved
```

### Trick count

```text
1 <= trickNumber <= 8
```

---

# 62. Invalid State Detection

The engine should detect:

```text
DUPLICATE_CARD
CARD_NOT_IN_ANY_VALID_ZONE
CARD_IN_MULTIPLE_ZONES
INVALID_HAND_SIZE
INVALID_TRICK_SIZE
INVALID_LEADER
INVALID_ACTIVE_SEAT
INVALID_LED_SUIT
INVALID_WINNER
INVALID_TRICK_NUMBER
ROUND_COMPLETE_WITH_REMAINING_CARDS
```

Invalid states should fail loudly in development/test environments.

---

# 63. Error Codes

Recommended stable action errors:

```text
PLAYING_NOT_ACTIVE
INVALID_TURN
INVALID_CARD_ID
CARD_NOT_IN_HAND
CARD_NOT_LEGAL
MUST_FOLLOW_LED_SUIT
INVALID_CONTRACT
INVALID_STATE_VERSION
ACTION_ALREADY_PROCESSED
TURN_EXPIRED
ROUND_ALREADY_COMPLETE
```

Client localization maps these codes to Arabic/English messages.

---

# 64. Client UX Contract

The client should receive enough information to render:

```text
whose turn
current trick
played cards
led suit
own hand
legal card hints
timer
trick winner
```

The client should NOT need to implement the rules itself.

It can perform local prediction for animation, but server state remains authoritative.

---

# 65. Client Prediction

Optional future optimization:

```text
tap card
→ local visual response
→ send action
→ server validates
→ reconcile
```

Prediction MUST NOT:

- commit score
- remove a card permanently
- decide trick winner
- advance the authoritative turn
- reveal hidden information

If server rejects the action, the client rolls back to the authoritative state.

---

# 66. Animation Boundary

Card animation may include:

```text
lift
drag
rotate
play
settle
trick collection
```

These belong entirely to the UI.

The Game Engine only sees:

```text
PLAY_CARD(cardId)
```

This keeps the gameplay deterministic and testable.

---

# 67. Performance

The following should be O(1) or effectively O(hand size):

```text
isTrump
getLegalCards
compareForTrick
resolveTrickWinner
```

A hand has at most eight cards, so correctness is more important than premature optimization.

Avoid expensive:

- serialization
- localization
- network calls
- database queries

inside card comparison loops.

---

# 68. Testing Matrix

### Legal play

- [ ] first card can be any card
- [ ] led-suit card is required when available
- [ ] void player can use allowed off-suit cards
- [ ] Trump behavior
- [ ] Sun behavior

### Winner

- [ ] highest led suit wins in Sun
- [ ] Trump beats led non-Trump
- [ ] highest Trump wins
- [ ] off-suit non-Trump cannot win

### Lifecycle

- [ ] four cards resolve
- [ ] winner leads next trick
- [ ] eight tricks complete
- [ ] all hands empty
- [ ] 32 cards accounted for

### Security

- [ ] wrong turn rejected
- [ ] card not in hand rejected
- [ ] duplicate action rejected
- [ ] stale state rejected
- [ ] hidden state not leaked

---

# 69. Property-Based Tests

### Conservation

After every legal play:

```text
number of unique card IDs across all zones = 32
```

### Hand reduction

After every completed trick:

```text
each player hand size decreases by exactly 1
```

### Trick size

```text
0 <= trick.plays.length <= 4
```

### Winner determinism

Same trick + contract:

```text
same winner
```

### Replay

Same initial state + same action sequence:

```text
same final state
```

---

# 70. Golden Fixtures

Minimum fixtures:

### Sun

```text
led = CLUBS
A♣
10♣
K♣
Q♥

winner = A♣
```

### Trump

```text
trump = HEARTS
led = CLUBS
A♣
K♣
9♥
Q♣

winner = 9♥
```

### Multiple Trump

```text
trump = HEARTS
led = CLUBS
J♥
9♥
A♥
10♥

winner = J♥
```

### Void player

A player has no led-suit card and submits an allowed off-suit card.

### Illegal follow

A player owns a led-suit card but submits another suit.

---

# 71. Replay Verification

A replay validator should verify:

```text
every action legal
every card belonged to actor
every turn correct
every led suit correct
every trick winner correct
every state transition valid
final state valid
```

A replay that fails validation must not be treated as authoritative.

---

# 72. Open Decisions

The following MUST be finalized:

1. Exact first trick leader.
2. Exact clockwise/seat convention.
3. Any special follow-suit exceptions.
4. Exact void/Trump rules.
5. Any project-related play exceptions.
6. Timeout automatic-play policy.
7. Whether timeout selection is deterministic.
8. Exact final trick bonus boundary.
9. Any variant-specific trick behavior.
10. Exact Rule Profile version.

---

# 73. Rule Freeze Gate

Before implementation freeze:

- [ ] First leader frozen.
- [ ] Turn direction frozen.
- [ ] Follow-suit rule frozen.
- [ ] Trump behavior frozen.
- [ ] Sun behavior frozen.
- [ ] Void behavior frozen.
- [ ] Trick winner algorithm frozen.
- [ ] Timeout behavior frozen.
- [ ] Eight-trick lifecycle frozen.
- [ ] Scoring handoff frozen.
- [ ] Replay semantics frozen.
- [ ] Golden fixtures verified.

---

# 74. Implementation Checklist

### Domain

- [ ] `TrickState`
- [ ] `TrickPlay`
- [ ] `getLegalCards`
- [ ] `isTrump`
- [ ] `compareForTrick`
- [ ] `resolveTrickWinner`
- [ ] `applyPlayCard`
- [ ] `startNextTrick`
- [ ] `validatePlayingState`

### Server

- [ ] authoritative turn
- [ ] timer
- [ ] state version
- [ ] action idempotency
- [ ] atomic persistence
- [ ] event publication

### Client

- [ ] legal-card hints
- [ ] card interaction
- [ ] turn indicator
- [ ] timer
- [ ] trick rendering
- [ ] reconnect reconciliation

### Tests

- [ ] legal cards
- [ ] follow suit
- [ ] Trump
- [ ] Sun
- [ ] winner
- [ ] eight tricks
- [ ] timeout
- [ ] reconnect
- [ ] replay
- [ ] property tests

---

# 75. Relationship to Other Documents

```text
01-game-rules.md
       ↓
02-card-system.md
       ↓
03-dealing.md
       ↓
04-bidding.md
       ↓
05-playing.md
       ↓
06-scoring.md
       ↓
07-game-state.md
       ↓
08-actions.md
       ↓
09-state-transitions.md
```

Playing consumes:

```text
Contract
Cards
Player Hands
Rule Profile
```

and produces:

```text
Trick Results
Updated Hands
Next Leader
Round Completion
```

Scoring consumes the trick results.

---

# 76. Final Engineering Rule

**The client chooses a card; the server decides whether that card can exist in the trick.**

There must be exactly one authoritative implementation for:

```text
legal cards
follow suit
Trump
Sun
winner comparison
trick resolution
turn progression
```

The same implementation must serve:

```text
Human players
Bots
Replays
Simulations
Tests
```

No duplicate gameplay rules should exist in the mobile UI or networking layer.

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

Final approval should occur only after the complete foundation specification has been reviewed together.
