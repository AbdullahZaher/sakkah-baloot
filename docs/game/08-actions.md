# صكّة بلوت — Actions Specification

**Document:** `docs/game/08-actions.md`  
**Status:** Draft for Review — PROPOSED RECONCILIATION (14.Z.10-R) — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** Game Rules, Card System, Dealing, Bidding, Playing, Scoring, Game State  
**Next:** State Transitions

---

# 1. Purpose

This document defines the complete authoritative action/command model for صكّة بلوت.

An action is a request to change game state.

The fundamental rule is:

```text
Client sends intent
        ↓
Server validates intent
        ↓
Game Engine applies transition
        ↓
New authoritative state
        ↓
Events + player projection
```

The client never sends an already-computed result.

---

# 2. Action vs Event

These are different concepts.

## Action

An action is an instruction:

```text
PLAY_CARD
```

## Event

An event is a fact that happened:

```text
CARD_PLAYED
```

The client submits:

```text
Action
```

The server emits:

```text
Event
```

Never use events as client commands.

---

# 3. Action Envelope

Every gameplay action should use a common envelope.

Recommended:

```ts
interface ActionEnvelope<TType, TPayload> {
  readonly actionId: string;
  readonly gameId: GameId;
  readonly playerId: PlayerId;
  readonly type: TType;
  readonly payload: TPayload;

  readonly expectedStateVersion: number;
  readonly clientSequence?: number;
  readonly sentAt?: number;
}
```

The server determines the authoritative timestamp.

---

# 4. Action ID

Every action requires:

```text
actionId
```

It must be unique within the game.

Purpose:

- idempotency
- debugging
- replay
- support
- duplicate detection

If the same `actionId` is received twice, it must not create two transitions.

---

# 5. State Version

The client includes:

```text
expectedStateVersion
```

Example:

```text
server = 105
client = 105
→ action can be evaluated
```

If:

```text
server = 106
client = 105
```

the server must apply the defined stale-state policy.

Recommended default:

```text
reject + resync
```

unless the action is explicitly safe to reconcile.

---

# 6. Client Sequence

Optional:

```text
clientSequence
```

This is useful for detecting:

```text
duplicate packets
out-of-order packets
client reconnect gaps
```

It is NOT the authoritative ordering mechanism.

The authoritative ordering is:

```text
server state version
```

---

# 7. Authentication

Every gameplay action must originate from an authenticated session.

The server must verify:

```text
authenticated user
→ mapped PlayerId
→ player belongs to game
```

The client must never be trusted to choose an arbitrary `playerId`.

The authenticated identity is authoritative.

---

# 8. Authorization

Before action-specific validation:

```text
player belongs to game
player has a valid seat
player is allowed to perform this action
```

Examples:

```text
spectator cannot PLAY_CARD
player cannot act as another seat
finished game cannot accept gameplay actions
```

---

# 9. Action Lifecycle

Every action follows:

```text
RECEIVED
   ↓
AUTHENTICATED
   ↓
AUTHORIZED
   ↓
VERSION_CHECKED
   ↓
VALIDATED
   ↓
APPLIED
   ↓
INVARIANTS_CHECKED
   ↓
COMMITTED
   ↓
EVENTS_PUBLISHED
```

If validation fails:

```text
REJECTED
```

No gameplay state mutation occurs.

---

# 10. Action Categories

Actions are grouped into:

```text
LOBBY
MATCH
DEALING
BIDDING
PROJECTS
DOUBLING
PLAYING
SOCIAL
SYSTEM
```

Social actions should remain logically separate from gameplay actions.

---

# 11. Lobby Actions

Recommended:

```text
CREATE_GAME
JOIN_GAME
LEAVE_GAME
READY
UNREADY
START_GAME
CANCEL_GAME
```

Not every action is available in every game mode.

---

# 12. CREATE_GAME

Conceptual:

```ts
type CreateGamePayload = {
  readonly ruleProfileId: string;
  readonly mode: GameMode;
  readonly isPrivate: boolean;
}
```

Server determines:

```text
gameId
host
initial state
```

Client does not choose:

```text
stateVersion
dealer
deck order
RNG seed
```

---

# 13. JOIN_GAME

```ts
type JoinGamePayload = {
  readonly gameId: GameId;
}
```

Server validates:

- game exists
- game accepts players
- player is not already seated elsewhere
- seat availability
- game capacity

---

# 14. LEAVE_GAME

```ts
type LeaveGamePayload = {}
```

If gameplay has started, leaving may not be equivalent to deleting the player.

The policy must distinguish:

```text
leave before game
disconnect during game
forfeit
```

---

# 15. READY

```ts
type ReadyPayload = {}
```

Server validates:

```text
player joined
game waiting
player not already ready
```

---

# 16. UNREADY

```ts
type UnreadyPayload = {}
```

Allowed only before the match begins.

---

# 17. START_GAME

```ts
type StartGamePayload = {}
```

Server validates:

- correct number of players
- all required players ready
- game not already started
- Rule Profile valid

Server then determines:

```text
dealer
initial deck
deal sequence
```

---

# 18. CANCEL_GAME

Used before the match starts.

It must not be confused with:

```text
FORFEIT
```

during an active match.

---

# 19. DEALING Actions

Most dealing operations should be server/system actions rather than player commands.

Do NOT expose:

```text
DEAL_CARDS
CHOOSE_DECK
SET_EXPOSED_CARD
```

to normal players.

The server controls dealing.

---

# 20. Bidding Actions

Core:

```text
PASS
CALL_SUN
CALL_TRUMP
CALL_ASHKAL
```

The canonical payloads are frozen by the Bidding specification: `PASS` and `CALL_SUN` have empty payloads, `CALL_TRUMP` carries only `suit`, and `CALL_ASHKAL` has an empty payload.

Recommended unified command:

```ts
type BidAction =
  | PassAction
  | CallSunAction
  | CallTrumpAction
  | CallAshkalAction;
```

---

# 21. PASS

```ts
interface PassAction {
  readonly type: "PASS";
  readonly payload: {};
}
```

Server validates:

```text
phase = BIDDING
player = active bidder
pass is legal in current bidding stage
```

---

# 22. CALL_SUN

```ts
interface CallSunAction {
  readonly type: "CALL_SUN";
  readonly payload: {};
}
```

The server decides whether:

```text
SUN
```

is legal in the current bidding state.

---

# 23. CALL_TRUMP

```ts
interface CallTrumpAction {
  readonly type: "CALL_TRUMP";
  readonly payload: {
    readonly suit: Suit;
  };
}
```

Never accept:

```text
isTrump: true
```

as the authoritative decision.

The contract is derived by the server.

---

# 24. CALL_ASHKAL

```ts
interface CallAshkalAction {
  readonly type: "CALL_ASHKAL";
  readonly payload: {};
}
```

The exact Ashkal payload must be frozen by the Bidding Rule Profile.

Do not allow the client to invent additional Ashkal fields.

---

# 25. Bidding Action Rules

The server validates:

```text
correct phase
correct active seat
correct bidding round
legal contract
valid suit
valid action sequence
```

A rejected bid does not change:

```text
stateVersion
```

unless the protocol explicitly records rejected attempts separately outside gameplay state.

---

# 26. Project Actions

Project actions are different from project detection.

Canonical:

```text
DECLARE_PROJECT
```

`CONFIRM_PROJECT` is not part of the canonical player protocol unless a later explicit owner decision introduces a separate confirmation rule.

The server may also derive project candidates automatically from hands.

---

# 27. DECLARE_PROJECT

Conceptual:

```ts
interface DeclareProjectPayload {
  readonly projectType: ProjectType;
  readonly cardIds?: readonly CardId[];
}
```

The server verifies the claimed cards.

The client cannot declare:

```text
rawValue
qaydValue
priority
```

as authoritative fields.

---

# 28. Project Claim Security

A player can only declare a project that is actually possible from their authoritative cards.

The server verifies:

```text
card ownership
project definition
contract eligibility
timing
declaration window
```

---

# 29. DOUBLING Actions

Canonical:

```text
DOUBLE
TRIPLE
QUADRUPLE
GAHWA
```

The exact names may be localized in UI but should remain stable internally.

---

# 30. DOUBLE

```ts
type DoublePayload = {};
```

Server determines:

```text
whether doubling is currently legal
which team may call it
new multiplier state
```

The client does not send:

```text
newMultiplier = 2
```

as authoritative data.

---

# 31. TRIPLE

```ts
type TriplePayload = {};
```

The server verifies:

```text
current state allows TRIPLE
calling team is eligible
doubling window is active
```

---

# 32. QUADRUPLE

```ts
type QuadruplePayload = {};
```

Same principle:

```text
server determines legality
server determines resulting state
```

---

# 33. GAHWA

```ts
type GahwaPayload = {};
```

Gahwa must be treated as an immediate match-winning terminal outcome rather than:

```text
multiplier = 5
```

The Rule Profile determines the exact conditions.

---

# 34. PLAY_CARD

This is the primary playing action.

```ts
interface PlayCardPayload {
  readonly cardId: CardId;
}
```

That is intentionally small.

The client does not send:

```text
ledSuit
winnerSeat
isTrump
trickNumber
```

---

# 35. PLAY_CARD Validation

Server checks:

```text
game exists
player belongs to game
phase = PLAYING
player is active seat
cardId valid
card belongs to player's hand
card is legal
turn not expired
state version valid
action not already processed
```

Only after all checks:

```text
apply card
```

---

# 36. PLAY_CARD Result

Successful result may emit:

```text
CARD_PLAYED
```

and, if the fourth card completes the trick:

```text
TRICK_COMPLETED
TURN_CHANGED
```

or the equivalent final protocol events.

The exact event ordering belongs to the State Transition document.

---

# 37. TIMEOUT

A timeout should normally be a server-generated action:

```text
SYSTEM_TIMEOUT
```

rather than a client command.

Example:

```ts
interface TimeoutAction {
  readonly type: "SYSTEM_TIMEOUT";
  readonly targetSeat: Seat;
}
```

The system determines the automatic move according to the Rule Profile.

---

# 38. RECONNECT

Reconnect is primarily a transport/session operation, not a gameplay mutation.

Recommended:

```text
RESYNC_GAME
```

rather than allowing a client to submit a fabricated gameplay state.

---

# 39. RESYNC_GAME

Conceptual:

```ts
interface ResyncGamePayload {
  readonly knownStateVersion?: number;
}
```

Server responds with:

```text
latest player-specific snapshot
```

or:

```text
snapshot + missing events
```

---

# 40. SOCIAL Actions

Examples:

```text
SEND_CHAT
SEND_REACTION
MUTE_PLAYER
UNMUTE_PLAYER
REPORT_PLAYER
```

These should not mutate core card/gameplay state.

They can use a separate social event stream.

---

# 41. SEND_CHAT

```ts
interface SendChatPayload {
  readonly message: string;
}
```

Server validates:

```text
length
rate limit
moderation policy
player status
game membership
```

Never trust client-provided:

```text
senderName
senderId
timestamp
```

---

# 42. SEND_REACTION

```ts
interface SendReactionPayload {
  readonly reactionId: string;
}
```

The server validates the reaction against the allowed catalog.

Do not allow arbitrary emoji payloads if the product intends a controlled reaction set.

---

# 43. MUTE_PLAYER

This is usually local client state.

If synchronized muting is supported:

```ts
interface MutePlayerPayload {
  readonly targetPlayerId: PlayerId;
}
```

The server must verify that the target belongs to the same game.

---

# 44. REPORT_PLAYER

```ts
interface ReportPlayerPayload {
  readonly targetPlayerId: PlayerId;
  readonly reasonCode: string;
}
```

Moderation records should be stored outside the core Game State.

---

# 45. SYSTEM Actions

System-generated actions may include:

```text
SYSTEM_START_ROUND
SYSTEM_DEAL
SYSTEM_TIMEOUT
SYSTEM_FORFEIT
SYSTEM_CANCEL_HAND
SYSTEM_INCIDENT_RESOLUTION
```

These are not player permissions.

---

# 46. Player vs System Authority

| Action | Player | Server/System |
|---|---:|---:|
| JOIN_GAME | Yes | Validate |
| READY | Yes | Validate |
| START_GAME | Yes/Host | Validate |
| DEAL | No | Yes |
| PASS | Yes | Validate |
| CALL_SUN | Yes | Validate |
| CALL_TRUMP | Yes | Validate |
| CALL_ASHKAL | Yes | Validate |
| DECLARE_PROJECT | Yes | Validate |
| DOUBLE | Yes | Validate |
| PLAY_CARD | Yes | Validate |
| TIMEOUT | No | Yes |
| SCORE_ROUND | No | Yes |
| END_MATCH | No | Yes |

The final product permission model may refine this table.

---

# 47. Action Permissions

Recommended conceptual permission:

```ts
type ActionPermission =
  | "PUBLIC"
  | "PLAYER"
  | "SEATED_PLAYER"
  | "ACTIVE_PLAYER"
  | "HOST"
  | "SYSTEM";
```

Examples:

```text
PLAY_CARD → ACTIVE_PLAYER
BID       → ACTIVE_PLAYER
READY     → SEATED_PLAYER
START     → HOST/SYSTEM
TIMEOUT   → SYSTEM
```

---

# 48. Action Availability

Do not determine availability from UI alone.

The server should expose a derived set:

```ts
getAvailableActions(
  state,
  playerId
): readonly AvailableAction[];
```

This can help the client render controls.

However:

```text
availableActions ≠ authorization bypass
```

The server still validates the submitted action.

---

# 49. Available Action Example

Conceptually:

```json
{
  "type": "PLAY_CARD",
  "allowed": true,
  "constraints": {
    "legalCardIds": ["..."]
  }
}
```

This improves UX without moving authority to the client.

---

# 50. Validation Layers

Actions should pass through:

```text
Envelope Validation
        ↓
Authentication
        ↓
Authorization
        ↓
Phase Validation
        ↓
Turn Validation
        ↓
Payload Validation
        ↓
Domain Rule Validation
        ↓
Invariant Validation
```

Each layer should have focused tests.

---

# 51. Payload Validation

Use strict schemas.

Recommended technologies can include:

```text
Zod
Valibot
JSON Schema
```

but the domain engine should not become coupled to a transport validation library.

A transport layer may convert:

```text
JSON payload
```

into:

```text
typed domain action
```

---

# 52. Domain Action Types

Recommended:

```ts
type GameAction =
  | JoinGameAction
  | LeaveGameAction
  | ReadyAction
  | UnreadyAction
  | StartGameAction
  | PassAction
  | CallSunAction
  | CallTrumpAction
  | CallAshkalAction
  | DeclareProjectAction
  | DoubleAction
  | TripleAction
  | QuadrupleAction
  | GahwaAction
  | PlayCardAction;
```

System actions can be a separate union:

```ts
type SystemAction = ...
```

---

# 53. Domain vs Transport Action

Transport:

```json
{
  "type": "PLAY_CARD",
  "payload": {
    "cardId": "..."
  }
}
```

Domain:

```ts
{
  type: "PLAY_CARD",
  cardId: cardId
}
```

Keep transport concerns outside the Game Engine.

---

# 54. Action Result

Recommended:

```ts
type ActionResult =
  | {
      readonly status: "ACCEPTED";
      readonly stateVersion: number;
      readonly events: readonly GameEvent[];
    }
  | {
      readonly status: "REJECTED";
      readonly error: ActionError;
      readonly stateVersion: number;
    };
```

---

# 55. Rejected Actions

A rejected action must not mutate gameplay state.

Example:

```text
PLAY_CARD
wrong turn
```

returns:

```text
INVALID_TURN
```

with current authoritative version.

---

# 56. Action Error Model

Recommended:

```ts
interface ActionError {
  readonly code: string;
  readonly messageKey: string;
  readonly retryable: boolean;
  readonly currentStateVersion: number;
}
```

Do not send only a localized Arabic sentence as the error contract.

The stable `code` is authoritative.

---

# 57. Error Examples

```text
AUTH_REQUIRED
NOT_IN_GAME
NOT_SEATED
NOT_ALLOWED
INVALID_PHASE
INVALID_TURN
INVALID_STATE_VERSION
ACTION_ALREADY_PROCESSED
INVALID_PAYLOAD
CARD_NOT_IN_HAND
MUST_FOLLOW_LED_SUIT
PROJECT_NOT_ELIGIBLE
DOUBLING_NOT_ALLOWED
GAME_ALREADY_COMPLETE
```

---

# 58. Retryability

Each error should indicate:

```text
retryable
```

Examples:

```text
NETWORK_ERROR → retryable
STALE_STATE → retry after resync
INVALID_TURN → usually not retryable until turn changes
CARD_NOT_IN_HAND → not retryable
INVALID_PAYLOAD → not retryable
```

---

# 59. Idempotency

The server should persist enough action-result metadata to answer:

```text
Have I already processed actionId?
```

Possible:

```ts
interface ProcessedAction {
  readonly actionId: string;
  readonly stateVersionBefore: number;
  readonly stateVersionAfter: number;
  readonly result: ActionResult;
}
```

Retention policy is an infrastructure decision.

---

# 60. Duplicate Action

If:

```text
actionId = ABC
```

was already committed, and the same action arrives again:

```text
do not apply it again
```

Return the original result where possible.

---

# 61. Concurrent Actions

Example:

```text
NORTH PLAY_CARD(A)
SOUTH PLAY_CARD(K)
```

while only NORTH is active.

The engine must serialize validation.

Exactly one legal action should commit.

The other receives:

```text
INVALID_TURN
```

or:

```text
STALE_STATE_VERSION
```

depending on timing.

---

# 62. Action Ordering

Never rely on:

```text
network arrival order
```

as a gameplay rule.

The authoritative game-room processor establishes:

```text
serialized action processing
```

and the state version confirms the committed order.

---

# 63. Server Timeout Race

If a player submits a card at approximately the same time as timeout:

```text
PLAY_CARD
SYSTEM_TIMEOUT
```

the game server must serialize both.

Whichever action is first in the authoritative transition sequence determines the outcome, according to the timer validation policy.

Do not resolve this independently on multiple workers.

---

# 64. Client UX

The UI can disable buttons based on:

```text
availableActions
```

but the server remains authoritative.

For card play:

```text
illegal card
```

may be visually disabled.

Still validate on server.

---

# 65. Optimistic UI

The client may optimistically animate:

```text
card selected
card moves toward table
```

before confirmation.

But if the action is rejected:

```text
rollback to server state
```

The client must never permanently remove the card until authoritative confirmation.

---

# 66. Action Auditing

Every accepted gameplay action should be traceable by:

```text
gameId
roundId
actionId
playerId
actionType
stateVersionBefore
stateVersionAfter
timestamp
```

Rejected actions may also be logged at an appropriate security/observability level.

Do not log sensitive hidden card state unnecessarily.

---

# 67. Replay

The action log should contain enough information to replay the game:

```text
accepted actions
system actions
ruleProfileId
initial state / seed metadata
```

Rejected actions are useful for audit but should not alter replay state.

---

# 68. Bot Actions

Bots should submit domain actions through the same interface:

```text
Bot
 ↓
GameAction
 ↓
Game Engine
```

A bot should not directly mutate:

```text
GameState
```

This guarantees that:

```text
Human
Bot
Replay
Simulation
```

use the same legality rules.

---

# 69. Simulation Actions

Simulation can generate:

```text
GameAction
```

sequences without transport.

This is useful for:

- balancing
- rules validation
- stress testing
- regression testing

---

# 70. Security

Never trust client-provided:

```text
playerId
teamId
seat
winner
score
contract
legalCards
trickNumber
timestamp
```

The server derives or validates all of them.

---

# 71. Rate Limits

Action-specific rate limits:

```text
CHAT        → high frequency but bounded
REACTION    → high frequency but bounded
PLAY_CARD   → very low frequency
BID         → low frequency
DOUBLE      → low frequency
REPORT      → low frequency
```

Gameplay actions should also be protected against spam/flooding.

---

# 72. Malformed Actions

Malformed payloads must fail safely.

Examples:

```text
unknown action type
missing cardId
invalid cardId
extra unexpected fields
wrong data type
oversized strings
invalid enum
```

No state mutation.

---

# 73. Version Compatibility

When protocol versions change:

```text
client protocol version
server protocol version
```

must be negotiated.

The domain Game Action should remain stable where possible.

Do not couple game rules to mobile app version numbers.

---

# 74. Action Schema Version

If needed:

```ts
interface ActionEnvelope {
  readonly schemaVersion: number;
}
```

This is different from:

```text
stateVersion
```

and:

```text
ruleProfileId
```

---

# 75. Open Decisions

Before implementation freeze:

1. Exact lobby action set.
2. Host permissions.
3. Exact Bidding action payloads.
4. Exact Ashkal payload.
5. Project declaration interaction.
6. Doubling action windows.
7. System timeout action shape.
8. Action result protocol.
9. Idempotency retention period.
10. Client sequence policy.
11. Error code catalog.
12. Rate limits.
13. Social action separation.
14. Protocol schema versioning.
15. Bot action identity.
16. Admin/system action authorization.

---

# 76. Rule Freeze Gate

Before implementation:

- [ ] One Action Envelope.
- [ ] One GameAction union.
- [ ] Stable action IDs.
- [ ] State version validation.
- [ ] Authentication/authorization.
- [ ] Strict payload schemas.
- [ ] Server-side legality validation.
- [ ] Idempotency.
- [ ] Concurrency serialization.
- [ ] Timeout race handling.
- [ ] Stable error codes.
- [ ] Replay compatibility.
- [ ] Bot compatibility.
- [ ] Rate limiting.
- [ ] Audit metadata.

---

# 77. Implementation Checklist

### Core

- [ ] `ActionEnvelope`
- [ ] `GameAction`
- [ ] `SystemAction`
- [ ] `ActionResult`
- [ ] `ActionError`
- [ ] `ProcessedAction`

### Gameplay

- [ ] bidding actions
- [ ] project actions
- [ ] doubling actions
- [ ] play-card action
- [ ] timeout system action

### Security

- [ ] authentication
- [ ] authorization
- [ ] payload validation
- [ ] rate limits
- [ ] anti-replay/idempotency

### Reliability

- [ ] state version
- [ ] concurrent action handling
- [ ] reconnect
- [ ] duplicate action handling
- [ ] timeout race

### Testing

- [ ] every action schema
- [ ] every permission
- [ ] every phase
- [ ] duplicate actions
- [ ] stale versions
- [ ] malformed payloads
- [ ] replay
- [ ] bot
- [ ] fuzz tests

---

# 78. Relationship to Other Documents

```text
Game Rules
    ↓
Game State
    ↓
Actions  ← THIS DOCUMENT
    ↓
State Transitions
    ↓
Events / Protocol
```

This document answers:

> "What can someone request?"

The next document answers:

> "Exactly how does each accepted request transform the Game State?"

---

# 79. Final Engineering Rule

**An action is an intent, never a result.**

The client says:

```text
PLAY_CARD(7H)
```

It does not say:

```text
I won the trick.
```

The client says:

```text
CALL_TRUMP(HEARTS)
```

It does not say:

```text
The contract is now Hearts.
```

The client says:

```text
DOUBLE
```

It does not say:

```text
Multiplier = 2.
```

The authoritative Game Engine derives all consequences.

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

Final approval should occur only after the complete foundation specification has been reviewed together.
