# صكّة بلوت — Phase 14.Z.3 Canonicalization Report

**Date:** 2026-09-22  
**Scope:** Rules Owner canonicalization of trick-legality edge gaps G-1, G-2, G-2P, G-3 plus directly related tracker cleanup.  
**Implementation:** Documentation only.

## Verdict

```text
PHASE_14.Z.3 = COMPLETE
RULE_FREEZE = BLOCKED
PRODUCTION_CODE = NOT_AUTHORIZED
```

## Owner decisions integrated

### G-1 — Partner Winning + Trump on Table
CLOSED.

Legality depends on trick position and the origin of the current winning trump:
- third + partner's trump winning → any trump; no forced overtrump;
- fourth + partner's trump winning → any trump; no forced overtrump;
- opponent's trump winning + higher trump → MUST_OVERTRUMP;
- opponent's trump winning + no higher trump + player has trump → any trump;
- opponent's trump winning + no trump → remaining non-trump/other legal cards according to lead-suit rules.

### G-2 — Ika Predicate
CLOSED.

```text
HOKUM
+ LEADER
+ NON_TRUMP
+ HIGHEST_REMAINING_CARD_OF_SUIT
```

Invalid declaration rejects the complete PLAY_CARD with zero state mutation.

### G-2P — Ika Partner Exemption
CLOSED.

```text
HOKUM
+ THIRD
+ NO_LEAD_SUIT
+ PARTNER_OPENED_TRICK
+ PARTNER_IS_CURRENT_WINNER
+ (PARTNER_LEAD_IS_ACE OR PARTNER_DECLARED_VALID_IKA)
→ ANY_CARD
```

Trump is included in ANY_CARD.

### G-3 — Verification Coverage
CLOSED as a specification requirement. The legal-move test list was expanded to cover all canonical partner/trump/Ika/Locked-Hokum combinations.

## Related tracker decisions

- V-07 = C: remove generic `countingSide` terminology.
- Kasho dealer transition = ROTATE_RIGHT.
- V-04 remains A: dedicated flat Kaboot table:
  - Hokum 25 / 25 / 25 / 25
  - Sun 44 / 44
  - Reverse Kaboot 88 independent.
- V-11 canonical successful-round allocation sentence is transcribed.
- RD-10 Ashkal baseline is already complete and remains Dealer + Dealer-left in both bidding rounds.

## Files updated

- `docs/game/10-legal-move-specification.md`
- `docs/02-RULE-PROFILE-SA.md`
- `docs/01-CANONICAL-RULES-CURRENT.md`
- `docs/FOUNDATION-CANONICAL-RULES.md`
- `docs/FOUNDATION-RULE-OWNER-DECISIONS-FINAL.md`
- `docs/FOUNDATION-RULE-CONFLICT-REGISTER.md`
- `docs/RULE-TO-CODE-MATRIX.md`
- `docs/REMAINING-ISSUES.md`
- `docs/RD-20-RULE-FREEZE-REPORT.md`
- `docs/RD-09-KABOOT-REVERSE-KABOOT-RESOLUTION-PROTOCOL.md`

## Explicit non-actions

No production engine code was created or modified. No test implementation was created. No architecture decision AD-01…AD-05 was inferred or closed.

## Remaining Freeze blockers

This phase does not close:
- exact Qaid conversion table and complement/opposing-side formula;
- V-06b Triple/Four scope;
- Sun doubling window fields;
- bidding priorities/residue;
- incident policy;
- first-dealer policy;
- timeout policy;
- full Kasho/violation matrix;
- architecture decisions AD-01…AD-05;
- frozen action/event catalog;
- frozen event catalog;
- production implementation and behavioral test evidence.

