# RD-20 — Repository Audit (Forensic, Read-Only)

**Document:** `docs/RD-20-REPOSITORY-AUDIT.md`
**Phase:** Final Rule Freeze + Production Domain Engine Audit (discovery only — no code modified)
**Date:** 2026-09-22
**Method:** full filesystem inspection (`ls`, glob for `*.{ts,tsx,js,json,py}`), full-text search across `docs/` for every stale-implementation target.

---

## 1. Repository contents

```
/Users/abdullahzaher/sakkah-baloot/
├── README.md
├── .DS_Store
└── docs/            (40 markdown files: Foundation 01–09, product 01–02,
                      FOUNDATION-* audit trail, 01–07 canonical pack,
                      RD-01/RD-09/RD-10 protocols, 14.y verification set)
```

**No source code exists.** No `packages/`, no `game-engine/`, no `package.json`, no test files, no server/client code of any kind. The repository is documentation-only.

## 2. Subsystem inventory (A–M)

| Area | Finding |
|---|---|
| A. Game-engine/domain implementation | MISSING — nothing to audit |
| B. State machine | MISSING (specified in `09-state-transitions.md` + `06-ARCHITECTURE-GATES.md`, unimplemented) |
| C. Actions | MISSING (specified, unfrozen — AD-01 open) |
| D. Events | MISSING (no canonical frozen catalog) |
| E. Scoring | MISSING |
| F. Project detection | MISSING |
| G. Legal move generation | MISSING (`getLegalMoves` specified, unimplemented) |
| H. Bot logic | MISSING |
| I. Replay logic | MISSING |
| J. Multiplayer/server validation | MISSING |
| K. Tests | MISSING — zero test files; no test evidence exists |
| L. Duplicated rule constants | NONE — nothing to duplicate (no code) |
| M. Stale/provisional implementations | NONE — nothing implemented, stale or otherwise |

## 3. Stale-implementation search results

Every target searched across the entire repository (code + docs). Code hits: none exist (no code). Documentation hits below are **specification text, not implementations** — listed to prove the search was performed, not as violations.

| Target | Code | Docs (specification only) |
|---|---|---|
| clockwise direction | NOT FOUND | Superseded statements in `03-dealing.md §5`, `05-playing.md §5` (canonical: CCW per `01-CANONICAL-RULES-CURRENT.md`) |
| exposed card assigned to wrong player | NOT FOUND | — (canonical: buyer; Ashkal partner) |
| Sun total = 140 | NOT FOUND in code; historic doc error in `01-game-rules.md §6.1` flagged C-08, transcription pending EC-01/DF-01/DF-02 | — |
| generic Kaboot multiplication | NOT FOUND | Explicitly forbidden (`01-CANONICAL-RULES-CURRENT.md` Kaboot; RD-09 protocol §3 mechanism) — but see contradiction F-01 in Freeze Report (RD-09 §21 values) |
| Baloot multiplied by contract multiplier | NOT FOUND | Explicitly forbidden (multiplier ×1 in `01/02` + RD-08) |
| Baloot + Hundred both scoring independently | NOT FOUND | Forbidden (absorbed — V-05 = B in `01`) |
| Kasho KEEP_CURRENT_DEALER | NOT FOUND | Canonical is ROTATE_RIGHT everywhere (`01/02/04`) |
| hardcoded seat arithmetic | NOT FOUND | Explicitly forbidden (relative-seat utility mandated) |
| project ranking using raw value | NOT FOUND | Explicitly forbidden (`05-PROJECT-RANKING-TRUTH-TABLE.md`) |
| project ranking using qaid value | NOT FOUND | Explicitly forbidden (same) |
| DECLARE_KABOOT | NOT FOUND | Explicitly forbidden (derived-only Kaboot) |
| REDEAL GamePhase | NOT FOUND | Explicitly forbidden (`04-TERMINATION-MATRIX.md`, `06-ARCHITECTURE-GATES.md`) |
| EXPOSED_ACE_PHASE | NOT FOUND | Explicitly forbidden (`06-ARCHITECTURE-GATES.md`) |
| KABOOT_PHASE | NOT FOUND | Explicitly forbidden (same) |
| PROJECT_PHASE | NOT FOUND | Explicitly forbidden (same) |
| client-derived legal move logic | NOT FOUND | Explicitly forbidden (`getLegalMoves` contract) |
| packet/network order tie-breaking | NOT FOUND | Explicitly forbidden |
| floating point Qaid | NOT FOUND | Explicitly forbidden (no persisted floats) |
| framework imports in domain engine | NOT FOUND | No domain engine exists; constraint recorded for implementation |

## 4. Test coverage gaps

Total: **all families MISSING** (dealing, bidding, Ashkal, escalation, projects, Baloot, Ika, cutting, legal moves, scoring, Kaboot, Reverse Kaboot, Gahwa, Kasho, termination, idempotency, hidden information, replay). The only executed verification in this audit is inline arithmetic (Sun/Hokum totals, conservation, tie halves) — see `ENGINE-TEST-REPORT.md`. No behavioral test evidence exists.

## 5. Audit conclusion

The repository is clean of stale, duplicated, or conflicting implementations **because no implementation exists**. The Freeze decision therefore rests entirely on documentation completeness/consistency (see `RD-20-RULE-FREEZE-REPORT.md`) and end-to-end traceability (see `RULE-TO-CODE-MATRIX.md`), where every code-side link is MISSING.
