# صكّة بلوت — Canonical Rule Inventory (Phase 14)

**Document:** `docs/FOUNDATION-CANONICAL-RULE-INVENTORY.md`
**Phase:** 14 — Canonical Rule Resolution (inventory only)
**Date:** 2026-09-22
**Policy:** CAPTURE ONLY. Unresolved cells are left explicitly unresolved. No assumptions fill any gap.

**Status key:** **A** EXPLICIT FOUNDATION FACT · **B** FOUNDATION RULE PROFILE DECISION (hook exists, value missing) · **C** RULE OWNER DECISION REQUIRED · **D** EXTERNAL AUTHORITATIVE SOURCE REQUIRED (adoption is still the Owner's act) · **E** STILL UNRESOLVED (no hook, no evidence).
**Architecture tag:** ARCH — owned by `FOUNDATION-ARCHITECTURE-DECISIONS.md`, not resolved here.

---

| Rule Area | Canonical Fact | Source | Status | Decision Needed |
|---|---|---|---|---|
| Players / seats | 4 players; seats NORTH/EAST/SOUTH/WEST; partners opposite | `01-game-rules.md §2.1`, `03-dealing.md §4` | A | None |
| Teams | Team A = NORTH+SOUTH; Team B = EAST+WEST; fixed for match | `01-game-rules.md §2.1`, `07-game-state.md §12–13` | A | None |
| Deck | 32 cards; 4 suits × 8 ranks (7,8,9,10,J,Q,K,A); canonical `SUIT_RANK` identity | `01-game-rules.md §2.3`, `02-card-system.md §3–5` | A | None |
| Card ranking — Sun | A > 10 > K > Q > J > 9 > 8 > 7 | `01-game-rules.md §5.1`, `02-card-system.md §10` | A | None |
| Card ranking — Trump | J > 9 > A > 10 > K > Q > 8 > 7 | `01-game-rules.md §5.2`, `02-card-system.md §11` | A | None |
| Card values — tables | Sun and Trump point tables as documented | `01-game-rules.md §6`, `02-card-system.md §14`, `06-scoring.md §7` | A | None (values canonical; totals transcription pending EC-01) |
| Sun arithmetic | Base 120, bonus +10, total 130 | Card tables (arithmetic) | A | Editorial confirmation EC-01, then DF-01/DF-02 |
| Hokm arithmetic | Base 152, bonus +10, total 162 | Card tables; `01-game-rules.md §6.2`, `06-scoring.md §8` | A | None |
| Dealing — structure | 3+2 = 5 cards/player (20); 1 exposed; completion to 8/player; 32-card conservation invariant | `03-dealing.md §13–20`, `01-game-rules.md §7` | A (structure) | Timing/position details — C (OD-DL-03/04) |
| Dealing — exposed fate | — (nothing documented) | — | C | RD-01 |
| Dealing — direction | Contradicted (CW vs CCW statements) | `01-game-rules.md §2.2`, `03-dealing.md §5`, `05-playing.md §5` | C | RD-02 |
| First dealer | Mechanism entirely unspecified | `03-dealing.md §8`, `01-game-rules.md §8` | C | Owner: selection mechanism |
| Dealer rotation | Deterministic via Rule Profile | `01-game-rules.md §8`, `03-dealing.md §7` | B | Rotation rule value; depends RD-02 |
| Bidding — structure | Two rounds; R1 exposed-suit Hokm / Sun / pass (+Ashkal option shape); R2 alternate Hokm / Sun / pass; BIDDING_FAILED path exists | `04-bidding.md §4–19` | A (structure) | Option sets + priorities — C (OD-BD-02…05) |
| Bidding — start seat | "Player to dealer's right" consistently stated, direction-relative | `04-bidding.md §5`, `05-playing.md §6`, `01-game-rules.md §15` | B/C | Seat follows RD-02 by derivation |
| Bidding — wire actions | BUY_* domain labels vs CALL_* authoritative wire model (doc gap DF-04) | `04-bidding.md §8`, `08-actions.md §1` | ARCH | AD-01 |
| PASS vs PASS_FINAL | Semantically distinct in bidding doc; single PASS in actions doc | `04-bidding.md §18–19`, `08-actions.md §21` | ARCH | AD-01 |
| Contracts — shape | SUN / TRUMP+suit / ASHKAL documented; purchaser + source + receiver provenance fields documented | `01-game-rules.md §10`, `02-card-system.md §9`, `04-bidding.md §21/§24` | A (layered) | Layer boundary — ARCH (AD-05); Ashkal representation — C (RD-10) |
| Ashkal — convention shape | Sun-style; caller ≠ exposed receiver; receiver = caller's partner | `04-bidding.md §11–13` | A (shape) | Eligible seats — C (RD-10) |
| Follow suit — core | Must follow led suit if held; engine-owned `getLegalCards` | `01-game-rules.md §13`, `05-playing.md §15–17` | A | Void-trump obligation — C (OD-PL-02) |
| Trick play — structure | 8 tricks/round; 4 plays/trick; led-suit fixed; Trump-beats / led-suit-wins logic; winner leads next | `05-playing.md §4–29`, `01-game-rules.md §14–16` | A | First leader seat — via RD-02; timeout auto-action — C (OD-PL-03) |
| Last-trick bonus | +10 raw points, awarded exactly once, applied by Scoring | `01-game-rules.md §17`, `05-playing.md §55`, `06-scoring.md §9` | A | Whether 10 is uniform across contracts — C (OD-PL-04) |
| Projects — types | SERA / FIFTY / HUNDRED / FOUR_HUNDRED / BALOOT; sequence ranking A-K-Q-J-10-9-8-7; non-overlap principle | `01-game-rules.md §18–21`, `06-scoring.md §11–13` | A | Combination edge cases — C (OD-CS-04) |
| Projects — Qaid values | Draft tables only | `06-scoring.md §14–18`, `§32` | C | RD-06 (do not promote drafts) |
| Projects — raw values | Table must be frozen; not inferable from Qaid | `06-scoring.md §31` | C | RD-06 |
| Projects — declaration | Lifecycle + DECLARE_PROJECT + window framing documented | `06-scoring.md §23–24`, `08-actions.md §27–28`, `09-state-transitions.md §18–19` | B/C | Close condition + NONE + ordering — C (RD-05) |
| Projects — comparison | Priority ordering sketched; tie-breaks unspecified | `06-scoring.md §26–27`, `§55–56` | C | Algorithm — C (OD-SC-11/12) |
| Baloot — combination | K+Q of trump; 2 Qaid; multiplier-excluded | `06-scoring.md §19`, `§35` | A | Timing + miss + coexistence — C (RD-08) |
| Kaboot — outcome | 8–0 tricks; server-derived detection (no player action) | `06-scoring.md §41`, Phase 13.5 + forensic verification | A | Values + project interaction — C (RD-07) |
| Doubling — model | NORMAL/DOUBLE/TRIPLE/QUADRUPLE/COFFEE; ×1/×2/×3/×4; Coffee distinct state; Baloot + Kaboot-base excluded from multiplication | `01-game-rules.md §25`, `06-scoring.md §33–37`, `§59` | A | Window + terminal + Coffee win — C (RD-03/04) |
| Scoring — architecture | Raw vs Qaid separation; pipeline order; SUCCESS/DRAW/FAILURE evaluation shape; integer arithmetic | `01-game-rules.md §26–30`, `06-scoring.md §3–6`, `§38–51` | A | Conversion exactness, failure-transfer values, thresholds — C |
| Qaid conversion | Simplified ÷5 (Sun) / ÷10 (Hokm) representations documented as common, not frozen | `06-scoring.md §45–47` | C | Exact rounding/threshold rules — C |
| Match target | 152 Qaid points («152 نقطة قيد») | `01-game-rules.md §4` | A | Both-cross tie-break — C (OD-SC-21); doubled-tie rule — C (OD-SC-19) |
| Match end — flow | updateScores → checkMatchEnd → GAME_RESULT or next dealer + new hand | `01-game-rules.md §31`, `09-state-transitions.md §25–28` | A (flow) | End-condition detail — C |
| Redeal — path | BIDDING_FAILED → redeal per Rule Profile (path exists) | `04-bidding.md §19` | A (existence) | Procedure — C (RD-09); matrix row — doc gap DF-05 |
| State lifecycle — mechanics | Transition pipeline, +1 stateVersion, idempotency, RESYNC-excluded-from-version, atomic commit | `09-state-transitions.md §6–8`, `§36–38`, `07-game-state.md` | A | Phase-name strings — ARCH (AD-02/03/04) |
| Server authority / hidden info / determinism | Universal across all documents; no contradiction found (Phase 12 Stage 13) | All Foundation docs | A | None |
| Ika cases; cutting/dag; Kawesh/Saneen; Hokm↔Sun edge transitions; Sakkah deviations | Listed open, no content | `01-game-rules.md §51`, `04-bidding.md §54` | C/E | Owner decisions (OD-GR-01/03, OD-BD-12, OD-GR-12/13) |

---

## Canonicalization Readiness per Area

* **Canonical (no decision needed):** players, seats, teams, deck, rankings, card-value tables, Hokm totals, trick-play structure, follow-suit core, last-trick bonus existence/amount, scoring pipeline shape, server authority, state mechanics.
* **Arithmetic-complete, transcription-pending:** Sun 120/+10/130 (EC-01 → DF-01/DF-02).
* **Blocked on RD-01…RD-10:** dealing completion, direction-dependent order, doubling, Coffee, declaration window, project values, Kaboot values, Baloot timing, redeal, Ashkal seats.
* **Blocked on wider catalogue:** Ika formula, cutting/dag, Kawesh/Saneen, tie-breaks, conversion exactness, first dealer, timeout policy, void-trump obligation (see Phase 14 Report §8).
* **Architecture-owned (not rules):** AD-01…AD-05.
