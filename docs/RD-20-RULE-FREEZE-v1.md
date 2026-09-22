# صكّة بلوت — Rule Freeze v1

**Status:** AUTHORIZED FOR PRODUCTION ENGINE IMPLEMENTATION  
**Date:** 2026-09-22

Rule Freeze v1 is the implementation authority for the frozen Saudi Rule Profile.

## Canonical set

- `docs/02-RULE-PROFILE-SA.md`
- `docs/game/01-game-rules.md` through `docs/game/10-legal-move-specification.md`
- `docs/ACTION-CATALOG.md`
- `docs/EVENT-CATALOG.md`
- `docs/RULE-TO-CODE-MATRIX.md`
- `docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md`
- `docs/FOUNDATION-RULE-CONFLICT-REGISTER.md`
- `docs/FOUNDATION-PHASE-14Z.11-FINAL-RULE-CLOSURE-AUDIT.md`

## Frozen invariants

- Counter-clockwise direction.
- 152 Qaid match target.
- Both teams crossing 152: higher final total wins.
- Equal final target totals: extra deal.
- Contract-specific integer Qaid conversion.
- Sun ≥65; Hokum ≥81.
- Failed contract allocates full contract round value to opponent.
- Successful contract preserves each team's own eligible allocation.
- Flat Kaboot values; Reverse Kaboot 88; Gahwa overrides.
- Project Raw is immutable; DOUBLE ×2; TRIPLE/FOUR ×1; Baloot ×1.
- Sun Double only within the frozen contract-finalization/final-cards window.
- Deterministic persisted first dealer.
- Bidding timeout 8s → PASS.
- Playing timeout 30s → AFK/disconnect handling; no random card.
- Server-authoritative incidents and Kasho.
- One wire PASS action; final-pass semantics are server-derived.
- Frozen action/event vocabulary and deterministic event ordering.
- Pure domain engine boundary: no UI, transport, database, Redis, or WebSocket dependencies.

## Implementation authorization

Production implementation may begin with the pure TypeScript domain engine. Rule changes require a new Rule Freeze revision.
