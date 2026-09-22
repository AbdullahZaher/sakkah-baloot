# صكّة بلوت — Dealing System Specification

**Document:** `docs/game/03-dealing.md`  
**Status:** FROZEN — IMPLEMENTATION AUTHORIZED  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`, `02-card-system.md`  
**Next dependent documents:** Bidding, Playing, Game State, Actions, State Transitions

---

# 1. Purpose

This document defines the authoritative dealing system for صكّة بلوت.

It specifies:

- dealer state
- player order
- shuffle ownership
- deterministic dealing
- initial 5-card deal
- exposed card
- bidding hand size
- completion of hands
- card distribution invariants
- redeal boundaries
- timeout/recovery behavior
- reconnect behavior
- replay representation
- testing requirements
- anti-cheat requirements

The goal is to ensure every game can reconstruct exactly how the 32 cards moved from the authoritative deck into player hands and the exposed card.

---

# 2. Core Principle

**The server is the sole authority for dealing.**

The mobile client MUST NOT:

- shuffle the deck
- decide which player receives a card
- select the exposed card
- calculate the authoritative deal
- regenerate the deck after reconnect
- infer hidden cards from client-side state

The client only receives the information it is authorized to see.

---

# 3. Domain Independence

The dealing implementation belongs in the pure game-domain layer.

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
- UI code
- platform APIs

Recommended location:

```text
packages/
└── game-engine/
    └── src/
        └── dealing/
            ├── deal-types.ts
            ├── deal-engine.ts
            ├── dealer-rotation.ts
            ├── deal-validation.ts
            └── deal-replay.ts
```

---

# 4. Players and Seating

A standard game has exactly four seats.

Canonical seat identifiers:

```text
NORTH
EAST
SOUTH
WEST
```

Partners sit opposite each other:

```text
NORTH ↔ SOUTH
EAST  ↔ WEST
```

Recommended:

```ts
type Seat =
  | "NORTH"
  | "EAST"
  | "SOUTH"
  | "WEST";
```

The engine should not assume that a player's database ID equals their seat.

A player has an identity, while a seat is a position in the current game.

---

# 5. Dealing Direction

The dealing sequence MUST be represented explicitly.

The baseline direction is:

```text
Dealer → next seat according to the canonical counter-clockwise direction → next → next
```

For the four canonical seats:

```text
NORTH → EAST → SOUTH → WEST → NORTH
```

The first dealer is deterministically derived from the persisted match seed and persisted as authoritative. Dealer rotation follows the frozen counter-clockwise profile.

Do not hard-code a culturally assumed convention if the selected ruleset specifies another one.

---

# 6. Dealer State

The match must maintain an authoritative dealer.

Recommended:

```ts
interface DealerState {
  readonly dealerSeat: Seat;
  readonly dealerPlayerId: PlayerId;
}
```

The seat is the game-domain fact.

The player ID is the current occupant of that seat.

---

# 7. Dealer Rotation

After a completed round, the dealer rotates according to the selected Rule Profile.

Conceptually:

```ts
getNextDealer(currentDealer, ruleProfile)
```

The function MUST be deterministic.

The engine should never determine dealer rotation from:

- network arrival order
- client timestamps
- player reconnect order
- database insertion order

---

# 8. First Dealer

The first dealer of a new match is deterministically derived from the persisted match seed. The derived seat is persisted and reused by reconnect/replay.

Possible mechanisms may include:

- random seat selection
- explicit host/dealer
- previous match carry-over
- another defined rule

Rule Freeze v1 closes the first-dealer mechanism.

It is frozen for production implementation by Rule Freeze v1.

---

# 9. Canonical Deck

The dealing system consumes the canonical 32-card deck defined by the Card System.

It MUST use:

```ts
createStandardDeck()
```

or the equivalent authoritative constructor.

The dealing engine must never create its own alternative card catalog.

---

# 10. Shuffle Ownership

The authoritative game server creates the shuffled deck.

Conceptually:

```ts
const deck = createStandardDeck();
const shuffledDeck = shuffleDeck(deck, randomSource);
```

The shuffle occurs once for the round unless the Rule Profile explicitly requires a full redeal.

The client does not participate in authoritative randomness.

---

# 11. Randomness

Randomness must be injectable.

Recommended:

```ts
interface RandomSource {
  next(): number;
}
```

For production:

```text
AuthoritativeServerRandom
```

For deterministic tests:

```text
SeededRandom
```

The deal engine must not call:

```ts
Math.random()
```

directly.

---

# 12. Deal Transcript

For replayability, the engine should be able to produce a deterministic deal transcript.

Recommended conceptual structure:

```ts
interface DealTranscript {
  readonly ruleProfileId: string;
  readonly dealerSeat: Seat;
  readonly initialDeckOrder: readonly CardId[];
  readonly exposedCardId?: CardId;
  readonly initialHands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly completionHands?: Readonly<Record<Seat, readonly CardId[]>>;
}
```

The production implementation may choose a more compact representation.

The key requirement is that the complete authoritative deal can be reconstructed.

---

# 13. Initial Deal

The frozen Rule Profile uses:

```text
3 cards per player
+
2 cards per player
=
5 cards per player
```

Therefore:

```text
4 × 5 = 20 cards
```

are initially distributed to players.

Then one card is exposed for the bidding process according to the Baloot rules.

The remaining cards stay in the authoritative deck.

The frozen dealing sequence is: 3 cards + 2 cards to each player, then one exposed card; after purchase, the buyer receives the exposed card plus 2 hidden cards and every other player receives 3 hidden cards. Ashkal gives the exposed card to the eligible partner, while the caller receives 3 hidden cards.

---

# 14. Initial Hand Invariant

After the initial deal:

```text
NORTH = 5
EAST  = 5
SOUTH = 5
WEST  = 5
```

Therefore:

```text
Total player-held cards = 20
```

No player may have:

```text
< 5
> 5
```

cards at the initial bidding state.

---

# 15. Exposed Card

The exposed card is a special public card used by the bidding system.

The dealing engine must distinguish:

```text
EXPOSED_CARD
```

from:

```text
PLAYER_HAND
DECK
```

The exposed card is visible to all players once the rules say it is revealed.

It must not be treated as belonging to the dealer or any player.

---

# 16. Exposed Card Identity

The exposed card remains a normal canonical card.

For example:

```text
HEARTS_9
```

does not become:

```text
EXPOSED_HEARTS_9
```

Its identity remains:

```text
HEARTS_9
```

The zone/context changes, not the card identity.

---

# 17. Remaining Deck

After:

```text
20 player cards
+
1 exposed card
```

the baseline remaining deck contains:

```text
11 cards
```

This is the authoritative hidden remainder before the completion deal.

The server must keep these cards hidden from clients.

---

# 18. Completion Deal

Once the bidding/contract-selection rules determine that the round proceeds to completion, the remaining cards are distributed so every player reaches:

```text
8 cards
```

Each player therefore receives:

```text
8 - 5 = 3 additional cards
```

Total:

```text
4 × 3 = 12 cards
```

This creates an important rule-design point:

The exact position/timing of the exposed card and the initial/completion distribution must be specified consistently so the full 32-card accounting closes correctly.

The canonical sequence is closed by Rule Freeze v1 and the exposed-card amendment/Ashkal protocols.

**Do not implement the arithmetic as an independent rule.**

The finalized dealing sequence must satisfy:

```text
32 unique cards
=
all four final 8-card hands
```

with any exposed/public card and temporary deck state accounted for at the correct phase.

---

# 19. Critical Accounting Invariant

At every state:

```text
number of cards in all logical zones = 32
```

Logical zones may include:

```text
DECK
PLAYER_HANDS
EXPOSED_CARD
TABLE
COMPLETED_TRICKS
```

A card must never disappear.

A card must never exist twice.

---

# 20. Card Conservation

The dealing engine MUST enforce:

```text
initial card count = 32
final card count = 32
unique card IDs = 32
```

For any valid deal state:

```text
deck
+ hands
+ exposed card
+ other active zones
= 32
```

This should be a hard invariant in tests.

---

# 21. Deal Phases

Recommended state model:

```text
DEAL_NOT_STARTED
        ↓
SHUFFLING
        ↓
INITIAL_DEAL
        ↓
EXPOSE_CARD
        ↓
BIDDING_READY
        ↓
COMPLETION_DEAL
        ↓
DEAL_COMPLETE
```

The exact integration with the global game lifecycle is defined by Game State and State Transition documents.

---

# 22. Atomicity

A deal phase must be committed atomically from the game engine's perspective.

Do not allow:

```text
Player A receives card
database write fails
Player B receives card
server crashes
```

to create an externally visible half-dealt authoritative state.

The server should:

1. construct the complete next state
2. validate invariants
3. persist/commit the authoritative transition
4. publish the resulting state/events

---

# 23. Persistence Strategy

The authoritative game server should persist enough information to recover the deal.

At minimum:

```text
gameId
roundId
ruleProfileId
dealerSeat
deal phase
authoritative card state
state version
```

The exact database schema belongs to the backend architecture document.

---

# 24. Action Ordering

Dealing is a server-side state transition, not a player action.

Therefore:

```text
DEAL_INITIAL
DEAL_EXPOSE
DEAL_COMPLETE
```

should be internal engine transitions/events rather than client-authoritative commands.

A client should never send:

```json
{
  "type": "DEAL_CARD"
}
```

and expect the server to obey.

---

# 25. Bidding Boundary

The dealing system ends at clearly defined hand states.

Before bidding:

```text
each player has the required initial cards
exposed card is in the correct public zone
remaining cards are authoritative and hidden
```

After bidding selects a contract:

```text
completion dealing occurs according to the finalized Rule Profile
```

Bidding logic itself belongs to:

```text
04-bidding.md
```

The dealing system must not decide who wins the bid.

---

# 26. Completion Deal Boundary

The completion deal should receive an explicit engine instruction such as:

```ts
completeDeal(state, contractDecision)
```

The exact contract object should come from the bidding engine.

The dealing engine must validate that:

- the contract exists
- the round is in the correct phase
- completion has not already happened
- cards are still in the expected zones

---

# 27. Duplicate Completion Protection

Calling completion twice must be rejected or produce a safe idempotent result.

Bad:

```text
completeDeal()
completeDeal()
→ player receives duplicate cards
```

Preferred:

```text
completeDeal()
→ DEAL_COMPLETE

completeDeal()
→ INVALID_STATE / ALREADY_COMPLETE
```

The authoritative action/state version should prevent duplicate execution.

---

# 28. Idempotency

If a network request causes the same logical transition to be retried, the server must not deal additional cards.

Recommended action metadata:

```ts
interface ActionEnvelope {
  readonly actionId: string;
  readonly gameId: string;
  readonly expectedStateVersion: number;
}
```

The server can use:

```text
actionId
+
gameId
+
stateVersion
```

to protect against duplicate transitions.

---

# 29. Reconnect

A player may disconnect during:

```text
SHUFFLING
INITIAL_DEAL
EXPOSE_CARD
BIDDING_READY
COMPLETION_DEAL
```

On reconnect:

1. authenticate player
2. restore game membership
3. load authoritative state
4. construct player-specific visible state
5. send current snapshot
6. resume normal game flow

The server must never re-deal because a player disconnected.

---

# 30. Reconnect During Animation

The UI may visually animate a deal while the server has already committed the resulting state.

Therefore:

```text
animation state != authoritative game state
```

If a player reconnects during a card animation, the client should simply render the authoritative snapshot.

It should not attempt to replay the missing animation as a gameplay operation.

---

# 31. Client Animation

The mobile client may animate:

```text
deck → player hand
deck → exposed position
```

for presentation.

Animations do not affect:

- card identity
- ownership
- deck order
- timing authority
- game state
- scoring

The game engine must never depend on an animation completing.

---

# 32. Hidden Deck

The remaining deck is sensitive information.

The client should normally receive:

```text
remainingCardCount
```

rather than:

```text
remainingCardIds
```

unless a specific authorized feature requires the information.

The server keeps the complete deck state.

---

# 33. Spectator Considerations

Future spectator mode may have different visibility rules.

The dealing system should therefore not assume:

```text
one universal view
```

Instead, visibility should be generated by a policy:

```ts
getVisibleGameState(state, viewerContext)
```

Possible viewers:

```text
PLAYER
SPECTATOR
ADMIN
REPLAY
```

Spectator/replay permissions are a future feature and must not weaken normal player privacy.

---

# 34. Admin/Debug Access

Administrative debugging may need full card state.

However:

- admin APIs must be authenticated
- access must be audited
- production logs must not casually expose hidden hands
- client-facing APIs must not inherit admin visibility

Do not solve debugging by leaking complete game state into every client.

---

# 35. Logging

Safe production logs can include:

```text
gameId
roundId
dealerSeat
dealPhase
stateVersion
remainingCardCount
```

Avoid logging complete hidden hands in normal production logs.

If full deal transcripts are required for dispute resolution, store them in a controlled replay/audit mechanism rather than ordinary application logs.

---

# 36. Dispute Resolution

The authoritative deal should be reconstructable after the game.

Useful evidence includes:

```text
ruleProfileId
gameId
roundId
dealer
shuffle evidence
deal transcript
action sequence
state versions
```

This supports:

- bug investigation
- anti-cheat review
- player support
- replay
- deterministic simulation

---

# 37. Shuffle Fairness

The production randomness design is a security-sensitive decision.

The final implementation should document:

- random source
- entropy source
- seed generation
- seed storage policy
- whether the seed is revealed
- whether post-game verification is supported
- how server compromise is handled

The client must never be allowed to choose the authoritative shuffle.

---

# 38. Deterministic Test Deal

Tests should support explicit predetermined deck sequences.

Example:

```ts
const deck = [
  "CLUBS_A",
  "CLUBS_K",
  ...
];
```

Then the dealing engine can verify exact outcomes.

This is superior to relying only on random tests.

---

# 39. Golden Test

Create golden test fixtures for at least:

```text
standard initial deal
known exposed card
known contract completion
known final hands
```

A golden fixture should specify:

```text
dealer
deck order
expected initial hands
expected exposed card
expected completion hands
```

The expected values must come from the finalized Rule Profile.

---

# 40. Property-Based Tests

Useful properties:

### Conservation

```text
all card IDs across zones = 32 unique IDs
```

### Hand size

Initial:

```text
every player = required initial hand size
```

Final:

```text
every player = 8
```

### No duplicates

```text
unique(allCards) = 32
```

### Determinism

Same:

```text
deck + seed + ruleProfile
```

must produce the same authoritative deal.

### Dealer rotation

Repeated rotation eventually visits every seat according to the rule profile.

---

# 41. Failure Injection

The dealing system should be tested under:

- persistence failure
- duplicate command
- reconnect
- server restart
- invalid state version
- malformed card ID
- duplicate card
- missing card
- invalid dealer
- invalid contract
- completion called twice

No failure should silently create an invalid deck.

---

# 42. Transaction Boundary

If the game server uses a database-backed state store, the deal transition should be committed using the same authoritative state transition mechanism used by other gameplay transitions.

Conceptually:

```text
load current state
      ↓
validate expected version
      ↓
calculate next state
      ↓
validate 32-card invariant
      ↓
persist next state atomically
      ↓
publish event
```

Do not publish:

```text
CARD_DEALT
```

before the authoritative state is safely committed if doing so could create a state/event mismatch.

---

# 43. Event Model

Possible internal events:

```text
ROUND_DEAL_STARTED
INITIAL_HANDS_DEALT
EXPOSED_CARD_REVEALED
COMPLETION_DEAL_STARTED
ROUND_DEAL_COMPLETED
```

These are examples, not final protocol names.

The exact event contract belongs in the Game Protocol document.

---

# 44. Deal State Object

Conceptually:

```ts
interface DealState {
  readonly phase: DealPhase;
  readonly dealerSeat: Seat;
  readonly hands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly deck: readonly CardId[];
  readonly exposedCardId?: CardId;
}
```

The final state representation may use a more compact normalized model.

The invariant remains more important than the exact storage shape.

---

# 45. Ordering Within a Hand

The engine should preserve a deterministic insertion order for cards as they are dealt.

However, the UI may sort a player's hand visually.

Therefore:

```text
domain hand order
```

and:

```text
UI display order
```

must be separate concepts.

The client may sort/group cards for usability without changing authoritative ownership.

---

# 46. Card Sorting

The UI may support:

```text
sort by suit
sort by rank
sort by gameplay relevance
```

These are presentation operations.

Never mutate the authoritative hand to satisfy a visual sorting preference.

---

# 47. Deal Timing

The server should not depend on real-time animation duration.

For example:

```text
Card 1 animation = 120 ms
Card 2 animation = 120 ms
```

is UI behavior only.

The authoritative deal can be committed immediately, while the client renders it progressively.

---

# 48. Timeout During Deal

If the game is server-driven, a player timeout should not interrupt the physical distribution of cards.

Deal transitions should complete automatically.

Timeouts become relevant to:

```text
bidding
playing
```

not to whether the server is allowed to distribute a card.

---

# 49. Server Restart

If the game server restarts during a deal:

1. load persisted authoritative game state
2. validate card conservation
3. determine current deal phase
4. resume or reconstruct the exact committed state
5. do not create a new random deal unless the stored state explicitly says the deal never committed

This is why atomic persistence is essential.

---

# 50. Never Re-Deal From UI State

A client may have:

```text
cached hand
cached deck animation
cached exposed card
```

These are not authoritative.

After reconnect or state mismatch:

```text
server snapshot wins
```

Always.

---

# 51. Frozen Dealing Decisions

The historical open dealing decisions are closed by Rule Freeze v1. Initial hand size, exposed-card timing, completion hand size, dealer convention, counter-clockwise direction, first-dealer derivation, cancellation/redeal behavior, visibility, and authoritative reconstruction are frozen implementation requirements.

---

# 52. Rule Freeze Gate

Rule Freeze v1 has passed. The checklist below is an implementation traceability checklist rather than a precondition to begin.

---

# 53. Acceptance Criteria

This document is ready for implementation when:

- [ ] All card movements are deterministic.
- [ ] The server owns dealing.
- [ ] Client cannot influence shuffle/deal.
- [ ] Card conservation is enforced.
- [ ] Duplicate cards are impossible.
- [ ] Hidden deck information is protected.
- [ ] Reconnect cannot cause re-deal.
- [ ] Duplicate transitions are rejected/idempotent.
- [ ] Atomic persistence boundary is defined.
- [ ] Golden tests exist.
- [ ] Property-based tests exist.
- [ ] Rule Profile decisions are frozen.

---

# 54. Relationship to Other Documents

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

The Dealing document defines how cards enter player hands.

It does not define:

- who wins the bid
- which card may be played
- project scoring
- final match scoring

Those belong to later documents.

---

# 55. Final Engineering Rule

**A deal is a deterministic authoritative state transition, not a visual animation.**

The client may animate the deal.

The server decides the deal.

The engine validates the deal.

The persistence layer preserves the deal.

The replay system reconstructs the deal.

The test suite proves the deal.

No UI behavior may become a hidden source of gameplay authority.

---

## Document Status

**Current status:** FROZEN — IMPLEMENTATION AUTHORIZED

Final approval should occur only after the complete foundation specification has been reviewed together.
