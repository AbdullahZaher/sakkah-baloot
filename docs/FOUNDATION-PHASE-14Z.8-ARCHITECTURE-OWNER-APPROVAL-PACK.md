# صكّة بلوت — Phase 14.Z.8 Architecture Owner Approval Pack

**Date:** 2026-09-22  
**Phase:** 14.Z.8 — Architecture Owner Approval / Reconciliation Gate  
**Status:** ACCEPTED — OWNER APPROVED 2026-09-22  
**Scope:** AD-01 through AD-05 + protocol reconciliation prerequisites

## 1. Purpose

This document is the explicit owner-approval gate identified by Phase 14.Z.7.

It does **not** freeze architecture, rules, actions, events, or production code by itself.

The purpose is to present AD-01 through AD-05 in an approval-ready form and define exactly what will happen after approval.

Source basis:
- `FOUNDATION-PHASE-14Z.5-ARCHITECTURE-DECISION-RECOMMENDATIONS.md`
- `FOUNDATION-PHASE-14Z.6-PROPOSED-ACTION-CATALOG.md`
- `FOUNDATION-PHASE-14Z.6-PROPOSED-EVENT-CATALOG.md`
- `FOUNDATION-PHASE-14Z.7-ARCHITECTURE-CONSISTENCY-AUDIT.md`

---

## 2. Owner decision protocol

For each decision below, the owner must explicitly choose one:

- **ACCEPT** — adopt the recommendation as canonical architecture.
- **REVISE** — provide a replacement decision.
- **DEFER** — leave the recommendation proposed and do not proceed to architecture freeze.

A general “continue” does not silently count as acceptance of AD-01…AD-05.

---

# 3. AD-01 — PASS / PASS_FINAL

### Proposed canonical decision

**ACCEPT candidate: A — one wire action: `PASS`.**

The client sends:

```ts
{ type: "PASS" }
```

The authoritative server derives the semantic meaning from `BiddingState.phase`:

- first-round pass;
- second-round pass;
- final-pass semantic where applicable.

`PASS_FINAL` remains domain terminology only and is **not** a trusted client wire action.

### Reason for this architecture

1. One player intent maps to one wire command.
2. The server, not the client, determines the semantic round.
3. Replay and idempotency remain simpler.
4. A stale/malicious client cannot assert a final-pass semantic that does not match authoritative state.
5. `passFinalBlocksLaterAshkal` remains derived authoritative state.

### Owner decision

- [x] ACCEPT
- [ ] REVISE
- [ ] DEFER

---

# 4. AD-02 — Canonical GamePhase

### Proposed canonical decision

Use one client-facing GamePhase enum:

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

The following remain internal concepts and are not GamePhase values:

- `GAME_CREATED`
- `COMPLETE_DEAL`
- `MATCH_END_CHECK`
- `TRICK_RESOLUTION`
- `PROJECT_RESOLUTION`
- `CONTRACT_RESOLUTION`

Canonical replacements:

| Old/stale terminology | Canonical treatment |
|---|---|
| `TRICK_PLAY` | `PLAYING` |
| `ROUND_SCORING` | `SCORING` |
| `GAME_RESULT` | `MATCH_COMPLETE` + `MATCH_COMPLETED` event |
| `COMPLETE_DEAL` lifecycle state | internal transition |
| `MATCH_END_CHECK` lifecycle state | internal branch |

### Owner decision

- [x] ACCEPT
- [ ] REVISE
- [ ] DEFER

---

# 5. AD-03 — COMPLETE_DEAL

### Proposed canonical decision

**Internal engine transition only.**

Canonical flow:

```text
CONTRACT_SELECTED
    ↓
internal COMPLETE_DEAL transition
    ↓
PROJECT_DECLARATION
```

The client never receives `COMPLETE_DEAL` as a GamePhase.

If UI animation requires the boundary, `FINAL_CARDS_DEALT` is an event rather than a new lifecycle phase.

### Owner decision

- [x] ACCEPT
- [ ] REVISE
- [ ] DEFER

---

# 6. AD-04 — MATCH_END_CHECK

### Proposed canonical decision

**Internal match-end evaluation only.**

Canonical flow:

```text
SCORING
    ↓
internal match-end evaluation
    ├── continue → ROUND_COMPLETE → ROUND_STARTING
    └── finish   → MATCH_COMPLETE
```

The client does not observe `MATCH_END_CHECK`.

### Owner decision

- [x] ACCEPT
- [ ] REVISE
- [ ] DEFER

---

# 7. AD-05 — Contract representation

### Proposed canonical decision

Use three explicit layers.

## 7.1 Domain Contract

```ts
type Contract =
  | {
      readonly type: "SUN";
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
      readonly mode: "NORMAL" | "ASHKAL";
    }
  | {
      readonly type: "TRUMP";
      readonly suit: Suit;
      readonly purchaserPlayerId: PlayerId;
      readonly source: "FIRST_ROUND" | "SECOND_ROUND";
      readonly mode: "NORMAL";
    };
```

Ashkal is normalized as:

```ts
{
  type: "SUN",
  mode: "ASHKAL"
}
```

Contract actors retain:

```ts
interface ContractActors {
  readonly buyerPlayerId: PlayerId;
  readonly buyerTeamId: TeamId;
  readonly exposedCardRecipientId: PlayerId;
}
```

## 7.2 Transport ContractDTO

Transport exposes a stable DTO but never becomes authoritative for derived fields.

## 7.3 UI representation

The UI may localize Sun/Hokum/Ashkal and source labels without changing domain or transport semantics.

### Owner decision

- [x] ACCEPT
- [ ] REVISE
- [ ] DEFER

---

# 8. Architecture invariants attached to AD-01…AD-05

If all five decisions are accepted, the following invariants become the target architecture:

1. Client sends intents, not derived outcomes.
2. Server derives semantic phase from authoritative state.
3. Client-facing phases contain stable observable lifecycle states only.
4. Internal branches do not become wire protocol accidentally.
5. Contract normalization preserves purchaser/source/Ashkal semantics.
6. Replay is based on domain state + immutable events.
7. Reconnect/resync consumes authoritative state/projection.
8. Core engine remains independent of React, Expo, Supabase, Redis, and WebSocket transport.

---

# 9. Immediate reconciliation work after acceptance

Acceptance of AD-01…AD-05 does **not** itself constitute Rule Freeze.

The next documentation-only pass should reconcile:

### 9.1 `docs/game/08-actions.md`

Normalize:

- `COFFEE` → `GAHWA`
- remove `CONFIRM_PROJECT` unless a later explicit rule decision requires it
- `CALL_ASHKAL` → empty payload
- retain one wire `PASS`
- preserve `PASS_FINAL` only as domain semantics

### 9.2 `docs/game/09-state-transitions.md`

Normalize:

- `TRICK_PLAY` → `PLAYING`
- `ROUND_SCORING` → `SCORING`
- `GAME_RESULT` → `MATCH_COMPLETE`
- `COMPLETE_DEAL` → internal transition
- `MATCH_END_CHECK` → internal branch
- reconcile direction language to canonical counter-clockwise direction
- freeze accepted-event ordering and transition boundaries

### 9.3 Event catalog

Reconcile event payloads against the authoritative state model and freeze exact ordering only after the reconciliation pass.

### 9.4 Rule → Code Matrix

Update only after architecture and Rule Freeze decisions are actually closed.

---

# 10. Remaining non-architecture Rule Freeze blockers

These are not solved by accepting AD-01…AD-05:

1. Exact Qaid conversion table transcription into canonical docs.
2. V-06b and V-11 canonical scoring transcription.
3. Cutting/Dag rule decision or explicit exclusion with provenance.
4. Bidding option sets and Sun-priority transcription.
5. Full Kasho violation/coexistence edge documentation.
6. Provenance closure for project ×3/×4 conflict.
7. Provenance closure for the broader Saudi Hokum Double-window conflict.
8. Exact event ordering/payload freeze.
9. Final Rule → Code traceability update.

These remain separate gates and must not be silently marked resolved.

---

# 11. Explicit freeze boundary

Even if AD-01…AD-05 are accepted:

```text
AD-01…AD-05 accepted
        ↓
documentation reconciliation
        ↓
remaining rule/provenance blockers closed
        ↓
event ordering + payload freeze
        ↓
Rule → Code matrix reconciliation
        ↓
final Rule Freeze audit
        ↓
ONLY THEN: production engine implementation
```

Therefore this document does **not** authorize:

- production engine implementation;
- production tests;
- transport implementation;
- database schema implementation;
- WebSocket implementation;
- bot implementation;
- UI implementation based on these proposed protocol decisions.

---

# 12. Owner response format

The cleanest approval response is:

```text
AD-01 ACCEPT
AD-02 ACCEPT
AD-03 ACCEPT
AD-04 ACCEPT
AD-05 ACCEPT
```

Or identify any item as:

```text
AD-XX REVISE: <replacement decision>
```

After explicit acceptance, the next phase can perform the documentation reconciliation without silently changing the approved architecture.

---

## 13. Current status

**Architecture recommendations:** PROPOSED  
**Owner approval:** PENDING  
**Documentation reconciliation:** NOT STARTED  
**Rule Freeze:** BLOCKED  
**Production code:** NOT AUTHORIZED
