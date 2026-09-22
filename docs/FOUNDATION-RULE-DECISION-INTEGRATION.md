# صكّة بلوت — Foundation Rule Decision Integration

**Phase:** 14.x — Rule Canonicalization & Decision Integration  
**Date:** 2026-09-22  
**Status:** CANONICALIZATION IN PROGRESS  
**Rule Freeze:** NOT AUTHORIZED

## 1. Authority hierarchy

1. Explicit Rules Owner decision.
2. Canonical project rule documents.
3. Saudi competitive/official rule source.
4. Secondary references.
5. Inference — never sufficient to resolve a rule.

## 2. Rules Owner decisions

### RD-01 — Exposed Card Fate
**RESOLVED**

The exposed card becomes part of the buyer's hand. On completion, the buyer receives the exposed card + 2 hidden cards; every other player receives 3 hidden cards.

Final hands: 8 cards each.

### RD-02 — Direction
**RESOLVED**

Direction is **counter-clockwise** and applies globally to:
- dealing;
- bidding;
- trick play;
- dealer rotation;
- seat-relative terminology.

"Right of dealer" must be derived from this direction.

### RD-04 — Gahwa
**RESOLVED**

Gahwa immediately ends the match in favor of the winning side. It is not an ordinary score multiplier.

`GAHWA -> MATCH_COMPLETE`

## 3. Research-supported, not silently frozen

### RD-03 — Doubling
Research supports:
`DOUBLE -> TRIPLE -> FOUR -> GAHWA` in Hokum and `DOUBLE` only in Sun.

Escalation ownership:
`Opponent -> Buyer -> Doubler -> Buyer`

Research also supports the documented open/locked behavior. The exact engine boundary of the doubling window remains open because sources differ in wording.

### RD-05 — Projects
Research supports declaration in the first trick and reveal/comparison in the second trick. Edge cases remain open.

### RD-06 — Project values
Research-supported baseline:
- Hokum: Sera 2, Fifty 5, Hundred 10, Baloot 2.
- Sun: Sera 4, Fifty 10, Hundred 20, Four Hundred 40.

Baloot does not multiply with doubling.

### RD-07 — Kaboot
Research-supported baseline:
- Hokum = 25.
- Sun = 44.
- Detection is derived from trick results, not a player action.
Special reversed-Kaboot handling remains subject to canonical verification.

### RD-08 — Baloot
Research-supported:
- K + Q of trump.
- Value = 2.
- Declaration during the second card, before it lands.
- Does not multiply with doubling.
A material source conflict remains around Baloot inside Hundred.

### RD-09 — Kasho / Redeal
Research-supported:
- Initial five all from 9/8/7 qualify for the documented Bushat condition.
- Second-round all-pass cancels the hand without score and advances dealing.
- Certain dealing violations give the opposing side a continue/redeal choice.

### RD-10 — Ashkal
Research-supported:
- Caller is the buyer.
- Partner receives the exposed card.
- Contract resolves as Sun.
- Eligibility depends on seat and bidding history.
Exact seat mapping must be canonicalized against RD-02.

## 4. Architecture rules

- Rule-specific values live in Rule Profile.
- Core Game Engine imports no React/Expo/Supabase/Redis/Postgres/WebSocket/UI code.
- Server is authoritative.
- Hidden information is never sent to clients.
- Kaboot and match completion are derived outcomes, not ordinary player actions.
- OPEN/LOCKED must be represented independently from doubling level.
- Rule Profile must be immutable for a match/replay.

## 5. Freeze blockers

- Exact doubling window boundary.
- Project edge cases and ties.
- Baloot/Hundred interaction.
- Kaboot special-case interactions.
- Full Kasho/redeal matrix.
- Exact Ashkal eligibility matrix.
- Complete scoring conversion edge cases.
- Canonical GamePhase naming.
- Remaining AD-01..AD-05 architecture decisions.

Rule Freeze is not authorized until these are resolved or explicitly parameterized.


---

## Phase 14.Z.3 Integration Addendum

### CLOSED — Trick legality edge gaps

- G-1: position/card-origin matrix for partner/opponent winning with trump on table.
- G-2: exact Ika predicate.
- G-2P: exact third-player Ika partner exemption predicate.
- G-3: required verification matrix coverage.

### CLOSED — Related terminology/policy items

- V-07: generic countingSide removed.
- Kasho dealer transition: ROTATE_RIGHT.
- V-04 canonical Kaboot table remains flat Saudi baseline and has been reconciled in the active RD-09 protocol.

### Freeze status

These closures do not authorize implementation. Remaining Freeze blockers are independent items listed in the current REMAINING-ISSUES.md and architecture decision track.
