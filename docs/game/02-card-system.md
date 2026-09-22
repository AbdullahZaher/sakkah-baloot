# صكّة بلوت — Card System Specification

**Document:** `docs/game/02-card-system.md`  
**Status:** Draft for Review — NOT FROZEN  
**Phase:** Foundation / Game Domain  
**Depends on:** `01-game-rules.md`  
**Next dependent documents:** Dealing, Bidding, Playing, Scoring, Game State

---

## 1. Purpose

This document defines the canonical card system for صكّة بلوت.

It is the single domain specification for:

- card identity
- suits
- ranks
- deck composition
- card ordering
- trick-comparison rules
- point values
- serialization
- visibility
- validation
- asset mapping
- deterministic handling
- test requirements

The goal is to ensure that the mobile client, game server, bot, replay system, simulations, and future admin tools all use the same card model.

This document defines the **card model**, not the complete game flow. Bidding, dealing, project declaration, doubling, and scoring procedures are specified in their dedicated documents.

---

# 2. Core Engineering Principle

The card system MUST be deterministic, canonical, and independent from UI.

The core card domain MUST NOT import:

- React
- React Native
- Expo
- Skia
- Reanimated
- Supabase
- PostgreSQL clients
- Redis
- WebSocket libraries
- network libraries
- platform-specific APIs

The card system belongs inside the pure game-domain layer.

Recommended package:

```text
packages/
└── game-engine/
    └── src/
        └── cards/
            ├── card-types.ts
            ├── card-catalog.ts
            ├── deck.ts
            ├── card-ranking.ts
            ├── card-points.ts
            ├── card-visibility.ts
            └── card-validation.ts
```

---

# 3. Canonical Deck

صكّة بلوت uses a 32-card deck.

There are four suits and eight ranks per suit.

## 3.1 Suits

The canonical suit identifiers are:

```text
CLUBS
DIAMONDS
HEARTS
SPADES
```

Recommended TypeScript representation:

```ts
type Suit =
  | "CLUBS"
  | "DIAMONDS"
  | "HEARTS"
  | "SPADES";
```

The internal identifiers MUST remain language-neutral.

Arabic labels belong to the localization layer.

Suggested Arabic labels:

| ID | Arabic |
|---|---|
| CLUBS | ♣️ سباتي |
| DIAMONDS | ♦️ ديناري |
| HEARTS | ♥️ كبة |
| SPADES | ♠️ بستوني |

The exact displayed terminology may be adjusted during UX/localization review, but internal identifiers MUST NOT change because of localization.

---

# 4. Ranks

The deck contains:

```text
7
8
9
10
J
Q
K
A
```

Recommended representation:

```ts
type Rank =
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";
```

Ranks MUST NOT be represented internally using localized strings such as:

```text
ولد
بنت
شيخ
آص
```

Those are presentation labels only.

---

# 5. Card Identity

Every physical card has one canonical immutable identity.

Recommended canonical ID format:

```text
<SUIT>_<RANK>
```

Examples:

```text
CLUBS_7
CLUBS_8
CLUBS_9
CLUBS_10
CLUBS_J
CLUBS_Q
CLUBS_K
CLUBS_A

DIAMONDS_7
...
HEARTS_A
SPADES_A
```

Recommended type:

```ts
type CardId =
  | `${Suit}_${Rank}`;
```

If TypeScript template-literal typing becomes impractical for runtime validation, use:

```ts
type CardId = string;
```

with a mandatory domain validator.

## 5.1 Identity Requirements

A card ID:

- MUST be unique inside the deck.
- MUST be stable across games.
- MUST be stable across replay files.
- MUST NOT depend on array position.
- MUST NOT change when a card moves between zones.
- MUST NOT contain player information.
- MUST NOT contain game/session IDs.

A card remains the same card whether it is:

```text
in the deck
in a player's hand
on the table
in the discard/trick pile
revealed
hidden
```

---

# 6. Canonical Card Catalog

The engine MUST have exactly 32 canonical cards.

Recommended catalog generation:

```ts
const SUITS = [
  "CLUBS",
  "DIAMONDS",
  "HEARTS",
  "SPADES",
] as const;

const RANKS = [
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;
```

The catalog is the authoritative source for card existence.

Do not create ad-hoc cards throughout the application.

Bad:

```ts
{ suit: "HEARTS", rank: "A" }
```

in dozens of unrelated modules.

Preferred:

```ts
CardCatalog.get("HEARTS_A")
```

or an equivalent immutable lookup.

---

# 7. Card Object

The minimal domain representation should be:

```ts
interface Card {
  readonly id: CardId;
  readonly suit: Suit;
  readonly rank: Rank;
}
```

The following should NOT be stored as mutable properties on the base card:

```text
isTrump
isPlayed
owner
selected
faceUp
position
animationState
```

Those are contextual state and belong elsewhere.

For example:

```ts
interface TrickCard {
  readonly cardId: CardId;
  readonly playerId: PlayerId;
}
```

rather than mutating the card itself.

---

# 8. Contextual Card Information

Card strength is contextual.

The same card can have different ordering depending on the contract.

For example:

```text
J♠
```

has ordinary/non-trump ordering when the contract is another suit or Sun.

When Spades is Trump, it uses Trump ordering.

Therefore:

```ts
getCardStrength(card, context)
```

is preferred over:

```ts
card.strength
```

The card itself does not permanently possess one gameplay strength.

---

# 9. Contract Context

The ranking system must accept explicit contract context.

Conceptually:

```ts
type Contract =
  | { type: "SUN" }
  | { type: "TRUMP"; suit: Suit }
  | { type: "ASHKAL"; suit?: Suit };
```

The exact Ashkal representation remains an open rule decision and MUST be finalized in the Bidding/Rules documents before implementation.

Card-ranking code MUST NOT silently guess the meaning of unresolved contract variants.

---

# 10. Sun / Non-Trump Ranking

For Sun, and for a suit that is not Trump, ranking from strongest to weakest is:

```text
A
10
K
Q
J
9
8
7
```

Numeric strength may be represented internally as:

```text
A  = 8
10 = 7
K  = 6
Q  = 5
J  = 4
9  = 3
8  = 2
7  = 1
```

The exact numeric values are implementation details.

The engine MUST compare semantic ordering, not rely on numeric values being meaningful outside the ranking function.

---

# 11. Trump Ranking

When a suit is Trump, ranking from strongest to weakest is:

```text
J
9
A
10
K
Q
8
7
```

Example for Hearts as Trump:

```text
J♥
9♥
A♥
10♥
K♥
Q♥
8♥
7♥
```

A Trump card must outrank every non-Trump card when the trick rules determine that Trump applies.

---

# 12. Ranking Function

The core API should conceptually expose:

```ts
getCardRankValue(
  card: Card,
  contract: Contract
): number;
```

and:

```ts
compareCards(
  a: Card,
  b: Card,
  context: TrickComparisonContext
): -1 | 0 | 1;
```

However, `compareCards` MUST NOT be called without trick context.

A card's ability to win depends on:

- contract
- trump suit
- led suit
- current trick state

Recommended:

```ts
interface TrickComparisonContext {
  readonly contract: Contract;
  readonly ledSuit: Suit;
}
```

The actual trick winner algorithm belongs to the Playing document, but the card system must provide the primitives required by it.

---

# 13. Following Suit

Card identity must preserve the original suit.

For example:

```text
A♥
```

always has:

```text
suit = HEARTS
rank = A
```

Even when Hearts is Trump.

Do NOT mutate:

```text
card.suit
```

into something like:

```text
TRUMP
```

Trump is a game context, not a card suit.

---

# 14. Raw Card Points — Draft

The following point values are the baseline currently documented for the project and MUST be reconciled with the final adopted Rule Profile before Rule Freeze.

## 14.1 Sun / Non-Trump

| Rank | Points |
|---|---:|
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| J | 2 |
| 9 | 0 |
| 8 | 0 |
| 7 | 0 |

## 14.2 Trump

| Rank | Points |
|---|---:|
| J | 20 |
| 9 | 14 |
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| 8 | 0 |
| 7 | 0 |

These values describe card-level raw points.

They do NOT by themselves define:

- final round score
- qaid conversion
- purchaser success
- project points
- doubling
- kaboot
- final match result

Those belong to the scoring system.

---

# 15. Card Point API

Recommended:

```ts
getCardPoints(
  card: Card,
  contract: Contract
): number;
```

The function must be deterministic.

Examples:

```text
A♣ under Sun       → 11
J♥ under Sun       → 2
J♥ when Hearts Trump → 20
9♥ when Hearts Trump → 14
9♥ under Sun       → 0
```

Tests MUST cover all 32 cards under both Sun and each possible Trump suit.

---

# 16. Deck Invariants

A valid deck MUST satisfy all of the following:

1. Exactly 32 cards.
2. Exactly four suits.
3. Exactly eight ranks per suit.
4. Every `(suit, rank)` combination exists exactly once.
5. No duplicate card IDs.
6. No unknown card IDs.
7. No missing cards.
8. Card identity is immutable.
9. Card catalog order is deterministic.

Recommended validation:

```ts
validateDeck(deck): DeckValidationResult
```

Validation should identify:

```text
DUPLICATE_CARD
UNKNOWN_CARD
MISSING_CARD
INVALID_CARD_COUNT
INVALID_SUIT
INVALID_RANK
```

---

# 17. Deck Creation

The deck should be generated from the canonical catalog.

Conceptually:

```ts
createStandardDeck(): Card[]
```

Requirements:

- returns exactly 32 cards
- does not mutate the catalog
- returns a fresh array
- preserves canonical card identities
- does not shuffle automatically

Creation and shuffling are separate operations.

This separation is important for deterministic tests and simulations.

---

# 18. Shuffling

Shuffling MUST be injected.

Do not directly call:

```ts
Math.random()
```

inside the game engine.

Preferred abstraction:

```ts
interface RandomSource {
  next(): number;
}
```

Then:

```ts
shuffleDeck(
  deck: readonly Card[],
  random: RandomSource
): Card[];
```

For production multiplayer games, the server controls the randomness used for authoritative dealing.

For testing and replay:

```ts
SeededRandom(seed)
```

can reproduce the same sequence.

---

# 19. Shuffle Requirements

A production shuffle should use a Fisher-Yates style algorithm.

Requirements:

- unbiased implementation
- deterministic when supplied with deterministic RNG
- no mutation of the original input
- reproducible from seed where supported

The exact cryptographic/randomness strategy is a server/security concern and should be documented separately.

The client MUST NOT be the authority for shuffle results.

---

# 20. Card Zones

The engine should model card location as state rather than mutating cards.

Typical zones:

```text
DECK
PLAYER_HAND
TABLE
COMPLETED_TRICK
REVEALED_CARD
DISCARDED / RESOLVED
```

A card MUST exist in exactly one logical zone at any point in a valid game state.

---

# 21. Card Ownership

Ownership is contextual.

The card object should remain immutable.

Instead:

```ts
interface CardLocation {
  readonly cardId: CardId;
  readonly zone:
    | "DECK"
    | "HAND"
    | "TABLE"
    | "COMPLETED_TRICK";
  readonly playerId?: PlayerId;
}
```

The actual implementation can use a more efficient state representation, but the invariant remains:

> A card must never simultaneously belong to two players or two zones.

---

# 22. Hidden Information

Card visibility is a security boundary.

The authoritative server knows:

- all 32 cards
- every player's complete hand
- deck state
- unrevealed cards
- future cards

A player client should receive only information that player is allowed to know.

For example, Player A should NOT receive:

```text
Player B's hidden hand
Player C's hidden hand
Player D's hidden hand
```

The server must construct a player-specific view.

---

# 23. Player Card View

Recommended concept:

```ts
interface VisibleCard {
  readonly id: CardId;
  readonly suit: Suit;
  readonly rank: Rank;
}
```

For hidden cards:

```ts
interface HiddenCard {
  readonly id?: never;
  readonly hidden: true;
}
```

However, exposing the actual hidden card ID can leak information through the protocol.

Therefore, the preferred network representation for an opponent's hidden card is simply a count or opaque slot unless the UI requires otherwise.

---

# 24. Network Security Rule

Never send hidden card identities to clients and rely on the UI to hide them.

Bad:

```json
{
  "opponentHand": [
    { "id": "HEARTS_A", "hidden": true }
  ]
}
```

Good:

```json
{
  "opponentHandCount": 5
}
```

The server should enforce information boundaries.

This applies to:

- normal gameplay
- reconnect
- debug endpoints
- analytics payloads
- logs
- crash reports
- replay sharing
- spectator systems

---

# 25. Replay Representation

Replays may contain the complete card state because replay authorization is separate from live player visibility.

A replay record should preserve:

- card IDs
- shuffle seed or authoritative shuffle evidence where appropriate
- deal sequence
- actions
- contract
- trick results
- projects
- scoring
- timestamps/version metadata

The replay system MUST NOT depend on UI card indexes.

---

# 26. Serialization

Canonical serialized form:

```text
CLUBS_A
DIAMONDS_10
HEARTS_J
SPADES_9
```

Recommended wire representation:

```json
{
  "id": "HEARTS_J"
}
```

If bandwidth optimization later requires integer IDs, that should be a protocol optimization, not a change to the domain identity.

Example internal mapping:

```text
0  = CLUBS_7
1  = CLUBS_8
...
31 = SPADES_A
```

The mapping MUST be deterministic and versioned.

Never derive the mapping independently in different applications.

---

# 27. Canonical Ordering

The catalog should define one stable canonical ordering for:

- tests
- serialization
- deterministic snapshots
- debugging
- replay
- fixtures

Recommended order:

```text
CLUBS
  7 8 9 10 J Q K A

DIAMONDS
  7 8 9 10 J Q K A

HEARTS
  7 8 9 10 J Q K A

SPADES
  7 8 9 10 J Q K A
```

This is NOT gameplay strength ordering.

Never use catalog order to determine a trick winner.

---

# 28. UI Asset Mapping

Card assets must be separate from domain card definitions.

Recommended:

```ts
interface CardAsset {
  readonly cardId: CardId;
  readonly faceAssetKey: string;
  readonly accessibilityLabelKey: string;
}
```

Example:

```text
HEARTS_A
→ card_hearts_a
```

The game engine must never know:

```text
.png
.svg
.skia
```

or asset paths.

The presentation layer maps card IDs to visual assets.

---

# 29. Localization

Card names must be localized outside the engine.

Recommended translation keys:

```text
cards.suits.clubs
cards.suits.diamonds
cards.suits.hearts
cards.suits.spades

cards.ranks.7
cards.ranks.8
cards.ranks.9
cards.ranks.10
cards.ranks.j
cards.ranks.q
cards.ranks.k
cards.ranks.a
```

Accessibility labels should be generated from these keys.

Example:

```text
"cards.accessibility.heart_ace"
```

The exact Arabic wording is a UX/localization decision and must not be embedded in game logic.

---

# 30. Card Equality

Card equality should be identity-based:

```ts
sameCard(a, b)
```

returns true only when their canonical IDs match.

Do not compare object references.

Bad:

```ts
a === b
```

Correct:

```ts
a.id === b.id
```

This matters for:

- replay reconstruction
- network deserialization
- state snapshots
- tests
- persistence
- reconnect

---

# 31. Card Validation

Every external card ID entering the engine MUST be validated.

Potential sources:

- client actions
- network messages
- replay files
- admin tools
- bot actions
- test fixtures

Never trust:

```ts
clientPayload.cardId
```

without validation.

Recommended:

```ts
parseCardId(input): Card | CardParseError
```

Invalid examples:

```text
HEART_A
HEARTS_11
JOKER
HEARTS
null
""
```

---

# 32. Illegal Card Actions

The card system should provide primitives for validating card existence, while the Game Engine validates game legality.

Examples:

Card system can answer:

```text
Does HEARTS_A exist?
```

Game Engine must answer:

```text
Is HEARTS_A currently in this player's hand?
```

Playing system must answer:

```text
Is HEARTS_A legal to play given the led suit and rules?
```

Do not put turn legality into the static card catalog.

---

# 33. Card Comparison Contract

The comparison API should distinguish:

1. static rank
2. contract-aware rank
3. trick-aware winner

For example:

```ts
getStaticRank(card)
getContractRank(card, contract)
compareForTrick(a, b, context)
```

This separation prevents accidental misuse.

---

# 34. Trick Winner Example

Assume:

```text
Contract: HEARTS Trump
Led Suit: CLUBS
```

Played:

```text
Player A: A♣
Player B: 7♣
Player C: 9♥
Player D: K♣
```

The winner is:

```text
9♥
```

because Hearts is Trump.

The card system should expose enough information for the Playing Engine to reach that result deterministically.

---

# 35. Non-Trump Trick Example

Assume:

```text
Contract: HEARTS Trump
Led Suit: CLUBS
```

Played:

```text
A♣
K♣
10♣
Q♦
```

The winning card is:

```text
A♣
```

because no Trump was played and the strongest card of the led suit wins.

---

# 36. Important Distinction: Suit vs Trump

These concepts MUST remain separate:

```text
Suit
Trump Suit
Led Suit
Played Suit
```

Example:

```text
Card suit      = HEARTS
Trump suit     = HEARTS
Led suit       = CLUBS
```

The card remains a Hearts card.

---

# 37. Project Cards

Projects such as:

```text
SERA
FIFTY
HUNDRED
FOUR_HUNDRED
BALOOT
```

may depend on card combinations.

Project detection MUST consume canonical card identities.

It should not depend on:

- UI positions
- card asset names
- localized labels
- player hand ordering

Recommended future API:

```ts
detectProjects(hand, contract): ProjectCandidate[]
```

The detailed project specification belongs in the Projects/Scoring documentation.

---

# 38. Baloot Project

Baloot is a special project associated with the Trump contract and a specific King/Queen combination.

Its exact:

- declaration timing
- eligibility
- scoring
- reveal requirements
- interaction with other projects

MUST follow the final Rule Profile.

The card system only provides the card identities required to detect it.

---

# 39. No Magic Numbers

Avoid scattered logic such as:

```ts
if (rank === "J") return 20;
```

throughout the codebase.

Prefer centralized definitions:

```ts
TRUMP_CARD_POINTS.J
```

and:

```ts
SUN_CARD_POINTS.J
```

Likewise for ordering:

```ts
SUN_RANK_ORDER
TRUMP_RANK_ORDER
```

This makes Rule Profile changes auditable.

---

# 40. Rule Profile Compatibility

Card constants may eventually become versioned.

Recommended conceptual structure:

```ts
interface CardRules {
  readonly sunRankOrder: readonly Rank[];
  readonly trumpRankOrder: readonly Rank[];
  readonly sunPoints: Readonly<Record<Rank, number>>;
  readonly trumpPoints: Readonly<Record<Rank, number>>;
}
```

Then:

```ts
getCardRules(ruleProfileId)
```

can supply the appropriate configuration.

The default implementation can have one frozen profile once the rules are approved.

---

# 41. What Must Not Be Configurable

The following are identity-level facts and should not vary by game rule profile:

```text
4 suits
8 ranks
32-card deck
card IDs
card identity
```

Rule profiles may affect:

```text
ranking, where explicitly allowed
points, where explicitly allowed
projects
scoring
bidding
doubling
special variants
```

Any variation must be explicit and versioned.

---

# 42. Testing Strategy

The card system requires unit, property-based, and integration tests.

## 42.1 Catalog Tests

Verify:

- exactly 32 cards
- 4 suits
- 8 ranks
- no duplicates
- all expected IDs exist

## 42.2 Ranking Tests

Verify:

- Sun ordering
- Trump ordering
- every Trump suit
- every rank
- comparison symmetry
- comparison transitivity where applicable

## 42.3 Point Tests

Verify every card under:

- Sun
- Clubs Trump
- Diamonds Trump
- Hearts Trump
- Spades Trump

## 42.4 Serialization Tests

Verify:

```text
Card → ID → Card
```

is lossless.

## 42.5 Validation Tests

Verify malformed IDs are rejected.

## 42.6 Determinism Tests

Given the same seed:

```text
createDeck()
shuffle(seed)
```

must produce the same sequence.

---

# 43. Property-Based Test Ideas

Useful invariants include:

### Deck uniqueness

For every generated standard deck:

```text
size = 32
unique(card.id) = 32
```

### Round-trip identity

For every card:

```text
parse(serialize(card)) == card
```

### Trump ordering

For every suit:

```text
J > 9 > A > 10 > K > Q > 8 > 7
```

### Sun ordering

```text
A > 10 > K > Q > J > 9 > 8 > 7
```

### Point stability

Calling point calculation repeatedly with identical inputs produces identical results.

---

# 44. Performance

Card operations are tiny and should not be a performance concern.

Nevertheless:

- avoid unnecessary allocations in hot trick-resolution loops
- prefer immutable static catalogs
- use lookup tables for rank strength
- avoid localization work inside the engine
- avoid asset resolution inside the engine
- avoid network calls entirely

Card comparison should be effectively O(1).

---

# 45. Debugging Representation

For logs and debugging, cards should have a concise representation:

```text
A♠
10♥
J♦
9♣
```

However, this display form is NOT canonical identity.

Canonical logs should retain:

```text
SPADES_A
HEARTS_10
DIAMONDS_J
CLUBS_9
```

This avoids ambiguity.

---

# 46. Security and Anti-Cheat

The client is never trusted to report:

```text
card ownership
card validity
deck contents
shuffle result
opponent cards
legal move
```

The authoritative server owns all of these.

A client request should be an intent:

```json
{
  "type": "PLAY_CARD",
  "cardId": "HEARTS_A"
}
```

The server validates:

1. player identity
2. current game
3. current turn
4. card ownership
5. card legality
6. rule state
7. action sequence/version

Only then is the action committed.

---

# 47. Reconnect Requirements

On reconnect, the server must reconstruct the player's current authorized card view from authoritative state.

The client must NOT restore hidden card state from stale local memory and assume it is correct.

The server sends a fresh authoritative snapshot.

This ensures:

- reconnect correctness
- anti-cheat protection
- deterministic recovery
- compatibility with server restarts/failover

---

# 48. Snapshot Requirements

A game snapshot may include:

```text
deck remaining count
visible cards
player's own hand
played cards
completed tricks
contract
turn
round state
```

It must not include unauthorized hidden cards.

Snapshots must preserve canonical card IDs.

---

# 49. Versioning

If the card protocol ever changes, version it explicitly.

Examples:

```text
CARD_PROTOCOL_V1
CARD_PROTOCOL_V2
```

Do not silently change:

```text
card IDs
serialization
numeric mappings
```

because replays and stored games may depend on them.

---

# 50. Acceptance Criteria

This document can be considered ready for implementation when:

- [ ] 32-card catalog is frozen.
- [ ] Suit identifiers are frozen.
- [ ] Rank identifiers are frozen.
- [ ] Card ID format is frozen.
- [ ] Sun ranking is frozen.
- [ ] Trump ranking is frozen.
- [ ] Card-level points are reconciled with the final Rule Profile.
- [ ] Card visibility rules are accepted.
- [ ] Serialization format is accepted.
- [ ] RNG/shuffle boundary is accepted.
- [ ] Asset mapping boundary is accepted.
- [ ] Localization boundary is accepted.
- [ ] Unit-test matrix is defined.
- [ ] Property-test invariants are defined.
- [ ] No unresolved card-level rule conflicts remain.

---

# 51. Implementation Checklist

When implementation begins:

### Domain

- [ ] `Suit`
- [ ] `Rank`
- [ ] `CardId`
- [ ] `Card`
- [ ] `Contract`
- [ ] `CardCatalog`
- [ ] `createStandardDeck`
- [ ] `validateDeck`
- [ ] `parseCardId`
- [ ] `getCardPoints`
- [ ] `getCardRankValue`
- [ ] `compareForTrick`

### Security

- [ ] authoritative server deck
- [ ] server-side ownership validation
- [ ] hidden-card filtering
- [ ] reconnect snapshot filtering

### Tests

- [ ] catalog tests
- [ ] ranking tests
- [ ] point tests
- [ ] serialization tests
- [ ] validation tests
- [ ] seeded shuffle tests
- [ ] property-based tests

### Client

- [ ] card asset mapping
- [ ] Arabic localization
- [ ] accessibility labels
- [ ] animation-independent card identity

---

# 52. Frozen Card-System Decisions

The card-system decisions that were previously listed as open are closed by Rule Freeze v1. The implementation must use the frozen Saudi Rule Profile and the canonical game specifications; it must not invent card-level variants.

Any future change requires a new Rule Freeze revision.

---

# 53. Relationship to Other Documents

This document provides primitives for:

```text
03-dealing.md
04-bidding.md
05-playing.md
06-scoring.md
07-game-state.md
08-actions.md
09-state-transitions.md
```

Dependency direction:

```text
Card System
    ↓
Dealing
    ↓
Bidding
    ↓
Playing
    ↓
Scoring
    ↓
Game State / Actions / Transitions
```

No higher-level document should redefine card identity.

---

# 54. Final Engineering Rule

There must be exactly one authoritative definition of what a card is.

The mobile UI, server, bot, replay engine, tests, simulations, and admin tools must all consume the same canonical card model.

**One card model.  
One identity system.  
One ranking implementation.  
One point-value source.  
Server-authoritative visibility.  
Deterministic behavior.**

---

## Document Status

**Current status:** Draft for Review — NOT FROZEN

This document should be reviewed together with:

- Product Vision
- Product Scope
- Game Rules
- Dealing
- Bidding
- Playing
- Scoring

Final approval should occur only after the complete foundation specification has been reviewed.
