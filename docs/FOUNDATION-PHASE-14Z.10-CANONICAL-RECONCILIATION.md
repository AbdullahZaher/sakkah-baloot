# صكّة بلوت — Phase 14.Z.10 Canonical Documentation Reconciliation

**Date:** 2026-09-22  
**Phase:** 14.Z.10 — Canonical Documentation Reconciliation  
**Status:** PROPOSED RECONCILIATION — SOURCE DOCUMENTS NOT YET MODIFIED  
**Reason:** AD-01…AD-05 remain explicitly pending owner approval.

## 1. Execution result

The current `07-game-state.md`, `08-actions.md`, and `09-state-transitions.md` were inspected against the 14.Z.5–14.Z.9 architecture package.

The reconciliation map is now complete. Because AD-01…AD-05 have not been explicitly accepted, this phase records the exact changes that should be applied but does not silently alter the canonical foundation documents.

## 2. 07 — Game State

### Current canonical direction
`07-game-state.md` already contains the intended client-facing GamePhase family.

### Required final target

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

Required reconciliation:
- retain `PLAYING` as the observable trick-play phase;
- retain `SCORING` as the observable scoring phase;
- retain `MATCH_COMPLETE` as the terminal phase;
- keep `COMPLETE_DEAL` and `MATCH_END_CHECK` out of GamePhase;
- align Contract representation with AD-05 if approved;
- retain hidden-information projection and authoritative state-version rules.

## 3. 08 — Actions

### Confirmed target vocabulary

```text
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
```

### Exact stale constructs found

| Existing construct | Reconciliation |
|---|---|
| `CALL_ASHKAL` with optional `suit` | remove client-supplied suit; empty payload |
| `CONFIRM_PROJECT` | remove from canonical player protocol unless separately approved |
| `COFFEE` / `CoffeeAction` | rename to `GAHWA` / `GahwaAction` |
| `PASS` | retain as the only pass wire action |
| `PASS_FINAL` | domain semantic only, never client wire input |
| system resolver actions | keep only where a genuine server-trigger boundary exists |

### Project declaration

`DECLARE_PROJECT` remains the player intent. The server validates authoritative card ownership, project eligibility, timing, overlap, and declaration lifecycle.

## 4. 09 — State Transitions

### Exact terminology replacements

| Existing | Canonical target |
|---|---|
| `TRICK_PLAY` | `PLAYING` |
| `ROUND_SCORING` | `SCORING` |
| `GAME_RESULT` | `MATCH_COMPLETE` + `MATCH_COMPLETED` event |
| `COMPLETE_DEAL` as lifecycle state | internal transition only |
| `MATCH_END_CHECK` as lifecycle state | internal branch only |
| generic `clockwise` baseline | canonical CCW for current Saudi profile |

### Canonical observable graph

```text
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
```

## 5. Event ordering freeze candidate

The following is a candidate for final freeze, not yet frozen:

```text
CARD_PLAYED
→ TRICK_COMPLETED
→ TURN_CHANGED
```

Final trick / round:

```text
[KABOOT_RESOLVED / REVERSE_KABOOT_RESOLVED when applicable]
→ ROUND_SCORED
→ ROUND_COMPLETED
```

Terminal match path:

```text
[KABOOT_RESOLVED / REVERSE_KABOOT_RESOLVED when applicable]
→ ROUND_SCORED
→ MATCH_COMPLETED
```

Important: `MATCH_END_EVALUATED` may remain internal/domain terminology if retained; it must not become a GamePhase.

## 6. Cross-document consistency checks

- [x] `PASS` is the intended single pass wire action.
- [x] `PASS_FINAL` is domain-only in the proposed architecture.
- [x] `CALL_ASHKAL` target is empty payload.
- [x] `GAHWA` is the proposed canonical escalation name.
- [x] `PLAYING` replaces `TRICK_PLAY`.
- [x] `SCORING` replaces `ROUND_SCORING`.
- [x] `MATCH_COMPLETE` replaces `GAME_RESULT`.
- [x] `COMPLETE_DEAL` is internal.
- [x] `MATCH_END_CHECK` is internal.
- [x] `RESYNC_GAME` is not a gameplay mutation.
- [x] client projections remain separate from authoritative full state.
- [x] canonical current rule direction is counter-clockwise.
- [ ] exact event payloads frozen.
- [ ] exact event ordering frozen.
- [ ] AD-01…AD-05 explicitly accepted.

## 7. Items deliberately not changed

The following remain outside this reconciliation and are not silently resolved:

1. Qaid conversion transcription.
2. V-06b / V-11 scoring transcription.
3. Cutting/Dag.
4. Bidding option sets and Sun priority.
5. Kasho violation/coexistence edge cases.
6. Project ×3/×4 provenance conflict.
7. Hokum Double-window provenance conflict.
8. Final event payload/order freeze.
9. Rule → Code matrix.

## 8. Gate result

```text
14.Z.10 reconciliation analysis       COMPLETE
14.Z.10 source-document mutation       NOT PERFORMED
AD-01…AD-05                            PENDING OWNER APPROVAL
Rule Freeze                            BLOCKED
Production Code                        NOT AUTHORIZED
```

## 9. Next controlled operation

After explicit AD-01…AD-05 acceptance, apply this reconciliation to the three source documents in one documentation-only change set, then run a zero-stale-terminology audit.

That controlled mutation is **Phase 14.Z.10-R**, followed by the final Rule Freeze audit.