# صكّة بلوت — Foundation Resolution Audit

**Document:** `docs/FOUNDATION-RESOLUTION-AUDIT.md`
**Phase:** 13 / 13.5 — Second-Pass Engineering Review + Corrections
**Date:** 2026-09-22
**Policy:** DISCOVERY ONLY. No fixes to Foundation. No rule invention. No implementation.

---

## Purpose

This document is a second-pass engineering review of the Phase 12 Foundation Forensic Audit,
with Phase 13.5 corrections applied to ensure no inference is presented as a decision,
no mathematically possible model is presented as a valid rule, and no architectural preference
is presented as an approved architecture.

---

## Classification Definitions

| Label | Meaning |
|---|---|
| FACT | Directly verifiable from source documents without interpretation |
| MATHEMATICAL CORRECTION | Arithmetic error demonstrable from the document's own values |
| CONFIRMED CONTRADICTION | Two documents make incompatible claims about the same rule/behavior |
| OPEN RULE DECISION | Must be decided by the Rules Owner; not resolvable from current documents |
| OPEN ARCHITECTURE DECISION | Must be decided by the engineering/product team; not resolvable from current docs |
| DOCUMENTATION GAP | Intended behavior is sufficiently established; only a written clarification is needed |
| LAYERED MODEL | Two representations describe different layers of the same concept; not contradictory |
| DERIVED OUTCOME | Calculated by the engine from authoritative state; no player action required |
| INFERENCE | Reasonable interpretation but NOT approved or canonical |

---

## Special Review 1: Sun Mathematics

### Independent Calculation

**FACT:** Card values are identical in both `01-game-rules.md §6.1` and `06-scoring.md §7`.

| Rank | Points |
|---|---|
| A | 11 |
| 10 | 10 |
| K | 4 |
| Q | 3 |
| J | 2 |
| 9 | 0 |
| 8 | 0 |
| 7 | 0 |
| Per-suit total | **30** |
| 4 suits × 30 | **120** |

**FACT:** Last-trick bonus = 10 (stated in both documents).

**MATHEMATICAL CONCLUSION (not an open rule choice):**
```
Sun base card points = 120
Last-trick bonus    = +10
Sun total           = 130
```

### What the Documents Currently State

`01-game-rules.md §6.1`:
```
Subtotal: 130       ← WRONG (should be 120)
+ 10 last trick
= 140               ← DOUBLE-COUNT ERROR (should be 130)
```

`06-scoring.md §8`:
```
130 card points before the last-trick bonus  ← WRONG (should be 120)
```

### Classification

**MATHEMATICAL CORRECTION** — not an open rule choice.

The card-value table mathematically determines the base card total. No external rule convention can override arithmetic. There is no independent rule source in the Foundation that establishes a different card-value table.

The error propagates consistently: the value 130 was written as the subtotal in both documents, and in `01-game-rules.md §6.1` an additional +10 was added to produce the double-counted 140.

**Corrected canonical statement:**
> Sun base card points = 120. Last-trick bonus = 10. Sun total = 130.
> The "140" in `01-game-rules.md §6.1` is a double-count error.
> The "130 before last-trick bonus" in `06-scoring.md §8` is arithmetically wrong; it should read "120 before last-trick bonus."

### Hokm Verification (independent calculation)

```
Trump suit (J=20, 9=14, A=11, 10=10, K=4, Q=3, 8=0, 7=0): 62
Three non-trump suits (30 each):                            90
Hokm total card points:                                    152
```

**FACT:** Hokm 152 is consistent with `06-scoring.md §8`. No error.

---

## Special Review 2: Dealing Card Conservation

### Mathematics

```
Total deck:              32 cards
Initial deal (5×4):      20 cards
Exposed card:             1 card
Remaining in deck:       11 cards
Completion needed (3×4): 12 cards

If all three quantities are treated as independent: 20+1+12 = 33 ≠ 32
```

**FACT:** The exposed card cannot simultaneously remain outside all hands AND allow 12 completion cards to come from an 11-card deck. One card is unaccounted for under the naive reading.

### Mathematically Valid Models (not confirmed rules)

| Model | Exposed card treatment | Accounting | Mathematically valid? |
|---|---|---|---|
| A | Orphaned (outside all hands) | 20+1+12=33 | NO |
| B | Given to purchaser as part of completion | 20+1+11=32 | YES |
| C | Returned to deck before completion | 20+0+12=32 | YES |
| D | Given to purchaser's partner (Ashkal) | 20+1+11=32 | YES |

### Classification

**OPEN RULE DECISION** — not "choose any mathematically valid option."

Models B, C, and D are mathematically possible. The Foundation does not contain evidence to determine which model represents the actual Baloot rule. An implementor cannot select between B, C, and D without a Rules Owner decision.

**Corrected statement:**
> "The Foundation does not currently specify the fate of the exposed card after contract selection. Several card-conservation models are mathematically valid (B, C, D), but the actual game rule must be confirmed by the Rules Owner before the dealing specification can be frozen."

Do not select B, C, or D. Do not infer from general Baloot knowledge.

---

## Special Review 3: Kaboot — Architectural Representation

### Evidence

**FACT:** `06-scoring.md §41` defines Kaboot as "one team wins all eight tricks" — a game outcome computed from trick counts.

**FACT:** No document defines a KABOOT or CLAIM_KABOOT action in `08-actions.md`.

**FACT:** `09-state-transitions.md §25` lists `tricks` as an input to ROUND_SCORING.

**FACT:** No document states that any player must declare or claim Kaboot.

### Architectural Conclusion

**DERIVED OUTCOME:** Kaboot is detectable by the scoring subsystem from completed trick counts without any player action. This is architecturally correct within the server-authoritative model documented throughout the Foundation.

This is an architectural conclusion, not a rule decision. The engine design follows directly from:
1. The server-authoritative model (stated universally)
2. The fact that trick counts are available at ROUND_SCORING time
3. The absence of any player-declaration mechanic in any document

### Scoring Values — Remain Unresolved

**OPEN RULE DECISION:** The Qaid values for Kaboot (currently stated as 25 Hokm / 44 Sun in `06-scoring.md §41`) are marked Draft. These require Rules Owner confirmation.

**Critical distinction:**
- How Kaboot is *detected* = DERIVED OUTCOME (architectural, resolved)
- How Kaboot is *scored* = OPEN RULE DECISION (unresolved)

---

## Special Review 4: PASS vs PASS_FINAL

### Evidence

**FACT:** `04-bidding.md §8` labels its action model as "Recommended **domain** action" — explicitly using the word "domain," not "wire" or "protocol."

**FACT:** `08-actions.md §1` states: "This document defines the **complete authoritative** action/command model for صكّة بلوت."

**FACT:** `04-bidding.md §18–19` defines PASS (round 1) and PASS_FINAL (round 2) as semantically distinct.

**FACT:** `08-actions.md §21` defines only one PASS action. Its validation includes "pass is legal in current bidding stage."

**FACT:** `07-game-state.md §16` includes `BiddingState.phase: BiddingPhase` tracking FIRST_ROUND vs SECOND_ROUND in authoritative server state.

### What Can Be Concluded

**INFERENCE (not a decision):** A single PASS wire action is *architecturally viable* because the server can derive round context from `BiddingState.phase`. This is ONE valid design option.

**NOT CONCLUDED:** That single PASS has been selected as the canonical design.

### Classification

**OPEN ARCHITECTURE DECISION**

| Option | Description |
|---|---|
| A | Single PASS wire action; server derives semantics from BiddingState.phase |
| B | Separate PASS and PASS_FINAL wire action types |

Both are architecturally viable. The Foundation does not explicitly designate which is canonical. `08-actions.md` is the authoritative wire-format document (per its self-declaration) but currently only defines PASS. Whether PASS_FINAL should be added is an open design decision.

This decision must be made before the action protocol is frozen. It does not block engine architecture.

---

## Special Review 5: Bidding Action Naming (BUY_* vs CALL_*)

### Evidence

**FACT:** `04-bidding.md §8` labels BUY_* as "Recommended **domain** action" — not wire types.

**FACT:** `08-actions.md §1` declares itself "the complete **authoritative** action/command model."

**FACT:** `09-state-transitions.md §64` transition matrix uses CALL_* naming (consistent with 08-actions.md).

**FACT:** Neither document explicitly states that BUY_* are wire types, nor that CALL_* are the finalized names.

### What Can Be Concluded

**INFERENCE:** `08-actions.md` is the intended authoritative wire-format source (per its explicit self-declaration). `04-bidding.md` uses domain-level labels. This is consistent with layered documentation.

**DOCUMENTATION GAP:** `04-bidding.md` does not explicitly state that BUY_* are conceptual labels only and that wire types are in `08-actions.md`. This creates implementor confusion risk.

### Classification

**DOCUMENTATION GAP** — a clarifying note is needed in `04-bidding.md` mapping domain labels to wire types. Not an architectural blocker given that `08-actions.md` is self-declared authoritative. Wire type naming (CALL_* vs BUY_*) remains frozen in `08-actions.md` subject to Rule Freeze.

---

## Special Review 6: GamePhase Naming Divergence

### Evidence

**FACT:** `07-game-state.md §8` defines GamePhase enum with: WAITING_FOR_PLAYERS, SEATING, ROUND_STARTING, DEALING, BIDDING, CONTRACT_SELECTED, PROJECT_DECLARATION, PLAYING, SCORING, ROUND_COMPLETE, MATCH_COMPLETE, CANCELLED.

**FACT:** `09-state-transitions.md §9` state machine uses: GAME_CREATED, SEATING, DEALING, BIDDING, CONTRACT_SELECTED, COMPLETE_DEAL, PROJECT_DECLARATION, TRICK_PLAY, ROUND_SCORING, MATCH_END_CHECK, GAME_RESULT.

**FACT:** `07-game-state.md §8` says "The exact transition graph belongs in 09-state-transitions.md" — meaning 07 defers the *transition graph* to 09, but does NOT explicitly designate 09 as canonical for phase *names*.

**FACT:** Neither document designates itself as the canonical source for GamePhase strings.

**FACT:** `09-state-transitions.md §1650 item 3` explicitly lists "Whether system transitions are represented as actions or internal transitions" as unresolved before freeze. This directly applies to COMPLETE_DEAL and MATCH_END_CHECK.

### What Can Be Concluded

**CONFIRMED CONTRADICTION:** The same semantic phases have different names in the two documents:

| Semantic phase | game-state name | transitions name |
|---|---|---|
| Active trick play | PLAYING | TRICK_PLAY |
| Round score calculation | SCORING | ROUND_SCORING |
| Final match state | MATCH_COMPLETE | GAME_RESULT |

These are confirmed name conflicts. Both documents describe the same lifecycle.

**OPEN ARCHITECTURE DECISION:** Which document is canonical for phase name strings has NOT been decided by the Foundation.

**OPEN ARCHITECTURE DECISIONS (sub-items):**

- Is COMPLETE_DEAL a client-observable GamePhase or an internal engine state?
- Is MATCH_END_CHECK a client-observable GamePhase or an internal branch?
- Is ROUND_STARTING a distinct phase or an alias for the start of DEALING?
- Is ROUND_COMPLETE a distinct phase or an alias for MATCH_END_CHECK?
- Is WAITING_FOR_PLAYERS a phase in the same enum as gameplay phases?

### Classification

**OPEN ARCHITECTURE DECISION** — the canonical GamePhase representation is unresolved.

Do NOT designate `09-state-transitions.md` as canonical. This is an inference, not a fact. The canonical source must be explicitly designated in the next phase.

---

## Special Review 7: Direction

### Evidence

**FACT:** `01-game-rules.md §2.2`: "اتجاه اللعب: **عكس عقارب الساعة**" (counter-clockwise per Rule Profile).

**FACT:** `05-playing.md §5`: "The playing order is **clockwise** according to the selected Rule Profile."

**FACT:** `03-dealing.md §5`: "Dealer → next seat **clockwise** → next → next."

**FACT:** Both `01-game-rules.md §2.2` and `05-playing.md §5` append "according to the selected Rule Profile" — deferring to the Rule Profile.

**FACT:** `01-game-rules.md §2.2` also states: "اللاعب الذي يبدأ أول أكلة هو اللاعب على يمين الموزع" (the player who starts the first trick is the player to the RIGHT of the dealer).

### What Can Be Concluded

**CONFIRMED CONTRADICTION:** `01-game-rules.md` and `05-playing.md` give opposite default values for play direction (counter-clockwise vs clockwise).

**NOT CONCLUDED:**
- Which document is correct
- That counter-clockwise is the correct Saudi Baloot rule
- That clockwise is an editorial error
- That dealing direction and play direction must be the same

### The Four Directions Are Independently Specifiable

The Foundation does not assert that dealing direction, bidding order, play direction, and seat geometry must all use the same direction value. These may be independently specified in the Rule Profile.

### Classification

**OPEN RULE DECISION** — both documents defer to the Rule Profile. The Rule Profile must explicitly specify the direction. Until then: UNRESOLVED.

Do NOT assume counter-clockwise is correct because it appears in the Game Rules. Do NOT assume clockwise is correct because it appears in two other documents. The Rules Owner must decide.

---

## Special Review 8: Bidding Start Player

### Evidence

**FACT:** `04-bidding.md §5`: "player immediately to the dealer's right" starts bidding (per public references and Rule Profile).

**FACT:** "Player to the right" is a direction-relative concept. The correct seat depends on whether direction is CW or CCW.

### Classification

**DEPENDENT OPEN RULE DECISION** — resolves automatically once the direction Rule Decision is made. Has no independent status.

---

## Special Review 9: Contract Representation

### Evidence

**FACT:** `02-card-system.md §9` provides a minimal Contract type and explicitly says: "The exact Ashkal representation remains an open rule decision and MUST be finalized in the Bidding/Rules documents."

**FACT:** `04-bidding.md §24` provides a full Contract type including `purchaserSeat`, `exposedCardReceiverSeat`, and `source: "FIRST_ROUND" | "SECOND_ROUND"`.

**FACT:** `05-playing.md §18` uses `contract.type === "TRUMP"` — only the discriminant.

### Classification

**LAYERED MODEL + DOCUMENTATION CROSS-REFERENCE REQUIRED**

These are not contradictory definitions — they serve different purposes:
- `02-card-system.md`: minimal representation for card ranking logic
- `04-bidding.md`: full domain representation with provenance
- `05-playing.md`: type-discriminant usage only

**OPEN ARCHITECTURE DECISION:** The canonical Contract type boundary between transport, domain, and card-system layers has not been formally defined. The next phase should define:
- Domain Contract (full state, for engine internals)
- Transport Contract (what is sent over the wire)
- Card-system Contract (minimal discriminant for ranking)

Whether these share one type or remain intentionally separate is an open design decision.

---

## Special Review 10: Project Declaration Lifecycle

### Evidence

**FACT:** `08-actions.md §27` defines `DECLARE_PROJECT` with payload `{ projectType, cardIds? }`.

**FACT:** `09-state-transitions.md §18` says at COMPLETE_DEAL → PROJECT_DECLARATION: "initialize declaration window."

**FACT:** `09-state-transitions.md §19` says PROJECT_DECLARATION → TRICK_PLAY fires "when the project/declaration window closes according to the Rule Profile."

**FACT:** `09-state-transitions.md §1650 item 6` explicitly lists "Exact project declaration timing" as unresolved before freeze.

### Classification

**OPEN RULE PROFILE DECISIONS** — the phase structure is defined but the following are all unresolved:
- How many players must declare before the window closes
- Whether a player may declare NONE explicitly
- Timer duration and behavior
- Simultaneous declaration handling
- Duplicate declaration behavior

The architecture is correctly parameterized (`ruleProfile` controls the window policy). No architectural action is needed. Rule Owner decisions are required.

---

## Special Review 11: Doubling Lifecycle

### Evidence

**FACT:** `09-state-transitions.md §18` says "initialize doubling state if applicable" at COMPLETE_DEAL → PROJECT_DECLARATION.

**FACT:** `09-state-transitions.md §39` shows "DOUBLE before doubling window" as a rejected action example.

**FACT:** `09-state-transitions.md §1650 item 7` explicitly lists "Doubling transition timing" as unresolved before freeze.

**FACT:** `06-scoring.md §37` says Coffee's "exact win condition is a Rule Profile decision."

### Classification

**OPEN RULE PROFILE DECISIONS** — the doubling architecture is sketched but the following are unresolved:
- Which phase(s) open the doubling window
- Which event closes the window
- Whether COFFEE terminates the window permanently
- Whether subsequent escalation after COFFEE is legal
- Interaction between doubling and Kaboot scoring

Do not select any option. The Rule Profile will specify `doublingWindowPolicy`.

---

## Special Review 12: Ashkal Eligibility

### Evidence

**FACT:** `04-bidding.md §12` uses: `ruleProfile.canCallAshkal(seat, dealerSeat)` — already parameterized.

**FACT:** The Foundation does not define which seats are eligible; it defers to the Rule Profile.

### Classification

**Architecture:** CORRECTLY PARAMETERIZED — `canCallAshkal` is a Rule Profile function. No architectural action needed.

**Rule:** OPEN RULE DECISION — the Rule Profile must specify `canCallAshkal` behavior.

These two are distinct: the architecture is sound; the rule is unresolved.

---

## Special Review 13: Redeal Trigger

### Evidence

**FACT:** `04-bidding.md §19` states: "If all eligible players pass and no contract is selected → BIDDING_FAILED → next action determined by the redeal Rule Profile."

**FACT:** `04-bidding.md §15` (BiddingPhase) shows `SECOND_ROUND → REDEAL` as a possible path.

**FACT:** `09-state-transitions.md §64` transition matrix does NOT include a BIDDING_FAILED → DEALING row.

**FACT:** The redeal path IS defined in the bidding document. The gap is in the transition matrix only.

### Classification

**DOCUMENTATION COMPLETENESS GAP** — the BIDDING_FAILED → DEALING path is defined in `04-bidding.md` but missing from the `09-state-transitions.md §64` transition matrix.

**OPEN RULE PROFILE DECISIONS** — the following remain unresolved:
- Same dealer or dealer rotation
- Whether seating resets
- Whether a penalty Qaid applies
- Maximum consecutive redeals

---

## Special Review 14: stateVersion / RESYNC

### Evidence

**FACT:** `09-state-transitions.md §6`: "Every accepted transition increments stateVersion."
**FACT:** `09-state-transitions.md §36`: "RESYNC_GAME should normally NOT increment gameplay stateVersion. It is a read/synchronization operation. state mutation ≠ state delivery."

### Classification

**RETRACTED** — F-P2-009 is a false finding. The Foundation explicitly distinguishes state mutation (increments stateVersion) from RESYNC (does not). There is no conflict.

---

## Phase 13.5 Corrections

The following corrections are applied to Phase 13 output:

### Correction 1 — Sun Mathematics
**Phase 13 issue:** Correctly identified the math error. No overreach.
**Phase 13.5 clarification:** Confirmed as MATHEMATICAL CORRECTION. Not an open rule preference. Card-value table arithmetically determines the base total.

### Correction 2 — Exposed Card
**Phase 13 issue:** Stated that "Interpretations B, C, D are all valid architecturally" and recommended that "the Rule Profile must specify which." This implies that choosing any of B/C/D is architecturally sufficient.
**Phase 13.5 correction:** B, C, D are mathematically possible models only. They are not confirmed valid Baloot rules. The Rules Owner must specify the actual rule, not choose from a menu of architectural options. Classification changed to OPEN RULE DECISION.

### Correction 3 — PASS_FINAL
**Phase 13 issue:** Phase 13 wrote "A single PASS action is sufficient" and "Server infers round from BiddingPhase." This presents one design option as selected.
**Phase 13.5 correction:** Single PASS is architecturally viable but NOT selected. Classification is OPEN ARCHITECTURE DECISION. Both options (single PASS / PASS+PASS_FINAL) are documented without a winner.

### Correction 4 — COMPLETE_DEAL
**Phase 13 issue:** Stated COMPLETE_DEAL is "probably an internal engine phase" and recommended adding a clarifying note.
**Phase 13.5 correction:** "Probably internal" is an inference, not a fact. `09-state-transitions.md §1650 item 3` explicitly lists this as unresolved. Classification: OPEN ARCHITECTURE DECISION.

### Correction 5 — MATCH_END_CHECK
**Phase 13 issue:** Stated MATCH_END_CHECK is "almost certainly an internal conditional branch."
**Phase 13.5 correction:** "Almost certainly" is an inference. Classification: OPEN ARCHITECTURE DECISION. The Foundation explicitly lists this as unresolved (§1650 item 3).

### Correction 6 — GamePhase Canonical Source
**Phase 13 issue:** Recommended designating `09-state-transitions.md` as canonical for phase names.
**Phase 13.5 correction:** That recommendation is an inference, not a fact. Neither document designates the other as canonical for phase name strings. Classification: OPEN ARCHITECTURE DECISION. No designation made.

### Correction 7 — Play Direction
**Phase 13 issue:** Noted the contradiction but leaned toward counter-clockwise ("The 05-playing.md clockwise statement appears to be an editorial error").
**Phase 13.5 correction:** This is an inference, not a fact. Both values exist in Foundation documents. The Rules Owner must decide. No directional preference stated.

### Correction 8 — Contract Layering
**Phase 13 issue:** Correctly identified as layered models. No overreach.
**Phase 13.5 clarification:** Confirmed as LAYERED MODEL. The open architecture decision about canonical Contract type boundaries is now explicitly stated.

### Correction 9 — Kaboot Detection vs Scoring
**Phase 13 issue:** Correctly separated detection from scoring. No overreach.
**Phase 13.5 clarification:** Detection = DERIVED OUTCOME (architectural). Scoring values = OPEN RULE DECISION. Distinction preserved and explicit.

### Correction 10 — stateVersion/RESYNC
**Phase 13 issue:** Correctly retracted F-P2-009.
**Phase 13.5 clarification:** Retraction confirmed. No reopening.

---

## Phase 13.5 Final Status

**FOUNDATION AUDIT CORRECTED**

All Phase 13 overreach has been corrected:
- No unresolved issue was silently decided
- No rule was invented
- No architectural choice was silently made
- All classifications are evidence-based
- INFERENCE is distinguished from FACT throughout

---

## Confirmed Facts

1. Sun base card points = 120 (arithmetic from defined card values)
2. Sun total (with last-trick bonus) = 130
3. The "130 before last-trick bonus" in `06-scoring.md §8` is arithmetically wrong
4. The "140" total in `01-game-rules.md §6.1` is a double-count error
5. Hokm base card points = 152 (verified by independent calculation)
6. `08-actions.md` declares itself the "complete authoritative action/command model"
7. `04-bidding.md §8` labels BUY_* as "Recommended domain action" (not wire types)
8. No document defines a KABOOT or CLAIM_KABOOT player action
9. No document states any player must declare Kaboot
10. `09-state-transitions.md §1650 item 3` explicitly lists system-transition representation as unresolved
11. `04-bidding.md §12` uses `ruleProfile.canCallAshkal()` — Ashkal eligibility is parameterized
12. The BIDDING_FAILED → DEALING path is defined in `04-bidding.md §19` (but absent from §64 matrix)
13. `09-state-transitions.md §36` explicitly states RESYNC does not increment stateVersion

---

## Confirmed Contradictions

1. **Play direction:** `01-game-rules.md §2.2` = counter-clockwise; `05-playing.md §5` = clockwise
2. **GamePhase names:** PLAYING (game-state) vs TRICK_PLAY (transitions); SCORING vs ROUND_SCORING; MATCH_COMPLETE vs GAME_RESULT

---

## Rule Owner Decisions Required

See `FOUNDATION-RULE-DECISIONS.md`

---

## Architecture Decisions Required

See `FOUNDATION-ARCHITECTURE-DECISIONS.md`

---

## Documentation-Only Fixes

See `FOUNDATION-DOCUMENTATION-FIXES.md`

---

## Remaining P0

None.

---

## Remaining P1

| ID | Issue |
|---|---|
| R-P1-001 | Sun base total documented incorrectly (MATHEMATICAL CORRECTION required) |
| R-P1-002 | Exposed card fate after bidding unspecified (OPEN RULE DECISION) |
| R-P1-003 | GamePhase canonical names not designated (OPEN ARCHITECTURE DECISION) |
| R-P1-004 | Play direction contradicted between two documents (OPEN RULE DECISION) |

---

## Remaining P2

| ID | Issue |
|---|---|
| R-P2-001 | PASS vs PASS_FINAL wire representation (OPEN ARCHITECTURE DECISION) |
| R-P2-002 | COMPLETE_DEAL: internal vs client-observable (OPEN ARCHITECTURE DECISION) |
| R-P2-003 | MATCH_END_CHECK: internal vs client-observable (OPEN ARCHITECTURE DECISION) |
| R-P2-004 | Doubling window open/close policy (OPEN RULE PROFILE DECISION) |
| R-P2-005 | Project declaration window policy (OPEN RULE PROFILE DECISION) |
| R-P2-006 | Bidding start player (DEPENDENT — resolves with direction) |

---

## Remaining P3

| ID | Issue |
|---|---|
| R-P3-001 | Contract type canonical layer boundaries (OPEN ARCHITECTURE DECISION) |
| R-P3-002 | Ashkal eligibility rule (OPEN RULE DECISION — architecture already parameterized) |
| R-P3-003 | BUY_* vs CALL_* terminology gap in 04-bidding.md (DOCUMENTATION GAP) |
| R-P3-004 | Redeal transition missing from §64 matrix (DOCUMENTATION COMPLETENESS GAP) |

---

## Retracted Findings

| Finding | Reason |
|---|---|
| F-P2-009 (stateVersion/RESYNC) | False. Foundation §36 explicitly distinguishes RESYNC from state mutation. |

---

## What Is Safe to Implement Now

The following are independent of all unresolved rule and architecture decisions:

- Immutable card identifiers (suit + rank as a discriminated union)
- Deck creation (32-card set, fixed composition)
- Card ranking for Sun context (A > 10 > K > Q > J > 9 > 8 > 7)
- Card ranking for Trump context (J > 9 > A > 10 > K > Q > 8 > 7)
- Seat type (NORTH | EAST | SOUTH | WEST)
- Team assignment (NORTH+SOUTH vs EAST+WEST)
- Generic action envelope (actionId, clientSequence, stateVersion, playerId, payload)
- Rule Profile interface (shell with placeholder methods)
- Deterministic state infrastructure (pure functions, no side effects)
- Serialization infrastructure (stable card/seat/action representations)
- Simulation harness (inject Rule Profile, run deterministic engine)

## What Must Wait for Rule Freeze

Everything that depends on:
- Play direction (all turn-order computation)
- Exposed card fate (dealing engine)
- Sun base total correction (scoring computation)
- Canonical GamePhase names (event schema, wire protocol)
- Doubling window policy (doubling enforcement)
- Project Qaid values (project scoring)
- Kaboot Qaid values (Kaboot scoring)
- Baloot timing (Baloot scoring)
- Redeal rules (redeal path)
- PASS vs PASS_FINAL (bidding wire format)
- COMPLETE_DEAL and MATCH_END_CHECK representation (state machine)
