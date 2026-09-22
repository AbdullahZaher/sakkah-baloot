# صكّة بلوت — State Transitions Specification

**Document:** `docs/game/09-state-transitions.md`  
**Status:** Draft for Review — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** Game Rules, Card System, Dealing, Bidding, Playing, Scoring, Game State, Actions  
**Purpose:** Define exactly how accepted actions transform authoritative Game State.

---

# 1. Purpose

This document defines the deterministic transition layer of صكّة بلوت.

The core contract is:

```text
(previousState, validatedAction)
        ↓
deterministic transition
        ↓
(nextState, events)
```

The transition system must:

- be deterministic
- be side-effect controlled
- preserve invariants
- reject illegal actions
- produce replayable results
- be independent from React Native
- be independent from transport
- be independent from persistence
- be independent from Supabase/Postgres/Redis

---

# 2. Core Principle

The Game Engine owns the truth.

```text
Client
  ↓
Action
  ↓
Server
  ↓
Validation
  ↓
Transition
  ↓
GameState
```

No client, UI component, database trigger, Redis worker, or WebSocket handler may directly mutate gameplay state.

---

# 3. Transition Function

Conceptual API:

```ts
transition(
  state: GameState,
  action: GameAction
): TransitionResult
```

Recommended:

```ts
interface TransitionResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}
```

For invalid actions:

```ts
type TransitionResult =
  | {
      readonly accepted: true;
      readonly state: GameState;
      readonly events: readonly GameEvent[];
    }
  | {
      readonly accepted: false;
      readonly error: ActionError;
      readonly state: GameState;
    };
```

---

# 4. Purity

The core transition function should behave as a pure function.

It must not directly perform:

```text
database writes
network requests
Redis commands
WebSocket sends
logging I/O
analytics calls
filesystem access
```

Instead:

```text
Engine → returns state + events
```

Infrastructure handles side effects after commit.

---

# 5. Determinism

For the same:

```text
state
+
action
+
rule profile
+
required deterministic inputs
```

the engine must produce the same:

```text
next state
+
event sequence
```

This is required for:

- replay
- debugging
- bot simulation
- QA
- dispute investigation
- deterministic tests

---

# 6. State Version

Every accepted transition increments:

```text
stateVersion
```

Example:

```text
105 → action accepted → 106
```

Rejected actions do not increment the gameplay state version.

Recommended invariant:

```text
next.stateVersion === previous.stateVersion + 1
```

for every committed state mutation.

System transitions follow the same rule.

---

# 7. Schema Version vs State Version

Do not confuse:

```text
schemaVersion
```

with:

```text
stateVersion
```

### schemaVersion

Defines the shape/format of stored state.

### stateVersion

Defines the chronological version of the current match state.

Example:

```text
schemaVersion = 3
stateVersion  = 187
```

---

# 8. Transition Pipeline

Every accepted action follows:

```text
Receive Action
      ↓
Authenticate
      ↓
Authorize
      ↓
Check Idempotency
      ↓
Check State Version
      ↓
Validate Action
      ↓
Resolve Transition
      ↓
Generate Candidate State
      ↓
Validate Invariants
      ↓
Increment State Version
      ↓
Commit Atomically
      ↓
Publish Events
```

The engine itself should receive already-authenticated domain actions.

---

# 9. State Machine

Baseline lifecycle:

```text
GAME_CREATED
      ↓
SEATING
      ↓
DEALING
      ↓
BIDDING
      ↓
CONTRACT_SELECTED
      ↓
COMPLETE_DEAL
      ↓
PROJECT_DECLARATION
      ↓
TRICK_PLAY
      ↓
ROUND_SCORING
      ↓
MATCH_END_CHECK
      ├── match continues → DEALING
      └── match complete  → GAME_RESULT
```

The final Rule Profile controls unresolved variant-specific transitions.

---

# 10. Transition Categories

Transitions are grouped into:

```text
Lifecycle
Seating
Dealing
Bidding
Contract
Projects
Doubling
Playing
Scoring
Match End
Recovery
System
```

---

# 11. Lifecycle Transition

## GAME_CREATED → SEATING

Triggered by:

```text
CREATE_GAME
```

Effects:

- create Game State
- assign game ID
- assign Rule Profile
- initialize players
- initialize teams
- initialize score
- initialize round metadata
- set `stateVersion = 1`

---

# 12. SEATING → SEATING

Triggered by:

```text
JOIN_GAME
LEAVE_GAME
READY
UNREADY
```

Only lobby state changes.

No card state may exist yet.

---

# 13. SEATING → DEALING

Triggered by:

```text
START_GAME
```

when all required preconditions are satisfied.

Server/system effects:

```text
select dealer
initialize round
initialize deck
shuffle using authoritative RNG
deal according to Rule Profile
```

The exact deal phases remain controlled by the Dealing specification.

---

# 14. DEALING → BIDDING

Transition occurs after the initial deal and exposed-card setup required by the selected Rule Profile.

Preconditions:

```text
all required cards dealt
exposed card valid
card conservation valid
dealer valid
bidding order established
```

Effects:

```text
phase = BIDDING
current bidder = derived seat
bidding state initialized
timer initialized
```

---

# 15. BIDDING → BIDDING

Triggered by:

```text
PASS
CALL_SUN
CALL_TRUMP
CALL_ASHKAL
```

For each accepted action:

1. validate active bidder
2. validate bidding round
3. validate legal action
4. append bidding history
5. update bidding state
6. determine next bidder or contract outcome
7. update timer

---

# 16. BIDDING → CONTRACT_SELECTED

When a legal bid creates a final contract:

```text
contract = selected
purchaser = identified player
```

Effects:

```text
contract state finalized
purchaser finalized
trump/sun context finalized
bidding timer stopped
```

No client-provided contract result is trusted.

---

# 17. CONTRACT_SELECTED → COMPLETE_DEAL

The engine begins the remainder of the deal.

Preconditions:

```text
contract exists
purchaser exists
initial deal complete
remaining deck known
```

Effects:

```text
deal remaining cards
complete each player's hand
validate 8-card hands
```

---

# 18. COMPLETE_DEAL → PROJECT_DECLARATION

After every player has the required final hand.

Preconditions:

```text
all four players have required cards
32-card conservation valid
no duplicate card
no missing card
```

Effects:

```text
initialize project candidates
initialize declaration window
initialize doubling state if applicable
```

---

# 19. PROJECT_DECLARATION → TRICK_PLAY

When the project/declaration window closes according to the Rule Profile.

Effects:

```text
projects finalized
declared projects validated
playing state initialized
first trick leader derived
turn timer started
```

The engine must not start trick play before all required declaration rules are satisfied.

---

# 20. TRICK_PLAY → TRICK_PLAY

Triggered by:

```text
PLAY_CARD
```

For each legal card:

```text
validate turn
validate ownership
validate follow-suit requirement
remove card from hand
add card to current trick
record play
```

Then:

```text
if trick incomplete:
    advance turn
else:
    resolve trick
```

---

# 21. Trick Resolution

When four legal cards exist:

```text
resolve winner
assign trick to winning team
add trick card points
apply relevant project/doubling logic where configured
clear current trick
```

Then:

```text
if tricks remain:
    winner leads next trick
else:
    → ROUND_SCORING
```

---

# 22. Trick Winner

Winner calculation must use the finalized contract.

Conceptually:

```text
if any trump card was played:
    highest trump wins
else:
    highest card of led suit wins
```

Exact ranking comes from the Card System + Rule Profile.

The engine must never infer ranking from UI/card asset order.

---

# 23. TRICK_PLAY → TRICK_PLAY

If the trick is incomplete:

```text
current trick = updated
current turn = next seat
turn timer = restarted
stateVersion++
```

If the trick is complete:

```text
resolve trick
then either continue or score round
```

The transition must be atomic.

---

# 24. Final Trick

After the eighth trick:

```text
TRICK_PLAY
    ↓
ROUND_SCORING
```

The final trick bonus is applied by the Scoring subsystem.

The Playing subsystem must not independently calculate final score.

---

# 25. ROUND_SCORING

Inputs:

```text
contract
tricks
card points
last trick
projects
doubling state
Rule Profile
```

The scoring subsystem calculates:

```text
round score
```

and returns a structured scoring result.

The transition layer applies that result to:

```text
team scores
round history
match state
```

---

# 26. ROUND_SCORING → MATCH_END_CHECK

After score application:

```text
round score committed
match score updated
round history appended
```

Then determine whether the match has ended.

The transition layer must not contain duplicate scoring formulas.

---

# 27. MATCH_END_CHECK → GAME_RESULT

If the Rule Profile says the match is complete:

```text
GAME_RESULT
```

Effects:

```text
final score frozen
winner/ending condition finalized
final result recorded
timers stopped
game marked complete
```

No further gameplay action is legal.

---

# 28. MATCH_END_CHECK → DEALING

If the match continues:

```text
advance round
rotate dealer according to Rule Profile
initialize new round
begin dealing
```

The previous round remains immutable in history.

---

# 29. Round Boundary

A new round must not reuse mutable references from the previous round.

Conceptually:

```ts
previousRound → immutable history
newRound      → fresh state
```

This protects:

- replay
- statistics
- debugging
- score history

---

# 30. Dealer Transition

Dealer rotation must be derived from:

```text
RuleProfile
current dealer
round result
```

Never hardcode rotation in UI or server transport.

---

# 31. Turn Transition

The engine derives:

```text
nextSeat
```

from the Rule Profile.

Typical baseline:

```text
clockwise
```

but the transition layer must consume configured direction rather than embedding assumptions.

---

# 32. Timer Transition

Timers are state data:

```ts
interface TimerState {
  readonly startedAt: number;
  readonly expiresAt: number;
  readonly purpose: TimerPurpose;
}
```

The server clock is authoritative.

The engine should evaluate:

```text
isExpired(now)
```

using an injected time value rather than reading system time directly.

This keeps simulation deterministic.

---

# 33. Timeout Transition

When a timer expires:

```text
SYSTEM_TIMEOUT
```

is generated by the authoritative server.

The transition then applies the Rule Profile's timeout policy.

Possible policies:

```text
auto-pass
auto-play legal card
forfeit
disconnect handling
```

The final behavior remains an open decision until the Rule Profile is frozen.

---

# 34. Disconnect

A disconnect should not automatically mutate gameplay state unless the product rules explicitly require it.

Recommended:

```text
connection status
```

is separated from:

```text
Game State
```

A disconnected player may remain seated while reconnecting.

---

# 35. Reconnect

Reconnect flow:

```text
client reconnects
     ↓
authenticate
     ↓
identify game
     ↓
request resync
     ↓
server generates player projection
     ↓
client replaces local state
```

The client does not submit a reconstructed Game State.

---

# 36. Resync Transition

`RESYNC_GAME` should normally not increment gameplay `stateVersion`.

It is a read/synchronization operation.

This distinction is important:

```text
state mutation ≠ state delivery
```

---

# 37. Duplicate Action

If:

```text
actionId
```

was already committed:

```text
do not execute transition again
```

Return the previously committed result.

This prevents:

```text
double card play
double bid
double project
double scoring
```

---

# 38. Stale State

If:

```text
expectedStateVersion !== currentStateVersion
```

the server applies the defined stale-state policy.

Default:

```text
reject
→ return current version
→ client resyncs
```

A future optimization may permit specific commutative actions, but gameplay commands should remain strict by default.

---

# 39. Invalid Transition

Examples:

```text
PLAY_CARD during BIDDING
CALL_TRUMP during TRICK_PLAY
READY after match started
DOUBLE before doubling window
PLAY_CARD when not active player
```

Result:

```text
rejected
state unchanged
stateVersion unchanged
```

---

# 40. Atomicity

A transition is all-or-nothing.

Bad:

```text
remove card
→ error resolving trick
→ half-mutated state
```

Correct:

```text
validate
→ construct candidate state
→ resolve all required effects
→ validate invariants
→ commit complete state
```

---

# 41. Invariant Validation

After every accepted transition, validate critical invariants.

Examples:

```text
32 unique cards conserved
each card has exactly one owner/zone
hand sizes valid
current turn valid
phase compatible with state
contract valid
score non-negative where required
stateVersion monotonic
team membership valid
```

---

# 42. Card Conservation

At every state where the complete deck exists:

```text
all cards across
hands
+
deck
+
exposed card
+
current trick
+
completed tricks
+
other defined zones
=
32 unique cards
```

The exact zones depend on the current phase.

---

# 43. Hidden Information

Transition logic operates on authoritative full state.

Player projections are generated after transition.

Never mutate state based on:

```text
client-hidden-card assumptions
```

The server knows the full deck.

The client receives only authorized information.

---

# 44. Event Generation

Transitions generate facts.

Examples:

```text
GAME_CREATED
PLAYER_JOINED
GAME_STARTED
CARDS_DEALT
BID_PLACED
CONTRACT_SELECTED
PROJECT_DECLARED
CARD_PLAYED
TRICK_COMPLETED
ROUND_SCORED
MATCH_COMPLETED
```

Events should describe what happened, not what the client should do.

---

# 45. Event Ordering

Events generated by one transition must have deterministic ordering.

Example:

```text
CARD_PLAYED
TRICK_COMPLETED
TURN_CHANGED
```

or another explicitly frozen ordering.

The State Transition specification must own this decision.

---

# 46. State + Event Atomicity

A committed transition must commit:

```text
new state
+
event record
+
processed action record
```

as one logical transaction.

If persistence architecture cannot provide a single database transaction for all records, an outbox pattern must guarantee eventual publication without losing committed events.

---

# 47. Outbox Boundary

Recommended:

```text
Game Engine
    ↓
Transition Result
    ↓
Persistence Transaction
    ├── new state
    ├── event records
    └── processed action
             ↓
          Outbox
             ↓
       WebSocket / analytics
```

The engine itself does not publish to WebSocket.

---

# 48. Redis Boundary

Redis may coordinate:

```text
room ownership
locks
presence
ephemeral timers
fan-out
```

but Redis must not become a second authoritative Game State.

The authoritative committed state remains under the game server persistence model.

---

# 49. Single Writer

A game room should have one logical serialized transition stream.

Conceptually:

```text
Game #123
   ↓
single ordered command processor
```

This prevents:

```text
double turn
duplicate trick resolution
simultaneous score commits
```

---

# 50. Crash During Transition

If the process crashes before commit:

```text
transition not committed
```

If after commit:

```text
state + action/event record recoverable
```

On restart:

```text
load snapshot/state
load pending events/outbox
resume processing
```

No transition should depend on volatile in-memory state alone.

---

# 51. Recovery

Recovery must preserve:

```text
stateVersion
actionId idempotency
round history
event ordering
timers
```

A recovered game must produce the same legal outcomes as a continuously running game.

---

# 52. Replay

Replay should reconstruct:

```text
initial state
+
accepted actions/system actions
=
final state
```

The replay engine should use the same transition function.

Do not create a separate "replay rules engine."

---

# 53. Deterministic RNG

Random operations such as shuffle require an explicit deterministic RNG input.

Example:

```ts
deal(state, rng)
```

Replay can reproduce the same deck order using recorded RNG seed/material.

Never use uncontrolled:

```text
Math.random()
```

inside authoritative game logic.

---

# 54. Deterministic Time

Timers should use injected time:

```ts
transition(state, action, {
  now
})
```

rather than:

```ts
Date.now()
```

inside domain logic.

This enables exact timeout tests.

---

# 55. Property Testing

Important properties:

```text
transition never creates duplicate cards
transition never loses cards
accepted PLAY_CARD always removes exactly one card
rejected action leaves state unchanged
stateVersion increments exactly once per mutation
replay reaches identical final state
duplicate action does not mutate state twice
```

---

# 56. Golden Fixtures

Maintain deterministic fixtures for:

```text
new game
initial deal
bidding
Sun contract
Trump contract
Ashkal
project declaration
first trick
mid-round
last trick
round scoring
match end
```

Each fixture should include:

```text
input state
action
expected state
expected events
```

---

# 57. State Hash

For debugging/replay:

```ts
stateHash(state)
```

should be deterministic.

Useful metadata:

```text
gameId
stateVersion
stateHash
previousStateHash
```

This can detect divergence between:

```text
live server
replay
simulation
```

---

# 58. Canonical Serialization

State hashing and replay require stable serialization.

Rules:

- stable object keys
- stable array ordering
- no transient fields
- no UI-only values
- no timestamps unless intentionally part of state
- no nondeterministic map iteration

---

# 59. Transition Tracing

Each committed transition should be traceable:

```text
gameId
actionId
actionType
stateVersionBefore
stateVersionAfter
transition duration
result
event count
```

This enables production debugging without exposing hidden card information to ordinary clients.

---

# 60. Performance

The transition function should be cheap enough for high-frequency card play.

Avoid:

```text
network I/O
database queries
large serialization
unnecessary cloning
```

inside the hot path.

However, correctness is more important than premature optimization.

---

# 61. Structural Immutability

Prefer immutable transition semantics:

```ts
nextState = transition(previousState, action)
```

rather than arbitrary mutation across services.

Implementation may use optimized structural sharing internally, provided externally visible semantics remain immutable and deterministic.

---

# 62. Illegal State Detection

The engine should detect impossible states such as:

```text
same card in two hands
five-card trick
player with 9 cards after complete deal
turn belongs to spectator
contract missing during trick play
score changed without scoring transition
completed match accepting PLAY_CARD
```

Fail closed.

Do not silently repair corrupted authoritative state during normal gameplay.

---

# 63. Corruption Handling

If an invariant fails:

```text
stop transition
do not commit candidate state
raise critical game-engine error
preserve diagnostic context
```

Recovery should be explicit and audited.

Never invent a new card, score, or winner to "fix" corruption.

---

# 64. Transition Matrix

| Current Phase | Action | Result |
|---|---|---|
| SEATING | JOIN_GAME | SEATING |
| SEATING | READY | SEATING |
| SEATING | START_GAME | DEALING |
| DEALING | player gameplay action | REJECT |
| BIDDING | PASS | BIDDING / CONTRACT_SELECTED |
| BIDDING | CALL_SUN | BIDDING / CONTRACT_SELECTED |
| BIDDING | CALL_TRUMP | BIDDING / CONTRACT_SELECTED |
| BIDDING | CALL_ASHKAL | BIDDING / CONTRACT_SELECTED |
| COMPLETE_DEAL | DECLARE_PROJECT | PROJECT_DECLARATION |
| TRICK_PLAY | PLAY_CARD | TRICK_PLAY / ROUND_SCORING |
| ROUND_SCORING | system score | MATCH_END_CHECK |
| MATCH_END_CHECK | continue | DEALING |
| MATCH_END_CHECK | finish | GAME_RESULT |
| GAME_RESULT | PLAY_CARD | REJECT |

Exact transitions remain Rule Profile dependent where noted.

---

# 65. State Transition Rules

The engine should enforce:

```text
Only legal phase transitions.
Only legal actor transitions.
Only legal payload transitions.
Only legal rule transitions.
Only legal state transitions.
```

A valid payload alone is never sufficient.

---

# 66. Separation of Concerns

### Game Engine

Owns:

```text
rules
validation
transitions
invariants
events
```

### Game Server

Owns:

```text
connections
authentication context
room routing
serialization
persistence orchestration
timeouts
outbox
```

### Mobile Client

Owns:

```text
rendering
input
animation
local interaction state
prediction/rollback
```

---

# 67. Example — PLAY_CARD

Input:

```ts
{
  type: "PLAY_CARD",
  cardId: "HEARTS_A"
}
```

Engine:

```text
1. phase = TRICK_PLAY
2. actor = active player
3. card exists in hand
4. card satisfies follow-suit rules
5. remove card
6. append to trick
7. if trick incomplete → next turn
8. if trick complete → resolve winner
9. validate invariants
10. increment stateVersion
11. emit events
```

---

# 68. Example — Invalid PLAY_CARD

Input:

```text
PLAY_CARD(SPADES_7)
```

when the player must follow Hearts and has a Heart.

Result:

```text
accepted = false
error = MUST_FOLLOW_LED_SUIT
state = unchanged
stateVersion = unchanged
```

No card is removed.

---

# 69. Example — Fourth Card

Input:

```text
PLAY_CARD(...)
```

completes the trick.

Transition may produce:

```text
CARD_PLAYED
TRICK_COMPLETED
TURN_CHANGED
```

or:

```text
CARD_PLAYED
TRICK_COMPLETED
ROUND_COMPLETED
```

depending on whether it was the final trick.

The exact event sequence must be frozen before protocol implementation.

---

# 70. Example — Round End

After final trick:

```text
TRICK_PLAY
    ↓
ROUND_SCORING
```

Scoring calculates the round result.

Then:

```text
ROUND_SCORED
MATCH_END_CHECK
```

If match continues:

```text
ROUND_ADVANCED
DEALING
```

If match ends:

```text
MATCH_COMPLETED
GAME_RESULT
```

---

# 71. Transition Contract

Every transition must satisfy:

```text
Given S and A:

if A is illegal:
    result.state === S
    result.accepted === false

if A is legal:
    result.state is valid
    result.stateVersion = S.stateVersion + 1
    result.events are deterministic
    all invariants pass
```

This is the core engine contract.

---

# 72. Open Decisions

Before freezing:

1. Exact event names.
2. Exact event ordering.
3. Whether system transitions are represented as actions or internal transitions.
4. Exact timeout semantics.
5. Exact lobby-to-game transition.
6. Exact project declaration timing.
7. Doubling transition timing.
8. Round-end score transition structure.
9. Dealer rotation.
10. Match tie/end semantics.
11. Persistence transaction strategy.
12. Outbox implementation.
13. Snapshot frequency.
14. Replay storage format.
15. State hash algorithm.
16. Corruption recovery procedure.

---

# 73. Foundation Freeze Gate

Before production implementation:

- [ ] State machine frozen.
- [ ] All legal phase transitions documented.
- [ ] All illegal transitions documented.
- [ ] Action → transition mapping complete.
- [ ] System transitions defined.
- [ ] Timer transitions defined.
- [ ] Reconnect behavior defined.
- [ ] Idempotency behavior defined.
- [ ] Event ordering frozen.
- [ ] State invariants frozen.
- [ ] Replay contract frozen.
- [ ] Deterministic RNG defined.
- [ ] Deterministic time defined.
- [ ] Persistence boundary defined.
- [ ] Outbox behavior defined.
- [ ] Recovery behavior tested.
- [ ] Rule Profile unresolved items resolved.

---

# 74. Final Architecture Rule

The complete gameplay loop is:

```text
                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        │
                     Action
                        │
                        ▼
                 ┌──────────────┐
                 │ Game Server  │
                 └──────┬───────┘
                        │
                  Validate
                        │
                        ▼
              ┌───────────────────┐
              │   Game Engine     │
              │                   │
              │ State + Action    │
              │       ↓           │
              │   Transition      │
              └────────┬──────────┘
                       │
                New State + Events
                       │
                       ▼
              ┌───────────────────┐
              │ Atomic Persistence│
              └────────┬──────────┘
                       │
                    Outbox
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        WebSocket             Replay
             │
             ▼
           Client
```

There must be one authoritative transition path.

No parallel rule implementation is allowed.

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

This completes the current **11-document Foundation sequence**:

1. Product Vision  
2. Product Scope  
3. Game Rules  
4. Card System  
5. Dealing  
6. Bidding  
7. Playing  
8. Scoring  
9. Game State  
10. Actions  
11. State Transitions  

The foundation should now be reviewed as one system before implementation-specific specifications are created.
