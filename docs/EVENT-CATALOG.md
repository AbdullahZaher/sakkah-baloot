# صكّة بلوت — Phase 14.Z.6 Proposed Canonical Event Catalog

**Date:** 2026-09-22  
**Phase:** 14.Z.6 — Action/Event Protocol Closure Preparation  
**Status:** FROZEN — OWNER APPROVED 2026-09-22  

## Purpose
Events are authoritative facts emitted by deterministic transitions. They are not client commands.

## 1. Event envelope
EventEnvelope: eventId, gameId, roundId, sequence, stateVersion, type, payload, occurredAt.
Sequence is authoritative event ordering within the game stream.

## 2. Lifecycle events
GAME_CREATED, PLAYER_JOINED, PLAYER_LEFT, PLAYER_READY, PLAYER_UNREADY, GAME_STARTED, ROUND_STARTED, ROUND_COMPLETED, MATCH_COMPLETED, GAME_CANCELLED

## 3. Seating/dealer events
SEATS_ASSIGNED, DEALER_SELECTED, DEALER_ROTATED
DEALER_ROTATED should carry explicit previous/next dealer IDs; relative-seat semantics remain derived from canonical CCW direction.

## 4. Dealing events
DEAL_STARTED, CARDS_DEALT, EXPOSED_CARD_REVEALED, FINAL_CARDS_DEALT, DEAL_COMPLETED
FINAL_CARDS_DEALT is an event, not a GamePhase. Hidden-card payloads are filtered by player projection.

## 5. Bidding events
PASS_ACCEPTED, SUN_CALLED, TRUMP_CALLED, ASHKAL_CALLED, CONTRACT_SELECTED
PASS_ACCEPTED may contain server-derived round semantics and isFinalPass. The client never supplies isFinalPass.

## 6. Escalation events
DOUBLE_CALLED, TRIPLE_CALLED, QUADRUPLE_CALLED, GAHWA_CALLED, ESCALATION_FINALIZED
GAHWA is an immediate match-winning outcome and must resolve through the canonical terminal path.

## 7. Project events
PROJECT_DECLARED, PROJECT_REVEALED, PROJECT_COMPARED, PROJECT_AWARDED, PROJECT_DISCARDED
Lifecycle: DECLARED → REVEALED → COMPARED → AWARDED or DISCARDED.
Project Raw and Qaid are derived server-side; declaration does not itself award score.

## 8. Baloot events
BALOOT_DECLARED, BALOOT_AWARDED, BALOOT_DISCARDED
Baloot remains independent from normal Project Winner ownership.

## 9. Kasho/cancellation events
KASHO_DECLARED, HAND_CANCELLED
Canonical Kasho cancellation: score awarded false, round score null, match score unchanged, dealer rotates right.

## 10. Incident events
INTEGRITY_INCIDENT_DETECTED, INTEGRITY_INCIDENT_DECISION_REQUIRED, INTEGRITY_INCIDENT_CONTINUED, INTEGRITY_INCIDENT_CANCELLED
Canonical matrix: accidental exposure = affected opposing team choice, continue/cancel, 0–0 on cancel, rotate right; wrong card count = affected opposing team if recoverable or server if impossible, continue/cancel or auto-cancel, 0–0, rotate right; duplicate/impossible deck = server, auto-cancel, 0–0, rotate right; purchase before completion/out of turn = affected opposing team when committed, continue/cancel, 0–0, rotate right; illegal Double/Ashkal committed anomaly = integrity path; unrecoverable integrity violation = auto-cancel, 0–0, rotate right.
Invalid client requests are ordinary rejections, not gameplay incidents.

## 11. Playing events
CARD_PLAYED, TRICK_COMPLETED, TURN_CHANGED
CARD_PLAYED contains playerId, cardId, trickNumber, ikaDeclared. Server determines whether Ika is valid. Invalid Ika emits no CARD_PLAYED and causes no mutation.

## 12. Scoring events
KABOOT_RESOLVED, REVERSE_KABOOT_RESOLVED, ROUND_SCORED
Round scoring should expose structured cardRaw, projectRaw, balootRaw, contractRaw, contractResult, convertedQaid, projectQaid, balootQaid, and finalQaid.
Kaboot uses the dedicated flat table: Hokum 25/25/25/25, Sun 44/44, Reverse Kaboot 88 independent. Gahwa overrides Kaboot.

## 13. Match-end events
MATCH_END_EVALUATED, MATCH_COMPLETED
MATCH_END_EVALUATED is internal/domain terminology if retained; it is not a client GamePhase.

## 14. Recovery/system events
TIMEOUT_TRIGGERED, FORFEIT_RECORDED, RESYNC_SERVED
RESYNC_SERVED may remain transport metadata rather than gameplay event-log data.

## 15. Frozen Event Ordering
Events from one accepted transition are deterministic and monotonically sequenced.
Representative card completion: CARD_PLAYED → TRICK_COMPLETED → TURN_CHANGED.
Representative round completion: KABOOT_RESOLVED or REVERSE_KABOOT_RESOLVED when applicable → ROUND_SCORED → MATCH_END_EVALUATED if retained → ROUND_COMPLETED or MATCH_COMPLETED.
Exact ordering must be frozen in 09-state-transitions.md.

## 16. Projection/security
Player-facing events are projections of authoritative facts. Never expose opponent hidden cards, future deck order, private unrevealed projects, RNG seed, or private server/moderation data.

## 17. Intentionally excluded internal labels
COMPLETE_DEAL, MATCH_END_CHECK, TRICK_RESOLUTION, PROJECT_RESOLUTION, CONTRACT_RESOLUTION are internal transition/resolution concepts, not client GamePhase values and not required client protocol events.

## 18. Freeze status
1. AD-01 through AD-05: accepted.
2. Action catalog: frozen.
3. Event ordering: frozen above.
4. Event payloads: reconciled with `07-game-state.md` and `08-actions.md`.
5. Remaining rule/provenance decisions: closed by Phase 14.Z.12.
6. Rule Freeze Gate: ready to pass.

**Production code remains unauthorized.**