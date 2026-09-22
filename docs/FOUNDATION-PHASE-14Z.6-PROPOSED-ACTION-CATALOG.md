# صكّة بلوت — Phase 14.Z.6 Proposed Canonical Action Catalog

**Date:** 2026-09-22  
**Phase:** 14.Z.6 — Action/Event Protocol Closure Preparation  
**Status:** PROPOSED — NOT FROZEN  

## Purpose
This catalog converts current Foundation decisions into one explicit action vocabulary. It is a proposal only and does not silently freeze AD-01 through AD-05.

## 1. Action envelope
ActionEnvelope: actionId, gameId, authenticated playerId, type, payload, expectedStateVersion, optional clientSequence, optional sentAt.
- playerId comes from authenticated identity.
- expectedStateVersion is the concurrency input.
- actionId is the idempotency key.
- server time is authoritative.
- rejected actions do not mutate gameplay state.

## 2. Proposed player/domain actions

Lobby: CREATE_GAME, JOIN_GAME, LEAVE_GAME, READY, UNREADY, START_GAME, CANCEL_GAME

Bidding: PASS, CALL_SUN, CALL_TRUMP, CALL_ASHKAL

PASS_FINAL is intentionally not a wire action in this proposal. The server derives first-round versus final-pass semantics from authoritative BiddingState.phase.

Projects: DECLARE_PROJECT
Baloot: DECLARE_BALOOT
Escalation: DOUBLE, TRIPLE, QUADRUPLE, GAHWA
Playing: PLAY_CARD
Kasho: DECLARE_KASHO
Resynchronization: RESYNC_GAME

## 3. System actions
SYSTEM_START_ROUND, SYSTEM_DEAL, SYSTEM_TIMEOUT, SYSTEM_RESOLVE_TRICK, SYSTEM_SCORE_ROUND, SYSTEM_END_MATCH, SYSTEM_FORFEIT, SYSTEM_CANCEL_HAND, SYSTEM_INCIDENT_RESOLUTION

System actions are not player permissions and still pass through the authoritative transition boundary.

## 4. Intentionally excluded player commands
DEAL_CARDS, CHOOSE_DECK, SET_EXPOSED_CARD, DECLARE_KABOOT, SET_SCORE, SET_QAID, SET_MULTIPLIER, SET_WINNER, SET_CONTRACT, COMPLETE_DEAL, MATCH_END_CHECK

These are server-derived transitions or results, not player intent.

## 5. Canonical payload principles
- PASS: empty payload.
- CALL_TRUMP: suit only.
- CALL_ASHKAL: empty payload; server derives buyer/team/exposed-card recipient.
- DECLARE_PROJECT: project type; server verifies authoritative card ownership and eligibility.
- DECLARE_BALOOT: empty payload.
- DOUBLE/TRIPLE/QUADRUPLE/GAHWA: empty payload; server determines eligibility and resulting state.
- PLAY_CARD: cardId only. Client does not send led suit, winner, trick number, trump status, Ika validity, or legality result.
- DECLARE_KASHO: empty payload; server determines eligibility and canonical CCW priority.

## 6. Proposed domain union
PlayerAction = CreateGameAction | JoinGameAction | LeaveGameAction | ReadyAction | UnreadyAction | StartGameAction | CancelGameAction | PassAction | CallSunAction | CallTrumpAction | CallAshkalAction | DeclareProjectAction | DeclareBalootAction | DoubleAction | TripleAction | QuadrupleAction | GahwaAction | PlayCardAction | DeclareKashoAction.
System actions remain a separate union.

## 7. Canonical validation order
Envelope → Authentication → Authorization → Idempotency → State-version check → Phase validation → Turn/actor validation → Payload validation → Rule validation → Candidate transition → Invariant validation → Commit.

## 8. Action semantics
Accepted action: deterministic next state, one gameplay stateVersion increment for a mutation, ordered authoritative events.
Rejected action: no gameplay mutation and no gameplay stateVersion increment.
Duplicate accepted actionId: never execute twice; return the original committed result where possible.

## 9. Freeze blockers
1. AD-01 through AD-05 must be explicitly accepted or revised.
2. Event catalog must be accepted.
3. 08-actions.md and 09-state-transitions.md must be reconciled.
4. Remaining rule/provenance conflicts must be closed.
5. Rule Freeze Gate must pass.

**Production code remains unauthorized.**