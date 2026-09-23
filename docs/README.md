# صكّة بلوت — Documentation

## Canonical implementation documents

### Rules
- `docs/02-RULE-PROFILE-SA.md` — Saudi Rule Profile v1.
- `docs/game/01-game-rules.md` through `docs/game/10-legal-move-specification.md` — canonical game domain specifications.

### Protocol
- `docs/ACTION-CATALOG.md` — frozen action vocabulary.
- `docs/EVENT-CATALOG.md` — frozen event vocabulary and ordering.
- `docs/RULE-TO-CODE-MATRIX.md` — rule traceability.

### Freeze authority
- `docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md` — Owner decisions.
- `docs/FOUNDATION-RULE-CONFLICT-REGISTER.md` — active conflict/status register.
- `docs/FOUNDATION-PHASE-14Z.10-R-CONSOLIDATED-FREEZE-BLOCKER-MATRIX.md` — final blocker ledger.
- `docs/FOUNDATION-PHASE-14Z.10-R-DECISION-CLOSURE-LEDGER.md` — closure history.
- `docs/FOUNDATION-PHASE-14Z.11-FINAL-RULE-CLOSURE-AUDIT.md` — final closure audit.
- `docs/RD-20-RULE-FREEZE-v1.md` — Rule Freeze v1 certificate.

### Specialized protocols
- `docs/RD-01-EXPOSED-CARD-AMENDMENT-ASHKAL.md`
- `docs/RD-09-KABOOT-REVERSE-KABOOT-RESOLUTION-PROTOCOL.md`
- `docs/RD-10-ASHKAL-ELIGIBILITY-AND-RESOLUTION-PROTOCOL.md`

### Phase 18 — Competitive AI
- `docs/PHASE-18-READINESS.md` — Phase 18 scope, gates, authority and exit criteria.
- `docs/PHASE-18-AI-ARCHITECTURE.md` — AI architecture, observation model, belief model, IS-MCTS and endgame strategy.
- `docs/PHASE-18-DECISION-LEDGER.md` — frozen Phase 18 architectural decisions.
- `docs/PHASE-18-ACCEPTANCE-CRITERIA.md` — implementation and closure gates.

### Product
- `docs/product/01-product-vision.md`
- `docs/product/02-product-scope.md`

## Documentation policy

Rule Freeze v1 is the implementation authority. Historical audit artifacts and superseded decision drafts are intentionally removed from the active documentation tree. New rule changes require a new Rule Freeze revision; do not modify frozen rules silently.

Phase 18 documentation is architectural until its readiness gates are explicitly passed. AI design decisions must not silently alter canonical game rules.
