# Foundation Dependencies — صكّة بلوت

This document maps the dependency relationships between all Foundation documents.

---

## Primary Dependency Chain (Reading Order)

```
Product Vision (01)
  ↓
Product Scope (02)
  ↓
Game Rules (03)
  ↓
Card System (04)
  ↓
Dealing (05)
  ↓
Bidding (06)
  ↓
Playing (07)
  ↓
Scoring (08)
  ↓
Game State (09)
  ↓
Actions (10)
  ↓
State Transitions (11)
```

Each document depends on all documents above it in this chain. The chain represents the minimum required reading order for understanding any given document.

---

## Cross-Dependencies

Beyond the primary chain, the following important cross-dependencies exist:

```
Game Rules (03)
  ├── Card System (04)      [card ranking and point values]
  ├── Dealing (05)          [dealing contract]
  ├── Bidding (06)          [bidding overview]
  ├── Playing (07)          [trick resolution overview]
  └── Scoring (08)          [scoring model]

Game State (09)
  ├── Dealing (05)          [dealing state fields]
  ├── Bidding (06)          [bidding state fields]
  ├── Playing (07)          [trick/turn state fields]
  └── Scoring (08)          [score state fields]

Actions (10)
  ├── Game State (09)       [stateVersion, phase guards]
  ├── Bidding (06)          [PASS, CALL_SUN, CALL_TRUMP, CALL_ASHKAL]
  ├── Playing (07)          [PLAY_CARD, legal card rules]
  └── Scoring (08)          [DECLARE_PROJECT, DOUBLE, TRIPLE, QUADRUPLE, COFFEE]

State Transitions (11)
  ├── Game State (09)       [state schema to mutate]
  ├── Actions (10)          [triggers for transitions]
  ├── Dealing (05)          [DEALING phase transitions]
  ├── Bidding (06)          [BIDDING phase transitions]
  ├── Playing (07)          [TRICK_PLAY phase transitions]
  └── Scoring (08)          [ROUND_SCORING phase transitions]
```

---

## Dependency Matrix

| Document | Depends On |
|---|---|
| 01 Product Vision | — (root) |
| 02 Product Scope | 01 |
| 03 Game Rules | 01, 02 |
| 04 Card System | 03 |
| 05 Dealing | 03, 04 |
| 06 Bidding | 03, 04, 05 |
| 07 Playing | 03, 04, 05, 06 |
| 08 Scoring | 03, 04, 05, 06, 07 |
| 09 Game State | 03, 04, 05, 06, 07, 08 |
| 10 Actions | 03, 04, 05, 06, 07, 08, 09 |
| 11 State Transitions | 03, 04, 05, 06, 07, 08, 09, 10 |

---

## Implementation Dependency Graph

For engineering purposes, the implementation dependency graph is:

```
game-rules package
  ├── card-model
  │     └── (no upstream)
  ├── deck
  │     └── card-model
  ├── shuffle
  │     └── deck
  ├── dealing-engine
  │     └── shuffle, deck, card-model
  ├── bidding-engine
  │     └── dealing-engine
  ├── playing-engine
  │     └── bidding-engine, card-model
  ├── scoring-engine
  │     └── playing-engine, card-model
  └── state-machine
        └── dealing-engine, bidding-engine, playing-engine, scoring-engine

game-server
  └── game-rules package, WebSocket transport, PostgreSQL, Redis

game-client (mobile)
  └── WebSocket transport, React Native, Skia, Reanimated
```

---

## Key Contractual Boundaries

### Client ↔ Server Boundary

```
Mobile Client
  → sends Actions (defined in doc 10)
  → receives player-specific GameState projections (defined in doc 09)
  ← never receives other players' hidden cards
  ← never assigns score, selects turn, or forces state
```

### Server ↔ Game Engine Boundary

```
Game Server
  → validates Actions (authorization, stateVersion, idempotency)
  → calls Game Engine with validated Action + current GameState
  ← receives next GameState
  → persists delta / outbox event
  → broadcasts projection to each player
```

### Game Engine Boundary

```
Game Engine (pure domain logic)
  → imports: nothing outside its own package
  → does NOT import: React, React Native, Expo, Supabase, Redis, PostgreSQL, WebSocket
  → input: (GameState, ValidatedAction) → output: GameState
  → is fully deterministic and testable in isolation
```

---

## Rule Profile Dependency

All game subsystem documents (03–08, 11) contain `OPEN_DECISION` items that are **blocked on Rule Profile selection**.

```
Rule Profile Selection (OPEN_DECISION)
  ↓
  ├── Dealing sequence variant
  ├── Exposed card behavior
  ├── Ashkal eligibility
  ├── Second-round bidding rules
  ├── SERA (سرا) value calculation
  ├── Baloot timing and value
  ├── Doubling mechanics
  ├── Coffee and Kaboot conditions
  ├── Tie-handling rules
  └── Match-end target score
```

No game subsystem implementation may be frozen until the Rule Profile is selected and all dependent `OPEN_DECISION` items are resolved.

---

## Document Freeze Dependencies

Documents may only be frozen in this order:

```
01 Product Vision   → freeze first
02 Product Scope    → requires 01 frozen
03 Game Rules       → requires 01, 02 frozen + Rule Profile selected
04 Card System      → requires 03 frozen
05 Dealing          → requires 03, 04 frozen + dealing variant resolved
06 Bidding          → requires 03, 04, 05 frozen + bidding variant resolved
07 Playing          → requires 03, 04, 05, 06 frozen
08 Scoring          → requires 03, 04, 05, 06, 07 frozen + scoring variant resolved
09 Game State       → requires all game docs (03–08) frozen
10 Actions          → requires 09 frozen
11 State Transitions→ requires 09, 10 frozen
```
