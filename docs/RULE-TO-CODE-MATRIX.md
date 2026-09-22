# Rule → Code Traceability Matrix

**Document:** `docs/RULE-TO-CODE-MATRIX.md`
**Date:** 2026-09-22
**Chain:** Rule → RuleProfile → State → Action → Event → Transition → Resolver → Test.
**Code-side reality:** no engine, no tests exist — every Resolver/Test cell is MISSING. Doc-side cells cite the canonical source. Any row without a complete chain is a Freeze blocker: **all 30 rows are blockers on the code side.**

Legend: ✅ documented · ❌ missing · ⚠️ documented but contested/gapped (see notes).

| # | Area | Rule | RuleProfile | State | Action | Event | Transition | Resolver | Test |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Seats | ✅ 01 seats/teams | ✅ fixed | ✅ 07 | n/a (setup) | ✅ setup events (09) | ✅ seating (09) | ❌ | ❌ |
| 2 | Direction | ✅ 01 CCW N→W→S→E | ✅ `direction` | ✅ dealer/seat state | n/a | ✅ rotation event (spec) | ✅ rotation | ❌ | ❌ |
| 3 | Dealing | ✅ 01 (5/exposed/8) | ✅ dealing block | ✅ hands/deck | ✅ system deal | ⚠️ CARDS_DEALT (unfrozen catalog) | ✅ deal transitions | ❌ | ❌ |
| 4 | Exposed card | ✅ 01 + RD-01 amendment | ✅ `exposedCardOwner` | ✅ exposed zone | ✅ reveal (system) | ⚠️ EXPOSED_CARD_REVEALED (unfrozen) | ✅ expose/complete | ❌ | ❌ |
| 5 | Ashkal | ✅ 01 + RD-10 protocol | ✅ ashkal block | ✅ ContractActors | ⚠️ CALL_ASHKAL (AD-01 open) | ⚠️ ASHKAL_CALLED (unfrozen) | ✅ Ashkal resolution §7 | ❌ | ❌ |
| 6 | Bidding | ✅ two rounds (01/04) | ⚠️ option sets/priorities open | ✅ bidding state | ⚠️ PASS/PASS_FINAL (AD-01) | ⚠️ bid events (unfrozen) | ✅ bid transitions | ❌ | ❌ |
| 7 | PASS/PASS_FINAL | ✅ semantic split (01) | ✅ `passFinalBlocksLaterAshkal` | ✅ playerStatus | ⚠️ wire form AD-01 | ⚠️ unfrozen | ✅ pass transitions | ❌ | ❌ |
| 8 | Escalation | ✅ 01 window + chains | ✅ escalation block | ✅ multiplier+mode | ⚠️ escalation actions (unfrozen) | ⚠️ ESCALATION_CHANGED (unfrozen) | ✅ window transitions | ❌ | ❌ |
| 9 | Open/Locked Hokum | ✅ 01 leading-only + game/10 §17–18 (Ika interplay specified) | ✅ `hokumPlayMode` | ✅ playMode | n/a (mode derived) | ⚠️ unfrozen | ✅ lead-legality branch | ❌ | ❌ |
| 10 | Projects | ✅ 01 lifecycle/values | ✅ values/multiplier | ✅ project state | ⚠️ DECLARE_PROJECT (unfrozen) | ⚠️ PROJECT_DECLARED/RESOLVED (unfrozen) | ✅ declare/compare/award | ❌ | ❌ |
| 11 | Project ranking | ✅ 05 truth table | ✅ `sequenceRank`+tieBreak | ✅ comparison inputs | n/a (derived) | n/a (derived) | ✅ rank comparator | ❌ | ❌ |
| 12 | Project ties | ✅ dealer-CCW priority (05/01) | ✅ `tieBreak` | ✅ tied projects | n/a | ⚠️ unfrozen | ✅ tie-break branch | ❌ | ❌ |
| 13 | Project Pool | ✅ 01 (winner-team pool) | ⚠️ pool rule stated, no dedicated key | ✅ pool state | n/a | ⚠️ unfrozen | ✅ pool formation | ❌ | ❌ |
| 14 | Baloot | ✅ 01 + RD-08 (absorbed) | ✅ baloot block | ✅ Baloot state | ⚠️ declaration action (unfrozen) | ⚠️ BALOOT_DECLARED (unfrozen) | ✅ Baloot resolution | ❌ | ❌ |
| 15 | Ika | ✅ game/10 §10–11 + Phase 14.Z.3 G-2/G-2P | ✅ `ika` predicate + partnerExemption | ⚠️ `ikaDeclared` on CARD_PLAYED | ⚠️ declaration action remains protocol-unfrozen | ⚠️ event catalog unfrozen | ✅ reject-no-mutation rule specified | ❌ | ❌ |
| 16 | Cutting | ❌ no rule content (open variant per 01-game-rules) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 17 | Must Trump | ✅ game/10 §12–14 + Phase 14.Z.3 G-1 | ✅ `trickLegality.nonTrumpLedNoLeadSuit` | ⚠️ hand/led state exists | ✅ PLAY_CARD | ⚠️ unfrozen | ⚠️ rule specified; resolver/test implementation missing | ❌ | ❌ |
| 18 | Must Overtrump | ✅ game/10 §14 + Phase 14.Z.3 G-1 | ✅ `trickLegality` trump cases | ⚠️ trick state exists | ✅ PLAY_CARD | ⚠️ unfrozen | ⚠️ rule specified; resolver/test implementation missing | ❌ | ❌ |
| 19 | Contract success | ✅ 01 (≥65/≥81, tie buyer) | ✅ `successThreshold` | ✅ contract raw | n/a (derived) | ⚠️ unfrozen | ✅ success branch | ❌ | ❌ |
| 20 | Contract failure | ✅ 01 (full value to opponent) | ✅ `buyerFailureAllocation` | ✅ contract raw | n/a (derived) | ⚠️ unfrozen | ✅ failure branch | ❌ | ❌ |
| 21 | Qaid conversion | ⚠️ mode declared, **exact table MISSING** | ❌ table absent | ✅ raw totals | n/a | ⚠️ unfrozen | ⚠️ conversion unimplementable | ❌ | ❌ |
| 22 | Kaboot | ⚠️ values OK; ⚠️ escalation formula contradicted (F-01) | ⚠️ escalation table absent | ✅ trick counts | n/a (derived-only) | ⚠️ KABOOT_RESOLVED (unfrozen) | ✅ detection branch | ❌ | ❌ |
| 23 | Reverse Kaboot | ✅ 01 + RD-09 protocol + profile | ✅ reverse block | ✅ initialHands requirement | n/a (derived-only) | ⚠️ unfrozen | ✅ reverse predicate | ❌ | ❌ |
| 24 | Kasho | ✅ 01 + profile (baseline) | ✅ kasho block + ROTATE_RIGHT | ✅ hand state | ⚠️ KASHO_DECLARED (unfrozen) | ⚠️ KASHO_DECLARED/HAND_CANCELLED (unfrozen) | ✅ cancel path | ❌ | ❌ |
| 25 | All Pass | ✅ 01/04 (cancel 0–0 rotate) | ✅ (via kasho cancel fields) | ✅ bidding-failed | ✅ system cancel | ⚠️ HAND_CANCELLED (unfrozen) | ✅ cancel path | ❌ | ❌ |
| 26 | Gahwa | ✅ 01 terminal + profile | ✅ gahwa block | ✅ escalation state | ⚠️ Gahwa call action (unfrozen) | ⚠️ GAHWA_RESOLVED (unfrozen) | ✅ MATCH_WIN branch | ❌ | ❌ |
| 27 | Hand termination | ✅ 04 matrix (7 paths) | ⚠️ incident policy absent | ✅ termination state | ⚠️ cancel/continue actions (unfrozen) | ⚠️ unfrozen catalog | ✅ resolver spec | ❌ | ❌ |
| 28 | Match end | ✅ 01 (152 / higher-wins / extra-deal) + profile | ✅ match block | ✅ match score | n/a (derived) | ⚠️ MATCH_FINISHED (unfrozen) | ✅ end-check branch | ❌ | ❌ |
| 29 | Replay | ✅ determinism constraints (01/09) | ✅ immutable profile | ✅ snapshots (07) | ✅ action log (spec) | ⚠️ schema unfrozen (AD-02/03/04) | ✅ replay reducer (spec) | ❌ | ❌ |
| 30 | Hidden information | ✅ server-authoritative, no leaks (all docs) | n/a | ✅ player projection (07) | ✅ intent-only actions | ⚠️ projection filtering unproven | ✅ projection boundary | ❌ | ❌ |

**Result:** 0/30 rows complete on the code side. Phase 14.Z.3 has closed the documentation-level trick-legality gaps G-1/G-2/G-2P/G-3; Resolver/Test cells remain intentionally MISSING because production implementation is not authorized while Rule Freeze is BLOCKED.
