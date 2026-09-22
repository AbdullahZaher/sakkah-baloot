# Foundation Consistency Audit — صكّة بلوت

**Audit Date:** 2026-09-21  
**Scope:** Cross-document consistency check across all 11 Foundation documents  
**Auditor:** Automated consolidation pass  
**Important:** No document has been modified to resolve any issue listed here. All issues must be resolved through human review and explicit document updates before implementation.

---

## Summary

| # | Severity | Category | Issue |
|---|---|---|---|
| 1 | HIGH | Game State / State Transitions | GamePhase enum inconsistency: `PLAYING` vs `TRICK_PLAY`, `SCORING` vs `ROUND_SCORING`, `ROUND_COMPLETE` vs `MATCH_END_CHECK` |
| 2 | MEDIUM | Playing / State Transitions | Playing doc uses internal sub-phases (`PLAYING_READY`, `PLAYING_COMPLETE`, `SCORING_PENDING`) not present in game-state enum |
| 3 | MEDIUM | Game State / State Transitions | `ROUND_STARTING` and `WAITING_FOR_PLAYERS` appear in Game State enum but not in State Transitions lifecycle |
| 4 | MEDIUM | Game State / State Transitions | `COMPLETE_DEAL` phase appears in State Transitions lifecycle but not in Game State enum |
| 5 | MEDIUM | Game State / State Transitions | `CANCELLED` appears in Game State enum but not in State Transitions lifecycle |
| 6 | LOW | Game State / State Transitions | `GAME_RESULT` terminal state in State Transitions vs `MATCH_COMPLETE` in Game State enum — potentially equivalent but named differently |
| 7 | LOW | Terminology | `سيرة` appears in scoring doc (lines 65, 456, 1838, 2157) as a correction notice (explicitly showing the wrong spelling). This is intentional and correct. No issue. |
| 8 | INFO | Arabic/English naming | `Sakkah` vs `صكّة` — both are used consistently. English romanization `Sakkah` is used in product docs (01–02), Arabic `صكّة` is used in game docs (03–11). Consistent pattern. |

---

## Issue Detail

---

### Issue 1 — GamePhase Enum Inconsistency

**Severity:** HIGH  
**Affected Documents:** `docs/game/07-game-state.md` (Game State), `docs/game/09-state-transitions.md` (State Transitions)

**Description:**

The `GamePhase` enum defined in `07-game-state.md` uses these values:

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

But `09-state-transitions.md` uses a different set of phase names in its state machine:

```text
GAME_CREATED
SEATING
DEALING
BIDDING
CONTRACT_SELECTED
COMPLETE_DEAL
PROJECT_DECLARATION
TRICK_PLAY         ← does not match "PLAYING"
ROUND_SCORING      ← does not match "SCORING"
MATCH_END_CHECK    ← does not match "ROUND_COMPLETE" or "MATCH_COMPLETE"
GAME_RESULT        ← does not match "MATCH_COMPLETE"
```

**Differences:**

| Game State Enum | State Transitions Label | Match? |
|---|---|---|
| `PLAYING` | `TRICK_PLAY` | NO |
| `SCORING` | `ROUND_SCORING` | NO |
| `ROUND_COMPLETE` | (implicit in MATCH_END_CHECK?) | UNCLEAR |
| `MATCH_COMPLETE` | `GAME_RESULT` | UNCLEAR |
| `WAITING_FOR_PLAYERS` | `GAME_CREATED` | DIFFERENT NAME |
| `ROUND_STARTING` | (missing) | MISSING in transitions |
| `CANCELLED` | (missing) | MISSING in transitions |
| (missing) | `COMPLETE_DEAL` | MISSING in game state enum |
| (missing) | `MATCH_END_CHECK` | MISSING in game state enum |

**Impact:**  
Implementation agents cannot produce a deterministic game engine without resolving which phase names are canonical. The two documents must agree on a single `GamePhase` enum.

**Recommended Resolution:**  
Human review required. One of the following approaches:
- Adopt the Game State enum as canonical and update State Transitions to reference it
- Adopt the State Transitions labels as canonical and update the Game State enum
- Reconcile by mapping: `TRICK_PLAY` → `PLAYING`, `ROUND_SCORING` → `SCORING`, etc., with explicit documentation of the mapping

Do NOT resolve silently. Update both documents explicitly.

---

### Issue 2 — Playing Doc Sub-Phase Names Not in GamePhase Enum

**Severity:** MEDIUM  
**Affected Documents:** `docs/game/05-playing.md` (Playing), `docs/game/07-game-state.md` (Game State)

**Description:**

`05-playing.md` references the following internal sub-phase states that are not present in the `GamePhase` enum in `07-game-state.md`:

- `PLAYING_READY` (line 99)
- `PLAYING_COMPLETE` (line 1290)
- `PLAYING_NOT_ACTIVE` (lines 883, 1496)
- `SCORING_PENDING` (line 1292)

**Impact:**  
It is unclear whether these are:
- Internal implementation constants within the playing engine (not part of GamePhase)
- Sub-states within the `PLAYING` phase that need to be added to GameState
- Renamed versions of existing phases

**Recommended Resolution:**  
Clarify in the Playing doc whether these are internal engine states or canonical GamePhase values. If they are canonical, add them to the Game State enum and ensure State Transitions references them.

---

### Issue 3 — `ROUND_STARTING` and `WAITING_FOR_PLAYERS` Missing from State Transitions

**Severity:** MEDIUM  
**Affected Documents:** `docs/game/07-game-state.md` (Game State), `docs/game/09-state-transitions.md` (State Transitions)

**Description:**

The Game State enum includes `WAITING_FOR_PLAYERS` and `ROUND_STARTING`, but these are not represented as named phases in the State Transitions lifecycle diagram.

- `GAME_CREATED` in State Transitions may correspond to `WAITING_FOR_PLAYERS` in Game State, but this is not explicitly stated.
- `ROUND_STARTING` has no counterpart transition section in State Transitions.

**Impact:**  
Missing lifecycle coverage in State Transitions. The game engine implementation cannot correctly handle these phases without explicit transitions defined.

**Recommended Resolution:**  
Add `WAITING_FOR_PLAYERS` ↔ `GAME_CREATED` mapping and `ROUND_STARTING` transitions to `09-state-transitions.md`, or remove `ROUND_STARTING` from the Game State enum if it is not a stable phase but a transient setup step.

---

### Issue 4 — `COMPLETE_DEAL` Phase Missing from Game State Enum

**Severity:** MEDIUM  
**Affected Documents:** `docs/game/09-state-transitions.md` (State Transitions), `docs/game/07-game-state.md` (Game State)

**Description:**

`09-state-transitions.md` includes `COMPLETE_DEAL` as a distinct lifecycle phase (between `CONTRACT_SELECTED` and `PROJECT_DECLARATION`), but this phase is absent from the `GamePhase` enum in `07-game-state.md`.

**Impact:**  
If `COMPLETE_DEAL` is a real phase (where the server finishes distributing remaining cards after the contract is set), it needs to be a persisted GamePhase value so clients can project the correct UI state.

**Recommended Resolution:**  
Either add `COMPLETE_DEAL` (or equivalent) to the Game State enum, or document explicitly that it is a transient operation within `CONTRACT_SELECTED` and not a stable persisted phase.

---

### Issue 5 — `CANCELLED` Phase Missing from State Transitions

**Severity:** MEDIUM  
**Affected Documents:** `docs/game/07-game-state.md` (Game State), `docs/game/09-state-transitions.md` (State Transitions)

**Description:**

The `GamePhase` enum in `07-game-state.md` includes `"CANCELLED"` as a terminal state, but no transition to `CANCELLED` is documented in `09-state-transitions.md`.

**Impact:**  
No defined trigger or condition for entering the `CANCELLED` state. The CANCEL_GAME action exists in `08-actions.md`, but its state transition is not fully defined.

**Recommended Resolution:**  
Add a `→ CANCELLED` transition section to State Transitions that documents:
- Which actions can trigger cancellation
- In which phases cancellation is allowed
- What cleanup is required

---

### Issue 6 — Terminal State Naming: `GAME_RESULT` vs `MATCH_COMPLETE`

**Severity:** LOW  
**Affected Documents:** `docs/game/07-game-state.md`, `docs/game/09-state-transitions.md`

**Description:**

The final terminal state for a completed match is called `GAME_RESULT` in State Transitions but `MATCH_COMPLETE` in the Game State enum. These may refer to the same concept, but the naming is inconsistent.

**Impact:**  
Low risk at this stage (documentation only), but will become a runtime bug if both names appear in implementation code.

**Recommended Resolution:**  
Select one canonical name. Recommended: `MATCH_COMPLETE` (clearer semantics). Update State Transitions accordingly.

---

## No Issues Found

The following areas passed the consistency check:

### Product Name
- `صكّة بلوت` is consistently used throughout all game documents (03–11)
- `Sakkah Baloot` is consistently used in product documents (01–02)
- No mixing of Arabic/English product names

### Arabic Terminology: سرا (SERA)
- `سرا` (correct) is used consistently as the project name in all game documents
- `سيرة` (incorrect) appears ONLY in `06-scoring.md` as an explicit correction notice (showing the wrong spelling to avoid)
- No document incorrectly uses `سيرة` as a name (only as an example of what NOT to use)
- Internal identifier `SERA` is consistently used in `01-game-rules.md`, `02-card-system.md`, and `06-scoring.md`

### Deck Size
- 32 cards is consistently referenced across all game documents

### Player and Team Count
- 4 players, 2 teams is consistently referenced

### Seating Model
- Team members seated across from each other is consistently described

### Server Authority
- All documents consistently establish the server as the authoritative game engine
- No document grants the client authority over game state

### stateVersion
- `stateVersion` as a monotonically incrementing mutation counter is consistently defined and referenced across: Dealing, Playing, State Transitions, Actions

### Hidden Information
- Server-authoritative hidden information (cards not broadcast to other players) is consistently enforced across all relevant documents

### OPEN_DECISION Preservation
- All documents correctly preserve `OPEN_DECISION` markers
- No document invents or silently resolves open decisions

---

## Audit Verdict

```
PASS WITH WARNINGS

Critical: 0
High:     1  (phase name enum inconsistency)
Medium:   4  (phase coverage gaps)
Low:      1  (terminal state naming)
Info:     0
```

The Foundation documents are internally coherent on product direction, game model, and server-authority architecture. The primary area requiring reconciliation before implementation is the **GamePhase naming alignment between Game State and State Transitions documents**.

No gameplay rule has been invented or resolved by this audit. All findings are observations that must be resolved through human review and explicit document updates.
