# صكّة بلوت — Game State Specification

**Document:** `docs/game/07-game-state.md`  
**Status:** Draft for Review — PROPOSED RECONCILIATION (14.Z.10-R) — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`, `02-card-system.md`, `03-dealing.md`, `04-bidding.md`, `05-playing.md`, `06-scoring.md`  
**Next dependent documents:** Actions, State Transitions

---

# 1. Purpose

This document defines the canonical authoritative Game State for صكّة بلوت.

The Game State is the single source of truth for:

- match identity
- round identity
- players
- seats
- teams
- dealer
- rule profile
- card ownership
- deck state
- exposed card
- bidding
- contract
- projects
- doubling
- tricks
- current turn
- timers
- round score
- match score
- state version
- replay metadata
- recovery metadata

The purpose is to prevent different subsystems from maintaining incompatible versions of the game.

---

# 2. Core Principle

There must be exactly one authoritative logical Game State.

The mobile client has:

```text
Player View State
```

The server has:

```text
Authoritative Game State
```

The client view is derived from the authoritative state.

It must never become the source of truth.

---

# 3. State Ownership

The authoritative state belongs to the Game Server.

The Game Server is responsible for:

```text
validation
state transitions
card ownership
turns
timers
contracts
tricks
scoring
reconnect
replay
```

Supabase/PostgreSQL may persist the state, but the database is not itself the gameplay rule engine.

Redis may support:

```text
presence
ephemeral coordination
pub/sub
locks
```

but must not become a second source of gameplay truth.

---

# 4. Pure Domain Model

The Game State model must be usable without:

- React
- React Native
- Expo
- Supabase
- PostgreSQL
- Redis
- WebSocket
- HTTP
- UI libraries

Recommended package:

```text
packages/game-engine/
└── src/
    └── state/
        ├── game-state.ts
        ├── state-validation.ts
        ├── state-snapshot.ts
        └── state-projection.ts
```

---

# 5. Hierarchy

The logical hierarchy is:

```text
Match
 ├── Players
 ├── Teams
 ├── Rule Profile
 ├── Match Score
 └── Current Round
      ├── Dealer
      ├── Deal
      ├── Bidding
      ├── Contract
      ├── Projects
      ├── Doubling
      ├── Tricks
      ├── Turn
      ├── Timers
      └── Round Score
```

Only one round is active at a time.

Historical rounds are immutable records/snapshots.

---

# 6. Match Identity

Recommended:

```ts
type GameId = string;
type RoundId = string;
type PlayerId = string;
type TeamId = string;
```

IDs must be opaque.

Do not derive game behavior from ID formatting.

---

# 7. Match State

Recommended high-level structure:

```ts
interface GameState {
  readonly gameId: GameId;
  readonly ruleProfileId: string;
  readonly phase: GamePhase;

  readonly players: PlayerState[];
  readonly teams: TeamState[];

  readonly dealer: DealerState;
  readonly score: MatchScore;

  readonly currentRound: RoundState | null;

  readonly stateVersion: number;
  readonly createdAt: number;
  readonly updatedAt: number;

  readonly replay: ReplayMetadata;
}
```

The final implementation may normalize collections for performance.

---

# 8. Game Phase

Recommended high-level phases:

```ts
type GamePhase =
  | "WAITING_FOR_PLAYERS"
  | "SEATING"
  | "ROUND_STARTING"
  | "DEALING"
  | "BIDDING"
  | "CONTRACT_SELECTED"
  | "PROJECT_DECLARATION"
  | "PLAYING"
  | "SCORING"
  | "ROUND_COMPLETE"
  | "MATCH_COMPLETE"
  | "CANCELLED";
```

The canonical transition graph is defined in `09-state-transitions.md`; internal transitions such as `COMPLETE_DEAL` and `MATCH_END_CHECK` are not client-facing GamePhase values.

The exact transition graph belongs in:

```text
09-state-transitions.md
```

---

# 9. Player State

Recommended:

```ts
interface PlayerState {
  readonly playerId: PlayerId;
  readonly seat: Seat;
  readonly teamId: TeamId;
  readonly status: PlayerStatus;
}
```

Gameplay state should not contain sensitive account information.

Do not place:

```text
email
phone
password
auth token
payment information
```

inside Game State.

---

# 10. Player Status

Possible:

```ts
type PlayerStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "LEFT"
  | "FORFEITED";
```

Presence is related to, but distinct from, gameplay state.

A player being disconnected does not automatically mean:

```text
game over
```

The Rule Profile and product policy determine the consequence.

---

# 11. Seats

Canonical:

```text
NORTH
EAST
SOUTH
WEST
```

A seat must map to exactly one active player during gameplay.

The mapping:

```text
seat → player
```

must be authoritative.

---

# 12. Teams

Two teams:

```text
TEAM_A
TEAM_B
```

Each has exactly two seats.

Default partnership:

```text
NORTH + SOUTH
EAST  + WEST
```

The exact team assignment should be created at game initialization and then remain immutable for the match.

---

# 13. Team State

Recommended:

```ts
interface TeamState {
  readonly teamId: TeamId;
  readonly seats: readonly [Seat, Seat];
  readonly matchQaid: number;
}
```

Team score is match-level state.

Round scoring should remain separately snapshotable.

---

# 14. Rule Profile

Every Game State MUST carry:

```ts
readonly ruleProfileId: string;
```

This is critical.

A replay from:

```text
saudi-standard-v1
```

must not accidentally be evaluated under:

```text
saudi-standard-v2
```

---

# 15. Rule Profile Version

Prefer a versioned identifier:

```text
saudi-standard-v1
```

rather than:

```text
saudi
```

The profile should be immutable for the lifetime of a match.

Changing rules in the middle of a match is forbidden.

---

# 16. Dealer

Game State contains:

```ts
interface DealerState {
  readonly seat: Seat;
  readonly playerId: PlayerId;
}
```

Dealer state must be explicit.

Do not calculate dealer dynamically from:

```text
round number
```

unless the Rule Profile defines that exact relation.

---

# 17. Round State

Recommended:

```ts
interface RoundState {
  readonly roundId: RoundId;
  readonly number: number;
  readonly dealerSeat: Seat;

  readonly deal: DealState;
  readonly bidding: BiddingState;
  readonly contract: Contract | null;

  readonly projects: ProjectState;
  readonly doubling: DoublingState;

  readonly playing: PlayingState | null;
  readonly score: RoundScore | null;
}
```

---

# 18. Deal State

Recommended conceptual model:

```ts
interface DealState {
  readonly phase: DealPhase;
  readonly deck: readonly CardId[];
  readonly hands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly exposedCardId: CardId | null;
}
```

The final implementation may use a normalized structure.

The key invariant is card conservation.

---

# 19. Hidden Information

The authoritative state may contain:

```text
all deck cards
all player hands
```

but the client must receive a filtered projection.

Never serialize the complete Game State directly to a player.

---

# 20. Bidding State

Recommended:

```ts
interface BiddingState {
  readonly phase: BiddingPhase;
  readonly activeSeat: Seat;
  readonly turnNumber: number;

  readonly actions: readonly BiddingActionRecord[];

  readonly contract: Contract | null;

  readonly startedAt: number;
  readonly expiresAt: number;
}
```

The final contract can also be stored at `RoundState.contract` for convenience, but there must be one authoritative value.

---

# 21. Contract

Contract should contain:

```text
type
suit when applicable
purchaser
source round
Ashkal metadata where applicable
```

The exact structure is frozen by Bidding.

Game State must store the selected contract after bidding.

---

# 22. Project State

Recommended:

```ts
interface ProjectState {
  readonly candidates: readonly ProjectCandidate[];
  readonly announcements: readonly ProjectAnnouncement[];
  readonly resolved: readonly ResolvedProject[];
}
```

Do not reduce projects to a single boolean.

The state must preserve enough information for:

```text
validation
comparison
replay
scoring
```

---

# 23. Doubling State

Recommended:

```ts
interface DoublingState {
  readonly level: MultiplierLevel;
  readonly initialDoublerTeamId?: TeamId;
  readonly history: readonly DoublingAction[];
}
```

Doubling must be part of authoritative round state.

---

# 24. Playing State

Recommended:

```ts
interface PlayingState {
  readonly trickNumber: number;
  readonly leaderSeat: Seat;
  readonly activeSeat: Seat;

  readonly currentTrick: TrickState;
  readonly completedTricks: readonly CompletedTrick[];

  readonly turnStartedAt: number;
  readonly turnExpiresAt: number;
}
```

The Game State should never represent:

```text
two active seats
```

at once.

---

# 25. Current Trick

A current trick can have:

```text
0–4 plays
```

When:

```text
plays = 0
```

then:

```text
ledSuit = undefined
winner = undefined
```

When:

```text
plays = 4
```

the trick must be resolved before progressing.

---

# 26. Completed Tricks

Recommended:

```ts
interface CompletedTrick {
  readonly trickNumber: number;
  readonly leaderSeat: Seat;
  readonly plays: readonly TrickPlay[];
  readonly winnerSeat: Seat;
}
```

Completed tricks are immutable.

Do not edit historical trick results after scoring.

---

# 27. Card Ownership Invariant

At every valid state:

```text
Every card exists exactly once.
```

A card can be in:

```text
deck
player hand
exposed card
current trick
completed trick
```

but never two zones simultaneously.

---

# 28. State-Level Card Validation

The Game State validator should calculate:

```text
all card IDs
```

across all zones and assert:

```text
count = 32
unique count = 32
```

This should run:

- in tests
- after critical transitions
- optionally in development builds
- during replay validation

---

# 29. Match Score

Recommended:

```ts
interface MatchScore {
  readonly teamA: number;
  readonly teamB: number;
}
```

The score should only change through the Scoring Engine transition.

No client action can directly mutate it.

---

# 30. Round Score

Once scoring is complete:

```ts
score: RoundScore
```

The RoundScore should be immutable.

A later UI display must consume the stored result rather than recompute it differently.

---

# 31. State Version

Every authoritative Game State has:

```ts
stateVersion: number;
```

The version increments after every committed state transition.

Example:

```text
100
 ↓ PLAY_CARD
101
 ↓ PLAY_CARD
102
 ↓ TRICK_COMPLETE
103
```

The exact increment policy must be consistent.

---

# 32. Monotonicity

The state version must never:

```text
decrease
```

or:

```text
repeat for two different committed states
```

This supports:

- concurrency control
- reconnect
- idempotency
- debugging
- replay

---

# 33. Action Sequence

Each accepted action should also have an authoritative sequence.

Recommended:

```ts
interface StateTransitionMeta {
  readonly stateVersion: number;
  readonly actionId: string;
  readonly actorPlayerId?: PlayerId;
  readonly committedAt: number;
}
```

The final Action Protocol document will define the full envelope.

---

# 34. State Transition Metadata

Do not place large audit payloads directly inside the hot Game State if avoidable.

Prefer separate:

```text
Game State
+
Event/Action Log
+
Replay Record
```

This keeps the active state compact.

---

# 35. Timers

Timers must be represented as deadlines.

Prefer:

```text
startedAt
expiresAt
```

rather than decrementing:

```text
remainingSeconds
```

inside persisted state.

The server calculates remaining time:

```text
expiresAt - authoritativeNow
```

---

# 36. Clock Authority

The server clock is authoritative.

The client clock is for:

```text
visual countdown
```

only.

Never decide a timeout using:

```text
Date.now()
```

on the client.

---

# 37. Timer Types

Possible timers:

```text
BIDDING_TURN
PLAYING_TURN
PROJECT_DECLARATION
RECONNECT_GRACE
ROOM_READY
```

Not every timer needs to be active simultaneously.

---

# 38. Active Timer

Recommended:

```ts
interface ActiveTimer {
  readonly type: TimerType;
  readonly seat?: Seat;
  readonly startedAt: number;
  readonly expiresAt: number;
}
```

Only one gameplay action timer should normally be active at once.

---

# 39. Reconnect State

The Game State should contain enough information to resume:

```text
current phase
active seat
current turn
hands
current trick
contract
score
timer deadline
state version
```

Presence details can remain outside the core state.

---

# 40. Snapshot

A snapshot is an immutable serialization of authoritative state at a specific version.

Recommended:

```ts
interface StateSnapshot {
  readonly gameId: GameId;
  readonly stateVersion: number;
  readonly phase: GamePhase;
  readonly state: GameState;
}
```

Snapshots support:

- reconnect
- server restart
- debugging
- replay
- dispute resolution

---

# 41. Player View

Never send:

```ts
GameState
```

directly to a player.

Instead:

```ts
createPlayerView(
  state: GameState,
  viewer: PlayerId
): PlayerGameView
```

The view filters hidden information.

---

# 42. Player Game View

Conceptually:

```ts
interface PlayerGameView {
  readonly gameId: GameId;
  readonly phase: GamePhase;
  readonly players: PublicPlayerView[];
  readonly teams: PublicTeamView[];

  readonly ownHand: readonly CardId[];
  readonly opponentHandCounts: Record<Seat, number>;

  readonly publicDeal: PublicDealView;
  readonly bidding: PublicBiddingView;
  readonly contract: PublicContractView | null;
  readonly playing: PublicPlayingView | null;
  readonly score: PublicScoreView;
  readonly timer: PublicTimerView | null;

  readonly stateVersion: number;
}
```

---

# 43. Hidden Information Projection

The player view must never expose:

```text
opponent hidden cards
remaining deck identities
future card order
unannounced private project candidates
internal RNG seed
private moderation metadata
server secrets
```

---

# 44. Public Information

Once a card is played:

```text
cardId
```

becomes public game information.

Likewise:

```text
current trick
contract
declared projects
scores
```

may become public according to the Rule Profile.

---

# 45. Project Visibility

Project state needs visibility levels.

Conceptually:

```ts
type Visibility =
  | "PRIVATE"
  | "DECLARED"
  | "PUBLIC"
  | "ADMIN_ONLY";
```

The player view should expose only the permitted level.

---

# 46. State Projection Security

The projection layer is a security boundary.

It should have tests asserting:

```text
Player A cannot see Player B's hidden hand.
```

This should be an automated security test.

---

# 47. State Mutation Rule

No subsystem should mutate the Game State directly.

Preferred:

```text
currentState
   +
validated action
   ↓
Game Engine
   ↓
nextState
```

Bad:

```ts
state.score.teamA += 4;
```

from arbitrary service code.

---

# 48. Immutable Transition Model

Conceptually:

```ts
applyAction(
  state,
  action,
  context
): TransitionResult
```

returns:

```ts
interface TransitionResult {
  readonly nextState: GameState;
  readonly events: readonly GameEvent[];
}
```

The old state remains unchanged.

This is especially useful for:

- replay
- tests
- debugging
- rollback
- simulations

---

# 49. Event Output

Events are derived from state transitions.

Possible:

```text
ROUND_STARTED
DEAL_STARTED
CARD_REVEALED
BID_ACCEPTED
CONTRACT_SELECTED
PROJECT_DECLARED
CARD_PLAYED
TRICK_COMPLETED
ROUND_SCORED
MATCH_COMPLETED
```

Exact protocol names belong to the Actions/Protocol documents.

---

# 50. Persistence Boundary

The authoritative transition pipeline should be:

```text
Load State
    ↓
Validate Version
    ↓
Validate Action
    ↓
Calculate Next State
    ↓
Validate Invariants
    ↓
Persist
    ↓
Publish Events
```

Do not publish a gameplay-success event before the authoritative state commit if that can create event/state divergence.

---

# 51. Database Representation

The persisted representation does not need to equal the in-memory domain object.

Possible architecture:

```text
PostgreSQL
    ↓
State Repository
    ↓
Domain GameState
```

The repository converts between:

```text
database schema
```

and:

```text
domain state
```

The database schema must not leak into the Game Engine.

---

# 52. Optimistic Concurrency

A state transition should use:

```text
WHERE state_version = expectedVersion
```

or an equivalent atomic mechanism.

If zero rows are updated:

```text
STALE_STATE_VERSION
```

The action must not be applied twice.

---

# 53. Distributed Locking

Redis or another coordination system may be used to prevent concurrent processing for the same game.

However:

```text
lock ≠ source of truth
```

The database/domain version check remains authoritative.

This protects against:

```text
two game-server workers
```

processing the same action simultaneously.

---

# 54. Single Writer Principle

Ideally:

```text
one game room
→ one authoritative processing sequence
```

for gameplay transitions.

If multiple server instances are involved, they must still converge on one serialized transition stream per game.

---

# 55. Server Restart

On restart:

```text
load latest committed state
```

then validate:

```text
state invariants
```

before accepting new actions.

Do not reconstruct state from UI clients.

---

# 56. Snapshot + Event Log

For long matches, a hybrid model is recommended:

```text
periodic snapshot
+
authoritative action/event log
```

For example:

```text
snapshot at v=100
events v=101..125
```

Recovery can:

```text
load v=100
replay 101..125
validate final state
```

The exact snapshot frequency is an operations decision.

---

# 57. Replay

Replay should use:

```text
initial snapshot
+
authoritative actions
+
ruleProfileId
```

and run through the same Game Engine.

Do not create a separate replay rules implementation.

---

# 58. State Hash

A deterministic state hash is recommended.

Conceptually:

```ts
hashGameState(state): string
```

The hash should exclude:

```text
non-deterministic timestamps
network metadata
ephemeral presence
```

unless explicitly required.

This can help detect:

- divergence
- replay corruption
- server bugs
- inconsistent replicas

---

# 59. Canonical Serialization

State hashing requires canonical serialization.

The serializer must guarantee stable ordering for:

```text
players
teams
hands
tricks
projects
events
```

Do not rely blindly on JavaScript object insertion order for cross-platform hashes.

---

# 60. Debug State Dump

Development tooling should support:

```text
gameId
stateVersion
phase
dealer
activeSeat
contract
hands
currentTrick
completedTricks
score
doubling
projects
```

with sensitive information clearly marked.

Production debug dumps must respect access controls.

---

# 61. State Validation

Recommended:

```ts
validateGameState(
  state: GameState
): ValidationResult
```

Validation should include:

### Structural

```text
required fields
valid enums
valid IDs
```

### Card

```text
32 unique cards
```

### Seats

```text
4 players
4 occupied seats
2 teams
```

### Phase

```text
phase/state compatibility
```

### Turn

```text
active seat valid
```

### Trick

```text
0–4 cards
```

### Score

```text
non-negative integer
```

---

# 62. Cross-System Invariants

Examples:

### Bidding

If:

```text
phase = BIDDING
```

then:

```text
contract = null
```

unless the selected transition semantics explicitly represent contract selection as a boundary state.

### Playing

If:

```text
phase = PLAYING
```

then:

```text
contract != null
hands are complete
```

### Scoring

If:

```text
phase = SCORING
```

then:

```text
8 tricks are complete
```

### Match Complete

If:

```text
phase = MATCH_COMPLETE
```

then:

```text
match winner exists
```

---

# 63. Invalid State Examples

Reject states such as:

```text
BIDDING + no active seat
PLAYING + no contract
PLAYING + player has 9 cards
TRICK with 5 plays
TRICK with 2 winners
ROUND_COMPLETE + incomplete tricks
MATCH_COMPLETE + no winner
duplicate card in two hands
```

---

# 64. State Recovery Invariant

After:

```text
serialize
→ persist
→ load
→ deserialize
```

the domain state must be semantically identical.

This should be tested.

---

# 65. State Transition Determinism

Given:

```text
same state
+
same action
+
same rule profile
```

the engine must produce:

```text
same next state
+
same events
```

No random values should be introduced by ordinary actions.

Randomness belongs only to explicitly controlled game initialization/dealing operations.

---

# 66. Action Idempotency

Every external action should carry:

```text
actionId
```

The authoritative layer must ensure:

```text
one actionId
→ at most one committed transition
```

If a duplicate arrives, the server may return the prior result.

---

# 67. Action Ordering

Actions must be ordered by:

```text
authoritative stateVersion
```

not:

```text
client timestamp
```

If two clients submit simultaneously:

```text
only one valid transition can win
```

The other must be revalidated against the new state.

---

# 68. Client Stale State

If a client is behind:

```text
client version = 100
server version = 104
```

the server should return:

```text
STALE_STATE
```

with enough information for the client to resynchronize.

Possible strategies:

```text
full snapshot
```

or:

```text
snapshot + events
```

---

# 69. Reconnect Synchronization

Recommended protocol:

```text
Client connects
    ↓
authenticate
    ↓
identify game
    ↓
server loads authoritative state
    ↓
server generates PlayerGameView
    ↓
send snapshot
    ↓
client replaces local state
    ↓
resume UI
```

Do not merge stale client gameplay state into the server state.

---

# 70. Offline Behavior

The mobile app may cache:

```text
last known view
```

for visual continuity.

It must not allow offline authoritative gameplay in a live multiplayer match unless the product explicitly supports an offline mode.

For live multiplayer:

```text
server state wins
```

---

# 71. Presence vs Game State

Keep:

```text
online/offline/ping
```

separate from:

```text
card/gameplay state
```

Presence may live in Redis or another ephemeral system.

Game State belongs to the authoritative game engine/persistence layer.

---

# 72. Chat/Social Data

Basic chat/reactions should not be embedded deeply inside the core Game State.

Prefer:

```text
Game State
+
Social Event Stream
```

This keeps gameplay deterministic.

A chat message should not increment:

```text
stateVersion
```

unless the protocol intentionally treats social events as part of the same ordered room stream.

The architecture should make this distinction explicit.

---

# 73. Moderation Data

Do not place:

```text
reports
mute records
moderation notes
```

inside the gameplay Game State.

They belong to the social/moderation subsystem.

Gameplay can consume a derived:

```text
canInteract(playerId)
```

policy if necessary.

---

# 74. Analytics

Analytics should subscribe to authoritative events.

Do not let analytics mutate Game State.

Examples:

```text
game_started
round_started
contract_selected
trick_completed
round_scored
match_completed
```

Analytics failures must not block gameplay.

---

# 75. Performance

The active Game State should remain compact.

Avoid storing redundant derived data unless it materially improves performance.

Examples that can often be derived:

```text
remainingCardsCount
isTrump
legalActions
```

But cache/denormalize only where there is a measured reason.

If derived data is persisted, it must be validated against the canonical state.

---

# 76. Memory

A four-player game is small.

Correctness is more important than micro-optimization.

Prefer:

```text
immutable arrays
clear structures
explicit invariants
```

over obscure compact encodings.

---

# 77. Versioned Schema

The persisted Game State should have a schema version:

```ts
schemaVersion: number;
```

This is different from:

```text
stateVersion
```

### schemaVersion

Changes when the stored data shape changes.

### stateVersion

Changes after gameplay transitions.

Do not confuse them.

---

# 78. Migration

If Game State schema changes:

```text
old schema
→ migration
→ new schema
```

must be deterministic.

A migration must not reinterpret historical game rules.

Historical matches retain their:

```text
ruleProfileId
```

---

# 79. Historical Rounds

Completed rounds should become immutable.

Recommended:

```text
activeRound
+
completedRoundSnapshots[]
```

The active Game State can keep only what is required for the live match while persistent storage retains the full history.

---

# 80. Round Snapshot

At round completion store:

```text
roundId
roundNumber
dealer
contract
purchaser
projects
doubling
tricks
raw score
qayd
match score before
match score after
ruleProfileId
state hash
```

This becomes a valuable debugging/replay artifact.

---

# 81. Match Completion Snapshot

When the match ends:

```text
final Game State
+
final Match Score
+
winning Team
+
all Round Snapshots
+
ruleProfileId
+
final state hash
```

must be persistable.

---

# 82. Security Boundaries

Game State contains sensitive information.

Access levels:

```text
Authoritative Server
    ↓ full state

Admin / Support
    ↓ controlled full or partial state

Player
    ↓ player-specific projection

Spectator
    ↓ public projection

Analytics
    ↓ event-derived subset
```

Never expose the full state through a generic API.

---

# 83. Client View Version

The Player View should include:

```text
stateVersion
```

so the client knows which authoritative state it is rendering.

If the server sends:

```text
v=120
```

then a later:

```text
v=119
```

must not overwrite it.

---

# 84. Out-of-Order Network Messages

The client should discard or reconcile stale snapshots/events.

Example:

```text
receive v=120
receive v=119
```

Do not regress to:

```text
v=119
```

unless the protocol explicitly identifies a rollback/recovery operation.

---

# 85. State Hash Verification

The server may include:

```text
stateHash
```

in snapshots.

The client should not be trusted to compute the authoritative hash, but it can use it for diagnostics.

Replay systems should verify hashes independently.

---

# 86. Testing Strategy

## Unit Tests

- state constructors
- phase validation
- card conservation
- turn validation
- score validation
- timer validation

## Integration Tests

- dealing → bidding
- bidding → contract
- contract → playing
- playing → scoring
- scoring → next round
- scoring → match completion

## Recovery Tests

- reconnect
- server restart
- stale action
- duplicate action
- concurrent actions
- snapshot restore

---

# 87. Property-Based Tests

Useful properties:

### Card conservation

```text
32 unique cards
```

### Version monotonicity

```text
v(n+1) > v(n)
```

### Determinism

```text
same state + same action = same result
```

### Serialization

```text
decode(encode(state)) ≡ state
```

### Projection security

```text
player view never contains unauthorized card IDs
```

---

# 88. Fuzz Testing

The state validator should be fuzzed with:

```text
invalid enum
missing field
duplicate card
negative score
invalid seat
5-card trick
9-card hand
invalid contract
invalid timer
invalid version
```

The engine must reject invalid state rather than crash unpredictably.

---

# 89. State Machine Testing

Generate random legal action sequences and verify:

```text
all states remain valid
```

Then compare:

```text
direct execution
```

against:

```text
replay execution
```

They must produce identical final states.

---

# 90. Observability

Every committed transition should be traceable through:

```text
gameId
roundId
stateVersion
actionId
actorPlayerId
```

This allows support to answer:

```text
What happened at v=183?
```

without guessing.

---

# 91. Correlation ID

Network requests should have a separate:

```text
requestId
```

Do not confuse:

```text
requestId
actionId
stateVersion
gameId
```

They solve different problems.

---

# 92. State Change Audit

For important transitions, record:

```text
beforeVersion
afterVersion
actionId
actor
actionType
timestamp
stateHashAfter
```

Do not store full sensitive state in every log line.

---

# 93. State Size

Monitor:

```text
serialized state bytes
```

over time.

If the state grows excessively due to:

```text
chat
events
analytics
```

move those systems out of the core Game State.

---

# 94. Open Decisions

The following must be frozen before implementation:

1. Exact `GamePhase` enum.
2. Exact `RoundState` shape.
3. Exact persistence model.
4. Snapshot frequency.
5. Event-log retention.
6. State hash algorithm.
7. Player View protocol.
8. Spectator projection.
9. Admin access model.
10. Presence architecture.
11. Social-event separation.
12. Server restart strategy.
13. Multi-server room ownership.
14. Schema migration strategy.
15. Exact timer model.
16. Exact disconnect grace policy.

---

# 95. Rule Freeze Gate

Before implementation:

- [ ] One authoritative Game State model.
- [ ] One state transition boundary.
- [ ] One versioning strategy.
- [ ] One concurrency strategy.
- [ ] Card conservation validator.
- [ ] Player projection security.
- [ ] Snapshot/recovery design.
- [ ] Replay design.
- [ ] Timer model.
- [ ] Persistence boundary.
- [ ] Schema versioning.
- [ ] State hash strategy.
- [ ] Observability fields.
- [ ] Cross-system invariants.
- [ ] Recovery tests.

---

# 96. Implementation Checklist

### Core

- [ ] `GameState`
- [ ] `RoundState`
- [ ] `PlayerState`
- [ ] `TeamState`
- [ ] `DealerState`
- [ ] `DealState`
- [ ] `BiddingState`
- [ ] `PlayingState`
- [ ] `ProjectState`
- [ ] `DoublingState`
- [ ] `MatchScore`

### Infrastructure Boundary

- [ ] state repository
- [ ] optimistic concurrency
- [ ] game-room serialization
- [ ] snapshots
- [ ] event log
- [ ] recovery
- [ ] state hash

### Security

- [ ] player projection
- [ ] hidden-card filtering
- [ ] admin access control
- [ ] replay authorization

### Tests

- [ ] invariants
- [ ] serialization
- [ ] recovery
- [ ] concurrency
- [ ] projection security
- [ ] replay determinism
- [ ] fuzzing
- [ ] property-based tests

---

# 97. Relationship to Other Documents

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

This document is the central state model.

The next documents define:

```text
Actions
```

and:

```text
How Actions transform Game State
```

---

# 98. Final Engineering Rule

**There is one game, one authoritative state, and one legal transition path.**

The mobile client does not own gameplay state.

The database does not own gameplay rules.

Redis does not own gameplay truth.

The UI does not own timers.

Analytics does not mutate gameplay.

Bots do not bypass the engine.

Replay does not implement a second ruleset.

Everything converges on:

```text
Authoritative GameState
        ↓
Validated Action
        ↓
Deterministic Transition
        ↓
Next GameState
        ↓
Events + Player Projection
```

That architecture is the foundation for a fair, reconnectable, replayable, and production-grade multiplayer Baloot game.

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

Final approval should occur only after the complete foundation specification has been reviewed together.
