# صكّة بلوت — Scoring Truth Table (Phase 14.y)

**Document:** `docs/FOUNDATION-SCORING-TRUTH-TABLE.md`
**Phase:** 14.y — Worked Examples & Canonical Scoring Verification
**Date:** 2026-09-22
**Status:** VERIFICATION ONLY — NOT FROZEN.

Assumptions A1–A12 per `FOUNDATION-WORKED-EXAMPLES.md`. Qaid figures are A10 illustrations (PROVISIONAL) unless noted. Status: **LOCKED** (arithmetic / Owner-decided rule) · **PROVISIONAL** (research baseline, profile DRAFT) · **OPEN** (Owner decision needed) · **CONFLICT** (sources disagree).

| Scenario | Contract | Projects | Baloot | Kaboot | Doubling | Raw Card Points | Project Points | Total Raw | Counting Side | Buyer Success | Round Allocation | Qaid | Match Delta | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EX-01 Sun success | SUN | — | — | No | NORMAL | A85–B45 | 0 | 130 | Buyer A: 85 | YES (decisive) | Own shares | A17–B9 | A+17 B+9 | PROVISIONAL |
| EX-02 Sun fail | SUN | — | — | No | NORMAL | A40–B90 | 0 | 130 | Buyer A: 40 | NO (decisive) | A0 + B configured | A0–B18* | A+0 B+18* | PROVISIONAL + OPEN value |
| EX-03 Hokum success | HOKUM♥ | — | — | No | NORMAL | B100–A62 | 0 | 162 | Buyer B: 100 | YES (decisive) | Own shares | B10–A6.2* | B+10 A+OPEN | PROVISIONAL + OPEN rounding |
| EX-04 Hokum fail | HOKUM♠ | — | — | No | NORMAL | A55–B107 | 0 | 162 | Buyer A: 55 | NO (decisive) | A0 + B configured | A0–B10.7* | A+0 B+OPEN | PROVISIONAL + OPEN value |
| EX-05 Sun+Sera | SUN | SERA(A) | — | No | NORMAL | A85–B45 | +4 (Sun) | 130 cards | Buyer A: 85 | YES | Own + project | A21–B9 | A+21 B+9 | PROVISIONAL |
| EX-06 Hokum+Fifty | HOKUM♥ | FIFTY(B) | — | No | NORMAL | B100–A62 | +5 | 162 cards | Buyer B: 100 | YES | Own + project | B15–A* | B+15 A+OPEN | PROVISIONAL |
| EX-07 Hokum+Hundred | HOKUM♥ | HUNDRED(B) | — | No | NORMAL | B100–A62 | +10 | 162 cards | Buyer B: 100 | YES | Own + project | B20–A* | B+20 A+OPEN | PROVISIONAL |
| EX-08 Sun+400 | SUN | 400(A) | — | No | NORMAL | A85–B45 | +40 | 130 cards | Buyer A: 85 | YES | Own + project | A57–B9 | A+57 B+9 | PROVISIONAL |
| EX-09 Baloot | HOKUM♥ | — | B(+2) | No | NORMAL | B100–A62 | +2 (×1) | 162 cards | Buyer B: 100 | YES | Own + Baloot | B12–A* | B+12 A+OPEN | PROVISIONAL |
| EX-10 Baloot+Hundred | HOKUM♥ | HUNDRED(B) | B ∈ H | No | NORMAL | B100–A62 | A:+12 / B:+10 | 162 cards | Buyer B: 100 | YES | BRANCH | B22 vs B20 | Δ2 | CONFLICT (C-02) |
| EX-11 Kaboot Hokum | HOKUM♥ | — | — | B 8–0 | NORMAL | B162–A0 | 0 | 162 | — (derived) | n/a | Kaboot value | B25–A0 | B+25 | PROVISIONAL + OPEN ×dbl |
| EX-12 Kaboot Sun | SUN | — | — | A 8–0 | NORMAL | A130–B0 | 0 | 130 | — (derived) | n/a | Kaboot value | A44–B0 | A+44 | PROVISIONAL + OPEN ×dbl |
| EX-13 Double Hokum | HOKUM♥ | — | — | No | DOUBLE(opp) | B100–A62 | 0 | 162 | Buyer B: 100 | YES | ×2 buyer base | B20–A* | B+20 A+OPEN | PROVISIONAL + OPEN window |
| EX-14 Triple Hokum | HOKUM♥ | SERA(B) | — | No | TRIPLE(buyer) | B100–A62 | +4 (×2 cap) | 162 cards | Buyer B: 100 | YES | ×3 base, ×2 proj | B34–A* | B+34 A+OPEN | PROVISIONAL + OPEN window |
| EX-15 Four Hokum | HOKUM♥ | SERA(B) | — | No | FOUR(dbler) | B100–A62 | +4 (×2 cap) | 162 cards | Buyer B: 100 | YES | ×4 base, ×2 proj | B44–A* | B+44 A+OPEN | PROVISIONAL + OPEN window |
| EX-16 Gahwa | HOKUM | — | — | No | GAHWA(buyer) | in progress | 0 | n/a | — (terminal) | n/a | MATCH_WIN B | terminal | B wins match | LOCKED terminal + OPEN reach |
| EX-17 Fail+project | HOKUM | SERA(A,fail) | — | No | NORMAL | A55–B107 | Branch 0 / +2 | 162 cards | Buyer A: 55 | NO | BRANCH | A0 vs A2 | OPEN | OPEN (V-03) |
| EX-18 Compare | HOKUM | SERA(A)× FIFTY(B)✓ | — | No | NORMAL | A98–B64 | +5 (B) | 162 cards | Buyer A: 98 | YES | Winner proj only | A*–B* | OPEN rounding | PROVISIONAL + OPEN |
| EX-19 All-pass | — | — | — | No | — | — | 0 | — | — | n/a (cancel) | 0–0, rotate | 0–0 | unchanged | PROVISIONAL (rotation) |
| EX-20 Exposed math | — | — | — | — | — | 20+1+11=32 | — | 32 | — | n/a | conservation | — | — | LOCKED |
| EX-21 Ashkal Sun | SUN(Ashkal) | — | — | No | NORMAL | B85–A45 | 0 | 130 | Buyer S(B): 85 | YES | Own shares | B17–A9 | B+17 A+9 | PROVISIONAL + OPEN seats |
| EX-22 Bushat cancel | — | — | — | No | — | — | 0 | — | — | n/a (cancel) | 0–0, advance | 0–0 | unchanged | PROVISIONAL + OPEN matrix |
| EX-23 Tie 81/81 | HOKUM | — | — | No | NORMAL | B81–A81 | 0 | 162 | Tie | OPEN | BRANCH | OPEN | OPEN | OPEN (V-01/V-06) |
| EX-24 Tie 65/65 | SUN | — | — | No | NORMAL | A65–B65 | 0 | 130 | Tie | OPEN | BRANCH | A13–B13 or A0 | OPEN | OPEN (V-01/V-06) |
| EX-25 Kaboot+proj | HOKUM♥ | SERA(B win) | — | B 8–0 | NORMAL | B162–A0 | +2 (prov) | 162 cards | — (derived) | n/a | 25+2=27* | B27*–A0 | B+27* | PROVISIONAL + OPEN |
| MATCH-01 exact 152 | — | — | — | — | — | — | — | — | — | — | A140+12=152 | — | A wins | PROVISIONAL + LOCKED target |
| MATCH-02 cross 152 | — | — | — | — | — | — | — | — | — | — | B148+11=159 | — | B wins | PROVISIONAL + LOCKED target |
| MATCH-03 both cross | — | — | — | — | — | — | — | — | — | — | A159 B154 | — | OPEN | OPEN (V-06) |
| MATCH-04 Gahwa | — | — | — | — | GAHWA | — | — | — | — | — | MATCH_WIN B | terminal | B wins match | LOCKED terminal |
| MATCH-05 tie@point | SUN | — | — | — | NORMAL | A65–B65 | 0 | 130 | Tie | OPEN | BRANCH | OPEN | OPEN | OPEN (V-06) |

`*` = figure depends on an OPEN rounding/allocation/value rule; shown for scale only, not canonical.
