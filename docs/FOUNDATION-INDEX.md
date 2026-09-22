# Foundation Index — صكّة بلوت

This document provides the canonical reading order for all Foundation documents and describes the purpose, dependencies, definitions, and intentional gaps of each.

---

## Canonical Reading Order

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

---

## Document Summaries

---

### 01 — Product Vision

**Path:** `docs/product/01-product-vision.md`  
**Status:** Draft

**Purpose:**  
Establishes the high-level mission, player experience target, core values, competitive positioning, and design direction of صكّة بلوت. This is the northstar document that all product and engineering decisions should trace back to.

**Dependencies:**  
None. This is the root document.

**What it defines:**
- The product mission and player target
- Core experience principles (fair, social, server-authoritative)
- Platform selection (Expo / React Native)
- Technology direction (Node.js server, PostgreSQL, Supabase, Redis)
- Monetization philosophy (cosmetic-only, no pay-to-win)
- Social safety requirements (mute, block, report)
- Accessibility requirements (RTL, Arabic typography, reduced motion)
- Localization requirements (ar-SA primary, en secondary)
- Analytics principles
- Architecture constraints (Game Engine must be pure domain logic)
- Design character (Premium / Modern / Saudi / Calm / Social)
- Performance goals
- Reliability requirements
- Open decisions

**What it intentionally does NOT define:**
- Exact game rules or rule variants
- Feature-level implementation details
- Specific technical architecture decisions
- Exact monetization pricing

---

### 02 — Product Scope

**Path:** `docs/product/02-product-scope.md`  
**Status:** Draft

**Purpose:**  
Defines the Prototype / MVP / V1 / V2 feature boundaries, priority matrix (P0–P3), MVP milestones (M0–M6), feature dependency rules, scope freeze rules, and definition of MVP Done.

**Dependencies:**
- Product Vision (01)

**What it defines:**
- MVP feature list and P0/P1/P2/P3 priority assignments
- What is explicitly NOT in MVP
- Milestone sequence M0 through M6
- Feature dependency graph
- Change control process
- Release blockers
- Scope freeze rules
- Explicitly deferred decisions

**What it intentionally does NOT define:**
- Detailed game rules (see Game Rules)
- Exact matchmaking formula
- Exact rating formula
- Economy details
- Tournament format

---

### 03 — Game Rules

**Path:** `docs/game/01-game-rules.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
First executable-oriented game rules specification. Defines the overall game lifecycle, structural rules, and the principle that صكّة must adopt ONE coherent Rule Profile rather than mixing rules from multiple sources.

**Dependencies:**
- Product Vision (01)
- Product Scope (02)

**What it defines:**
- Players (4), Teams (2), Seating (team members across from each other)
- Deck: 32 cards (7–A in four suits)
- Card ranking in Sun vs Hokm
- Card point values overview
- Game lifecycle: Deal → Bid → Play → Score → Repeat
- Dealing contract overview
- Bidding overview (Sun / Hokm / Ashkal)
- Follow-suit principle
- Trick resolution overview
- Projects overview (سرا / خمسين / مية / أربعمية / بلوت)
- Doubling overview
- Timeout principles
- Reconnect principles
- Hidden information principles
- Determinism requirements
- State invariants
- Testing requirements
- Rule conflict policy
- Rule Freeze Gate

**What it intentionally does NOT define:**
- Exact dealing sequence variants (see Dealing)
- Exact bidding mechanics (see Bidding)
- Exact playing mechanics (see Playing)
- Exact scoring formulas (see Scoring)
- Game State schema (see Game State)
- Action protocol (see Actions)
- State transitions (see State Transitions)
- Which Rule Profile to adopt (OPEN_DECISION)

---

### 04 — Card System

**Path:** `docs/game/02-card-system.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Canonical 32-card model. Defines card identity, ranking, point values, visibility rules, serialization format, validation, deterministic shuffle boundary, asset mapping, and localization boundary.

**Dependencies:**
- Game Rules (03)

**What it defines:**
- The 32-card deck (suits: ♠ ♥ ♦ ♣ — ranks: 7 8 9 10 J Q K A)
- Card identity schema (suit + rank)
- Card ranking in Sun and Hokm contexts
- Card point values (raw)
- Card visibility model (server-authoritative hidden information)
- Card serialization format
- Deck validation rules
- Deterministic shuffle requirements
- Asset/localization mapping boundary
- Testing requirements for the card model
- SERA (سرا) identifier definition

**What it intentionally does NOT define:**
- Final point values under all rule-profile variants (OPEN_DECISION)
- Dealing sequence (see Dealing)
- Bidding rules (see Bidding)
- Project eligibility (see Scoring)

---

### 05 — Dealing

**Path:** `docs/game/03-dealing.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Authoritative dealing architecture: dealer/seating, shuffle authority, initial deal, exposed card, completion deal, card conservation, reconnect/recovery, replay, anti-cheat, persistence, and test requirements.

**Dependencies:**
- Card System (04)
- Game Rules (03)

**What it defines:**
- Dealer selection and rotation contract
- Seating model
- Shuffle authority (server only)
- Initial deal sequence (first deal: N cards each)
- Exposed card concept and ownership model
- Completion deal (remaining cards)
- Card conservation invariant (exactly 32 cards at all times)
- Dealing phase entry/exit conditions
- stateVersion integration during dealing
- Reconnect/recovery during dealing
- Replay determinism requirements
- Anti-cheat boundaries
- Persistence boundary for dealing phase
- Testing requirements

**What it intentionally does NOT define:**
- Exact 3+2 vs other deal-split variants (OPEN_DECISION)
- Exposed card final behavior variants (OPEN_DECISION)
- Bidding rules (see Bidding)

---

### 06 — Bidding

**Path:** `docs/game/04-bidding.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Authoritative bidding state machine: first round, second round, Sun, Hokm, Ashkal, pass semantics, purchaser identity, exposed-card ownership, timeouts, reconnect, idempotency, and rule-freeze gates.

**Dependencies:**
- Dealing (05)
- Card System (04)
- Game Rules (03)

**What it defines:**
- Bidding phase entry conditions
- Turn order during bidding
- Pass semantics and rules
- CALL_SUN action and contract
- CALL_TRUMP (Hokm) action and contract
- CALL_ASHKAL action concept
- Purchaser identity and responsibility
- Second-round bidding conditions
- Contract selection outcome
- stateVersion during bidding
- Timeout behavior during bidding
- Reconnect behavior during bidding
- Idempotency requirements
- Rule Freeze Gate for bidding

**What it intentionally does NOT define:**
- Exact Ashkal eligibility rules (OPEN_DECISION)
- Exact second-round rules (OPEN_DECISION)
- Exact exposed-card ownership transfer rules (OPEN_DECISION)
- Playing rules (see Playing)

---

### 07 — Playing

**Path:** `docs/game/05-playing.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Authoritative Playing/Trick Engine: legal card calculation, follow-suit, Sun, Trump, trick winner resolution, turn progression, eight-trick lifecycle, timeout, reconnect, replay, bot compatibility, invariants, and testing.

**Dependencies:**
- Bidding (06)
- Card System (04)
- Game Rules (03)

**What it defines:**
- PLAY_CARD action schema
- Legal card calculation algorithm
- Follow-suit obligation rules
- Sun card precedence
- Trump (Hokm) card precedence
- Trick winner determination algorithm
- Turn progression within a trick
- Eight-trick lifecycle (round structure)
- Lead player for next trick
- stateVersion during playing
- Timeout behavior during playing
- Reconnect behavior during playing
- Replay determinism
- Bot compatibility requirements
- State invariants during playing
- Testing requirements

**What it intentionally does NOT define:**
- Scoring (see Scoring)
- Exact variant rules for edge-case trick resolution (some OPEN_DECISION items)
- Doubling rules (see Scoring)

---

### 08 — Scoring

**Path:** `docs/game/06-scoring.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Complete scoring architecture: raw card points, last-trick bonus, projects, سرا (SERA), خمسين, مية, أربعمية, بلوت, project comparison, purchaser success, Qaid conversion, doubling, triple, four, Coffee, Kaboot, ties, match score, scoring invariants.

**Dependencies:**
- Playing (07)
- Card System (04)
- Game Rules (03)

**What it defines:**
- Raw card point totals per trick
- Last-trick bonus
- Project definitions: سرا (SERA), خمسين, مية, أربعمية, بلوت
- SERA (سرا) — correct Arabic spelling and MUST NOT use سيرة
- Project declaration timing and eligibility
- Project comparison rules
- Purchaser success/failure conditions
- Qaid conversion
- Doubling / Triple / Quadruple structure
- Coffee and Kaboot concepts
- Tie-handling overview
- Match score accumulation
- Scoring invariants
- Rule Freeze Gate for scoring

**What it intentionally does NOT define:**
- Final numeric values for all doubling variants (OPEN_DECISION)
- Exact Kaboot and Coffee conditions under all variants (OPEN_DECISION)
- Exact tie resolution (OPEN_DECISION)
- Exact match-end target score (OPEN_DECISION)

---

### 09 — Game State

**Path:** `docs/game/07-game-state.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Canonical authoritative Game State for the entire match. Defines the schema covering players, teams, seats, dealer, rule profile, cards, dealing, bidding, contract, projects, doubling, tricks, turns, timers, scoring, versioning, snapshots, projections, recovery, concurrency, replay, and state invariants.

**Dependencies:**
- All game subsystem documents (03–08)

**What it defines:**
- GameState root schema
- GamePhase enum (WAITING_FOR_PLAYERS, SEATING, ROUND_STARTING, DEALING, BIDDING, CONTRACT_SELECTED, PROJECT_DECLARATION, PLAYING, SCORING, ROUND_COMPLETE, MATCH_COMPLETE, CANCELLED)
- Player and team schema
- Dealer rotation state
- Card distribution state
- Bidding state
- Contract state
- Project declaration state
- Trick state
- Turn state
- Timer state
- Score state
- stateVersion (monotonically incrementing mutation counter)
- Snapshot and projection model
- Server-authoritative hidden information model
- Concurrency and idempotency model
- Replay requirements

**What it intentionally does NOT define:**
- The full state transition graph (see State Transitions)
- Action protocol (see Actions)
- Unresolved rule-profile-specific state fields (OPEN_DECISION items remain)

---

### 10 — Actions

**Path:** `docs/game/08-actions.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Complete typed Action/Command model: action envelope, authentication, authorization, state versioning, idempotency, bidding, projects, doubling, card play, timeout, reconnect, social actions, system actions, validation, errors, rate limits, replay, bots, and concurrency.

**Dependencies:**
- Game State (09)
- All game subsystem documents (03–08)

**What it defines:**
- Action envelope schema (type, actionId, playerId, gameId, stateVersion, clientSeq, timestamp, payload)
- Action authentication requirements
- Action authorization model (who may perform which action in which phase)
- stateVersion-based optimistic concurrency
- Idempotency requirements (actionId deduplication)
- Lobby actions: CREATE_GAME, JOIN_GAME, LEAVE_GAME, READY, UNREADY, START_GAME, CANCEL_GAME
- Dealing actions
- Bidding actions: PASS, CALL_SUN, CALL_TRUMP, CALL_ASHKAL
- Project actions: DECLARE_PROJECT
- Doubling actions: DOUBLE, TRIPLE, QUADRUPLE, COFFEE, KABOOT
- Play action: PLAY_CARD
- Timeout actions (system-generated)
- Reconnect actions: REJOIN_GAME, RESYNC_GAME
- Social actions
- System/bot actions
- Validation pipeline
- Error types and codes
- Rate limiting requirements
- Replay compatibility

**What it intentionally does NOT define:**
- Game State mutation logic (see State Transitions)
- Unresolved doubling/variant rules (OPEN_DECISION)

---

### 11 — State Transitions

**Path:** `docs/game/09-state-transitions.md`  
**Status:** Draft / NOT FROZEN

**Purpose:**  
Deterministic State Transition layer connecting validated Actions to authoritative Game State. Includes lifecycle state machine, phase transitions, trick resolution, scoring boundaries, timers, reconnect/recovery, atomicity, invariants, replay, persistence/outbox boundaries, and failure handling.

**Dependencies:**
- Actions (10)
- Game State (09)
- All game subsystem documents (03–08)

**What it defines:**
- Full state machine: GAME_CREATED → SEATING → DEALING → BIDDING → CONTRACT_SELECTED → COMPLETE_DEAL → PROJECT_DECLARATION → TRICK_PLAY → ROUND_SCORING → MATCH_END_CHECK → GAME_RESULT
- Per-transition: preconditions, mutations, postconditions, stateVersion increment
- Trick resolution transition
- Scoring boundary (when scoring is triggered)
- Timer expiry transitions
- Reconnect/recovery transitions
- Atomicity requirements (all-or-nothing mutation)
- State invariants enforcement
- Replay determinism requirements
- Persistence/outbox boundary
- Invalid transition handling
- System vs player action distinction

**What it intentionally does NOT define:**
- Unresolved rule-profile-specific transition variants (OPEN_DECISION)
- Client-side projection logic
- Network/transport layer

---

## Validation Checklist

Before starting implementation, all of the following must be true:

- [ ] All 11 Foundation documents have been reviewed together as a system
- [ ] All `OPEN_DECISION` items have been formally resolved or deferred with explicit owner
- [ ] A single Rule Profile has been selected
- [ ] The phase name enum has been reconciled across Game State, State Transitions, and Playing docs
- [ ] Technical Architecture document exists
- [ ] UX Flow document exists
- [ ] Scope freeze has been approved
