# صكّة بلوت — Foundation Resolution Matrix

**Document:** `docs/FOUNDATION-RESOLUTION-MATRIX.md`
**Phase:** 13.5 — Corrected Second-Pass Engineering Review
**Date:** 2026-09-22

---

## Matrix

| ID | Issue | Evidence Status | Classification | Rule Decision? | Architecture Decision? | Documentation Fix? | Blocks Rule Freeze? | Blocks Architecture? |
|---|---|---|---|---|---|---|---|---|
| R-P1-001 | Sun base total: 120 not 130 | FACT — arithmetic from card table | MATHEMATICAL CORRECTION | No | No | YES — fix both docs | YES | No |
| R-P1-002 | Exposed card fate unspecified | FACT — no doc specifies fate | OPEN RULE DECISION | YES | No | No | YES | No |
| R-P1-003 | GamePhase canonical names not designated | FACT — two docs use different names | OPEN ARCHITECTURE DECISION | No | YES | No | YES | YES — event schema |
| R-P1-004 | Play direction contradicted | FACT — two docs state opposite values | OPEN RULE DECISION | YES | No | No | YES | No |
| R-P2-001 | PASS vs PASS_FINAL wire representation | FACT — 04-bidding and 08-actions differ | OPEN ARCHITECTURE DECISION | No | YES | No | No | No |
| R-P2-002 | COMPLETE_DEAL: internal vs observable | FACT — 09-transitions §1650 item 3 | OPEN ARCHITECTURE DECISION | No | YES | No | No | YES — event schema |
| R-P2-003 | MATCH_END_CHECK: internal vs observable | FACT — 09-transitions §1650 item 3 | OPEN ARCHITECTURE DECISION | No | YES | No | No | YES — event schema |
| R-P2-004 | Doubling window policy | FACT — §1650 item 7 unresolved | OPEN RULE PROFILE DECISION | YES | No | No | YES | No |
| R-P2-005 | Project declaration window | FACT — §1650 item 6 unresolved | OPEN RULE PROFILE DECISION | YES | No | No | YES | No |
| R-P2-006 | Bidding start player | INFERENCE — depends on direction | DEPENDENT OPEN RULE DECISION | YES (via direction) | No | No | YES (via direction) | No |
| R-P3-001 | Contract type layer boundaries | FACT — different fields in different docs | LAYERED MODEL + DOC CROSS-REF | No | YES | YES | No | No |
| R-P3-002 | Ashkal eligibility rule | FACT — ruleProfile.canCallAshkal() exists | OPEN RULE DECISION (arch ok) | YES | No | No | YES | No |
| R-P3-003 | BUY_* vs CALL_* terminology gap | FACT — 04-bidding uses domain labels | DOCUMENTATION GAP | No | No | YES | No | No |
| R-P3-004 | Redeal path missing from §64 matrix | FACT — path defined in 04-bidding | DOCUMENTATION COMPLETENESS GAP | No | No | YES | No | No |
| RETRACTED | F-P2-009: stateVersion/RESYNC | FACT — §36 explicitly resolves | FALSE FINDING | No | No | No | No | No |

---

## Reclassification From Phase 12

| Phase 12 ID | P12 Severity | P13.5 Severity | Change | Reason |
|---|---|---|---|---|
| F-P0-001 | P0 | P1 | Downgraded | Mathematical correction, not blocker |
| F-P0-002 | P0 | P1 | Downgraded | Missing rule, not broken model |
| F-P0-003 | P0 | P2/Arch | Reclassified | Kaboot = derived outcome, no action needed |
| F-P0-004 | P0 | P3 | Downgraded | Documentation gap; 08-actions self-declared authoritative |
| F-P0-005 | P0 | P2 | Downgraded | Open architecture decision, not blocker |
| F-P1-001 | P1 | P1 | Confirmed | Real naming divergence, real architecture decision |
| F-P1-002 | P1 | P1 | Confirmed | Real contradiction, rule decision required |
| F-P1-003 | P1 | P2 | Downgraded | Dependent on direction; no independent status |
| F-P1-004 | P1 | P3 | Downgraded | Layered models, not contradiction |
| F-P1-005 | P1 | P2 | Downgraded | Phase structure defined; policy is rule profile decision |
| F-P1-006 | P1 | P2 | Downgraded | Architecture sketched; policy is rule profile decision |
| F-P1-007 | P1 | P3 | Downgraded | ruleProfile.canCallAshkal() already in doc |
| F-P1-008 | P1 | P3 | Downgraded | Path defined in 04-bidding; matrix row is missing |
| F-P2-009 | P2 | RETRACTED | False | §36 explicitly resolves |

---

## Count Summary

| Severity | Phase 12 | Phase 13.5 |
|---|---|---|
| P0 | 5 | 0 |
| P1 | 8 | 4 |
| P2 | — | 5 |
| P3 | — | 4 |
| Retracted | — | 1 |

---

## Key Classification Policy Applied

The following distinctions were enforced throughout this matrix:

| What Phase 13 wrote | What Phase 13.5 corrects it to |
|---|---|
| "Single PASS is sufficient" | "Single PASS is ONE viable option (OPEN ARCHITECTURE DECISION)" |
| "COMPLETE_DEAL is probably internal" | "COMPLETE_DEAL representation is OPEN ARCHITECTURE DECISION" |
| "MATCH_END_CHECK is almost certainly internal" | "MATCH_END_CHECK representation is OPEN ARCHITECTURE DECISION" |
| "Designate 09-transitions as canonical for phase names" | "No designation made; this is OPEN ARCHITECTURE DECISION" |
| "B/C/D are all valid" (exposed card) | "B/C/D are mathematically possible; only one is the correct rule (OPEN RULE DECISION)" |
| "CCW likely correct" (direction) | "Both values exist in Foundation; Rules Owner must decide (OPEN RULE DECISION)" |
