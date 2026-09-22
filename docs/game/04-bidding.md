# صكّة بلوت — Bidding System Specification

**Document:** `docs/game/04-bidding.md`  
**Status:** Draft for Review — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`, `02-card-system.md`, `03-dealing.md`  
**Next dependent documents:** Playing, Scoring, Game State, Actions, State Transitions

---

# 1. Purpose

This document defines the authoritative bidding/شراء system for صكّة بلوت.

It covers:

- bidding phases
- turn order
- pass semantics
- first round
- second round
- Hokm
- Sun
- Ashkal
- purchaser identity
- exposed-card ownership
- contract selection
- completion-deal handoff
- invalid actions
- timeouts
- duplicate actions
- reconnect behavior
- deterministic state transitions
- testing

The Saudi Baloot conventions required by this project are frozen in Rule Freeze v1 and must be implemented exactly; no undocumented variant may be introduced.

Current public rule references describe a two-round purchase process beginning from the player to the dealer's right, with the exposed card determining the first-round Hokm option; sources also describe Ashkal as a special option available to an eligible seat in the first round. citeturn0search0turn0search22

---

# 2. Critical Rule Freeze Principle

The bidding engine MUST NOT contain undocumented house rules.

Before implementation is frozen, the project must select a single authoritative Rule Profile.

The Rule Profile must explicitly define:

```text
FIRST_DEALER
DEAL_DIRECTION
FIRST_ROUND_OPTIONS
SECOND_ROUND_OPTIONS
ASHKAL_ELIGIBILITY
ASHKAL_BEHAVIOR
SECOND_HOKM_SELECTION
SUN_PRIORITY
PASS_SEMANTICS
REDEAL_RULE
BUYER_DETERMINATION
DOUBLING_START_BOUNDARY
```

Public references are not perfectly consistent on some Baloot variants, so the engine must encode the selected profile rather than mix rules from multiple sources. citeturn0search0turn0search22

---

# 3. Domain Independence

Bidding belongs in the pure game engine.

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
        └── bidding/
            ├── bidding-types.ts
            ├── bidding-engine.ts
            ├── bidding-rules.ts
            ├── bidding-validation.ts
            └── bidding-transitions.ts
```

---

# 4. Conceptual Bidding Lifecycle

Baseline lifecycle:

```text
BIDDING_NOT_STARTED
        ↓
FIRST_ROUND
        ↓
FIRST_ROUND_DECISION
        ↓
SECOND_ROUND
        ↓
CONTRACT_SELECTED
        ↓
COMPLETION_DEAL
```

There may be an early transition:

```text
FIRST_ROUND
        ↓
CONTRACT_SELECTED
```

if a player purchases immediately.

There may also be:

```text
SECOND_ROUND
        ↓
REDEAL
```

if no valid contract is selected and the final Rule Profile requires a redeal.

---

# 5. Seating and Turn Order

Canonical seats:

```text
NORTH
EAST
SOUTH
WEST
```

The bidding starts from the seat immediately to the dealer according to the selected Rule Profile.

A public Saudi-rule reference describes the player to the dealer's right as the starting player. citeturn0search0

The engine must not infer turn order from:

- player join order
- socket connection order
- database row order
- device clock
- animation timing

---

# 6. Bidding Turn

Recommended:

```ts
interface BiddingTurn {
  readonly seat: Seat;
  readonly phase: BiddingPhase;
  readonly turnNumber: number;
}
```

The engine exposes exactly one actionable seat at a time.

Only that seat may submit a bidding action.

---

# 7. First Round

The first round begins after:

```text
initial cards dealt
+
exposed card revealed
```

The exposed card is relevant to the first-round contract.

A common Saudi Baloot description defines the first round as allowing the exposed suit as Hokm, Sun, or pass, with Ashkal as a special first-round option for the eligible seat. citeturn0search0turn0search22

The exact accepted option set is a Rule Profile decision.

---

# 8. First-Round Action Model

Recommended domain action:

```ts
type FirstRoundAction =
  | { type: "PASS" }
  | { type: "BUY_HOKM_EXPOSED_SUIT" }
  | { type: "BUY_SUN" }
  | { type: "BUY_ASHKAL" };
```

Important:

`BUY_ASHKAL` MUST NOT be universally available.

Eligibility is validated by the Rule Profile.

---

# 9. First-Round Hokm

If the player buys the exposed card's suit as Hokm:

```text
contract.type = TRUMP
contract.suit = exposedCard.suit
```

The player becomes the purchaser.

Example:

```text
Exposed card = HEARTS_9

Player chooses:
BUY_HOKM_EXPOSED_SUIT

Result:
contract = HEARTS TRUMP
purchaser = acting player
```

---

# 10. First-Round Sun

If Sun is selected:

```text
contract.type = SUN
```

There is no Trump suit.

The player who makes the accepted Sun purchase is the purchaser.

The exact priority interaction between Sun and a previous Hokm call MUST be defined by the Rule Profile.

---

# 11. Ashkal

Ashkal is a special first-round purchase option.

A commonly documented Saudi Baloot convention describes Ashkal as a way for the caller to initiate a Sun-style contract while the caller's partner takes the exposed card. citeturn0search0turn0search22

The project domain should represent the distinction explicitly:

```ts
interface AshkalContract {
  readonly type: "ASHKAL";
  readonly purchaserSeat: Seat;
  readonly exposedCardReceiverSeat: Seat;
}
```

However, the final contract representation may normalize Ashkal into a Sun contract plus metadata.

---

# 12. Ashkal Eligibility

The current project draft treats Ashkal as restricted.

Public references commonly describe the dealer and the player immediately to the dealer's left as the eligible seats. citeturn0search0turn0search22

The engine MUST NOT simply check:

```ts
seat === DEALER || seat === LEFT_OF_DEALER
```

unless that exact convention is frozen in the Rule Profile.

Preferred:

```ts
rules.canCallAshkal(seat, dealerSeat)
```

---

# 13. Ashkal Exposed Card Receiver

When Ashkal is accepted under the selected rule profile:

```text
caller ≠ exposed-card receiver
```

The caller remains the purchaser for game/scoring purposes.

The receiver is the caller's partner according to the selected seating model.

This distinction is critical.

Do not model the exposed card as automatically belonging to the player who announced the contract.

---

# 14. Second Round

If the first round does not select a contract, the game enters the second round.

The exact option set must be frozen.

A commonly documented convention is:

```text
Hokm of a different suit
Sun
Pass
```

and no Ashkal in the second round. citeturn0search22turn0search3

Some public descriptions phrase the second round differently, so the Rule Profile is authoritative.

---

# 15. Second-Round Action Model

Recommended baseline:

```ts
type SecondRoundAction =
  | { type: "PASS" }
  | { type: "BUY_SUN" }
  | { type: "BUY_HOKM"; suit: Suit };
```

Validation MUST reject a second-round Hokm equal to the exposed card's suit if the selected Rule Profile uses the standard second-round convention. citeturn0search22

---

# 16. Second-Round Hokm

If a player chooses Hokm in the second round:

```ts
{
  type: "TRUMP",
  suit: chosenSuit
}
```

The chosen suit must satisfy the Rule Profile.

A commonly documented rule requires it to differ from the exposed card's suit. citeturn0search22

---

# 17. Second-Round Sun

If a player chooses Sun in the second round:

```text
contract = SUN
purchaser = acting player
```

The selected Rule Profile must define whether later players can override this selection.

Do not infer override priority from the first-round rules.

---

# 18. Pass Semantics

The engine must distinguish:

```text
PASS
```

from:

```text
NO_CONTRACT
```

A pass means:

> This player declines to select a contract at this turn.

It does not necessarily mean:

> This player permanently declines all future bidding.

Therefore, first-round `PASS` can advance the turn while preserving eligibility for the second round.

---

# 19. Final Pass

If the Rule Profile defines a final second-round pass:

```ts
PASS (final-pass semantics are derived from authoritative bidding state; not a separate wire action)
```

it means:

> This player declines the available second-round contracts.

If all eligible players pass and no contract is selected:

```text
BIDDING_FAILED
```

The next action is determined by the redeal Rule Profile.

---

# 20. Redeal

The project MUST NOT automatically assume that a failed bidding sequence means:

```text
new random deck
```

The final Rule Profile must define:

- whether the hand is redealt
- whether the dealer rotates first
- whether the same dealer redeals
- whether the previous exposed card matters
- whether a no-point cancellation is possible
- whether special “kawesh/saneen” variants are supported

This historical note is superseded by Rule Freeze v1; the project-specific cancellation and redeal semantics are frozen in the canonical Rule Profile.

---

# 21. Contract Object

Recommended normalized representation:

```ts
type Contract =
  | {
      readonly type: "SUN";
      readonly purchaserSeat: Seat;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
    }
  | {
      readonly type: "TRUMP";
      readonly suit: Suit;
      readonly purchaserSeat: Seat;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
    }
  | {
      readonly type: "ASHKAL";
      readonly purchaserSeat: Seat;
      readonly exposedCardReceiverSeat: Seat;
      readonly source: "FIRST_ROUND";
    };
```

The final engine may normalize Ashkal to:

```ts
{
  type: "SUN",
  ...
  mode: "ASHKAL"
}
```

if this makes later scoring/play logic clearer.

The important requirement is preserving enough information to identify:

```text
who purchased
how the contract was selected
who received the exposed card
```

---

# 22. Purchaser Identity

The purchaser is the player whose valid action caused the contract to be selected.

For normal Sun/Hokm:

```text
purchaser = caller
```

For Ashkal:

```text
purchaser = caller
exposedCardReceiver = caller's partner
```

Do not confuse:

```text
purchaser
```

with:

```text
player who physically receives exposed card
```

---

# 23. Contract Source

Every selected contract should retain:

```text
FIRST_ROUND
SECOND_ROUND
```

This is useful for:

- replay
- scoring edge cases
- debugging
- analytics
- rule validation

Example:

```json
{
  "type": "TRUMP",
  "suit": "HEARTS",
  "source": "FIRST_ROUND",
  "purchaserSeat": "EAST"
}
```

---

# 24. Bidding History

The authoritative state should retain bidding actions.

Recommended:

```ts
interface BiddingActionRecord {
  readonly actionId: string;
  readonly turnNumber: number;
  readonly seat: Seat;
  readonly phase: BiddingPhase;
  readonly action: BiddingAction;
  readonly stateVersion: number;
}
```

Do not store only the final contract.

The complete history is valuable for:

- replay
- disputes
- debugging
- anti-cheat
- analytics
- deterministic reconstruction

---

# 25. Action Validation

Every bidding action must validate:

1. game exists
2. round exists
3. game is in bidding
4. acting player belongs to the game
5. acting player occupies the expected seat
6. it is that seat's turn
7. action is legal in current phase
8. action is legal under Rule Profile
9. exposed card exists where required
10. contract has not already been selected
11. action ID is not duplicated
12. expected state version matches

---

# 26. Invalid Turn

If the wrong player submits:

```json
{
  "type": "BUY_SUN"
}
```

the server must reject it.

It must not:

- queue it for later
- silently execute it
- advance the turn
- alter the contract

Recommended error:

```text
INVALID_TURN
```

---

# 27. Invalid Contract

Examples:

```text
BUY_HOKM with no exposed card
BUY_HOKM using an illegal second-round suit
BUY_ASHKAL from an ineligible seat
BUY_ASHKAL in second round
BUY_SUN after bidding has already ended
```

All must be rejected by the authoritative engine.

---

# 28. Duplicate Action

If the same action arrives twice:

```text
actionId = abc123
```

the second request must not create a second transition.

Possible behavior:

```text
return previously committed result
```

or:

```text
DUPLICATE_ACTION
```

depending on protocol design.

The important invariant:

> One accepted bidding action produces at most one authoritative state transition.

---

# 29. State Version

Each bidding transition should use optimistic versioning:

```text
expectedStateVersion
```

Example:

```text
Current = 42
Client submits = 42
→ accepted
→ new state = 43
```

If another transition has already produced:

```text
Current = 43
```

then a stale action using `42` is rejected.

---

# 30. Timeout

Bidding requires a server-authoritative timer.

The client displays the countdown but does not own the timer.

Conceptually:

```ts
interface BiddingTimer {
  readonly turnStartedAt: number;
  readonly expiresAt: number;
}
```

The server determines expiration.

---

# 31. Timeout Action

When the timer expires, the engine should apply the Rule Profile's defined automatic action.

Possible policy:

```text
timeout → PASS
```

or another explicitly defined behavior.

The project MUST NOT invent a timeout action in UI code.

---

# 32. Reconnect During Bidding

On reconnect:

1. authenticate
2. restore game membership
3. load authoritative state
4. send current bidding phase
5. send current turn
6. send remaining time
7. send legal actions
8. resume

The client should not restart the timer locally.

---

# 33. Legal Actions API

The server can provide:

```ts
getLegalBiddingActions(state, seat)
```

Example:

```json
{
  "phase": "FIRST_ROUND",
  "turn": "EAST",
  "legalActions": [
    "PASS",
    "BUY_HOKM_EXPOSED_SUIT",
    "BUY_SUN"
  ]
}
```

If Ashkal is legal:

```text
BUY_ASHKAL
```

is added.

The client may use this to render the UI.

But the server still validates the action when submitted.

---

# 34. Do Not Trust Legal-Actions UI

A malicious client can submit:

```text
BUY_ASHKAL
```

even if the UI did not show the button.

Therefore:

```text
legalActions API = UX assistance
```

not:

```text
security boundary
```

The engine performs the final validation.

---

# 35. Bidding UI State

The client may display:

```text
PASS
حكم
صن
أشكل
```

The UI labels are localization concerns.

The network protocol should use stable identifiers:

```text
PASS
BUY_HOKM_EXPOSED_SUIT
BUY_SUN
BUY_ASHKAL
```

Never send Arabic labels as authoritative action types.

---

# 36. Bidding State Machine

Recommended:

```text
                    ┌───────────────┐
                    │ FIRST_ROUND   │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
           PASS           SUN/HOKM       ASHKAL
             │              │              │
             ↓              ↓              ↓
        NEXT_PLAYER   CONTRACT_SELECTED  CONTRACT_SELECTED
             │
       all passed?
             │
            YES
             ↓
     ┌───────────────┐
     │ SECOND_ROUND   │
     └───────┬───────┘
             │
        PASS/SUN/HOKM
             │
             ├──────────────→ CONTRACT_SELECTED
             │
        all final pass
             │
             ↓
       BIDDING_FAILED
```

The exact transitions must be generated from the Rule Profile.

---

# 37. No Implicit Transitions

Do not write code such as:

```ts
if (allPassed) startSecondRound();
```

without checking the rule profile.

Prefer:

```ts
const transition = rules.resolveBiddingTransition(state, action);
```

This makes variants explicit and testable.

---

# 38. First-Round Priority

A first-round purchase can have priority implications when multiple players could later select or override a contract.

The project must define the exact priority semantics.

Do not import priority rules from an unrelated Baloot implementation.

Public sources describe different nuances around first-round Sun/Hokm interactions, which reinforces the need for an explicit Rule Profile. citeturn0search0turn0search22

---

# 39. Second-Round Priority

Second-round priority must be independently specified.

In particular, freeze:

- whether Sun can be overridden
- whether a later Hokm can override Sun
- whether a second-round Hokm can be changed
- whether a previous pass can be reversed
- whether the first eligible purchaser immediately owns the contract

These are not safe assumptions.

---

# 40. Ashkal Priority

Ashkal is not simply another localized name for Sun.

It carries an additional ownership/dealing consequence.

Therefore, the engine must preserve:

```text
caller
receiver
contract mode
```

until the round is complete.

---

# 41. Completion-Deal Handoff

After contract selection:

```text
BIDDING_COMPLETE
```

the dealing system receives:

```ts
contractDecision
```

and performs the remaining distribution according to the selected Rule Profile.

Bidding must not directly mutate deck arrays.

Preferred boundary:

```text
Bidding Engine
       ↓
Contract Decision
       ↓
Dealing Engine
       ↓
Completed Hands
```

---

# 42. Contract Selection Event

Possible event:

```text
CONTRACT_SELECTED
```

Payload conceptually:

```ts
interface ContractSelectedEvent {
  readonly contract: Contract;
  readonly purchaserSeat: Seat;
  readonly source: "FIRST_ROUND" | "SECOND_ROUND";
}
```

For Ashkal, include the exposed-card receiver.

---

# 43. Analytics

Bidding analytics should record facts, not strategic judgments.

Examples:

```text
bidding_round
action
seat
contract_type
contract_suit
time_to_action
timed_out
```

Do not send hidden hand information to analytics by default.

---

# 44. Bot Compatibility

Bots must use the same bidding API as human clients.

Recommended:

```ts
chooseBiddingAction(
  visibleState,
  legalActions
): BiddingAction
```

The bot must not bypass validation.

This ensures:

```text
Human
Bot
Replay
Simulation
```

all exercise the same authoritative rules.

---

# 45. Simulation Compatibility

A simulation should be able to run:

```text
shuffle
→ deal
→ bidding
→ contract
→ completion deal
```

without:

- network
- UI
- database
- real-time timers

Time should be injectable or simulated.

---

# 46. Testing Matrix

Minimum unit tests:

### First round

- [ ] PASS advances correctly
- [ ] valid exposed-suit Hokm succeeds
- [ ] valid Sun succeeds
- [ ] valid Ashkal succeeds
- [ ] invalid Ashkal rejected
- [ ] wrong-turn action rejected
- [ ] duplicate action protected

### Second round

- [ ] enters only when required
- [ ] valid Sun succeeds
- [ ] valid alternate Hokm succeeds
- [ ] invalid same-suit Hokm rejected where required
- [ ] Ashkal rejected where required
- [ ] all-final-pass path handled

### Contract

- [ ] purchaser recorded
- [ ] source recorded
- [ ] exposed receiver recorded for Ashkal
- [ ] completion handoff generated

### Recovery

- [ ] reconnect snapshot
- [ ] stale state version
- [ ] duplicate action
- [ ] timeout
- [ ] server restart

---

# 47. Property-Based Tests

Useful properties:

### Turn progression

For any legal bidding sequence:

```text
only the expected seat can act
```

### No duplicate contract

Once:

```text
CONTRACT_SELECTED
```

occurs:

```text
no further bidding action changes the contract
```

### Action determinism

Same:

```text
state + action + ruleProfile
```

produces the same result.

### Replay determinism

Replaying the same bidding actions from the same initial state produces the same final contract.

---

# 48. Golden Bidding Fixtures

Create fixtures such as:

### Fixture A — First-round Hokm

```text
dealer = NORTH
exposed = HEARTS_9
first actor = EAST
EAST → BUY_HOKM_EXPOSED_SUIT
expected contract = HEARTS TRUMP
purchaser = EAST
```

### Fixture B — First-round Sun

```text
dealer = NORTH
EAST → PASS
SOUTH → BUY_SUN
expected contract = SUN
purchaser = SOUTH
```

### Fixture C — Ashkal

```text
eligible caller → BUY_ASHKAL
expected:
contract mode = ASHKAL
purchaser = caller
exposed receiver = caller's partner
```

These fixtures are examples only until the final Rule Profile is frozen.

---

# 49. Error Codes

Recommended stable errors:

```text
BIDDING_NOT_ACTIVE
INVALID_TURN
INVALID_PHASE
INVALID_ACTION
ACTION_ALREADY_PROCESSED
STALE_STATE_VERSION
CONTRACT_ALREADY_SELECTED
ASHKAL_NOT_ALLOWED
INVALID_HOKM_SUIT
EXPOSED_CARD_UNAVAILABLE
BIDDING_TIMEOUT
BIDDING_FAILED
```

The client can map these to localized messages.

---

# 50. Security

The server must never accept client claims such as:

```json
{
  "contract": "SUN",
  "purchaser": "EAST"
}
```

as authoritative.

The client submits:

```json
{
  "type": "BUY_SUN"
}
```

The server determines:

```text
purchaser
contract
source
next state
```

from authoritative state.

---

# 51. Persistence

Persist at least:

```text
gameId
roundId
biddingPhase
currentTurn
dealerSeat
exposedCardId
biddingActionHistory
contract
stateVersion
turnStartedAt
turnExpiresAt
ruleProfileId
```

The exact storage schema belongs to the backend architecture specification.

---

# 52. State Transition Transaction

For every accepted bidding action:

```text
load authoritative state
        ↓
validate state version
        ↓
validate player/seat
        ↓
validate action
        ↓
calculate next state
        ↓
validate invariants
        ↓
persist atomically
        ↓
emit event
```

No external event should claim an action succeeded before the authoritative transition is committed.

---

# 53. Bidding Invariants

At all times:

1. exactly one current bidding seat
2. current seat must be one of four seats
3. phase must be valid
4. contract is null until selected
5. contract never changes after selection
6. exposed card remains identifiable
7. purchaser is valid
8. Ashkal receiver is valid when applicable
9. action history is ordered
10. action IDs are unique
11. state version increases monotonically
12. no player can act out of turn

---

# 54. Frozen Bidding Decisions

The bidding decisions previously listed here as open are closed by Rule Freeze v1, including first/second-round priority, Ace→Sun dealer-right priority, Kasho closure on purchase, PASS semantics, Ashkal handling, and deterministic first dealer.

The Domain Engine must implement the frozen Rule Profile rather than infer alternative house rules.

Any future bidding-rule change requires a new Rule Freeze revision.