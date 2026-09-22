# Remaining Issues (Post RD-20 Freeze Audit)

**Document:** `docs/REMAINING-ISSUES.md`
**Date:** 2026-09-22
**Standing:** `RULE_FREEZE = BLOCKED`. Ordered by impact. Nothing here invents a rule.

## P0 — must resolve first (contradiction)

* **F-01 Kaboot × doubling: CLOSED.** V-04 = A, Saudi Baseline / flat dedicated table. Hokum 25/25/25/25; Sun 44/44; Reverse 88 independent; Gahwa overrides. RD-09 and Rule Profile reconciled.

## P1 — missing artifacts / undefined content / provenance

1. Exact conversion table (+ define "complement calculation").
2. V-06b doubled-tie transcription into `01`+`02`.
3. V-11 ordinary-allocation sentence into canonical scoring docs.
4. V-07 counting-side definition: CLOSED — term removed; use precise allocation/ownership terminology.
5. Incident policy block in profile (dealer + score on cancel).
6. First-dealer mechanism + profile field.
7. Timeout policy (bidding + playing).
8. Sun Double window fields.
9. Frozen action catalog (closes AD-01 input side).
10. Frozen event catalog (needs AD-02/03/04).
11. Cutting/Dag rule content or explicit exclusion with provenance.
12. Must-Overtrump rule content: CLOSED as core content; partner-winning/table-trump edge cases canonicalized in game/10.
13. Must-Trump definition: CLOSED as core content; partner-winning/table-trump edge cases canonicalized in game/10.
14. Ika: CLOSED for rule content and partner exemption; implementation/test evidence remains post-Freeze work.
15. Provenance records: project ×3/×4, locked mode, exposed Ace, max-2-projects, incident path.
16. Bidding option sets + Sun-priority rules.
17. Full Kasho/violation matrix (RD-09 14 items) + project coexistence/tie/declaration-failure edges.

## P2 — clarity / hygiene

* RD-10 §5 mixed action naming (BUY_HOKUM vs CALL_ASHKAL) — normalize when AD-01 closes.
* "Rotate right" dealer phrasing relies on the relative-seat utility; add one worked rotation example.
* RD-09 vs RD-11 naming collision (Kaboot vs Kasho/Redeal) already flagged in Phase 15 §10 — adopt RD-09 = Kaboot, RD-11 = Kasho.
* EC-01/DF-01/DF-02 transcription of Sun 120 (historic `01-game-rules.md §6.1` 140 error still present in the old doc).

## Implementation track (after Freeze PASS only)

* Build `packages/game-engine` per Phase 7 module layout with zero framework imports.
* Implement the 5 authoritative APIs + immutable events + seeded RNG dealing.
* Full test families per `03-RD-20-RULE-FREEZE-AUDIT.md` §Test families (8 families).
* Security battery (Phase 11) + replay determinism proof (Phase 10).

## Update — game/10 legal-move specification accepted (14.Z.2)

`docs/game/10-legal-move-specification.md` (CANONICAL / FREEZE-READY CORE, documentation only) was preserved into the repo and forensically verified: no contradiction with the `01`/`02` pack (locked-lead, Ika, hierarchy, direction, scoring separation all consistent); governance checklist clean (no REDEAL/DECLARE_KABOOT/phase inventions, no floats, no client-legality, server recalculation mandated); freeze status honest (`RULE_FREEZE = NOT YET DECLARED`, global blockers listed).

Effect on P1 items above:
* #12 Must-Overtrump content → SPECIFIED in game/10 §14 (downgraded to P2 edge gap G-1).
* #13 Must-Trump definition → SPECIFIED in game/10 §12–13, closing OD-PL-02 content (downgraded to P2 edge gap G-1; trail cleanup still pending per §33).
* #14 Ika trail + partner exemption → exemption content now in game/10 §11 + FINAL C-19 (trail cleanup still pending per §33).

New P2 edge gaps (do not block Freeze core; must close before trick-legality sign-off):
* **G-1:** partner-winning + trump-on-table sub-cases unspecified (§13 silent on table-trump; §14 conditioned on OPPONENT winning only). Third + partner-winning + table-trump: MUST_TRUMP vs MUST_OVERTRUMP ambiguous; may third overtake partner's trump? Fourth + partner-winning + table-trump: overtaking unspecified.
* **G-2:** "required Ika card condition" (§10) and "specific partner situation" (§11) predicates referenced but not spelled out in one place; `01` defines neither — single-predicate transcription task.
* **G-3:** §30 test list lacks partner-winning + trump-on-table combos and the Ika + locked-lead case (§18 behavior unlisted).
