# صكّة بلوت — Phase 14.Z.9 Documentation Reconciliation & Protocol Freeze Preparation

**Date:** 2026-09-22  
**Phase:** 14.Z.9 — Documentation Reconciliation & Protocol Freeze Preparation  
**Status:** PREPARATION COMPLETE — RECONCILIATION NOT YET FROZEN  
**Prerequisite:** Explicit owner decision on AD-01 through AD-05

## 1. Objective

Phase 14.Z.9 defines the exact documentation reconciliation pass that follows owner acceptance of AD-01…AD-05.

This phase deliberately separates:
1. architecture approval;
2. documentation reconciliation;
3. rule/provenance closure;
4. event/action protocol freeze;
5. final Rule Freeze.

No production implementation is authorized by this document.

## 2. Canonical vocabulary target

| Concern | Canonical term | Classification |
|---|---|---|
| Client gameplay phase | `PLAYING` | GamePhase |
| Round scoring phase | `SCORING` | GamePhase |
| Match terminal phase | `MATCH_COMPLETE` | GamePhase |
| Final-deal boundary | `FINAL_CARDS_DEALT` | Event |
| Complete-deal processing | `COMPLETE_DEAL` | Internal transition |
| Match-end evaluation | `MATCH_END_CHECK` | Internal branch |
| Match completion fact | `MATCH_COMPLETED` | Event |
| Passing command | `PASS` | Wire action |
| Final-pass meaning | `PASS_FINAL` | Domain semantic only |
| Highest escalation | `GAHWA` | Action/event terminology |
| Project declaration | `DECLARE_PROJECT` | Wire action |
| Ashkal declaration | `CALL_ASHKAL` | Wire action, empty payload |
| Trick lifecycle | `PLAYING` + `TRICK_COMPLETED` | Phase + event |

The target direction is counter-clockwise throughout the rules and relative-seat semantics.

## 3. 07 — Game State reconciliation

`07-game-state.md` remains the authoritative owner of client-facing `GamePhase`.

Canonical enum:

~~~ts
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
~~~

Reconciliation rules:
- Do not add `COMPLETE_DEAL` to GamePhase.
- Do not add `MATCH_END_CHECK` to GamePhase.
- Do not reintroduce `TRICK_PLAY`, `ROUND_SCORING`, or `GAME_RESULT`.
- Contract state must align with approved AD-05.
- Hidden-information rules remain unchanged.
- State version remains authoritative and monotonic.
- `RESYNC_GAME` remains a synchronization operation, not gameplay mutation.

## 4. 08 — Actions reconciliation

Target player action vocabulary:

~~~text
CREATE_GAME
JOIN_GAME
LEAVE_GAME
READY
UNREADY
START_GAME
CANCEL_GAME

PASS
CALL_SUN
CALL_TRUMP
CALL_ASHKAL

DECLARE_PROJECT
DECLARE_BALOOT

DOUBLE
TRIPLE
QUADRUPLE
GAHWA

PLAY_CARD

DECLARE_KASHO

RESYNC_GAME
~~~

Required corrections:

### PASS
Only `{ type: "PASS" }` is sent by the client. The server derives first/second/final semantics.

### CALL_ASHKAL
Payload is empty. The server derives the authoritative buyer, team, and exposed-card recipient.

### Projects
`DECLARE_PROJECT` is the declaration command. `CONFIRM_PROJECT` is not part of the proposed canonical protocol unless a later explicit owner decision introduces a separate confirmation rule.

### Escalation
Normalize stale `COFFEE` terminology to `GAHWA`.

### Server/system processing
Pure resolver concepts must not become arbitrary client-visible commands. System-triggered transitions may remain where there is a real server scheduling, timeout, or orchestration boundary.

## 5. 09 — State Transition reconciliation

Canonical observable flow:

~~~text
WAITING_FOR_PLAYERS
    ↓
SEATING
    ↓
ROUND_STARTING
    ↓
DEALING
    ↓
BIDDING
    ↓
CONTRACT_SELECTED
    ↓
[internal COMPLETE_DEAL]
    ↓
PROJECT_DECLARATION
    ↓
PLAYING
    ↓
SCORING
    ↓
[internal MATCH_END_CHECK]
    ├── continue → ROUND_COMPLETE → ROUND_STARTING
    └── finish   → MATCH_COMPLETE
~~~

Required corrections:

`TRICK_PLAY` → `PLAYING`  
`ROUND_SCORING` → `SCORING`  
`GAME_RESULT` → `MATCH_COMPLETE`

Retain these only internally:
`COMPLETE_DEAL`, `MATCH_END_CHECK`, `TRICK_RESOLUTION`, `PROJECT_RESOLUTION`, `CONTRACT_RESOLUTION`.

Any generic baseline direction such as `clockwise` must not survive where it describes canonical game movement. The canonical game direction is counter-clockwise.

## 6. Event protocol reconciliation

The proposed event catalog remains the starting point. Final freeze must explicitly define event name, payload, visibility, sequence position, stateVersion, persistence, client projection, and whether it is gameplay state or transport metadata.

Representative card ordering:

~~~text
CARD_PLAYED
→ TRICK_COMPLETED
→ TURN_CHANGED
~~~

Representative round completion:

~~~text
KABOOT_RESOLVED / REVERSE_KABOOT_RESOLVED (when applicable)
→ ROUND_SCORED
→ ROUND_COMPLETED
~~~

or the terminal path:

~~~text
KABOOT_RESOLVED / REVERSE_KABOOT_RESOLVED (when applicable)
→ ROUND_SCORED
→ MATCH_COMPLETED
~~~

Exact final ordering remains a freeze task and must not be inferred from this preparation document.

## 7. Action / transition / event boundary

**Action:** intent submitted to the authoritative transition boundary.

Examples: `PLAY_CARD`, `PASS`, `CALL_SUN`, `DOUBLE`, `DECLARE_PROJECT`.

**Internal transition:** deterministic engine processing.

Examples: `TRICK_RESOLUTION`, `PROJECT_RESOLUTION`, `CONTRACT_RESOLUTION`, `COMPLETE_DEAL`, `MATCH_END_CHECK`.

**Event:** immutable fact produced by a committed transition.

Examples: `CARD_PLAYED`, `TRICK_COMPLETED`, `PROJECT_DECLARED`, `ROUND_SCORED`, `MATCH_COMPLETED`.

No layer should be used as a substitute for another.

## 8. Freeze checks after reconciliation

- [ ] 07 contains one canonical GamePhase vocabulary.
- [ ] 08 contains one canonical player action vocabulary.
- [ ] 09 contains the canonical phase graph.
- [ ] No stale `TRICK_PLAY` lifecycle remains.
- [ ] No stale `ROUND_SCORING` lifecycle remains.
- [ ] No stale `GAME_RESULT` lifecycle remains.
- [ ] `PASS_FINAL` is not a wire command.
- [ ] `COFFEE` is absent from canonical protocol terminology.
- [ ] `CONFIRM_PROJECT` is absent unless explicitly re-approved.
- [ ] `CALL_ASHKAL` has no client-supplied suit.
- [ ] Direction language is reconciled with canonical counter-clockwise rules.
- [ ] Internal transitions are not accidentally exposed as GamePhase values.
- [ ] Event ordering is explicit.
- [ ] Event payload ownership is explicit.
- [ ] Hidden-information boundaries remain intact.
- [ ] `RESYNC_GAME` does not mutate gameplay stateVersion.

## 9. Rule Freeze blockers outside this pass

1. Exact Qaid conversion table transcription.
2. V-06b and V-11 canonical scoring transcription.
3. Cutting/Dag rule decision or explicit exclusion with provenance.
4. Bidding option sets and Sun-priority transcription.
5. Full Kasho violation/coexistence edge documentation.
6. Project ×3/×4 provenance closure.
7. Broader Saudi Hokum Double-window provenance closure.
8. Exact final event ordering/payload freeze.
9. Final Rule → Code matrix update.

## 10. No silent architecture approval

This phase does not infer `AD-01…AD-05 = ACCEPTED` merely from a request to continue. The owner approval gate remains explicit.

Once AD-01…AD-05 are accepted, the reconciliation can be applied to 07/08/09 in a controlled documentation-only commit.

## 11. Next phase

**Phase 14.Z.10 — Canonical Documentation Reconciliation**

Scope:
- apply approved vocabulary to 07/08/09;
- reconcile action/event catalogs;
- remove stale terminology;
- reconcile CCW direction;
- produce exact diff/audit;
- do not implement engine code.

After 14.Z.10:

**Phase 14.Z.11 — Final Rule Freeze Audit**

Only after that gate can production engine implementation be considered.