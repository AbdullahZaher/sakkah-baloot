# صكّة بلوت — Architecture Decisions Required

**Document:** `docs/FOUNDATION-ARCHITECTURE-DECISIONS.md`
**Phase:** 13.5
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. No decisions made. No design selected.

---

## Scope

This document contains ONLY decisions that require the engineering or product team to make a technical design choice.

Items excluded from this document:
- Rule decisions (see `FOUNDATION-RULE-DECISIONS.md`)
- Documentation fixes (see `FOUNDATION-DOCUMENTATION-FIXES.md`)

No option is pre-selected in this document. All options are presented neutrally.

---

## AD-01: PASS vs PASS_FINAL Wire Representation

**Evidence from Foundation:**

`04-bidding.md §8`: labels actions as "Recommended **domain** action" — explicitly "domain," not "wire."

`04-bidding.md §18–19`: defines PASS (round 1) and PASS_FINAL (round 2) as semantically distinct.

`08-actions.md §1`: "This document defines the **complete authoritative** action/command model."

`08-actions.md §21`: defines only one PASS action; validation checks "pass is legal in current bidding stage."

`07-game-state.md §16`: `BiddingState.phase: BiddingPhase` tracks `FIRST_ROUND | SECOND_ROUND` in authoritative server state.

`04-bidding.md §29`: references "depending on protocol design" for duplicate action handling.

**Available Options:**

| Option | Description | Advantage | Disadvantage |
|---|---|---|---|
| A | Single PASS; server derives round from BiddingState.phase | Simpler wire format; fewer action types | Server coupling to phase state; client cannot self-validate |
| B | Separate PASS and PASS_FINAL wire action types | Client can validate without knowing BiddingPhase | Two action types for semantically overlapping behavior; 04-bidding and 08-actions must align |

**What remains undecided:**
- Which option is canonical
- Whether `08-actions.md` should be updated to add PASS_FINAL
- Whether `04-bidding.md §19` intended PASS_FINAL as a wire type or a conceptual distinction

**What must be decided before protocol freeze:**
The wire action type(s) for second-round pass.

---

## AD-02: Canonical GamePhase Representation

**Evidence from Foundation:**

`07-game-state.md §8` GamePhase enum: WAITING_FOR_PLAYERS, SEATING, ROUND_STARTING, DEALING, BIDDING, CONTRACT_SELECTED, PROJECT_DECLARATION, PLAYING, SCORING, ROUND_COMPLETE, MATCH_COMPLETE, CANCELLED.

`09-state-transitions.md §9` state machine: GAME_CREATED, SEATING, DEALING, BIDDING, CONTRACT_SELECTED, COMPLETE_DEAL, PROJECT_DECLARATION, TRICK_PLAY, ROUND_SCORING, MATCH_END_CHECK, GAME_RESULT.

`07-game-state.md §8`: "The exact transition graph belongs in 09-state-transitions.md" — defers the graph, not the phase name strings.

Neither document designates the other as canonical for phase name strings.

`09-state-transitions.md §1650 item 3`: explicitly lists system transition representation as unresolved.

**Name conflicts (same semantic phase, different names):**

| Semantic phase | game-state | transitions |
|---|---|---|
| Trick play | PLAYING | TRICK_PLAY |
| Round score calculation | SCORING | ROUND_SCORING |
| Final match state | MATCH_COMPLETE | GAME_RESULT |

**Phases only in game-state:** WAITING_FOR_PLAYERS, ROUND_STARTING, ROUND_COMPLETE, CANCELLED.

**Phases only in transitions:** GAME_CREATED, COMPLETE_DEAL, MATCH_END_CHECK.

**What must be decided before protocol freeze:**
1. Which document is the canonical source for GamePhase enum strings
2. The complete canonical list of client-observable phases
3. The complete list of engine-internal states (not in the enum)
4. Whether COMPLETE_DEAL is observable (see AD-03)
5. Whether MATCH_END_CHECK is observable (see AD-04)
6. Whether ROUND_STARTING, ROUND_COMPLETE exist as distinct states
7. The terminal state name (MATCH_COMPLETE or GAME_RESULT)
8. Whether CANCELLED and WAITING_FOR_PLAYERS are in the same enum as gameplay phases

---

## AD-03: COMPLETE_DEAL — Internal vs Client-Observable

**Evidence from Foundation:**

`09-state-transitions.md §17`: defines COMPLETE_DEAL as a transition from CONTRACT_SELECTED.

`07-game-state.md §8`: does not include COMPLETE_DEAL in GamePhase enum.

`09-state-transitions.md §1650 item 3`: "Whether system transitions are represented as actions or internal transitions" — explicitly unresolved before freeze.

No document states that COMPLETE_DEAL is internal-only. No document states it is client-observable.

**Available Options:**

| Option | Description | Implication |
|---|---|---|
| A | Internal engine state only | Clients observe CONTRACT_SELECTED then PROJECT_DECLARATION; no intervening phase |
| B | Client-observable phase | Clients receive a COMPLETE_DEAL phase event during card distribution; useful for animations |

**What is known:**
- No player action occurs during COMPLETE_DEAL
- The transition matrix shows it as a named state
- Card distribution happens during this state (may require client animation)

**What must be decided before event schema is frozen:**
Whether COMPLETE_DEAL appears in the GamePhase enum and is emitted as a phase event to clients.

---

## AD-04: MATCH_END_CHECK — Internal vs Client-Observable

**Evidence from Foundation:**

`09-state-transitions.md §27–28`: defines MATCH_END_CHECK as a transition decision point with two exits (GAME_RESULT, DEALING).

`09-state-transitions.md §64` transition matrix: includes rows for `MATCH_END_CHECK | continue | DEALING` and `MATCH_END_CHECK | finish | GAME_RESULT`.

`07-game-state.md §8`: does not include MATCH_END_CHECK in GamePhase enum.

`09-state-transitions.md §1650 item 3`: explicitly unresolved.

No player action occurs during MATCH_END_CHECK. The Foundation presents it as a conditional branch.

**Available Options:**

| Option | Description | Implication |
|---|---|---|
| A | Internal engine branch | Clients never observe MATCH_END_CHECK; they transition from ROUND_SCORING directly to DEALING or GAME_RESULT |
| B | Observable intermediate state | Clients receive MATCH_END_CHECK as a brief state before the match-end determination is communicated |

**What must be decided before event schema is frozen:**
Whether MATCH_END_CHECK appears in client-facing state or is purely an engine-internal computation.

---

## AD-05: Domain Contract vs Card-System Contract vs Transport Representation

**Evidence from Foundation:**

`02-card-system.md §9` (minimal):
```ts
type Contract =
  | { type: "SUN" }
  | { type: "TRUMP"; suit: Suit }
  | { type: "ASHKAL"; suit?: Suit };
```
Explicitly says: "The exact Ashkal representation remains an open rule decision and MUST be finalized in the Bidding/Rules documents."

`04-bidding.md §24` (full domain):
```ts
type Contract =
  | { type: "SUN"; purchaserSeat: Seat; source: "FIRST_ROUND" | "SECOND_ROUND" }
  | { type: "TRUMP"; suit: Suit; purchaserSeat: Seat; source: "FIRST_ROUND" | "SECOND_ROUND" }
  | { type: "ASHKAL"; purchaserSeat: Seat; exposedCardReceiverSeat: Seat; source: "FIRST_ROUND" };
```

`04-bidding.md §24` also says: "The final engine may normalize Ashkal to `{ type: 'SUN', mode: 'ASHKAL' }` if this makes later logic clearer."

`05-playing.md §18`: uses only `contract.type === "TRUMP"` — type discriminant only.

**Observation:** These are not contradictory. They serve different purposes. `02-card-system.md` explicitly defers to `04-bidding.md` for the final representation.

**What remains undecided:**
1. Whether a single canonical Contract type is defined in one document
2. Whether transport contract (wire format) differs from domain contract (engine internals)
3. Which fields are required at each layer
4. Whether the Ashkal normalization (`mode: "ASHKAL"`) is adopted

**What must be decided before engine implementation:**
The canonical Contract type used internally, and whether the wire format differs.

---

## Decision Priority

| ID | Decision | Blocks Event Schema? | Blocks Wire Protocol? | Blocks Architecture? |
|---|---|---|---|---|
| AD-01 | PASS vs PASS_FINAL | No | YES | No |
| AD-02 | Canonical GamePhase | YES | YES | YES |
| AD-03 | COMPLETE_DEAL representation | YES | YES | No |
| AD-04 | MATCH_END_CHECK representation | YES | YES | No |
| AD-05 | Contract type layers | No | No | No |

AD-02 is the highest priority as it gates all other phase-related decisions.
