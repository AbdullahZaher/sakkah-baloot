# صكّة بلوت — Foundation Critical Findings (P0 & P1)

**Document:** `docs/FOUNDATION-CRITICAL-FINDINGS.md`
**Audit Phase:** 12
**Date:** 2026-09-21
**Policy:** DISCOVERY ONLY — No fixes applied. No rules invented.

---

## P0 — Blockers (5 findings)

These findings describe issues that would cause incorrect or undefined engine behavior if implemented against the current documentation.

---

### F-P0-001: Sun Card-Point Total Arithmetic Error

**Sources in conflict:**
- `01-game-rules.md §6.1`
- `06-scoring.md §8`

**Issue:**

Both documents state the Sun card total = 130 before the last-trick bonus.

Manual calculation from the defined card values:
```
A=11, 10=10, K=4, Q=3, J=2, 9=0, 8=0, 7=0
Sum per suit = 30
4 suits × 30 = 120
```

Stated: 130. Calculated: 120. Discrepancy: 10 points.

Furthermore, `01-game-rules.md §6.1` adds "+10 for the final trick → 140 total". If 130 already includes the last trick bonus, adding 10 again produces a double-count. If 130 is purely card points, it is arithmetically wrong.

**Impact:** Any purchaser success/failure threshold calculation, any Qaid conversion, and any Kaboot detection will produce wrong results if implemented against the stated 130.

**Status:** OPEN_DECISION — Must resolve: does 130 include last-trick bonus or not? What is the correct base card total for Sun?

---

### F-P0-002: Dealing Card Conservation Failure

**Sources in conflict:**
- `03-dealing.md §17`
- `03-dealing.md §18`

**Issue:**

```
Initial deal: 5 cards × 4 players = 20 cards
Exposed card: 1 card
Deck remainder after initial + exposed: 32 - 20 - 1 = 11 cards

Completion deal required: (8 - 5) × 4 players = 12 cards
Cards available in deck: 11
Deficit: 1 card
Total accounted: 20 + 1 + 12 = 33 ≠ 32
```

The dealing arithmetic does not close. One card cannot be assigned.

The document says: "the finalized dealing sequence must satisfy 32 unique cards = all four final 8-card hands" but the math as stated does not satisfy this.

The exposed card fate is not specified:
- Does it go to the purchaser as part of completion?
- Does it go to the Ashkal receiver?
- Does it return to deck before completion?
- Is one player's completion 2 cards (from deck) + 1 (exposed) = 3 while others get 3 from deck?

**Impact:** Any dealing engine implementation will have an unresolvable 1-card gap under the stated model. The invariant `sum(hand sizes) = 32` cannot be satisfied.

**Status:** OPEN_DECISION — Must specify the exact fate of the exposed card after bidding.

---

### F-P0-003: Kaboot Has No Defined Action

**Sources in conflict:**
- `06-scoring.md §41` (defines Kaboot as a scorable outcome)
- `08-actions.md` (no KABOOT or CLAIM_KABOOT action)
- `01-game-rules.md §42` (lists Kaboot as a distinct game scenario)

**Issue:**

Kaboot is defined as a complete outcome (one team wins all 8 tricks) with specific Qaid values:
```
Hokm Kaboot = 25
Sun Kaboot = 44
```

No action is defined to handle this outcome:
- No server-generated KABOOT_DETECTED event
- No client CLAIM_KABOOT action
- No specification of whether Kaboot is server-detected automatically or requires player declaration

**Impact:** The engine has no defined path for the Kaboot round completion. Scoring for the Kaboot case is unreachable.

**Status:** OPEN_DECISION — Must specify: is Kaboot auto-detected by server after trick 8, or is it a player claim?

---

### F-P0-004: Bidding Action Name Split

**Sources in conflict:**
- `04-bidding.md` (uses BUY_* naming)
- `08-actions.md` (uses CALL_* naming)
- `09-state-transitions.md` (uses CALL_* in transition matrix)

**Issue:**

The bidding actions have two incompatible naming schemes:

| 04-bidding.md | 08-actions.md |
|---|---|
| BUY_HOKM_EXPOSED_SUIT | CALL_TRUMP |
| BUY_SUN | CALL_SUN |
| BUY_ASHKAL | CALL_ASHKAL |
| BUY_HOKM (second round) | CALL_TRUMP |
| PASS_FINAL | PASS (only) |

The Bidding document and the Actions document describe the same player actions using different type strings. An implementation team reading both documents will arrive at different action type discriminators depending on which document they reference.

The State Transitions document uses CALL_* from the Actions document — making that the more authoritative naming — but the Bidding document's BUY_* naming is more semantically explicit and distinguishes first vs second round Hokm.

**Impact:** If any part of the system uses BUY_HOKM_EXPOSED_SUIT and another uses CALL_TRUMP, the systems will not interoperate.

**Status:** OPEN_DECISION — Canonical action type names must be unified in one authoritative place before implementation.

---

### F-P0-005: PASS_FINAL Not Defined in Actions

**Sources in conflict:**
- `04-bidding.md §15` (defines PASS_FINAL as second-round pass)
- `08-actions.md §21` (defines only PASS with no round distinction)

**Issue:**

The bidding system has two semantically different PASS actions:
- Round 1 PASS: passes the bidding turn to the next player; bidding may continue.
- Round 2 PASS_FINAL: if all players pass in round 2, the deal is considered BIDDING_FAILED and a redeal may occur.

`08-actions.md` defines only one PASS action. The server cannot determine from the action alone whether this is a round-1 pass (bidding continues) or round-2 final pass (potential redeal trigger).

The server can infer this from the current bidding phase state — but the distinction is not documented as part of the PASS action or its validation contract.

**Impact:** Redeal behavior after all-pass in round 2 is unimplementable from current action definitions alone.

**Status:** OPEN_DECISION — Must specify: single PASS action with server-inferred round context, or distinct PASS / PASS_FINAL action types?

---

## P1 — Critical Issues (8 findings)

These findings describe contradictions between documents that will cause cross-component failures at integration time.

---

### F-P1-001: GamePhase Enum vs State Machine Divergence

**Sources in conflict:**
- `07-game-state.md §8` (GamePhase enum)
- `09-state-transitions.md §9` (State Machine)

**Issue:**

7 phase names exist only in the GamePhase enum; 4 phase names exist only in the State Machine:

Exclusive to game-state enum:
```
WAITING_FOR_PLAYERS, ROUND_STARTING, PLAYING, SCORING, ROUND_COMPLETE, MATCH_COMPLETE, CANCELLED
```

Exclusive to state machine:
```
GAME_CREATED, COMPLETE_DEAL, MATCH_END_CHECK, GAME_RESULT
```

Key name mismatches:
- game-state `PLAYING` = transitions `TRICK_PLAY`
- game-state `SCORING` = transitions `ROUND_SCORING`
- game-state `MATCH_COMPLETE` = transitions `GAME_RESULT`

**Impact:** Game State, Actions, and State Transitions documents will produce incompatible phase values. The engine and client will use different phase names for the same state.

---

### F-P1-002: Play Direction Contradiction

**Sources in conflict:**
- `01-game-rules.md §2.2` (counter-clockwise)
- `03-dealing.md §5` (clockwise)

**Issue:**

Game Rules defines play direction as counter-clockwise.
Dealing document states the dealing sequence is clockwise (NORTH → EAST → SOUTH → WEST).

NORTH → EAST → SOUTH → WEST is clockwise by standard card table layout convention.

`05-playing.md §6` states "player to the dealer's right" as first trick leader. In counter-clockwise play, the first actor is to the dealer's right (the dealer dealt to them first). In clockwise play, the first actor is to the dealer's left.

Both the dealing direction and the first-trick leader definition depend on resolving this conflict.

**Impact:** The turn order for dealing, bidding, and playing could be entirely reversed depending on which document is used as the reference.

---

### F-P1-003: Bidding Start Player Ambiguity

**Sources in conflict:**
- `04-bidding.md §8` (first bidder = player to dealer's right)
- `05-playing.md §6` (first trick leader = player to dealer's right)
- `01-game-rules.md §2.2` (counter-clockwise)

**Issue:**

In counter-clockwise Baloot, the player to the dealer's right is the first to receive cards and typically the first to bid. This is consistent across the documents.

However, the dealing direction described in `03-dealing.md §5` is clockwise. Under clockwise dealing, the first player to receive cards is to the dealer's LEFT, not right.

The conflict means the bidding start player definition depends on which direction document is authoritative.

---

### F-P1-004: Contract Type Representation Split

**Sources in conflict:**
- `02-card-system.md §9` (Contract type)
- `04-bidding.md §9` and `§11` (Contract type)
- `05-playing.md §18` (uses contract.type)

**Issue:**

The Contract type is defined differently in three documents:

`02-card-system.md`:
```ts
type Contract =
  | { type: "SUN" }
  | { type: "TRUMP"; suit: Suit }
  | { type: "ASHKAL"; suit?: Suit }
```

`04-bidding.md` (implied from section 11):
```ts
interface AshkalContract {
  type: "ASHKAL";
  purchaserSeat: Seat;
  exposedCardReceiverSeat: Seat;
}
```

The Ashkal contract in the card system has an optional suit, while the bidding document adds purchaserSeat and exposedCardReceiverSeat — fields absent from the card system definition.

No single document defines the canonical Contract union type.

---

### F-P1-005: Project Declaration Phase Content Unspecified

**Sources in conflict:**
- `09-state-transitions.md §18–19` (PROJECT_DECLARATION phase transitions)
- `08-actions.md §27` (DECLARE_PROJECT action)
- `06-scoring.md §23–24` (Project lifecycle)

**Issue:**

`09-state-transitions.md` shows:
```
COMPLETE_DEAL → PROJECT_DECLARATION → TRICK_PLAY
```

But no internal transitions within PROJECT_DECLARATION are specified:
- How does the phase advance? After all players have declared? After a timer? After one player declares?
- What if a player has no project to declare?
- What if multiple players declare simultaneously?
- Does DECLARE_PROJECT require all 4 players to act, or is it optional per player?
- Can a player declare NONE explicitly?

The phase is a black box between entry and exit.

---

### F-P1-006: Doubling Window Not Specified

**Sources in conflict:**
- `08-actions.md §29` (DOUBLING Actions section)
- `06-scoring.md` (doubling is scored)
- `09-state-transitions.md` (no doubling transitions listed)

**Issue:**

DOUBLE, TRIPLE, QUADRUPLE, COFFEE are defined as actions in `08-actions.md`. They are scored in `06-scoring.md`. But:

- No document specifies what game phase activates the doubling window.
- No document specifies what phase event closes the doubling window.
- The state machine in `09-state-transitions.md` has no DOUBLING transitions.
- It is unknown whether doubling can occur during PROJECT_DECLARATION, during TRICK_PLAY, or only at the start of a round.

---

### F-P1-007: Ashkal Eligibility Seat Inconsistency

**Sources in conflict:**
- `04-bidding.md §12` (dealer and player to dealer's left as eligible)
- `01-game-rules.md §51` (Ashkal details listed as open)

**Issue:**

`04-bidding.md §12` states:
> "Public references commonly describe the dealer and the player immediately to the dealer's left as the eligible seats."

But "dealer's left" depends on play direction. Under counter-clockwise play (as stated in Game Rules), left and right have different meanings than under clockwise play (as stated in Dealing doc).

The Ashkal eligibility rule references a directional relative position that is itself unresolved.

---

### F-P1-008: Redeal Trigger Undefined

**Sources in conflict:**
- `03-dealing.md §8` (first dealer mechanism undefined)
- `04-bidding.md §54 item 11` (exact redeal behavior after all-pass — OPEN_DECISION)
- `01-game-rules.md §51` (التكويش وإعادة اليد — listed as open)

**Issue:**

The redeal scenario (all players pass in both rounds) is referenced multiple times but never fully specified:
- Is a redeal an automatic server action?
- Does the same dealer deal again or does dealer rotate?
- Do the same players remain in the same seats?
- Is there a limit on consecutive redeals?
- Does any penalty apply?

No transition exists in `09-state-transitions.md` for BIDDING_FAILED → DEALING (redeal path).

---

## Summary Table

| ID | Severity | Title | Documents Affected |
|---|---|---|---|
| F-P0-001 | P0 | Sun card total arithmetic error | 01-game-rules, 06-scoring |
| F-P0-002 | P0 | Dealing card conservation failure | 03-dealing |
| F-P0-003 | P0 | Kaboot has no action defined | 06-scoring, 08-actions |
| F-P0-004 | P0 | Bidding action name split (BUY vs CALL) | 04-bidding, 08-actions, 09-transitions |
| F-P0-005 | P0 | PASS_FINAL not defined in actions | 04-bidding, 08-actions |
| F-P1-001 | P1 | GamePhase enum vs state machine divergence | 07-game-state, 09-transitions |
| F-P1-002 | P1 | Play direction contradiction | 01-game-rules, 03-dealing |
| F-P1-003 | P1 | Bidding start player ambiguity | 04-bidding, 05-playing, 01-game-rules |
| F-P1-004 | P1 | Contract type representation split | 02-card-system, 04-bidding, 05-playing |
| F-P1-005 | P1 | Project declaration phase content unspecified | 08-actions, 09-transitions, 06-scoring |
| F-P1-006 | P1 | Doubling window not specified | 08-actions, 06-scoring, 09-transitions |
| F-P1-007 | P1 | Ashkal eligibility seat inconsistency | 04-bidding, 01-game-rules |
| F-P1-008 | P1 | Redeal trigger undefined | 03-dealing, 04-bidding, 09-transitions |
