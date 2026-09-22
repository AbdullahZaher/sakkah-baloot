# صكّة بلوت — Sakkah Baloot

## Project

**Arabic name:** صكّة بلوت  
**Internal identifier:** `sakkah-baloot`  
**Product description:** An authoritative, server-side multiplayer mobile Baloot card game targeting Saudi players. Pure rules-faithful implementation with no pay-to-win mechanics.

---

## Purpose of this Package

This repository contains the **complete Foundation documentation** for صكّة بلوت — eleven structured specification documents that collectively define the product vision, product scope, game rules, card system, and the full game engine contract (dealing, bidding, playing, scoring, game state, actions, and state transitions).

These documents are the **single source of truth** from which all implementation work must derive. No implementation agent may invent or silently resolve any item marked `OPEN_DECISION` or `NOT_FROZEN`.

---

## Foundation Documents

| # | Document | Path | Status |
|---|-----------|------|--------|
| 01 | Product Vision | `docs/product/01-product-vision.md` | Draft |
| 02 | Product Scope | `docs/product/02-product-scope.md` | Draft |
| 03 | Game Rules | `docs/game/01-game-rules.md` | Draft / NOT FROZEN |
| 04 | Card System | `docs/game/02-card-system.md` | Draft / NOT FROZEN |
| 05 | Dealing | `docs/game/03-dealing.md` | Draft / NOT FROZEN |
| 06 | Bidding | `docs/game/04-bidding.md` | Draft / NOT FROZEN |
| 07 | Playing | `docs/game/05-playing.md` | Draft / NOT FROZEN |
| 08 | Scoring | `docs/game/06-scoring.md` | Draft / NOT FROZEN |
| 09 | Game State | `docs/game/07-game-state.md` | Draft / NOT FROZEN |
| 10 | Actions | `docs/game/08-actions.md` | Draft / NOT FROZEN |
| 11 | State Transitions | `docs/game/09-state-transitions.md` | Draft / NOT FROZEN |

---

## Documentation Status

All 11 Foundation documents are **Draft for Review** and are **intentionally NOT FROZEN**.

The documents contain explicit `OPEN_DECISION` markers for unresolved rule-profile decisions. These must not be resolved by implementation agents without formal approval.

---

## Document Dependencies

Reading order follows the dependency chain:

```
Product Vision → Product Scope → Game Rules → Card System → Dealing → Bidding → Playing → Scoring → Game State → Actions → State Transitions
```

See `docs/FOUNDATION-DEPENDENCIES.md` for the full dependency graph.

---

## Current Open Decisions

The following rule-profile decisions are **explicitly unresolved** and must not be invented by implementation agents:

- Bidding variants (exact round-1 / round-2 mechanics)
- Ashkal eligibility and resolution
- Dealer rotation rule
- Dealing sequence (3+2 / exposed card / completion variants)
- Exposed-card ownership and behavior
- سرا (SERA) exact eligibility and value per variant
- Baloot timing and value
- Doubling / Triple / Quadruple / Coffee / Kaboot mechanics
- Tie-handling rules
- Match-ending rules (target score, win condition)
- Timeout behavior for each phase
- Final rule profile selection (which Saudi Baloot source to follow)
- Exact matchmaking and rating algorithms
- Monetization pricing
- Final visual identity

---

## Critical Terminology

| Correct Arabic | Incorrect (DO NOT USE) | Internal ID |
|---|---|---|
| سرا | سيرة | SERA |

The project naming is `صكّة بلوت` / `Sakkah Baloot`. Do not use `سيرة` anywhere in engine, protocol, database, analytics, or documentation.

---

## Next Recommended Engineering Phase

After the complete Foundation set has been reviewed and approved together:

1. **Rule Profile Selection** — choose one authoritative Baloot rules source and freeze all `OPEN_DECISION` items.
2. **Technical Architecture** — monorepo setup, package contracts, protocol design, API shape.
3. **UX Flow** — screen map, player flows, error states.
4. **M0 — Foundation** — repository scaffolding, TypeScript config, engine package, server shell, test infrastructure.
5. **M1 — Deterministic Game Engine** — card model, deal, bid, play, score, state transitions.
6. **M2–M6** — per milestones in `docs/product/02-product-scope.md`.

---

## Additional Documentation

| Document | Path | Purpose |
|---|---|---|
| Foundation Index | `docs/FOUNDATION-INDEX.md` | Canonical reading order and per-document summary |
| Dependency Map | `docs/FOUNDATION-DEPENDENCIES.md` | Inter-document dependency graph |
| Consolidation Report | `docs/FOUNDATION-CONSOLIDATION-REPORT.md` | ZIP extraction, duplicate detection, and validation results |
| Consistency Audit | `docs/FOUNDATION-CONSISTENCY-AUDIT.md` | Cross-document consistency issues |

---

*This package was consolidated from 11 Foundation ZIP files on 2026-09-21. No document content was modified during consolidation.*
