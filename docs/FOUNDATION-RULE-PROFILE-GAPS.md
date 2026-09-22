# صكّة بلوت — Rule Profile Gap Register (Phase 14)

**Document:** `docs/FOUNDATION-RULE-PROFILE-GAPS.md`
**Phase:** 14 — Canonical Rule Resolution (gap capture only)
**Date:** 2026-09-22
**Policy:** CAPTURE ONLY. No configuration values are invented. A "hook" below means the Foundation names the decision point — never that its value is known.

---

## Rule Profile Configuration Map (§8)

Which rules the Foundation explicitly routes through the Rule Profile. No values are supplied here.

| Rule | Explicitly parameterized? | Evidence | Needs Owner Decision? |
|---|---|---|---|
| Play direction (dealing / bidding / trick order) | PARTIAL — referenced, value contradicted | `01-game-rules.md §2.2` (CCW + deferral); `05-playing.md §5` (CW + deferral); `getNextSeat(seat, direction)` pattern in `05-playing.md §5` | YES — RD-02 (single value or per-subsystem values) |
| First dealer selection | NO — decision point named, no hook | `03-dealing.md §8` ("Rule Profile decision"); `01-game-rules.md §8` | YES — mechanism + hook name |
| Ashkal eligibility | YES — `canCallAshkal(seat, dealerSeat)` | `04-bidding.md §12` | YES — implementation (RD-10); depends RD-02 |
| Ashkal behavior / representation | PARTIAL — outcome shape documented | `04-bidding.md §11–13`; `02-card-system.md §9` defers | YES — RD-10 |
| Doubling window policy | NO — key unnamed (gap AG-05) | `08-actions.md §30` ("server determines"); `09-state-transitions.md §18` ("if applicable"); open item 7 | YES — RD-03 (open/close/eligible phases) |
| Coffee behavior + win condition | PARTIAL — terminal-state shape documented | `06-scoring.md §37` ("exact win condition is a Rule Profile decision") | YES — RD-04 |
| Redeal policy | PARTIAL — trigger path documented | `04-bidding.md §19` ("per Rule Profile"); `§20` open list | YES — RD-09 |
| Project declaration window | PARTIAL — window framing documented | `09-state-transitions.md §18–19`; open item 6 | YES — RD-05 (close condition, NONE, ordering) |
| Baloot timing | NO — deferred without hook | `06-scoring.md §20`; `01-game-rules.md §24` | YES — RD-08 |
| Project Qaid + raw tables | PARTIAL — draft tables exist | `06-scoring.md §31–32` (Draft) | YES — RD-06 (freeze; do not promote drafts) |
| Kaboot values + interaction | PARTIAL — draft values exist | `06-scoring.md §41–42` (Draft) | YES — RD-07 |
| Tie policy (normal hand) | PARTIAL — candidate policy named | `06-scoring.md §43` (`tiePolicy: "PURCHASER_WINS"` presented as example "if adopted") | YES — adopt or replace |
| Tie-after-double rule | NO — behavior described from public ref, not adopted | `06-scoring.md §44` (research input) + `initialDoublerTeamId` field shape | YES — adopt or replace |
| Qaid conversion + rounding | PARTIAL — simplified ÷5/÷10 documented as common | `06-scoring.md §45–48` (integer arithmetic mandated; exact rule open) | YES — exact rules |
| Match-end both-cross rule | NO — edge case posed, no hook | `06-scoring.md §63` | YES — rule |
| Timeout auto-action (bidding + play) | NO — candidate policies listed, none adopted | `04-bidding.md §30–31`; `05-playing.md §44–45` | YES — single production behavior |
| Void-suit trump obligation | NO — conditional rule stated, exception path open | `05-playing.md §15–17` ("unless profile defines an exception") | YES — obligation or option |
| Exposed-card fate | NO — no hook exists | `03-dealing.md §17–18` (accounting flagged, fate absent) | YES — RD-01 (rule must precede any hook) |
| Match target value | YES — 152 Qaid named | `01-game-rules.md §4` («152 نقطة قيد»); `06-scoring.md §61` | NO — value canonical; only edge rules open |
| WinningScore / players / cards / allowSun / allowHokm / allowAshkal shell | YES — interface sketched | `01-game-rules.md §43` RuleProfile sketch | Shape only — values per decisions above |

---

## Gap Register

| Area | Existing Profile Hook | Missing Decision | Dependency | Freeze Impact |
|---|---|---|---|---|
| Direction | `direction` consumed by turn helpers; value contradicted | Canonical value(s) — RD-02 | None (root) | YES |
| First dealer | None (named decision, no hook) | Mechanism + hook | None | YES |
| Ashkal eligibility | `canCallAshkal(seat, dealerSeat)` | Implementation — RD-10 | RD-02 | YES |
| Doubling window | None (unnamed key, AG-05) | Key name + open/close/eligible-phase policy — RD-03 | RD-02 (order-relative edges) | YES |
| Coffee | Terminal-state shape | Win condition + terminality — RD-04 | RD-03 | YES |
| Redeal | "Per Rule Profile" reference | Full procedure — RD-09 | RD-02 | YES |
| Project window | Window framing | Close condition + NONE + ordering — RD-05 | None | YES |
| Baloot | None | Window + miss behavior — RD-08 | RD-05 (if shared window) | YES |
| Project tables | Draft Qaid/raw tables | Frozen values — RD-06 | None | YES |
| Kaboot | Draft values | Frozen values + interaction — RD-07 | RD-06, RD-03 | YES |
| Ties | Example policy field | Adopted policies (normal + doubled) | None | YES |
| Conversion | Simplified representations | Exact rounding/threshold rules | RD-06/07 (interact) | YES |
| Match-end edge | None | Both-cross + threshold-edge rules | Match target (canonical) | YES |
| Timeout | Candidate list, no adoption | Single behavior per phase | None | YES |
| Void obligation | Exception path reserved | Obligation vs option | RD-02 (partial) | YES |
| Exposed fate | None | Rule before hook — RD-01 | None | YES |

---

## Dependency Graph (§9)

```
RD-02 (direction)
 ├── bidding start seat (derives automatically once RD-02 answered)
 ├── first trick leader seat (derives; "right of dealer" rule itself is stated A)
 ├── dealer rotation direction
 ├── RD-09 redeal rotation (same-vs-next dealer interpreted in RD-02 frame)
 ├── RD-10 Ashkal seats ("left/right" gain meaning only via RD-02)
 ├── project tie-break seat priority (06-scoring.md §56)
 └── timeout/doubling edges where order-relative

RD-03 (doubling window)
 └── RD-04 (Coffee terminality — a level inside RD-03's window)

RD-01 (exposed fate)
 ├── completion-deal card counts (3×4 from deck vs exposed-inclusive)
 └── Ashkal receiver consistency (04-bidding.md §13 must hold under the answer)

RD-05 (declaration window)
 ├── trick-play entry gate
 └── RD-08 interplay (if Baloot shares the window)

EC-01 (Sun confirmation)
 └── DF-01 / DF-02 transcription → scoring freeze

RD-06 (project values)
 ├── RD-07 Kaboot interaction (project treatment under Kaboot)
 └── conversion interplay (raw contributions feed purchaser evaluation)

ARCHITECTURE (referenced, not resolved):
 AD-01 ← bidding wire form (waits on RD-09/RD-10 content only for completeness)
 AD-02/03/04 ← event schema (independent of rule content; blocks protocol, not rules)
 AD-05 ← contract layers (waits on RD-10 representation content)
```

No dependency is resolved by assumption. Derived items (bidding-start seat, first-leader seat) derive only *after* RD-02 is answered, and are marked as derivations — not decisions — when that happens.
