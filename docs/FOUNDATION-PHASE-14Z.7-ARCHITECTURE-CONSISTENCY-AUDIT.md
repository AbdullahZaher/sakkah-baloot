# صكّة بلوت — Phase 14.Z.7 Architecture Consistency Audit

**Date:** 2026-09-22  
**Phase:** 14.Z.7 — Architecture Consistency Audit  
**Status:** AUDIT COMPLETE — RULE FREEZE STILL BLOCKED  
**Scope:** 07 Game State / 08 Actions / 09 State Transitions / 14.Z.5 Architecture / 14.Z.6 Proposed Action & Event Catalogs

## 1. Executive result

Documentation was compared across the canonical GamePhase recommendation, existing action specification, existing transition specification, and the proposed 14.Z.6 catalogs.

Result:

- Architecture direction is coherent.
- The proposed 14.Z.6 catalogs expose the intended architecture clearly.
- The existing `08-actions.md` and `09-state-transitions.md` are still stale in several places and MUST NOT be treated as frozen protocol documents.
- Rule Freeze remains BLOCKED.
- No production engine code or tests are authorized.

## 2. AD-01 — PASS / PASS_FINAL

### Finding: CONSISTENCY GAP

`08-actions.md` defines only `PASS`, which is compatible with AD-01, while older text elsewhere still discusses `PASS_FINAL` semantically.

Canonical target:

`PASS` is the only client wire action. The server derives FIRST vs SECOND round and the final-pass semantic from authoritative bidding state.

Required documentation treatment:
- keep `PASS_FINAL` as domain semantics only;
- remove any implication that the client may submit `PASS_FINAL`;
- preserve `passFinalBlocksLaterAshkal` as authoritative state/rule behavior.

## 3. AD-02 — GamePhase

### Finding: MAJOR STALE TRANSITION TERMINOLOGY

`07-game-state.md` owns the client-facing GamePhase model, while `09-state-transitions.md` still uses an older lifecycle vocabulary such as `TRICK_PLAY`, `ROUND_SCORING`, and `GAME_RESULT`.

Canonical target:

`PLAYING` replaces `TRICK_PLAY` as the observable GamePhase.
`SCORING` replaces `ROUND_SCORING` as the observable GamePhase.
`MATCH_COMPLETE` replaces `GAME_RESULT` as the terminal observable GamePhase.
`COMPLETE_DEAL` and `MATCH_END_CHECK` remain internal transitions.

## 4. AD-03 — COMPLETE_DEAL

### Finding: ARCHITECTURE CONSISTENT, DOCUMENTATION STALE

The 14.Z.5 recommendation correctly treats COMPLETE_DEAL as internal. The existing 09 transition document still presents it as a lifecycle state label.

Required treatment:
`CONTRACT_SELECTED → internal COMPLETE_DEAL → PROJECT_DECLARATION`.
No client GamePhase named COMPLETE_DEAL.
`FINAL_CARDS_DEALT` may be an event only.

## 5. AD-04 — MATCH_END_CHECK

### Finding: ARCHITECTURE CONSISTENT, DOCUMENTATION STALE

The recommendation treats MATCH_END_CHECK as an internal branch. Existing 09 text still uses it as a lifecycle node leading to GAME_RESULT.

Canonical target:

`SCORING → internal match-end evaluation → ROUND_COMPLETE → next round`
or
`SCORING → internal match-end evaluation → MATCH_COMPLETE`.

## 6. AD-05 — Contract

### Finding: STRUCTURALLY CONSISTENT

The three-layer model remains coherent:

1. Domain Contract
2. Transport ContractDTO
3. UI representation

Ashkal remains normalized as Sun + `mode: ASHKAL`, while ContractActors preserves the exposed-card recipient.

No implementation should allow transport DTO fields to override authoritative domain state.

## 7. 14.Z.6 Action Catalog

### Finding: PROPOSAL IS COHERENT

The proposed catalog correctly establishes:

- `PASS`
- `CALL_SUN`
- `CALL_TRUMP`
- `CALL_ASHKAL`
- `DECLARE_PROJECT`
- `DECLARE_BALOOT`
- `DOUBLE` / `TRIPLE` / `QUADRUPLE` / `GAHWA`
- `PLAY_CARD`
- `DECLARE_KASHO`
- `RESYNC_GAME`

Important stale terminology remains in `08-actions.md`:
- `COFFEE` must be normalized to `GAHWA` in the canonical protocol.
- `CONFIRM_PROJECT` is still described as a possible action but is not part of the approved project declaration protocol.
- `CALL_ASHKAL` still contains an optional suit payload in the old draft; the proposed catalog makes it empty.

These are documentation reconciliation tasks, not permission to implement.

## 8. 14.Z.6 Event Catalog

### Finding: PROPOSAL IS COHERENT WITH ONE IMPORTANT BOUNDARY

Events correctly represent facts such as:

`CARD_PLAYED`, `TRICK_COMPLETED`, `TURN_CHANGED`, `PROJECT_DECLARED`, `BALOOT_DECLARED`, `KASHO_DECLARED`, `HAND_CANCELLED`, `ROUND_SCORED`, `MATCH_COMPLETED`.

However, exact event ordering and payload schemas are not yet frozen.

Therefore the event catalog must remain PROPOSED until reconciled with 09.

## 9. Hidden-information boundary

### Finding: CONSISTENT

The architecture consistently requires:

authoritative full state on server → player-specific projection → client.

Opponent hidden cards, future deck order, RNG seed, private project information, and private server metadata must not cross the projection boundary.

## 10. State version / resync

### Finding: CONSISTENT

`RESYNC_GAME` is a synchronization operation, not a gameplay mutation.

It must not increment gameplay `stateVersion`.

Gameplay actions use expected state version and strict stale-state rejection by default.

## 11. System action boundary

### Finding: NEEDS NORMALIZATION

The old action specification lists system actions such as `SYSTEM_RESOLVE_TRICK`, `SYSTEM_SCORE_ROUND`, and `SYSTEM_END_MATCH`, while the proposed architecture also models deterministic internal resolution steps.

Canonical principle:

System actions are acceptable only when they represent an actual externally scheduled/server-triggered transition. Pure resolver functions such as trick resolution and contract resolution should not be exposed as transport commands.

Therefore:
- `SYSTEM_TIMEOUT` can be a system command/event trigger.
- `SYSTEM_DEAL` can represent authoritative dealing orchestration.
- trick/project/contract resolution should normally occur inside the deterministic transition produced by an accepted action or scheduled system transition, not as arbitrary client-visible commands.

## 12. Event vs transition terminology

### Finding: NEEDS NORMALIZATION

Do not use all three layers interchangeably:

- GamePhase = client-observable lifecycle state.
- Transition = internal state-machine step.
- Event = immutable fact emitted from a committed transition.

Examples:

`PLAYING` = GamePhase.
`TRICK_RESOLUTION` = internal transition/resolver concept.
`TRICK_COMPLETED` = event.

`MATCH_COMPLETE` = GamePhase.
`MATCH_END_CHECK` = internal branch.
`MATCH_COMPLETED` = event.

## 13. Existing documentation contradictions that must be repaired

| Area | Existing stale form | Canonical target |
|---|---|---|
| Game phase | `TRICK_PLAY` | `PLAYING` |
| Scoring phase | `ROUND_SCORING` | `SCORING` |
| Terminal result | `GAME_RESULT` | `MATCH_COMPLETE` + `MATCH_COMPLETED` event |
| Deal boundary | `COMPLETE_DEAL` as lifecycle node | internal transition only |
| Match check | `MATCH_END_CHECK` as lifecycle node | internal branch only |
| Doubling | `COFFEE` | `GAHWA` |
| Pass | possible `PASS_FINAL` wire semantics | `PASS` wire + server-derived final-pass semantic |
| Project confirmation | `CONFIRM_PROJECT` draft | `DECLARE_PROJECT` protocol unless a later explicit rule requires confirmation |
| Ashkal payload | optional suit in old action draft | empty payload; server derives contract |

## 14. Items that are NOT solved by this audit

These remain genuine blockers:

1. Explicit owner acceptance/revision of AD-01 through AD-05.
2. Exact Qaid conversion table transcription into canonical docs.
3. V-06b and V-11 canonical scoring transcription.
4. Cutting/Dag rule or explicit exclusion with provenance.
5. Bidding option sets and Sun-priority transcription.
6. Full Kasho violation/coexistence edge documentation.
7. Provenance closure for project ×3/×4 conflict.
8. Provenance closure for the broader Saudi Hokum Double window conflict.
9. Exact event ordering/payload freeze.
10. Rule → Code matrix update after architecture freeze.

## 15. Freeze gate impact

Current state:

`ARCHITECTURE CONSISTENCY AUDIT = COMPLETE`
`ARCHITECTURE = PROPOSED / NOT FROZEN`
`RULE_FREEZE = BLOCKED`
`PRODUCTION_CODE = NOT AUTHORIZED`

## 16. Next required owner gate

The next owner decision is not to write engine code.

The owner should explicitly accept or revise AD-01 through AD-05. Once accepted, the stale 08/09 terminology can be reconciled into one frozen protocol vocabulary, followed by the final Rule Freeze audit.

**No production implementation should begin before that gate.**